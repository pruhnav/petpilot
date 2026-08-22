/** The harness: a local server that turns the triage agent into an ambient one.
 *
 *  Two layers, kept deliberately apart:
 *    - Arcade SDK (API key + user id): pre-authorizes Google and Slack.
 *      Plumbing. (Gmail poll / demo-email path is parked until needed.)
 *    - MCP gateway: every tool call the agent makes. See GATEWAY_AUTH for how
 *      this client authenticates to it.
 *
 *  Three phases, and the UI only shows what the current one needs:
 *    connect -> gateway -> ready
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

import { PORT, SLACK_CHANNEL, ARCADE_USER_ID } from "./config.js";
import {
  awaitConnect,
  providerState,
  sendDemoEmail,
  startConnect,
} from "./arcade.js";
import {
  gatewayConfigured,
  gatewayConnected,
  gatewayNeedsAuthorize,
  gatewayUrl,
  restoreGateway,
  setGateway,
  startGatewayAuth,
  storeGatewayTokens,
} from "./gateway.js";
import { completeGatewayAuth } from "./oauth.js";
import { triage, type DogEvent, type TriageEvent } from "./triage.js";
import { formToEmail, GENUINE_SAMPLES, SPAM_SAMPLES } from "./applications.js";
import { DOGS, ORG } from "./dogs.js";

type Feed =
  | { type: "log"; level: "info" | "warn" | "error"; text: string }
  | { type: "observation"; dogName: string; description: string; confidence: number }
  | { type: "triage"; event: TriageEvent };

/**
 * TEMPORARY — mock observation events until the upstream vision / observation
 * engine is wired. Replace this list (and /api/demo-event) with real pipeline
 * ingestion; do not treat these as production fixtures.
 */
const SAMPLE_DOG_EVENTS: DogEvent[] = [
  {
    dogId: "dog_biscuit",
    dogName: "Biscuit",
    eventType: "anomaly",
    description: "hasn't eaten in 18 hours",
    observedAt: new Date().toISOString(),
    confidence: 0.91,
  },
  {
    dogId: "dog_marigold",
    dogName: "Marigold",
    eventType: "anomaly",
    description: "limping on hind leg after yard time",
    observedAt: new Date().toISOString(),
    confidence: 0.87,
  },
  {
    dogId: "dog_juniper",
    dogName: "Juniper",
    eventType: "event",
    description: "seems anxious around new volunteers",
    observedAt: new Date().toISOString(),
    confidence: 0.84,
  },
  {
    dogId: "dog_waffles",
    dogName: "Waffles",
    eventType: "routine",
    description: "finished full bowl at breakfast",
    observedAt: new Date().toISOString(),
    confidence: 0.96,
  },
  {
    dogId: "dog_tofu",
    dogName: "Tofu",
    eventType: "event",
    description: "kennel latch sticks occasionally",
    observedAt: new Date().toISOString(),
    confidence: 0.79,
  },
  {
    dogId: "dog_olive",
    dogName: "Olive",
    eventType: "anomaly",
    description: "possible limp — camera angle unclear, may be shadow",
    observedAt: new Date().toISOString(),
    confidence: 0.42,
  },
];

const subscribers = new Set<(f: Feed) => void>();
const publish = (f: Feed) => {
  for (const send of subscribers) send(f);
};

const log = (text: string, level: "info" | "warn" | "error" = "info") => {
  console.log(`[${level}] ${text}`);
  publish({ type: "log", level, text });
};

const app = new Hono();

/** Serve a page from public/, substituting the brand.
 *
 *  Read per request rather than cached, so editing the HTML mid-workshop only
 *  needs a browser refresh. */
const page = (file: string) =>
  readFileSync(join(process.cwd(), "public", file), "utf8").replaceAll("{{ORG}}", ORG);

app.get("/", (c) => c.html(page("index.html")));

