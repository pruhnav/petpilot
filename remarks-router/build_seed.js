// build_seed.js
// Generates seed_cache.json: ~15 observations in shelter voice, already
// classified/routed, so the app loads fully populated with NO api call.
// Run once: node build_seed.js  (commit the resulting JSON).
//
// The labels/reasons here are written by hand to match what the classifier
// would produce, so the demo is stable and offline-safe. Purple pee is the
// headliner and is written well.

const fs = require("fs");
const { recipientsFor, PRECEDENTS } = require("./routing");

function prec(id) { return PRECEDENTS.find((p) => p.id === id) || null; }

// [text, label, confidence, reason, precedentId]
const FIXTURES = [
  ["Peed purple this morning, seemed fine otherwise", "medical_urgent", 0.96,
   "Abnormal urine color can signal internal bleeding or toxin exposure and warrants same-day vet review.", "p1"],
  ["Bella threw up her breakfast twice and won't touch water", "medical_urgent", 0.9,
   "Repeated vomiting with refusal to drink risks dehydration and needs urgent medical attention.", "p2"],
  ["Max is dragging his back leg after the afternoon play session", "medical_urgent", 0.82,
   "A suddenly non-weight-bearing limb may indicate injury and should be seen the same day.", "p3"],
  ["Small scrape on Coco's paw pad, she's still walking normally", "medical_routine", 0.8,
   "A minor superficial wound with normal mobility is a non-urgent medical note.", "p3"],
  ["Luna is due for her rabies booster next week", "medical_routine", 0.88,
   "A scheduled routine vaccination is a standard medical-records task.", "p3"],
  ["Charlie growled and snapped when I reached near his food bowl", "behavior", 0.9,
   "Resource guarding around food is a behavioral concern for the behavior team to assess.", "p4"],
  ["Rocky hid in the back of his kennel and shook after a loud visitor", "behavior", 0.85,
   "Fearful withdrawal following a stressor is a behavioral change worth tracking.", "p5"],
  ["The new dog keeps pacing the fence line and won't settle", "behavior", 0.78,
   "Persistent pacing can indicate stress or anxiety and is a behavioral observation.", "p5"],
  ["Latch on kennel A3 is broken, door won't stay shut", "facility", 0.94,
   "A broken kennel latch is a containment/safety issue for operations to fix.", "p6"],
  ["Water line by the play yard is leaking onto the floor", "facility", 0.9,
   "A leak creating a wet floor is a facility hazard for operations.", "p7"],
  ["It's really cold in room B, the heater might be out", "facility", 0.83,
   "A possible heating failure affecting animal comfort is a facilities issue.", "p7"],
  ["Bruno had a fantastic long walk and played fetch for 20 minutes", "enrichment", 0.92,
   "A positive activity and play note is enrichment, not a health or behavior concern.", "p8"],
  ["Spent 15 minutes doing socialization with the shy terrier, big progress", "enrichment", 0.88,
   "A socialization session update is an enrichment log entry.", "p8"],
  ["Milo seemed a little off after his visitor left, not sure how", "unclear", 0.45,
   "The observation is vague and could be behavioral or medical, so a human should triage it.", null],
  ["Something smells weird near the back kennels but I can't tell what", "unclear", 0.4,
   "The report is ambiguous with no clear category, so it routes to managers for review.", null],
];

const seed = FIXTURES.map(([text, label, confidence, reason, precedentId], i) => ({
  id: `seed_${i + 1}`,
  text,
  label,
  confidence,
  reason,
  precedent: prec(precedentId),
  recipients: recipientsFor(label),
  send: {
    mode: "seed",
    results: recipientsFor(label).map((ch) => ({ channel: ch, status: "sent (seeded)" })),
  },
  timestamp: new Date(Date.now() - (FIXTURES.length - i) * 3600_000).toISOString(),
  source: "seed",
}));

fs.writeFileSync("seed_cache.json", JSON.stringify(seed, null, 2));
console.log(`wrote seed_cache.json with ${seed.length} observations`);
