// send.js
// The "make it real" step. Takes the classified observation + recipients
// and posts a Slack message via Arcade's direct execute call.
//
// Arcade posts AS YOU (the ARCADE_USER_ID). You must be JOINED to the
// target channel or the post fails silently. Join your demo channels early.
//
// If SEND_MODE=log (or Arcade isn't configured), it skips the real send
// and just returns a logged record so the UI's "sent alerts" panel still
// populates. Flip to real sending once auth is confirmed.

const { Arcade } = require("@arcadeai/arcadejs");

const SEND_MODE = process.env.SEND_MODE || "slack"; // "slack" | "log"
const ARCADE_USER_ID = process.env.ARCADE_USER_ID;

let arcade = null;
if (SEND_MODE === "slack" && process.env.ARCADE_API_KEY) {
  arcade = new Arcade({ apiKey: process.env.ARCADE_API_KEY });
}

function formatMessage({ text, label, confidence, reason }) {
  const conf = Math.round((confidence ?? 0) * 100);
  const urgent = label === "medical_urgent" ? ":rotating_light: " : "";
  return [
    `${urgent}*New shelter observation* — \`${label}\` (${conf}% confidence)`,
    `> ${text}`,
    `_${reason}_`,
  ].join("\n");
}

// Resolve a channel name/id to what Slack.SendMessage expects.
// Arcade's Slack.SendMessage takes a channel name (without #) or a channel id.
function normalizeChannel(ch) {
  return ch.startsWith("#") ? ch.slice(1) : ch;
}

async function sendAlert(observation, recipients) {
  const message = formatMessage(observation);
  const results = [];

  if (SEND_MODE === "log" || !arcade) {
    for (const ch of recipients) {
      results.push({ channel: ch, status: "logged", message });
    }
    return { mode: "log", results };
  }

  for (const ch of recipients) {
    const channel = normalizeChannel(ch);
    try {
      const resp = await arcade.tools.execute({
        tool_name: "Slack.SendMessage",
        input: { channel_name: channel, message },
        user_id: ARCADE_USER_ID,
      });
      // Arcade returns tool results on resp.output.value
      results.push({ channel: ch, status: "sent", response: resp?.output?.value ?? resp });
    } catch (err) {
      // First-ever run needs authorization. Surface the URL instead of a
      // cryptic error so whoever's doing setup can click it once.
      if (err?.name === "PermissionDeniedError" || /authoriz/i.test(String(err?.message))) {
        try {
          const auth = await arcade.tools.authorize({
            tool_name: "Slack.SendMessage",
            user_id: ARCADE_USER_ID,
          });
          results.push({
            channel: ch,
            status: "needs_auth",
            authUrl: auth?.url,
            note: "Open authUrl once to grant Slack access, then retry.",
          });
          continue;
        } catch (authErr) {
          results.push({ channel: ch, status: "error", error: String(authErr?.message || authErr) });
          continue;
        }
      }
      // One channel failing shouldn't kill the others.
      results.push({ channel: ch, status: "error", error: String(err?.message || err) });
    }
  }

  return { mode: "slack", results };
}

module.exports = { sendAlert, formatMessage };
