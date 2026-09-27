# DogOS — CLAUDE.md
## AI Nervous System for Animal Shelters

> **Hackathon goal:** Build a working, demo-ready DogOS prototype that turns fragmented shelter data + live dog observations into verified, actionable care workflows.
>
> **Core promise:** Every dog gets an AI care agent that watches, remembers, verifies, routes, and acts — from shelter to foster.
>
> **North-star demo loop:**  
> **Video → dog identity → observation → anomaly → human review → context/truth → triage → Arcade action → human acknowledgement → resolved case**

---

# 0. READ THIS FIRST — BUILD RULES

This is a hackathon build. Do **not** over-engineer.

## MUST DO
- Use one shared MongoDB database.
- Use backend dog IDs everywhere.
- Keep every AI output grounded in observable events and stored context.
- Keep human-in-the-loop before any AI observation becomes trusted shelter truth.
- Use real Arcade actions for at least:
  - Slack
  - Google Calendar
- Use Gmail if time permits.
- Show one polished end-to-end demo case.
- Preserve one dog’s memory when moved from shelter → foster.
- Keep the frontend clean, minimal, professional, and believable.

## MUST NOT DO
- Do not build a PetPoint replacement.
- Do not build a generic shelter CRM.
- Do not diagnose diseases from video.
- Do not claim dog emotions.
- Do not automatically turn camera guesses into medical facts.
- Do not train a custom large CV model from scratch.
- Do not create 15 AI agents.
- Do not hardcode separate dog identities in frontend and video code.
- Do not let every team member invent their own schema.
- Do not add random sponsor integrations only to show logos.
- Do not use fake “AI confidence that dog is sick.”
- Do not expose chain-of-thought in the UI.

---

# 1. PRODUCT DEFINITION

## Product Name
# DogOS

### Tagline
**Every dog gets an AI care agent.**

### Alternate pitch line
**A shelter has hundreds of eyes watching dogs every day. DogOS gives all of those eyes one nervous system.**

---

# 2. PROBLEMS WE ARE DIRECTLY SOLVING

These four problems must be visible in the product and presentation.

## 01 — Inaccessible Data
### Current problem
Intake, medical, foster, adoption, location, volunteer and observation data are spread across disconnected systems and hard to retrieve.

### DogOS solution
Create a **Unified Dog Profile** and **Ask DogOS** layer that lets staff see the current state of one dog without knowing which system stores the answer.

### Product proof
A single Bella page shows:
- location
- kennel
- medical context
- vaccination dates
- foster/adoption state
- observations
- daily timeline
- verified anomalies
- active cases
- next care event

---

## 02 — Time-Consuming
### Current problem
Staff and volunteers manually log updates, find the right person, relay information, update another system, schedule follow-ups, and repeat.

### DogOS solution
DogOS:
- creates observations automatically from video
- structures volunteer notes
- generates daily reports
- triages confirmed observations
- uses Arcade to message the right team
- schedules follow-ups automatically
- tracks acknowledgement and resolution

### Product proof
One volunteer click on **CONFIRM** should trigger:
1. context retrieval
2. triage
3. Slack notification
4. Calendar event
5. case state update

---

## 03 — Unreliable & Outdated
### Current problem
Kennel/location and other records lag behind reality. Different systems or humans can contain conflicting information.

### DogOS solution
Use a layered trust model:

`RAW SIGNAL → AI OBSERVATION → HUMAN VERIFIED → CANONICAL EVENT → ACTION`

DogOS detects:
- camera vs database conflicts
- human vs system conflicts
- stale location information
- uncertain identity
- inconsistent observations

### Product proof
Truth Queue can contain:
- anomaly review cards
- data conflict cards

Example:
- Shelter record: Bella = Kennel A3
- Volunteer report: Bella moved to Medical
- Vision: Bella not seen in A3 since 1:12 PM

Human confirms:
`Medical Wing`

Then canonical state changes.

---

## 04 — Hard to Scale
### Current problem
Large humane societies have many dogs, volunteers, teams, locations, programs and systems. Humans cannot continuously monitor every dog and every data change.

### DogOS solution
DogOS works by **exception**.

Example:
- 500 dogs monitored
- 472 normal
- 19 watch
- 7 review
- 2 active cases

Humans only review what actually needs attention.

### Product proof
The Live Shelter homepage shows many individual AI agents, but only exceptions surface.

---

# 3. FINAL MVP FEATURES

## F1. Live Shelter
Main operational screen.

Shows:
- all dogs
- dog name
- photo
- current kennel/location
- current activity
- last food interaction
- anomaly count
- next medical event
- DogOS status

Statuses:
- `NORMAL`
- `WATCH`
- `NEEDS_REVIEW`
- `BEING_CHECKED`
- `RESOLVED`

---

## F2. Individual Dog Recognition + Tracking
Input:
- two YouTube shelter videos

Pipeline:
1. dog detection
2. tracking across frames
3. initial/manual dog identity assignment using backend dog list
4. visual re-identification when track is lost/recreated
5. structured event generation

The frontend must never independently invent names.

Identity must map to:
`dogId` from backend MongoDB.

### Demo language
Say:
> “DogOS initializes identity once, then maintains it using object tracking and visual re-identification.”

