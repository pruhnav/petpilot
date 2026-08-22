// routing.js
// The routing table: label -> who gets alerted.
// This is a plain object on purpose. It is NOT machine learning.
// Seed it with your shelter's real teams/channels. To make routing
// feel data-driven in the demo, PRECEDENTS below maps a handful of
// past incidents so the classifier's output can cite a nearest match.

// Slack channel IDs or names the alert should be posted to per label.
// Use channel names your Arcade Slack user is JOINED to, or the send fails silently.
const ROUTING = {
  medical_urgent:  ["#shelter-medical", "#shelter-managers"],
  medical_routine: ["#shelter-medical"],
  behavior:        ["#behavior-team"],
  facility:        ["#operations"],
  enrichment:      ["#enrichment"],
  unclear:         ["#shelter-managers"], // when in doubt, a human triages
};

// Human-readable label descriptions, injected into the classifier prompt
// so the model knows exactly what each bucket means.
const LABEL_GUIDE = {
  medical_urgent:  "A health sign needing same-day vet attention (blood, purple/bloody urine, collapse, repeated vomiting, labored breathing, seizure, refusal to eat/drink 24h+, sudden severe lethargy).",
  medical_routine: "A minor or non-urgent health note (mild limp, small scrape, due for routine vaccine, minor loose stool once).",
  behavior:        "A behavioral change or concern (aggression, fear, resource guarding, unusual reactivity, withdrawal after a visitor).",
  facility:        "A physical environment/operations issue (broken latch, leaking water, kennel damage, temperature, cleanliness).",
  enrichment:      "A note about play, socialization, walks, or enrichment activity that isn't a health/behavior concern.",
  unclear:         "The observation is ambiguous or doesn't clearly fit the other five buckets.",
};

// ~8 seeded past incidents. The classifier gets these and returns the
// nearest one so the UI can show "matched precedent." Honest framing on
// stage: "nearest-neighbor over historical routings, seeded with 8,
// gets better with the shelter's own data."
const PRECEDENTS = [
  { id: "p1", text: "Dog urinated a dark purple color this morning",               label: "medical_urgent",  routedTo: ["#shelter-medical", "#shelter-managers"] },
  { id: "p2", text: "Bloody discharge noticed during afternoon walk",              label: "medical_urgent",  routedTo: ["#shelter-medical", "#shelter-managers"] },
  { id: "p3", text: "Slight limp on back left leg, still playful",                 label: "medical_routine", routedTo: ["#shelter-medical"] },
  { id: "p4", text: "Growled and snapped when approached near food bowl",          label: "behavior",        routedTo: ["#behavior-team"] },
  { id: "p5", text: "Hid in the back of the kennel after a visitor left",          label: "behavior",        routedTo: ["#behavior-team"] },
  { id: "p6", text: "Kennel latch on A3 is broken and won't stay shut",           label: "facility",        routedTo: ["#operations"] },
  { id: "p7", text: "Water bowl area flooding, floor is soaked",                   label: "facility",        routedTo: ["#operations"] },
  { id: "p8", text: "Had a great long walk and played fetch for 20 minutes",       label: "enrichment",      routedTo: ["#enrichment"] },
];

function recipientsFor(label) {
  return ROUTING[label] || ROUTING.unclear;
}

module.exports = { ROUTING, LABEL_GUIDE, PRECEDENTS, recipientsFor };
