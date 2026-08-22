# PetPilot 

Shelter management front end (foster roster, medical calendar, intake & outcomes)
plus the **remarks router** — the piece that turns a free-text observation a
volunteer types ("peed purple this morning, seemed fine otherwise") into a
classified, routed, and actually-sent alert.

## The two pieces

This repo has a **frontend** and a **backend**, and both run at the same time.

```
browser (the Foster Board page)
   |  you open a dog's Remarks, type an observation, hit "Classify & route"
   v
remarks-router backend  (localhost:3001)
   |  1. Claude classifies the text into one of six labels
   |  2. a routing table maps the label to the right team
   |  3. Arcade sends the alert (Slack) - or logs it in log mode
   v
a new row appears in the dog's Remarks, tagged and routed
```

- **Frontend** - `Foster Board.dc.html` + `support.js` + `_ds/`. A single-file
  "Design Component" app (React under the hood, loaded from a CDN). The Remarks
  drawer has a free-text box wired to the backend.
- **Backend** - everything in `remarks-router/`. A small Node/Express server that
  classifies and routes. See `remarks-router/README.md` for its internals.

## Running it locally

You need **Node.js** and **Python** installed. Two terminals, both stay open.

### 1. Start the backend

```
cd remarks-router
copy .env.example .env      # then edit .env - see below
npm install                 # one time
npm start                   # prints "remarks router listening on :3001"
```

Edit `.env` before `npm start`:
- `ANTHROPIC_API_KEY` - required, or classification fails. Get one at console.anthropic.com.
- `ARCADE_API_KEY` / `ARCADE_USER_ID` - only needed for real Slack sending.
- `SEND_MODE` - set to `log` to skip real sending (classifies and logs the alert);
  set to `slack` once you have Arcade set up and have joined the Slack channels.

> Windows note: if `npm` fails with "running scripts is disabled," either run the
> commands from **Command Prompt** (cmd) instead of PowerShell, or run once:
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

### 2. Serve the frontend (second terminal)

```
python -m http.server 8000
```

from the repo root, then open **http://localhost:8000/Foster%20Board.dc.html**.

> The page must be **served**, not opened as a file. Double-clicking the HTML or
> viewing it in a design/preview tool leaves every `{{ value }}` unresolved,
> because the runtime can't boot. Serving over http fixes that.

### 3. Try it

Open a dog's **Remarks**, type an observation, hit **Classify & route**. A new row
appears with a label chip (red for `medical_urgent`) and the teams it routed to.

## How the backend connection is configured

The frontend calls `http://localhost:3001` - this is set once as `REMARKS_API`
near the bottom of `Foster Board.dc.html`. If the backend is deployed elsewhere,
change that one line.

If a submit shows "Couldn't reach the router," the backend isn't running or
errored - check the backend terminal. A missing `ANTHROPIC_API_KEY` shows up
there as an authentication error; fill in the key and restart `npm start`.

## Secrets

`.env` holds API keys and is **git-ignored** - never commit it. Each teammate
makes their own `.env` from `.env.example` with their own keys.

## Where things live

| Path                        | What                                              |
| --------------------------- | ------------------------------------------------- |
| `Foster Board.dc.html`      | The whole frontend app (markup + logic)           |
| `support.js`                | The Design Component runtime the page loads       |
| `_ds/`                      | Design system: styles + component bundle          |
| `remarks-router/`           | The classify + route + send backend               |
| `remarks-router/README.md`  | Backend internals, endpoints, and demo-safety     |