Do not claim perfect canine biometric recognition.

---

## F3. Observable Activity Detection

Track observable events only.

### Required MVP events
- `MOVING`
- `RESTING`
- `PROLONGED_INACTIVITY`
- `PACING`
- `BOWL_APPROACH`
- `BOWL_INTERACTION`
- `FOOD_INTERACTION_MISSING`
- `WATER_INTERACTION`
- `IN_KENNEL`
- `OUTSIDE_KENNEL`
- `HUMAN_INTERACTION`

### Optional
- `POSSIBLE_BATHROOM_EVENT`

Do not output:
- anxious
- depressed
- sick
- kennel cough
- dehydrated
- arthritis
- pain

Those are not camera observations.

---

## F4. Per-Dog Timeline
Each dog gets a time-ordered event feed.

Example:

```text
08:02  Food provided
08:18  Bowl interaction
09:04  Resting
10:11  Volunteer interaction
10:32  Walk completed
12:41  Activity below recent baseline
```

---

## F5. Routine / Anomaly Intelligence
The AI reasons over structured events.

It should identify deviations such as:
- expected feeding interaction missing
- prolonged inactivity relative to recent routine
- repeated pacing
- unexpected location absence
- unusual decrease in activity events

Output wording:
> “This differs from Bella’s recent routine and may warrant review.”

Not:
> “Bella is sick.”

---

## F6. DogOS Truth Queue — Tinder-Style Human Review
This is one of the hero screens.

Two card types:

### A. Observation Review
Example:
- Bella
- possible missed feeding
- timestamp
- why flagged
- short video snippet
- context
- AI observation confidence

Actions:
- `PASS`
- `EDIT`
- `CONFIRM`

### B. Data Conflict
Example:
- Pet record says A3
- latest volunteer note says Medical
- vision sees Bella absent from A3

Human chooses/corrects truth.

### Important
Tinder/swipe interaction is visual only.
Always keep visible buttons.

---

## F7. Video Snippets
When an anomaly is detected:
- store anomaly timestamp
- create/start playback range around event

Target:
- 15–30 seconds before/after

Example:
```json
{
  "startTime": 842,
  "endTime": 872
}
```

The review card should jump directly to that segment.

If local clipping is difficult, use the original video with controlled `currentTime` + stop time.

---

## F8. Manual Human Observation
Volunteer/foster can type or speak:

> “Bella coughed several times during her walk.”

AI converts it into:
- dog
- timestamp
- source
- observable event
- context
- proposed route

This is stored alongside camera events.

---

## F9. Truth / Context Agent
After human confirmation, retrieve:
- dog record
- medical record
- recent observation history
- recent manual notes
- shelter/location state

Then create a short context package.

Example:

```text
Camera:
Breakfast interaction not observed.

Volunteer:
Reported coughing earlier.

Medical:
Procedure yesterday.

Previous:
Normal appetite yesterday.

Conclusion:
New observable change after recent procedure.
Human medical review recommended.
```

No diagnosis.

---

## F10. Triage Agent
Possible routes:
- `ROUTINE_ONLY`
- `VOLUNTEER_REVIEW`
- `SHELTER_MEDICINE`
- `BEHAVIOR`
- `OPERATIONS`

Example:
- food/appetite deviation + relevant medical context → `SHELTER_MEDICINE`
- repeated pacing without medical context → `BEHAVIOR`
- location mismatch → `OPERATIONS`
- obvious false positive → `ROUTINE_ONLY`

---

## F11. Arcade Action Agent
Arcade is the execution layer.

### Must work
#### Slack
Send real message to appropriate channel/team.

#### Google Calendar
Create:
- rechecks
- vaccinations
- care follow-ups

### Nice to have
#### Gmail
Foster communication / follow-up.

#### Sheets
Audit or operations log.

### Core principle
Success is **not**:
`message_sent = true`

Success is:
`responsible_human_acknowledged = true`

---

## F12. Case Lifecycle

```text
DETECTED
↓
PENDING_REVIEW
↓
CONFIRMED
↓
TRIAGED
↓
ACTION_SENT
↓
ACKNOWLEDGED
↓
RESOLVED
```

Dismissed flow:

```text
DETECTED
↓
PENDING_REVIEW
↓
DISMISSED
```

Persist all state changes in MongoDB.

---

## F13. Daily AI Report
Per dog, generate one concise daily summary.

Example:

```text
BELLA — TODAY

Food
Breakfast interaction was delayed.

Water
3 observed water interactions.

Activity
Morning activity was lower than recent routine.

Human Interaction
2 volunteer interactions.

Events
1 anomaly confirmed.

Action
Shelter Medicine review requested.

Next Care
Medical recheck at 3:30 PM.
```

---

## F14. Care Calendar
Display:
- vaccination due dates
- rechecks
- scheduled procedures
- foster follow-ups

Allow DogOS to create Calendar events through Arcade.

---

## F15. Ask DogOS
Small command/search bar.

Examples:
- “Where is Bella?”
- “What happened with Bella today?”
- “Which dogs need vaccinations this week?”
- “Which dogs need human review?”
- “Show dogs with unresolved cases.”

This queries our Mongo data + agent state.

Do not build a generic chatbot.

