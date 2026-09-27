// DogOS's one boundary to Arcade (CLAUDE.md section 26). The rest of the app calls only
// the wrapper functions below and never touches vendor tool names directly.
//
// Until ARCADE_API_KEY / ARCADE_USER_ID are set (they aren't yet — the Arcade MCP
// connector needs an interactive auth step first), every call logs what it *would* do
// and returns a STUB_SENT result so the case lifecycle can still run end-to-end in demos.

const ARCADE_BASE_URL = "https://api.arcade.dev/v1";

function isConfigured() {
  return Boolean(process.env.ARCADE_API_KEY && process.env.ARCADE_USER_ID);
}

async function executeTool(toolName, input) {
  const res = await fetch(`${ARCADE_BASE_URL}/tools/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.ARCADE_API_KEY}`
    },
    body: JSON.stringify({ tool_name: toolName, input, user_id: process.env.ARCADE_USER_ID })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Arcade tool ${toolName} failed: ${res.status} ${body}`);
  }
  return res.json();
}

const ROUTE_CHANNEL_KEY = {
  SHELTER_MEDICINE: "medical",
  BEHAVIOR: "behavior",
  OPERATIONS: "operations",
  VOLUNTEER_REVIEW: "operations",
  ROUTINE_ONLY: null
};

export async function notifyTeam(caseDoc, dog, shelter) {
  const channelKey = ROUTE_CHANNEL_KEY[caseDoc.route];
  const channel = channelKey ? shelter?.routing?.[channelKey] : null;
  const text = `*DogOS — ${dog?.name || caseDoc.dogId}* (case ${caseDoc._id})\n${caseDoc.context.summary}\nRoute: ${caseDoc.route} · Priority: ${caseDoc.priority}`;

  if (!isConfigured() || !channel) {
    console.log(`[arcadeService:stub] Slack -> ${channel || "(no channel configured)"}:\n${text}`);
    return { status: "STUB_SENT", channel, text };
  }

  try {
    const result = await executeTool(process.env.ARCADE_SLACK_SEND_TOOL || "Slack.SendMessage@2.5.4", {
      channel_name: channel,
      message: text
    });
    return { status: "SENT", channel, externalId: result?.output?.value?.ts || result?.id || null };
  } catch (err) {
    console.error("[arcadeService] Slack send failed, falling back to stub:", err.message);
    return { status: "STUB_SENT", channel, text, error: err.message };
  }
}

export async function createCareEvent(dog, title, description, dateTime) {
  if (!isConfigured()) {
    console.log(`[arcadeService:stub] Calendar -> "${title}" at ${dateTime}`);
    return { status: "STUB_SENT", title, dateTime };
  }

  const start = new Date(dateTime);
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  try {
    const result = await executeTool(process.env.ARCADE_CALENDAR_CREATE_TOOL || "GoogleCalendar.CreateEvent@3.6.0", {
      summary: title,
      description,
      start_datetime: start.toISOString().slice(0, 19),
      end_datetime: end.toISOString().slice(0, 19)
    });
    return { status: "SENT", externalId: result?.output?.value?.id || result?.id || null, title, dateTime };
  } catch (err) {
    console.error("[arcadeService] Calendar create failed, falling back to stub:", err.message);
    return { status: "STUB_SENT", title, dateTime, error: err.message };
  }
}

export function scheduleRecheck(caseDoc, dog, dateTime) {
  return createCareEvent(dog, `${dog?.name || caseDoc.dogId} — Medical Recheck`, `DogOS case ${caseDoc._id}\n${caseDoc.context.summary}`, dateTime);
}

export function scheduleVaccination(dog, vaccination, dateTime) {
  return createCareEvent(dog, `${dog?.name || dog?._id} — ${vaccination} Vaccination`, `DogOS care calendar — ${vaccination} due for ${dog?.name}`, dateTime);
}

export async function contactFoster(dog, message, recipientEmail) {
  if (!isConfigured() || !recipientEmail) {
    console.log(`[arcadeService:stub] Gmail -> ${recipientEmail || "(no recipient)"} re ${dog?.name}: ${message}`);
    return { status: "STUB_SENT", message };
  }

  try {
    const result = await executeTool(process.env.ARCADE_GMAIL_SEND_TOOL || "Gmail.SendEmail@8.9.1", {
      subject: `DogOS follow-up — ${dog?.name}`,
      body: message,
      recipient: recipientEmail
    });
    return { status: "SENT", externalId: result?.output?.value?.id || null };
  } catch (err) {
    console.error("[arcadeService] Gmail send failed, falling back to stub:", err.message);
    return { status: "STUB_SENT", message, error: err.message };
  }
}

export async function checkAcknowledgement(caseDoc, channel) {
  if (!isConfigured() || !channel) return { acknowledged: false, reason: "stub mode — no Arcade credentials or channel configured" };

  try {
    const result = await executeTool(process.env.ARCADE_SLACK_READ_TOOL || "Slack.GetMessages@2.5.4", {
      channel_name: channel,
      oldest_relative: "24:00:00",
      limit: 20
    });
    return { acknowledged: false, raw: result };
  } catch (err) {
    console.error("[arcadeService] Slack read failed:", err.message);
    return { acknowledged: false, error: err.message };
  }
}

export function isArcadeConfigured() {
  return isConfigured();
}