app.get("/api/state", async (c) => {
  const providers = await providerState();
  const allConnected = providers.length > 0 && providers.every((p) => p.connected);
  const next = providers.find((p) => !p.connected) ?? null;
  return c.json({
    userId: ARCADE_USER_ID,
    channel: SLACK_CHANNEL,
    phase: !allConnected ? "connect" : gatewayConnected() ? "ready" : "gateway",
    providers,
    next,
    step: {
      done: providers.filter((p) => p.connected).length,
      total: providers.length,
    },
    gateway: {
      url: gatewayUrl(),
      configured: gatewayConfigured(),
      connected: gatewayConnected(),
      needsAuthorize: gatewayNeedsAuthorize(),
    },
  });
});

/** Providers with a completion watcher already running, so clicking Connect
 *  twice doesn't produce two waiters and two duplicate log lines. */
const awaiting = new Set<string>();

/** Consent for the next unconnected provider, one per click.
 *
 *  See startConnect() for why this isn't both at once. The client relabels its
 *  button from /api/state, so after Google completes the same button reads
 *  "Connect Slack". */
app.post("/api/connect", async (c) => {
  const only = new URL(c.req.url).searchParams.get("provider") ?? undefined;
  try {
    const flow = await startConnect(only);
    if (!flow) {
      log("Already connected.");
      return c.json({ ok: true, flow: null });
    }
    if (flow.authId && !awaiting.has(flow.id)) {
      awaiting.add(flow.id);
      log(`Waiting for ${flow.label} authorization…`);
      awaitConnect(flow.authId)
        .then(() => log(`${flow.label} connected.`))
        .catch((e) => log(`${flow.label} authorization failed: ${e.message}`, "error"))
        .finally(() => awaiting.delete(flow.id));
    }
    return c.json({ ok: true, flow });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    log(`Could not start authorization: ${error}`, "error");
    return c.json({ ok: false, error }, 500);
  }
});

/** Point the agent at a gateway. A step the attendee performs and watches, which
 *  is why it lives in the UI rather than in .env. */
app.post("/api/gateway", async (c) => {
  const { url } = (await c.req.json()) as { url?: string };
  if (!url) return c.json({ ok: false, error: "No URL provided." }, 400);
  try {
    const connected = await setGateway(url);
    log(connected ? "Gateway connected." : "Gateway set — needs authorization.");
    return c.json({ ok: true, connected });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    log(`Gateway rejected: ${error}`, "error");
    return c.json({ ok: false, error }, 400);
  }
});

/** Starts the browser leg of the gateway OAuth flow and hands back the URL.
 *  The exchange happens in /oauth/callback below. */
app.post("/api/authorize/gateway", async (c) => {
  try {
    const url = await startGatewayAuth();
    log("Opening gateway authorization…");
    return c.json({ ok: true, url });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    log(`Could not start gateway authorization: ${error}`, "error");
    return c.json({ ok: false, error }, 400);
  }
});

/** Where the authorization server sends the browser back.
 *
 *  Running this ourselves rather than via Mastra's loopback server is the entire
 *  workaround: we read `iss` off the query string and pass it to the token
 *  exchange, which Mastra's callback does not do. */
app.get("/oauth/callback", async (c) => {
  const params = new URL(c.req.url).searchParams;
  try {
    const { tokens, clientInformation } = await completeGatewayAuth(params);
    const connected = await storeGatewayTokens(clientInformation, tokens);
    log(connected ? "Gateway authorized. Ready for PetPilot events." : "Gateway authorized, but it returned no tools.", connected ? "info" : "warn");
    return c.html("<title>Connected</title><body style=\"font:16px system-ui;padding:3rem\">Gateway connected. You can close this tab.</body>");
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    log(`Gateway authorization failed: ${error}`, "error");
    return c.html(`<title>Failed</title><body style="font:16px system-ui;padding:3rem">Authorization failed. Check the server log.</body>`, 400);
  }
});

/** The public application form.
 *
 *  This is the trigger the audience can actually see. Two windows side by side:
 *  a form that anyone could fill in, and the operator's console. Nothing links
 *  them except an email in a mailbox.
 *
 *  The dog list is injected from dogs.ts rather than hardcoded in the HTML, so
 *  the roster still has exactly one source of truth. */