---

## F16. Foster Continuity
The DogOS identity must survive:

`IN_SHELTER → IN_FOSTER`

Do not create a new dog profile.

The same dog retains:
- medical record
- observations
- verified anomalies
- daily summaries
- prior cases
- routine information
- prior recommendations

Foster can report:
> “Bella coughed again tonight and didn’t finish dinner.”

DogOS retrieves prior shelter context and routes the new report appropriately.

---

# 4. DATA ARCHITECTURE

Use **one MongoDB database**.

Logical domains:
1. medical data
2. shelter data
3. dog/current-state data
4. observation/event data

Recommended collections:

```text
dogs
medicalRecords
shelters
observations
cases
careEvents
users
```

---

# 5. CANONICAL DATA MODELS

## 5.1 Dog

```json
{
  "_id": "dog_bella",
  "name": "Bella",
  "breed": "Labrador Mix",
  "age": 4,
  "sex": "female",
  "photoUrl": "/dogs/bella.jpg",
  "visualIdentity": {
    "referenceImages": [],
    "embedding": [],
    "currentTrackerId": null,
    "recognitionConfidence": null
  },
  "shelter": {
    "shelterId": "petzen_demo",
    "room": "A",
    "kennel": "A3",
    "status": "IN_SHELTER",
    "lastVerifiedLocationAt": null
  },
  "care": {
    "foodSchedule": ["08:00", "17:00"],
    "walkSchedule": ["10:00", "16:00"]
  },
  "dogosStatus": "NORMAL",
  "nextStep": "ROUTINE_MONITORING"
}
```

---

## 5.2 Medical Record

```json
{
  "_id": "med_bella",
  "dogId": "dog_bella",
  "vaccinations": [
    {
      "type": "Rabies",
      "lastDate": "2025-08-25",
      "nextDue": "2026-08-25",
      "status": "DUE_SOON"
    }
  ],
  "medications": [],
  "procedures": [
    {
      "name": "Minor procedure",
      "date": "2026-08-21",
      "status": "COMPLETED"
    }
  ],
  "restrictions": [],
  "clinicalNotes": []
}
```

---

## 5.3 Shelter

```json
{
  "_id": "petzen_demo",
  "name": "PetZen Demo Shelter",
  "rooms": [
    {
      "id": "room_A",
      "cameraId": "camera_01",
      "kennels": ["A1","A2","A3","A4","A5","A6","A7"]
    }
  ],
  "routing": {
    "medical": "#shelter-medical",
    "behavior": "#shelter-behavior",
    "operations": "#shelter-operations"
  }
}
```

---

## 5.4 DogEvent — CRITICAL SHARED CONTRACT

Every component must use this shape.

```json
{
  "_id": "event_001",
  "dogId": "dog_bella",
  "source": "CAMERA",
  "type": "FOOD_INTERACTION_MISSING",
  "timestamp": "2026-08-22T13:40:00Z",
  "confidence": 0.83,
  "description": "Expected breakfast interaction not observed.",
  "evidence": {
    "videoSource": "youtube_demo_1",
    "startTime": 121,
    "endTime": 151,
    "trackId": 4
  },
  "verification": {
    "status": "PENDING",
    "reviewedBy": null,
    "reviewedAt": null,
    "correction": null
  },
  "routing": null
}
```

Allowed `source`:
- `CAMERA`
- `VOLUNTEER`
- `FOSTER`
- `SYSTEM`

Allowed verification:
- `PENDING`
- `CONFIRMED`
- `DISMISSED`
- `CORRECTED`
- `HUMAN_REPORTED`

---

## 5.5 Case

```json
{
  "_id": "case_001",
  "dogId": "dog_bella",
  "eventIds": ["event_001"],
  "status": "TRIAGED",
  "route": "SHELTER_MEDICINE",
  "priority": "MEDIUM",
  "context": {
    "summary": "New observable change following recent procedure."
  },
  "actions": [
    {
      "type": "SLACK_MESSAGE",
      "status": "SENT",
      "externalId": null
    }
  ],
  "acknowledgedBy": null,
  "resolvedAt": null
}
```

---

# 6. REQUIRED SEED DOGS

Create exactly 7 demo dogs so all team members share the same identities.

| ID | Name | Kennel | Demo State |
|---|---|---|---|
| dog_bella | Bella | A3 | Hero anomaly case |
| dog_bruno | Bruno | A1 | Vaccine due soon |
| dog_milo | Milo | A2 | Normal |
| dog_luna | Luna | A4 | Foster continuity |
| dog_charlie | Charlie | A5 | Normal |
| dog_coco | Coco | A6 | Normal |
| dog_max | Max | A7 | Location-conflict example |

Do not change these IDs without telling the whole team.

---

# 7. HERO DEMO CASE — BELLA

## Background
Bella:
- Labrador mix
- Kennel A3
- procedure yesterday
- normal appetite yesterday
- expected breakfast around 8:00
- vaccination due soon

