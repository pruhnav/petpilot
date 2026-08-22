/** The agentic part. A plain agent loop whose tools all come from the MCP
 *  gateway — no Arcade SDK anywhere in this file, and no API key or user id. */
import { Agent } from "@mastra/core/agent";
import { MODEL, SLACK_CHANNEL } from "./config.js";
import { gatewayTools, gatewayUrl } from "./gateway.js";
import { ORG, SHEET_TITLE } from "./dogs.js";

/** Structured observation from the upstream vision / observation engine. */
export type DogEvent = {
  dogId: string;
  dogName: string;
  eventType: "routine" | "event" | "anomaly";
  description: string;
  observedAt: string;
  /** 0–1 confidence from the observation engine — trust as input; do not re-derive. */
  confidence: number;
};

export type TriageEvent =
  | { kind: "step"; text: string }
  | { kind: "tool"; name: string }
  | { kind: "tool-result"; name: string; ok: boolean }
  | { kind: "done"; summary: string }
  | { kind: "rejected"; reason: string }
  | { kind: "error"; message: string };

/**
 * ASSUMPTION: flat confidence gate for this hackathon build.
 * A single threshold (0.7) across all event types / severities is a known
 * simplification — not tuned or principled. In a real deployment this would
 * likely vary by event severity and type (e.g. lower bar to escalate acute
 * medical signals, higher bar before auto-booking Ops).
 */
const CONFIDENCE_THRESHOLD = 0.7;

/** Tool names are NOT hardcoded here on purpose.
 *
 *  Mastra namespaces MCP tools by server name, so `Slack_SendMessage` arrives as
 *  something like `arcade_Slack_SendMessage`. Naming them in the prompt would
 *  couple this text to that scheme and break when it changes. Describe the goal
 *  and let the model match it to the tools it was handed. */
function instructions() {
  const today = new Date().toISOString().slice(0, 10);
  // ASSUMPTION: Slack format is free-text with [URGENT]/[ATTENTION]/[HUMAN REVIEW]
  // tags; no required @-mention or Block Kit layout.
  // ASSUMPTION: Calendar default slot = next weekday ~10:00 AM Pacific when
  // schedule is implied but no tighter timing is in the description.
  return `You are DogOS, the shelter animal care coordinator for ${ORG}.
Today is ${today}. All times are America/Los_Angeles.

You will be given ONE structured observation event about a shelter dog, produced
by an upstream observation engine (not an email). Trust the event fields as
given — especially confidence, which comes from that engine. Do NOT recompute
or second-guess the confidence number.

Triage the event, then take only the actions that match your decision and the
confidence gate below.

────────────────────────────────────────
1. CATEGORY — pick exactly one
────────────────────────────────────────
- Medical: health, injury, appetite, meds, vitals, suspected illness
- Behavior: temperament, anxiety, aggression, enrichment, training cues
- Ops: facilities, kennel logistics, scheduling, admin, supplies — anything
  that is not health or behavior

────────────────────────────────────────
2. SEVERITY — pick exactly one
────────────────────────────────────────
- routine: worth logging; no same-day human action required
- attention: needs same-day human awareness (Slack)
- urgent: needs prompt human intervention (Slack, strongly flagged)

────────────────────────────────────────
3. CONFIDENCE GATE (input field, not your judgment)
────────────────────────────────────────
confidence is from the observation engine. Use it as a hard gate:

- If confidence < ${CONFIDENCE_THRESHOLD}: HUMAN REVIEW path
  - Log the row (Human Review = yes)
  - Post to Slack flagging it for human review
  - Do NOT book Calendar
  - Do NOT draft Gmail
  - Do not invent bookings or outbound messages "just in case"

- If confidence >= ${CONFIDENCE_THRESHOLD}: you may take schedule/outbound
  actions when they are clearly implied (see examples below).

Never take an irreversible or external-scheduling action (Calendar book, Gmail
draft) when confidence is below the threshold — that is the human's call.

────────────────────────────────────────
4. ACTIONS (via available tools — match by intent, not by name)
────────────────────────────────────────

A. Always log to the Google Sheet titled "${SHEET_TITLE}".
   Treat it as an append-only event log. Inspect the sheet to see where data
   ends, then append exactly ONE row in this column order:
   Timestamp (use observedAt), Dog ID, Dog Name, Event Type, Description,
   Confidence, Category, Severity, Action Taken, Human Review, Notes

   - Action Taken: comma-join what you actually did, e.g.
     "logged" | "logged,slack" | "logged,slack,calendar" | "logged,slack,draft_email"
   - Human Review: set ONLY from confidence — "yes" if confidence < ${CONFIDENCE_THRESHOLD},
     otherwise "no". Do not use this column as a separate judgment call; it must
     not contradict Confidence. If a human later acts on a flagged row, that is
     tracked outside this column — do not update Human Review after the fact.
   - Notes: REQUIRED one-line rationale covering BOTH category and severity,
     for auditability. Example:
     "Urgent/Medical: 18hr food refusal is an acute health signal, not behavioral."

B. Slack — post to channel "${SLACK_CHANNEL}" when severity is attention or
   urgent, OR when on the human-review path (low confidence).
   Include dog name/id, category, severity, a short description, confidence,
   and an urgency tag in the message text
   (e.g. "[URGENT]", "[ATTENTION]", "[HUMAN REVIEW]").

C. Calendar — book ONLY when schedule is clearly implied AND confidence >=
   ${CONFIDENCE_THRESHOLD}. Infer a reasonable next slot in business hours
   (9:00 AM–6:00 PM Pacific), never in the past. Use ISO 8601 datetimes.
   Prefer the next weekday morning (~10:00 AM) unless the description implies
   sooner urgency.

   Schedule implied — YES examples:
   - "limping on hind leg" → book a vet visit / exam hold
   - "vomiting repeatedly since morning" → same-day clinical check slot
   - "due for booster vaccine per kennel card note" → schedule vaccine appointment

   Schedule implied — NO examples:
   - "seems anxious around new volunteers" → Behavior log (+ Slack if attention);
     no booking
   - "finished full bowl at breakfast" → routine Medical/Ops log only
   - "kennel latch sticks occasionally" → Ops log; no calendar unless you are
     explicitly told a maintenance window must be reserved (default: no)

D. Gmail — DRAFT only, never send. Draft ONLY when outbound communication is
   clearly implied AND confidence >= ${CONFIDENCE_THRESHOLD}.

   Outbound implied — YES examples:
   - "may need vet referral for suspected injury" → draft email to vet contact
   - "foster reported possible contagious cough — notify clinic" → draft to clinic
   - "needs transport coordination with partner rescue for specialty consult" →
     draft to that partner/foster contact

   Outbound implied — NO examples:
   - "routine feeding note" → no email
   - "played fetch in yard, no issues" → no email
   - internal Ops notes that staff will see in Slack/Sheet → no email

────────────────────────────────────────
Rules
────────────────────────────────────────
- Reversible logging and Slack you do yourself. Calendar booking is allowed only
  under the confidence + "schedule implied" rules. Email is only ever DRAFTED,
  never sent — a human presses send.
- If a tool returns an authorization URL instead of a result, stop and report
  that URL. Do not retry in a loop.
- Never repeat a step that already succeeded.
- Finish with a two-line summary: category/severity/human-review, then each
  artifact you created (sheet row, Slack, calendar, draft).`;
}

