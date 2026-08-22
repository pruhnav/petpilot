// test_pipeline.js
// Verifies the wiring WITHOUT needing real API keys:
//  - routing table returns sane recipients for every label
//  - send.js in log mode produces one result per recipient
//  - seed_cache.json is well-formed
// Run: node test_pipeline.js

process.env.SEND_MODE = "log"; // force offline send

const assert = require("assert");
const { ROUTING, recipientsFor, PRECEDENTS } = require("./routing");
const { sendAlert, formatMessage } = require("./send");

let passed = 0;
function check(name, fn) {
  try { fn(); console.log(`  ok  ${name}`); passed++; }
  catch (e) { console.error(`  FAIL ${name}\n       ${e.message}`); process.exitCode = 1; }
}

(async () => {
  console.log("routing table");
  check("every label maps to >=1 recipient", () => {
    for (const label of Object.keys(ROUTING)) {
      assert(recipientsFor(label).length >= 1, `${label} has no recipients`);
    }
  });
  check("unknown label falls back to unclear route", () => {
    assert.deepStrictEqual(recipientsFor("nonsense"), ROUTING.unclear);
  });
  check("medical_urgent alerts managers too", () => {
    assert(recipientsFor("medical_urgent").includes("#shelter-managers"));
  });

  console.log("message formatting");
  check("urgent messages get a siren", () => {
    const m = formatMessage({ text: "x", label: "medical_urgent", confidence: 0.9, reason: "r" });
    assert(m.includes(":rotating_light:"), "no siren on urgent");
  });
  check("non-urgent messages have no siren", () => {
    const m = formatMessage({ text: "x", label: "enrichment", confidence: 0.9, reason: "r" });
    assert(!m.includes(":rotating_light:"), "siren on non-urgent");
  });

  console.log("send (log mode)");
  await (async () => {
    const recips = recipientsFor("medical_urgent");
    const out = await sendAlert(
      { text: "peed purple", label: "medical_urgent", confidence: 0.96, reason: "r" },
      recips
    );
    check("log mode returns one result per recipient", () => {
      assert.strictEqual(out.mode, "log");
      assert.strictEqual(out.results.length, recips.length);
      assert(out.results.every((r) => r.status === "logged"));
    });
  })();

  console.log("seed cache");
  check("seed_cache.json parses and has 15 well-formed records", () => {
    const seed = require("./seed_cache.json");
    assert.strictEqual(seed.length, 15);
    for (const r of seed) {
      assert(r.text && r.label && r.recipients?.length, `bad record ${r.id}`);
      assert(recipientsFor(r.label).length >= 1);
    }
  });
  check("purple pee headliner is present and urgent", () => {
    const seed = require("./seed_cache.json");
    const pee = seed.find((r) => /purple/i.test(r.text));
    assert(pee, "no purple pee fixture");
    assert.strictEqual(pee.label, "medical_urgent");
  });
  check("every precedent id in fixtures resolves", () => {
    const seed = require("./seed_cache.json");
    for (const r of seed) {
      if (r.precedent) assert(PRECEDENTS.some((p) => p.id === r.precedent.id));
    }
  });

  console.log(`\n${passed} checks passed`);
})();