## Demo
1. Vision identifies Bella.
2. DogOS observes no breakfast interaction.
3. DogOS observes lower-than-normal activity.
4. Event becomes `PENDING_REVIEW`.
5. Review Queue shows Bella card + video snippet.
6. Volunteer presses `CONFIRM`.
7. Backend retrieves medical + recent observation context.
8. Truth Agent prepares evidence summary.
9. Triage Agent routes to `SHELTER_MEDICINE`.
10. Arcade sends real Slack message.
11. Arcade creates real Calendar recheck.
12. Case becomes `ACTION_SENT`.
13. Simulate or capture staff acknowledgement.
14. Case becomes `ACKNOWLEDGED`.
15. Later mark `RESOLVED`.
16. Move Bella to `IN_FOSTER`.
17. Foster reports a similar event.
18. DogOS retrieves Bella’s shelter history.
19. Arcade routes the follow-up.

This is the final presentation story.

---

# 8. TEAM OWNERSHIP

# PERSON 1 — FRONTEND

## Mission
Build everything judges see.

## Owns
- UI shell
- navigation
- Live Shelter
- Dog Profile
- Truth Queue
- Active Case
- Care Calendar
- Ask DogOS
- Foster Continuity
- agent action timeline
- loading/error/empty states

## Must consume APIs
Do not independently hardcode core dog logic.

Hardcoded fallback demo data is allowed only behind a clear fallback flag.

### Screen 1 — Live Shelter
KPIs:
- 7 Dogs Monitored
- 1 Needs Review
- 1 Active Intervention
- 3 Upcoming Care Events

Dog cards:
- photo
- name
- kennel
- status
- current activity
- last food interaction
- next care event

### Screen 2 — Dog Profile
Sections:
- video/tracking preview
- current activity
- identity confidence
- today timeline
- routine comparison
- medical context
- next care events
- current open case

### Screen 3 — DogOS Truth Queue
Must show:
- dog
- observation type
- timestamp
- why flagged
- context
- video snippet
- confidence
- PASS
- EDIT
- CONFIRM

### Screen 4 — Active Case / Agent Timeline
Show only observable agent actions.

### Screen 5 — Care Calendar
Show vaccination, recheck, foster follow-up.

### Screen 6 — Foster Continuity
Hero message:
**Bella’s memory came with her.**

### Screen 7 — Ask DogOS
Questions:
- Where is Bella?
- What happened to Bella today?
- Which dogs have vaccines due?
- Who needs review?
- Show unresolved cases.

## Person 1 Acceptance Criteria
- All main flows clickable.
- Works on laptop presentation resolution.
- No broken buttons.
- Review card looks polished.
- Agent timeline visibly updates.
- Dog names come from backend.
- No giant analytics dashboard.
- No fake medical diagnosis language.

---

# PERSON 2 — BACKEND + MONGODB + API + ARCADE

## Mission
Own DogOS system backbone and real sponsor actions.

## Backend Responsibilities

### A. MongoDB
Implement:
- dogs
- medicalRecords
- shelters
- observations
- cases
- careEvents

Seed all 7 dogs.

### B. Core APIs

```text
GET  /api/dogs
GET  /api/dogs/:dogId
GET  /api/dogs/:dogId/timeline
GET  /api/dogs/:dogId/report

POST /api/observations
GET  /api/review
POST /api/review/:eventId/confirm
POST /api/review/:eventId/dismiss
POST /api/review/:eventId/edit

GET  /api/cases
GET  /api/cases/:caseId
POST /api/cases/:caseId/acknowledge
POST /api/cases/:caseId/resolve

GET  /api/care-events
POST /api/care-events

POST /api/dogs/:dogId/move-to-foster

POST /api/ask
```

### C. Event Ingestion
Person 4 sends `DogEvent`.

Backend:
1. validates dog exists
2. validates event schema
3. stores event
4. runs anomaly/routine logic if required
5. creates review item if needed
6. emits frontend update

### D. Human Review
On confirm:
1. set event `CONFIRMED`
2. retrieve dog
3. retrieve medical record
4. retrieve recent observations
5. run Person 3 truth/context logic
6. run Person 3 triage logic
7. create Case
8. invoke Arcade workflow

On dismiss:
- mark `DISMISSED`
- do not route
- retain for audit/feedback

On edit:
- preserve original AI output
- store human correction
- create corrected canonical event if confirmed

### E. Arcade

Mandatory:
- Slack
- Google Calendar

Optional:
- Gmail
- Sheets

### F. Resolution State Machine

```text
DETECTED
PENDING_REVIEW
CONFIRMED
TRIAGED
ACTION_SENT
ACKNOWLEDGED
RESOLVED
DISMISSED
```

### G. Ask DogOS
Answer only from Mongo data / agent state.

## Person 2 Acceptance Criteria
- Mongo seed script works.
- All 7 dogs load.
- Person 4 can POST an event.
- Person 1 can fetch review queue.
- Confirm creates a case.
- Slack message actually arrives.
- Calendar event actually appears.
- Case state changes are persisted.
- Foster transition retains same dogId.

---

# PERSON 3 — MEDICAL LABELS + AI SAFETY + TRIAGE KNOWLEDGE

## Mission
Define what DogOS is allowed to observe, say, infer, and route.

## Observation Vocabulary

### Allowed
- reduced food interaction
- increased/decreased movement
- prolonged inactivity
- repeated pacing
- volunteer-reported cough
- volunteer-reported vomiting
- possible bathroom event
- water interaction
- human interaction
- location mismatch
- missed scheduled care

