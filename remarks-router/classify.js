// classify.js
// One direct Claude call. Free text in -> { label, confidence, reason, precedentId }.
// Deterministic-ish (low temperature), fixed label set, one JSON object back.
// No Mastra, no agent runtime. This is the whole "AI" of the app.

const Anthropic = require("@anthropic-ai/sdk");
const { LABEL_GUIDE, PRECEDENTS } = require("./routing");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LABELS = Object.keys(LABEL_GUIDE);

function buildSystemPrompt() {
  const guide = Object.entries(LABEL_GUIDE)
    .map(([label, desc]) => `- ${label}: ${desc}`)
    .join("\n");

  const precedentList = PRECEDENTS
    .map((p) => `  { "id": "${p.id}", "text": "${p.text}", "label": "${p.label}" }`)
    .join("\n");

  return `You are a triage classifier for an animal shelter. A volunteer or staff member types a free-text observation about a dog. Classify it into EXACTLY ONE label.

Labels:
${guide}

You are also given past incidents. Pick the single closest one by meaning (not wording) and return its id as "precedentId". If none is reasonably close, use null.

Past incidents:
${precedentList}

Respond with ONLY a JSON object, no prose, no markdown fences:
{
  "label": "<one of: ${LABELS.join(", ")}>",
  "confidence": <number 0.0-1.0>,
  "reason": "<one sentence, plain language, why this label>",
  "precedentId": "<id of nearest past incident, or null>"
}

Bias toward caution: if an observation could plausibly be medical_urgent, choose medical_urgent. It is better to over-alert the medical team than to miss a real emergency.`;
}

const SYSTEM_PROMPT = buildSystemPrompt();

async function classify(text) {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: text }],
  });

  const raw = msg.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  // Strip accidental code fences, then parse.
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    // Fallback so the pipeline never hard-crashes on a bad parse.
    return {
      label: "unclear",
      confidence: 0.0,
      reason: "Could not parse classifier output; routed to managers for manual triage.",
      precedentId: null,
      _parseError: true,
      _raw: raw,
    };
  }

  // Validate label is in the known set.
  if (!LABELS.includes(parsed.label)) {
    parsed.label = "unclear";
    parsed.reason = (parsed.reason || "") + " (label coerced to unclear: out of set)";
  }

  return parsed;
}

module.exports = { classify };
