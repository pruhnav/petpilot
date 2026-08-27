# PetPilot

**Winner, AI Valley Dogathon 2026.** Built in 5 hours by a team of 4.

Shelter software has a field for everything that fits in a form and nothing for
what staff actually notice. A volunteer sees a dog pee purple, or notice it was
lethargic on a short walk, and there is nowhere structured to put that. It ends
up in a group text, or nowhere. Even when it does get written down, there is no
clear rule for who should hear about it: sometimes the vet team, sometimes
behavior, sometimes facilities, and the shelter staff we talked to said there is
no one clear-cut way to decide.

PetPilot is a shelter management front end plus a **remarks router**: type the
observation in plain English, and it gets classified, routed to the right teams,
and actually sent.

## How it works

```
browser (the Foster Board page)
   |  open a dog's Remarks, type an observation, hit "Classify & route"
   v
remarks-router backend  (localhost:3001)
   |  1. Claude classifies the text into one of six labels
   |  2. a routing table maps the label to the responsible teams
   |  3. Arcade sends the alert to Slack, or logs it in log mode
   v
a new row appears in the dog's Remarks, tagged and routed
```

Example: `"peed purple this morning, seemed fine otherwise"` classifies as
`medical_urgent`, which routes to the teams responsible for urgent medical calls.

Routing is a lookup table from label to teams, not a model decision. That keeps
the behavior inspectable: you can read exactly why an alert went where it went,
which matters more than sophistication when a vet is the one being paged.

Arcade handles the authenticated send, so the project does not ship its own OAuth
flow and per-user tokens stay out of this codebase. That is deliberate: a shelter
alert router has to reach people across a volunteer base that turns over
constantly, so delegated auth is the right primitive rather than an afterthought.

## Live version

Deployed on Replit at <https://dog-os-dogathon-1.replit.app/>.

**This repo is the source of record.**

## Running it locally

You need **Node.js** and **Python**. Two terminals, both stay open.

### 1. Backend

```bash
cd remarks-router
cp .env.example .env      # Windows: copy .env.example .env
npm install               # one time
npm start                 # prints "remarks router listening on :3001"
```

Fill in `.env` before starting:

| Variable | Needed for |
| --- | --- |
| `ANTHROPIC_API_KEY` | Required. Without it, classification fails. Get one at console.anthropic.com |
| `ARCADE_API_KEY` / `ARCADE_USER_ID` | Only for real Slack sending |
| `SEND_MODE` | `log` classifies and logs the alert without sending. `slack` sends for real, once Arcade is set up and you have joined the channels |

`.env` is git-ignored. Never commit it. Each teammate makes their own.

> **Windows:** if `npm` fails with "running scripts is disabled," use Command
> Prompt instead of PowerShell, or run once:
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

### 2. Frontend (second terminal)

```bash
python -m http.server 8000
```

From the repo root, then open <http://localhost:8000/Foster%20Board.dc.html>.

> The page must be **served**, not opened as a file. Double-clicking the HTML
> leaves every `{{ value }}` unresolved because the runtime cannot boot.

### 3. Try it

Open a dog's **Remarks**, type an observation, hit **Classify & route**. A new row
appears with a label chip (red for `medical_urgent`) and the teams it routed to.

If you see "Couldn't reach the router," the backend is not running or errored.
Check the backend terminal; a missing `ANTHROPIC_API_KEY` shows up there as an
authentication error.

## Where things live

| Path | What |
| --- | --- |
| `Foster Board.dc.html` | The whole frontend app: foster roster, medical calendar, intake and outcomes, and the Remarks drawer. Single-file Design Component app, React via CDN |
| `support.js` | The Design Component runtime the page loads |
| `_ds/` | Design system: styles and component bundle |
| `remarks-router/` | The classify, route, and send backend (Node/Express). See its own README for endpoints and internals |

The frontend calls `http://localhost:3001`, set once as `REMARKS_API` near the
bottom of `Foster Board.dc.html`. Change that one line to point elsewhere.

## Honest limits

Built in one 5-hour session, so:

- All shelter data is synthetic. No real PetPoint integration; this is designed
  as a layer that would sit alongside a shelter's system of record, not replace it.
- Routing is a fixed table, not learned from a shelter's own history of who got
  alerted for what. That is the obvious next step and the reason to want real data.
- Six labels is a starting taxonomy, not a validated one.

## What this would unlock

The router has to touch every system a shelter already runs, which makes it a
reasonable wedge for the things the shelter staff asked for and we could not build
in five hours: syncing to electronic health records so an adopted animal arriving
at a hospital does not need manual re-entry, keeping Salesforce and the shelter
system consistent instead of diverging, inter-shelter transfer requests with
tracking, and quarantine history that is currently hard to retrieve at all.

## Team

- Pranav Balachander, [pruhnav](https://github.com/pruhnav)
- Kiran Oguri, [kiran172](https://github.com/kiran172)
- Arshia Bhattacharyya, [LinkedIn](https://www.linkedin.com/in/arshia-bhattacharyya-a732a5291/)
- Trisha Moorkoth, [tprofessional](https://github.com/tprofessional)