### Never state as camera fact
- kennel cough
- infection
- dehydration
- depression
- anxiety
- arthritis
- pain
- fever
- diagnosis of any kind

## Safe Language Templates

Use:
> “Food interaction was not observed during Bella’s expected breakfast window.”

> “Bella’s morning activity differed from her recent routine.”

> “A volunteer reported repeated coughing.”

> “Human medical review is recommended.”

Never:
> “Bella has kennel cough.”

> “Bella is sick.”

> “Bella is depressed.”

> “Bella is in pain.”

## Triage Labels

```text
ROUTINE_ONLY
VOLUNTEER_REVIEW
SHELTER_MEDICINE
BEHAVIOR
OPERATIONS
```

## Truth Agent Rules
1. identify each source
2. distinguish observed vs reported vs verified
3. detect conflict
4. prefer human-verified information over raw AI observation
5. never silently overwrite contradictory data
6. surface unresolved conflict

Trust order for MVP:

```text
HUMAN VERIFIED CURRENT EVENT
>
CLINICAL RECORD
>
TRAINED STAFF / VOLUNTEER REPORT
>
AI CAMERA OBSERVATION
>
STALE SYSTEM RECORD
```

## Hero Bella Expected Output

```json
{
  "route": "SHELTER_MEDICINE",
  "priority": "MEDIUM",
  "summary": "A new feeding/activity deviation was human-verified after a recent procedure. Human medical review is recommended.",
  "diagnosis": null
}
```

## Person 3 Acceptance Criteria
- Seed medical data for all 7 dogs exists.
- Bella demo case is deterministic.
- No diagnosis language appears.
- Person 2 receives clear triage rules.
- At least 10 example events + expected routes exist.
- Truth conflicts have explicit handling.

---

# PERSON 4 — VISION + VIDEO + LIVE SHELTER INTELLIGENCE

## Mission
Turn YouTube shelter footage into individually identified DogOS events.

## INPUT
Two YouTube shelter video URLs.

For demo reliability:
- download/process clips locally if permitted
- or use a prepared local video source
- retain source timestamps

## Vision Pipeline

```text
VIDEO
↓
DOG DETECTOR
↓
MULTI-OBJECT TRACKER
↓
INITIAL ID MAPPING
↓
VISUAL RE-ID ASSIST
↓
PER-DOG EVENT STREAM
↓
ANOMALY / ROUTINE SIGNAL
↓
DogEvent POST → backend
```

## Dog Detection
Use a pretrained model.
Do not train from scratch.

## Tracking
Preferred:
- ByteTrack
- DeepSORT

## Identity Initialization
At beginning:
1. fetch dogs from backend
2. user chooses detected dog
3. assign backend dog identity
4. save reference crop/embedding

## Visual Re-Identification
If tracker loses dog:
1. crop new detection
2. create visual embedding
3. compare with known dog references
4. if confidence high → restore dogId
5. if uncertain → mark `IDENTITY_REVIEW_REQUIRED`

Never silently assign low-confidence identity.

## Activity/Event Extraction

Required:
- moving
- resting/stationary
- prolonged inactivity
- pacing approximation
- bowl-zone approach
- bowl-zone interaction
- water-zone interaction
- kennel presence
- human interaction

Use ROIs for:
- kennel
- bowl
- water

## Event Aggregation
Do not send frame-by-frame data to LLM/backend.

Aggregate first.

## Anomaly Logic

### Missing Feeding
If expected food window exists and no bowl interaction is observed:
Emit `FOOD_INTERACTION_MISSING`

### Prolonged Inactivity
If stationary duration exceeds chosen threshold and recent baseline:
Emit `PROLONGED_INACTIVITY`

### Pacing
Approximate repeated back-and-forth trajectory:
Emit `PACING`

### Location Mismatch
If backend says kennel A3 but tracked dog is elsewhere for defined window:
Emit `LOCATION_MISMATCH`

## Video Evidence
Every anomaly stores:
- source
- timestamp
- start time
- end time
- optional saved clip

## API Contract

```text
POST /api/observations
```

Payload must match `DogEvent`.

## Person 4 Acceptance Criteria
- At least one video runs.
- Dogs are detected.
- At least 2 dogs can be named/tracked.
- Bella maps to backend `dog_bella`.
- One anomaly is generated.
- Anomaly includes playable evidence timestamp.
- Backend receives it.
- Review Queue displays it.
- If ReID fails, manual correction fallback works.

---

# 9. AI AGENT ARCHITECTURE

Keep five conceptual agents.

## 1. Sentinel Agent
Video → structured observations.

## 2. Routine Agent
Event history → deviation/anomaly.

## 3. Truth Agent
Verified event + medical + shelter + volunteer + camera context → evidence-based current truth.

## 4. Triage Agent
Truth/context → route + priority + safe summary.

## 5. Action Agent
Case → Arcade tool execution + state transitions.

---

# 10. FULL END-TO-END FLOW

