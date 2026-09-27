import { Router } from "express";
import { nanoid } from "nanoid";
import Dog from "../models/Dog.js";
import Shelter from "../models/Shelter.js";
import DogEvent from "../models/DogEvent.js";
import Case from "../models/Case.js";
import { gatherContext } from "../services/truthAgent.js";
import { triage } from "../services/triageAgent.js";
import * as arcadeService from "../services/arcadeService.js";

const router = Router();

router.get("/", async (req, res) => {
  const events = await DogEvent.find({ "verification.status": "PENDING" }).sort({ timestamp: -1 }).lean();
  const dogs = await Dog.find({ _id: { $in: [...new Set(events.map((e) => e.dogId))] } }).lean();
  const dogById = Object.fromEntries(dogs.map((d) => [d._id, d]));
  res.json(events.map((e) => ({ ...e, dog: dogById[e.dogId] || null })));
});

router.post("/:eventId/confirm", async (req, res) => {
  const event = await DogEvent.findById(req.params.eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });

  event.verification.status = "CONFIRMED";
  event.verification.reviewedBy = req.body.reviewedBy || "volunteer";
  event.verification.reviewedAt = new Date();
  await event.save();

  const dog = await Dog.findById(event.dogId);
  const shelter = dog ? await Shelter.findById(dog.shelter.shelterId) : null;
  const context = await gatherContext(event.dogId, event);
  const { route, priority, summary } = triage(event, context);

  event.routing = { route, priority };
  await event.save();

  const caseDoc = await Case.create({
    _id: `case_${nanoid(10)}`,
    dogId: event.dogId,
    eventIds: [event._id],
    status: "TRIAGED",
    route,
    priority,
    context: { summary }
  });

  const slackResult = route !== "ROUTINE_ONLY" ? await arcadeService.notifyTeam(caseDoc, dog, shelter) : null;
  const calendarResult =
    route === "SHELTER_MEDICINE"
      ? await arcadeService.scheduleRecheck(caseDoc, dog, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
      : null;

  if (slackResult) {
    caseDoc.actions.push({ type: "SLACK_MESSAGE", status: slackResult.status, externalId: slackResult.externalId || null });
  }
  if (calendarResult) {
    caseDoc.actions.push({ type: "CALENDAR_EVENT", status: calendarResult.status, externalId: calendarResult.externalId || null });
  }
  if (caseDoc.actions.length) caseDoc.status = "ACTION_SENT";
  await caseDoc.save();

  if (dog) {
    dog.dogosStatus = "BEING_CHECKED";
    dog.nextStep = route;
    await dog.save();
  }

  res.json({ event, case: caseDoc });
});

router.post("/:eventId/dismiss", async (req, res) => {
  const event = await DogEvent.findById(req.params.eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });

  event.verification.status = "DISMISSED";
  event.verification.reviewedBy = req.body.reviewedBy || "volunteer";
  event.verification.reviewedAt = new Date();
  await event.save();

  const stillPending = await DogEvent.exists({ dogId: event.dogId, "verification.status": "PENDING" });
  const openCase = await Case.exists({ dogId: event.dogId, status: { $nin: ["RESOLVED", "DISMISSED"] } });
  if (!stillPending && !openCase) await Dog.findByIdAndUpdate(event.dogId, { dogosStatus: "NORMAL" });

  res.json(event);
});

// Correction is stored either way; pass confirm:true to also run it through the
// same pipeline as /confirm (POST /:eventId/confirm) once the correction is saved.
router.post("/:eventId/edit", async (req, res) => {
  const event = await DogEvent.findById(req.params.eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const { correction, confirm, reviewedBy } = req.body;
  event.verification.correction = correction || null;
  event.verification.reviewedBy = reviewedBy || "volunteer";
  event.verification.reviewedAt = new Date();
  event.verification.status = confirm ? "CORRECTED" : "PENDING";
  if (confirm && correction) {
    if (correction.type) event.type = correction.type;
    if (correction.description) event.description = correction.description;
  }
  await event.save();

  res.json(event);
});

export default router;