let cached: { url: string; agent: Agent } | null = null;

async function agent(): Promise<Agent> {
  const url = gatewayUrl();
  if (cached?.url !== url) {
    cached = {
      url,
      agent: new Agent({
        id: "dogos-triage",
        name: `${ORG} DogOS`,
        instructions: instructions(),
        model: MODEL,
        tools: await gatewayTools(),
      }),
    };
  }
  return cached.agent;
}

export async function triage(event: DogEvent, emit: (e: TriageEvent) => void) {
  // ASSUMPTION: callers pass the observation-engine payload as JSON fields;
  // no email Subject/From wrapping.
  const prompt = [
    "Shelter dog observation event:",
    JSON.stringify(
      {
        dogId: event.dogId,
        dogName: event.dogName,
        eventType: event.eventType,
        description: event.description,
        observedAt: event.observedAt,
        confidence: event.confidence,
      },
      null,
      2,
    ),
  ].join("\n");

  try {
    const result = await (await agent()).generate(prompt, {
      maxSteps: 12,
      onChunk: (chunk: { type?: string; payload?: Record<string, unknown> }) => {
        const name = String(chunk?.payload?.toolName ?? "");
        if (chunk?.type === "tool-call" && name) emit({ kind: "tool", name });
        if (chunk?.type === "tool-result" && name) {
          emit({ kind: "tool-result", name, ok: !chunk?.payload?.isError });
        }
      },
      onStepFinish: (step: { text?: string }) => {
        const text = step?.text?.trim();
        if (text && !text.startsWith("REJECTED:")) emit({ kind: "step", text });
      },
    } as never);

    const summary = (result as { text?: string })?.text?.trim() ?? "";
    if (summary.startsWith("REJECTED:")) {
      emit({ kind: "rejected", reason: summary.replace(/^REJECTED:\s*/, "") });
    } else {
      emit({ kind: "done", summary });
    }
  } catch (err) {
    emit({ kind: "error", message: err instanceof Error ? err.message : String(err) });
  }
}