```text
1. Video runs
2. Dog detected
3. Tracker maintains dog identity
4. DogOS associates identity with backend dogId
5. Observable events collected
6. Routine Agent finds possible deviation
7. Observation stored
8. Review card created
9. Human watches video evidence
10. Human chooses PASS / EDIT / CONFIRM

IF PASS:
11. Event dismissed
12. No action
13. Feedback retained

IF EDIT:
11. Human correction stored
12. Corrected event becomes canonical if confirmed

IF CONFIRM:
11. Event becomes verified
12. Truth Agent gathers context
13. Triage Agent selects team
14. Case created
15. Arcade sends Slack
16. Arcade creates Calendar follow-up
17. Case becomes ACTION_SENT
18. Human acknowledges
19. Case becomes ACKNOWLEDGED
20. Later resolved
21. Dog profile + report update

IF DOG MOVES TO FOSTER:
22. Same dogId retained
23. Same history retained
24. Foster submits observation
25. DogOS uses previous shelter context
26. Arcade routes follow-up
```

---

# 11. DEMO SCRIPT

## Scene 1 — Live Shelter
> “A volunteer cannot watch every dog, every minute. DogOS can.”

Show:
`7 DOGS • 7 AI CARE AGENTS`

## Scene 2 — Bella
Video/agent detects:
- missed expected food interaction
- lower morning activity

Bella:
`NEEDS REVIEW`

## Scene 3 — Truth Queue
Play snippet.
Press `CONFIRM`.

## Scene 4 — Intelligence
Show:
- Camera
- Volunteer
- Medical
- Previous context

Then:
`ROUTE → SHELTER MEDICINE`

## Scene 5 — Arcade
Show:
- real Slack message
- real Calendar event

## Scene 6 — Acknowledgement
Staff:
> “I’ll check Bella.”

DogOS:
`BEING CHECKED`

Then:
`RESOLVED`

## Scene 7 — Foster Continuity
Move Bella:
`IN_SHELTER → IN_FOSTER`

Foster submits:
> “Bella coughed again tonight and didn’t finish dinner.”

DogOS links history and routes follow-up.

Finish:
> “The shelter changed. The caregiver changed. The software changed. Bella’s memory shouldn’t.”

---

# 12. UI NAVIGATION

Keep sidebar only:

```text
Live Shelter
Truth Queue
Active Cases
Care Calendar
```

Ask DogOS stays in header.

Do not add 15 navigation items.

---

# 13. REPO / FOLDER SUGGESTION

Adapt to existing repo.

```text
/
├── CLAUDE.md
├── frontend/
│   ├── app/
│   ├── components/
│   │   ├── DogCard
│   │   ├── TruthCard
│   │   ├── AgentTimeline
│   │   ├── VideoEvidence
│   │   └── CareCalendar
│   └── lib/
│       └── api
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   ├── routineAgent
│   │   ├── truthAgent
│   │   ├── triageAgent
│   │   ├── arcadeService
│   │   └── reportService
│   ├── seed/
│   └── server
│
├── vision/
│   ├── detector
│   ├── tracker
│   ├── reid
│   ├── roi
│   ├── event_aggregator
│   └── send_event
│
└── docs/
    ├── demo-scenarios.md
    └── triage-rules.md
```

Do not restructure a working repo just to match this.

---

# 14. INTEGRATION ORDER

## Phase 1 — Contracts
All team members first agree on:
- dog IDs
- DogEvent schema
- Case schema
- API endpoint
- hero Bella scenario

## Phase 2 — Parallel Build
Person 1: UI with mocks  
Person 2: Mongo/API/Arcade  
Person 3: Medical seed + triage rules  
Person 4: Vision pipeline

## Phase 3 — First Integration

```text
Person 4
POST DogEvent
↓
Person 2 backend
↓
Person 1 Truth Queue
```

## Phase 4 — Closed Loop

```text
CONFIRM
↓
Truth Agent
↓
Triage
↓
Arcade Slack
↓
Arcade Calendar
↓
Case timeline
```

## Phase 5 — Foster
Only after closed loop works.

---

# 15. BUILD PRIORITY

## P0 — MUST SHIP
- seed 7 dogs
- Live Shelter
- dog profile
- event ingestion
- one anomaly
- video evidence
- Truth Queue
- confirm/dismiss
- triage
- real Slack action
- real Calendar action
- agent timeline
- Bella demo

## P1 — SHOULD SHIP
- Ask DogOS
- daily report
- location conflict
- foster continuity

## P2 — ONLY IF EVERYTHING WORKS
- sophisticated ReID
- Gmail foster emails
- Sheets logging
- multiple anomaly classes
- fancy charts
- advanced CV

---

# 16. FALLBACKS

## If dog ReID fails
Use:
- manual initial identity
- tracker persistence
- kennel/ROI context
- manual identity correction

## If camera anomaly fails
Precompute one event from the source video and still show:
- evidence
- human review
- AI reasoning
- real Arcade action

## If Slack integration fails
Get Calendar working and fix Slack before adding any extra feature.

## If LLM output varies
Make Bella hero case deterministic with structured prompts/rules.

---

# 17. PRODUCT LANGUAGE

Use:
- observation
- routine deviation
- verified event
- human review
- medical review recommended
- context
- evidence
- active case
- acknowledged
- resolved

Avoid:
- diagnosis
- disease detected
- emotion detected
- dog is sick
- AI doctor
- AI veterinarian
- guaranteed identity

