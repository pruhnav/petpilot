// server.js
// Minimal backend for the "remarks" button. Separate frontend POSTs here.
//
//   POST /remarks   { "text": "peed purple this morning, seemed fine otherwise" }
//     -> classify -> route -> send -> return the full record
//
//   GET  /alerts    -> everything processed so far (for the "sent alerts" panel)
//   GET  /seed      -> the pre-processed fixtures, so the page loads populated
//
// In-memory only. No database. Restarting clears runtime alerts (seed persists).

const express = require("express");
const cors = require("cors");
const { classify } = require("./classify");
const { sendAlert } = require("./send");
const { recipientsFor, PRECEDENTS } = require("./routing");
const seededAlerts = require("./seed_cache.json");

const app = express();
app.use(cors());               // frontend is on a different origin
app.use(express.json());

// Runtime alerts from newly typed observations (newest first).
const alerts = [];

function precedentById(id) {
  return PRECEDENTS.find((p) => p.id === id) || null;
}

// Core pipeline: text -> classified, routed, sent record.
async function processObservation(text) {
  const classification = await classify(text);
  const recipients = recipientsFor(classification.label);
  const sendResult = await sendAlert(
    { text, ...classification },
    recipients
  );

  return {
    id: `obs_${Date.now()}`,
    text,
    label: classification.label,
    confidence: classification.confidence,
    reason: classification.reason,
    precedent: precedentById(classification.precedentId),
    recipients,
    send: sendResult,
    timestamp: new Date().toISOString(),
    source: "live",
  };
}

// The button hits this.
app.post("/remarks", async (req, res) => {
  const text = (req.body?.text || "").trim();
  const dogId = req.body?.dogId || null; // optional: which dog this is about
  if (!text) return res.status(400).json({ error: "text is required" });

  try {
    const record = await processObservation(text);
    record.dogId = dogId;
    alerts.unshift(record);
    res.json(record);
  } catch (err) {
    console.error("process failed:", err);
    res.status(500).json({
      error: "processing failed",
      detail: String(err?.message || err),
    });
  }
});

// Everything the page should show: live alerts on top of the seeded ones.
app.get("/alerts", (_req, res) => {
  res.json([...alerts, ...seededAlerts]);
});

// Just the seed, if the frontend wants to render it separately on load.
app.get("/seed", (_req, res) => res.json(seededAlerts));

app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`remarks router listening on :${PORT}`);
  console.log(`SEND_MODE=${process.env.SEND_MODE || "slack"}`);
});
