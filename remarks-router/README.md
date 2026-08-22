# Remarks Router

The "remarks" button's backend. A volunteer types a free-text observation about a
dog — *"peed purple this morning, seemed fine otherwise"* — and this service
classifies it, decides which team should know, and sends a real Slack alert.

PetPoint has no field for the weird stuff. Today those observations either go
nowhere or land in a note nobody routes, and there's no clear rule for who gets
told. This is that missing loop: **free text in → classified → routed → alerted.**

## The pipeline

```
observation text
  → classify (one Claude call)  → { label, confidence, reason, precedent }
  → routing table lookup        → ["#shelter-medical", "#shelter-managers"]
  → Arcade Slack.SendMessage    → real message lands in the channel
  → record pushed to the alerts list, rendered in the UI
```

Six fixed labels: `medical_urgent`, `medical_routine`, `behavior`, `facility`,
`enrichment`, `unclear`. The routing table (`routing.js`) is a plain object
mapping each label to Slack channels — it is not an ML system, and it shouldn't be.

## Setup

```bash
npm install
cp .env.example .env     # fill in ANTHROPIC_API_KEY, ARCADE_API_KEY, ARCADE_USER_ID
npm run seed             # regenerate seed_cache.json (already committed)
npm start                # backend on :3001
```

Arcade posts **as you** (the `ARCADE_USER_ID`). You must be a member of the target
channels or the send silently no-ops — join `#shelter-medical`, `#shelter-managers`,
`#behavior-team`, `#operations`, `#enrichment` before demoing.

First send triggers a one-time OAuth: the response comes back with
`status: "needs_auth"` and an `authUrl`. Open it once, approve, retry. Arcade
remembers the token after that.

## Endpoints

| Method | Route        | Purpose                                             |
| ------ | ------------ | --------------------------------------------------- |
| POST   | `/remarks`   | `{ "text": "..." }` → classify, route, send, return |
| GET    | `/alerts`    | Live alerts + the 15 seeded ones (newest first)     |
| GET    | `/seed`      | Just the seeded fixtures                            |
| GET    | `/health`    | `{ ok: true }`                                      |

## Demo-safety

- **Seeded on load.** `/alerts` returns 15 pre-processed observations even with no
  API call, so the page is never empty on a cold open. Purple pee is first.
- **Offline fallback.** Set `SEND_MODE=log` to skip real Slack sends and just
  record intended recipients — use this if Arcade auth isn't working at judging time.
- **Graceful classifier failure.** A bad/unparseable model response falls back to
  `unclear` → routed to managers, never a crash.

## How routing decisions are made

The classifier returns one of six labels plus a confidence and a one-sentence
reason, and picks the nearest of ~8 seeded past incidents (`PRECEDENTS` in
`routing.js`) so the UI can show "matched precedent." Honest framing: it's
nearest-neighbor over historical routings, seeded with 8, and gets better as the
shelter contributes its own. The label→recipient map is hand-maintained by the
shelter.

## Honest limits

- 8 seeded precedents, 6 fixed labels, hand-written routing table.
- Classifier biases toward `medical_urgent` on ambiguity — over-alerting by design.
- No database; live alerts are in-memory and clear on restart (seed persists).

## What this unlocks

The router is the wedge because it's the one piece that has to touch every other
system anyway: EHR sync, Salesforce two-way, inter-shelter transfer approvals,
role-based access, quarantine history, fundraising attribution. Route the
observation correctly first; everything else hangs off knowing who needed to know.

## Files

| File               | Job                                                        |
| ------------------ | ---------------------------------------------------------- |
| `server.js`        | Express routes; the `/remarks` pipeline; serves alerts     |
| `classify.js`      | One Claude call: text → label, confidence, reason, precedent |
| `routing.js`       | Label→recipient table, label guide, seeded precedents      |
| `send.js`          | Arcade `Slack.SendMessage`, with log-mode + auth fallback  |
| `build_seed.js`    | Regenerates `seed_cache.json` (15 fixtures, shelter voice) |
| `seed_cache.json`  | Pre-processed observations so the page loads populated     |
| `test_pipeline.js` | Offline smoke test — no API keys needed                    |