---

# 18. PRESENTATION PROBLEM → SOLUTION MAPPING

### Inaccessible Data
**DogOS Unified Dog Profile + Ask DogOS**
> One dog, one live view across all care data.

### Time-Consuming
**Automatic observations + AI reports + Arcade execution**
> Humans care for animals instead of moving information between systems.

### Unreliable & Outdated
**Truth Queue + human verification + live observations**
> AI guesses never become shelter truth without verification.

### Hard to Scale
**Exception-based individual care agents**
> AI watches everything; humans review only what needs attention.

---

# 19. SPONSOR STORY

## Arcade.dev
DogOS Brain decides **what should happen**.

Arcade decides **what DogOS is authorized to do**.

Arcade executes:
- Slack
- Calendar
- Gmail if available
- other delegated tools

Pitch:
> “Arcade is the execution kernel of DogOS. Without it, DogOS observes. With it, DogOS closes the care loop.”

## Emergent
Use Emergent for rapid product/UI development if it accelerates the frontend.

Say:
> “Emergent helped us turn the rescue workflow into a deployed operational product inside the hackathon.”

## Morgan Stanley / UNO Group
Supporting sponsors.
Do not force artificial integrations.

---

# 20. SUCCESS METRICS

Potential:
- dogs monitored
- observations generated
- anomalies reviewed
- false positives dismissed
- confirmed events routed
- median observation → acknowledgement time
- upcoming care events scheduled
- unresolved cases
- data conflicts resolved

Best metric:
### `Observation → Responsible Human Acknowledged`

---

# 21. FINAL PRODUCT PRINCIPLES

1. **Dog-centered, not system-centered.**
2. **Observe first. Diagnose never.**
3. **AI proposes truth; humans verify truth.**
4. **Verified truth should trigger action.**
5. **An agent is not done when it sends a message. It is done when the care loop closes.**
6. **A dog’s memory must survive every transition.**
7. **AI watches everything; humans see only what matters.**

---

# 22. FINAL PITCH

> “Today, a dog’s medical history can live in one system, volunteer observations in another, its location somewhere else, and the most recent truth inside a person’s head.
>
> DogOS gives every dog an AI care agent.
>
> It continuously turns video and human observations into a live timeline, learns the dog’s routine, surfaces only meaningful deviations, asks humans to verify what is true, and then uses Arcade to notify the right team, schedule the next action, and stay with the case until someone responds.
>
> When the dog leaves the shelter for foster care, that memory goes with them.
>
> PetPoint can be the system of record.
>
> **DogOS becomes the system of awareness and action.**”

---

# 23. CLAUDE CODE EXECUTION INSTRUCTION

When Claude Code reads this file:

1. Inspect the existing repository before modifying architecture.
2. Preserve working code.
3. Do not rewrite the whole project unless necessary.
4. Identify which team/person owns the requested task.
5. Respect the shared schemas in this document.
6. Do not silently change dog IDs or API contracts.
7. Implement only the current person’s responsibilities unless explicitly instructed otherwise.
8. Use mocks only where the real integration is not yet available.
9. Keep all mocked interfaces compatible with the final API contract.
10. Optimize for a reliable hackathon demo over production-scale perfection.
11. After each feature, test the exact Bella demo flow it participates in.
12. Never introduce medical diagnosis claims.
13. Before adding a new dependency, verify it is necessary.
14. Prefer the simplest implementation that proves the concept.
15. If an existing implementation conflicts with this file, preserve working behavior and adapt incrementally rather than blindly replacing it.

---

# END STATE

At demo time, the system must prove:

```text
DOG
↓
OBSERVED
↓
INDIVIDUALLY IDENTIFIED
↓
ANOMALY DETECTED
↓
HUMAN VERIFIED
↓
CONTEXT UNDERSTOOD
↓
RIGHT TEAM SELECTED
↓
ARCADE ACTS
↓
HUMAN ACKNOWLEDGES
↓
CASE RESOLVED
↓
DOG MEMORY CONTINUES INTO FOSTER
```

If this works, DogOS is demo-ready.


---

# 24. ARCADE.DEV — EXACT TOOLS AND EXECUTION PLAN

Arcade is the **permissioned action runtime** for DogOS.

Do not use Arcade only as a thin wrapper around one Slack message. The agent should use Arcade to perform real shelter actions and verify that those actions led to a human response.

## Arcade Priority Order

### P0 — Slack
Required for the hero demo.

Target capabilities:
- send a message to the correct shelter team
- read/search channel or thread responses
- detect acknowledgement
- optionally reply in the same thread

DogOS flow:

```text
Verified Bella observation
↓
Triage = SHELTER_MEDICINE
↓
Arcade → Slack message
↓
Shelter Medicine replies
"I'll check Bella."
↓
DogOS reads acknowledgement
↓
Case = ACKNOWLEDGED
```

Expected logical tool wrappers in DogOS:

```text
notifySlackTeam(case)
getSlackCaseReplies(case)
detectHumanAcknowledgement(case)
```

If Arcade's exact tool names differ, map these wrappers to the available Slack tools rather than changing the DogOS application contract.

---

### P0 — Google Calendar
Required for the hero demo.

