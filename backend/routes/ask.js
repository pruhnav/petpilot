import { Router } from "express";
import Dog from "../models/Dog.js";
import MedicalRecord from "../models/MedicalRecord.js";
import DogEvent from "../models/DogEvent.js";
import Case from "../models/Case.js";

const router = Router();

function findMentionedDog(dogs, lower) {
  return dogs.find((d) => lower.includes(d.name.toLowerCase()));
}

router.post("/", async (req, res) => {
  const question = (req.body.question || "").trim();
  if (!question) return res.status(400).json({ error: "question is required" });
  const lower = question.toLowerCase();
  const dogs = await Dog.find().lean();
  const byId = Object.fromEntries(dogs.map((d) => [d._id, d]));

  if (/vaccin/.test(lower)) {
    const records = await MedicalRecord.find({ "vaccinations.status": { $in: ["DUE_SOON", "OVERDUE"] } }).lean();
    const names = records.map((r) => byId[r.dogId]?.name).filter(Boolean);
    return res.json({ answer: names.length ? `Vaccines due soon: ${names.join(", ")}.` : "No dogs have vaccines due soon." });
  }

  if (/needs? review|review queue/.test(lower)) {
    const needsReview = dogs.filter((d) => d.dogosStatus === "NEEDS_REVIEW");
    return res.json({
      answer: needsReview.length
        ? `${needsReview.map((d) => d.name).join(", ")} need${needsReview.length === 1 ? "s" : ""} review.`
        : "No dogs currently need review."
    });
  }

  if (/unresolved case|open case/.test(lower)) {
    const openCases = await Case.find({ status: { $nin: ["RESOLVED", "DISMISSED"] } }).lean();
    const names = openCases.map((c) => byId[c.dogId]?.name).filter(Boolean);
    return res.json({ answer: names.length ? `Unresolved cases: ${names.join(", ")}.` : "No unresolved cases." });
  }

  const dog = findMentionedDog(dogs, lower);
  if (dog && /where/.test(lower)) {
    const loc = dog.shelter.status === "IN_FOSTER" ? "in foster care" : `kennel ${dog.shelter.kennel}`;
    return res.json({ answer: `${dog.name} is ${loc}.` });
  }

  if (dog && /what happened|today/.test(lower)) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const events = await DogEvent.find({ dogId: dog._id, timestamp: { $gte: since } }).sort({ timestamp: 1 }).lean();
    return res.json({
      answer: events.length
        ? `Today for ${dog.name}: ${events.map((e) => e.description || e.type).join("; ")}.`
        : `No events recorded for ${dog.name} today.`
    });
  }

  return res.json({
    answer: "I can answer questions about a dog's location, today's events, vaccines due, dogs needing review, or unresolved cases."
  });
});

export default router;