app.get("/apply", (c) => {
  const options = DOGS.map(
    (d) => `<option value="${d.name}">${d.name} — ${d.breed}, ${d.age}</option>`,
  ).join("");
  // Samples are injected rather than duplicated in the HTML, so the form's
  // prefill and the console's fallback button read the same list.
  const samples = JSON.stringify({ genuine: GENUINE_SAMPLES, spam: SPAM_SAMPLES });
  return c.html(
    page("apply.html")
      .replace("<!--DOGS-->", options)
      .replace('"<!--SAMPLES-->"', samples),
  );
});

/** Accept a submission and email it to the intake inbox.
 *
 *  Note what this route does NOT do: it does not trigger triage, or tell the
 *  console anything. It sends an email and stops. The agent finds out the same
 *  way it would find out about a form on a real website — by polling the
 *  mailbox. Wiring this straight to triage() would make the demo a lie. */
app.post("/apply", async (c) => {
  try {
    const submission = (await c.req.json()) as Record<string, unknown>;
    const { subject, body } = formToEmail(submission);
    await sendDemoEmail({ subject, body });
    console.log(`[info] form submission: ${subject}`);
    return c.json({ ok: true });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    log(`Form submission failed to send: ${error}`, "error");
    return c.json({ ok: false, error }, 500);
  }
});

/**
 * TEMPORARY — manual trigger for SAMPLE_DOG_EVENTS. Replaces Gmail polling
 * until the observation engine posts real DogEvent payloads here.
 *
 *   POST /api/demo-event?i=0     — cycle by index (default 0)
 *   POST /api/demo-event?kind=low — force the low-confidence / human-review sample
 */
app.post("/api/demo-event", async (c) => {
  if (!gatewayConnected()) {
    return c.json({ ok: false, error: "Gateway not connected." }, 400);
  }
  const params = new URL(c.req.url).searchParams;
  const low = params.get("kind") === "low";
  const event = low
    ? SAMPLE_DOG_EVENTS.find((e) => e.confidence < 0.7) ?? SAMPLE_DOG_EVENTS.at(-1)!
    : SAMPLE_DOG_EVENTS[Number(params.get("i") ?? 0) % SAMPLE_DOG_EVENTS.length];

  // Fresh timestamp each run so calendar/sheet rows don't all share seed time.
  const payload: DogEvent = { ...event, observedAt: new Date().toISOString() };

  log(
    low
      ? `Mock event (low confidence): ${payload.dogName} — ${payload.description}`
      : `Mock event: ${payload.dogName} — ${payload.description} (${payload.confidence})`,
  );
  publish({
    type: "observation",
    dogName: payload.dogName,
    description: payload.description,
    confidence: payload.confidence,
  });

  try {
    await triage(payload, (triageEvent) => publish({ type: "triage", event: triageEvent }));
    return c.json({ ok: true, event: payload });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    log(`Triage failed: ${error}`, "error");
    return c.json({ ok: false, error }, 500);
  }
});

app.get("/api/events", (c) =>
  streamSSE(c, async (stream) => {
    const send = (f: Feed) => void stream.writeSSE({ data: JSON.stringify(f) });
    subscribers.add(send);
    await new Promise<void>((resolve) => stream.onAbort(resolve));
    subscribers.delete(send);
  }),
);

serve({ fetch: app.fetch, port: PORT }, async (info) => {
  console.log(`\n  Console → http://localhost:${info.port}`);
  console.log(`  Public form → http://localhost:${info.port}/apply\n`);
  console.log(`  Acting as: ${ARCADE_USER_ID}`);
  console.log(`  Slack channel: #${SLACK_CHANNEL}`);
  console.log(`  TEMPORARY: use Run sample event (no Gmail poll)\n`);

  // Reconnect to the gateway used last time, with any tokens already on disk, so
  // a restart doesn't ask you to redo setup you already did.
  if (await restoreGateway()) log("Gateway restored from last run.");
});