Use for:
- medical rechecks
- vaccination dates
- care follow-ups
- foster follow-ups

Expected logical wrappers:

```text
createCareEvent(case, dateTime)
listDogCareEvents(dogId)
updateCareEvent(eventId, changes)
```

Hero example:

```text
Bella anomaly confirmed
↓
Shelter Medicine review required
↓
Arcade → create Google Calendar event

Title:
Bella — Medical Recheck

Description:
DogOS case case_bella_001
Verified feeding/activity deviation
Human medical review requested
```

Vaccination example:

```text
Bruno vaccination due
↓
DogOS Care Calendar
↓
Schedule
↓
Arcade → Google Calendar
```

---

### P1 — Gmail
Use primarily for foster continuity.

Possible actions:

```text
contactFoster()
sendFosterFollowup()
replyToFoster()
searchFosterConversation()
```

Example:

```text
Bella moves to foster
↓
Foster reports:
"She coughed again tonight."
↓
DogOS retrieves prior shelter context
↓
Arcade → Gmail follow-up / instructions
↓
Response becomes part of Bella's continuing case history
```

Do not prioritize Gmail above Slack + Calendar.

---

### P2 — Google Sheets
Optional.

Only add if the core loop is already stable.

Possible use:
- operational audit log
- confirmed observations
- routed team
- acknowledgement status
- resolution timestamps

Example columns:

```text
Dog
Observation
Verified
Route
Action
Status
Timestamp
```

Do not spend meaningful hackathon time polishing Sheets integration.

---

# 25. CUSTOM DOGOS MCP / ARCADE TOOLS

If time permits, expose DogOS's own shelter-data actions as custom Arcade/MCP tools.

This makes Arcade central to the architecture rather than only an external notification layer.

Recommended custom DogOS tools:

```text
DogOS.GetDog
DogOS.GetMedicalRecord
DogOS.GetCurrentLocation
DogOS.GetRecentObservations
DogOS.GetActiveCases
DogOS.UpdateVerifiedLocation
DogOS.CreateVerifiedObservation
DogOS.MoveDogToFoster
DogOS.ResolveCase
```

These tools should operate on the same MongoDB data used by the backend.

Conceptual Arcade tool surface:

```text
ARCADE ACTION RUNTIME

├── DogOS.GetDog
├── DogOS.GetMedicalRecord
├── DogOS.GetCurrentLocation
├── DogOS.UpdateVerifiedLocation
├── DogOS.MoveDogToFoster
│
├── Slack.Send / Read / Thread actions
│
├── Google Calendar Create / Read / Update actions
│
├── Gmail Send / Search / Reply actions
│
└── Optional Google Sheets actions
```

Exact Arcade tool names may vary by installed toolkit/version. Keep application-level wrapper names stable and bind them to the available Arcade tools.

---

# 26. ARCADE ACTION ORCHESTRATION

Person 2 should implement one backend service boundary:

```text
backend/services/arcadeService
```

Suggested interface:

```text
notifyTeam(case)
scheduleRecheck(case, dateTime)
scheduleVaccination(dogId, vaccination)
contactFoster(dogId, message)
checkAcknowledgement(case)
```

The rest of DogOS should not directly depend on vendor-specific Slack/Calendar tool names.

Internally:

```text
DogOS Case
↓
arcadeService
↓
Arcade authorization/runtime
↓
Slack / Calendar / Gmail / DogOS custom MCP
```

---

# 27. ARCADE HERO DEMO REQUIREMENTS

The hero demo is not complete unless the following happens:

```text
1. Bella anomaly is human-confirmed.
2. Truth/Triage routes Bella to Shelter Medicine.
3. Arcade sends a REAL Slack message.
4. Arcade creates a REAL Google Calendar recheck.
5. DogOS records both actions in the case timeline.
6. A human acknowledgement is captured.
7. Case state moves ACTION_SENT → ACKNOWLEDGED.
```

The frontend should display:

```text
✓ Verified observation
✓ Context retrieved
✓ Routed → Shelter Medicine
✓ Arcade → Slack sent
✓ Arcade → Calendar recheck created
● Awaiting acknowledgment
```

Then:

```text
✓ Shelter Medicine acknowledged
```

Only after that should the case be considered actively handled.

---

# 28. WHY ARCADE EXISTS IN DOGOS

Use this explanation in code comments, README/presentation material, and demo narration:

> DogOS decides what should happen. Arcade controls what the agent is authorized to do and executes those actions across the shelter's existing tools.

Important architecture distinction:

```text
DogOS AI
= reasoning / context / triage

Arcade
= permissions / tool execution / external actions

MongoDB
= current application state / demo system of truth

Human
= final verification and care authority
```

Do not let the LLM own credentials directly.

Do not bypass Arcade with direct Slack/Calendar APIs for the main sponsor demo unless an unavoidable technical blocker occurs.

---

# 29. ARCADE JUDGE PITCH

Use this line:

> “We didn't use Arcade just to send a Slack message. Arcade is DogOS's permissioned action runtime. The agent assembles verified shelter context, routes the case, acts across Slack and Calendar, and keeps the case open until a human acknowledges the care event.”

Shorter version:

> **DogOS provides the intelligence. Arcade gives it permissioned hands.**
