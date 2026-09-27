import { Router } from "express";
import { nanoid } from "nanoid";
import CareEvent from "../models/CareEvent.js";
import Dog from "../models/Dog.js";
import { createCareEvent } from "../services/arcadeService.js";

const router = Router();

router.get("/", async (req, res) => {
  const filter = {};
  if (req.query.dogId) filter.dogId = req.query.dogId;
  res.json(await CareEvent.find(filter).sort({ dateTime: 1 }).lean());
});

router.post("/", async (req, res) => {
  const { dogId, type, title, description, dateTime } = req.body;
  if (!dogId || !type || !title || !dateTime) {
    return res.status(400).json({ error: "dogId, type, title and dateTime are required" });
  }

  const dog = await Dog.findById(dogId).lean();
  if (!dog) return res.status(404).json({ error: "Dog not found" });

  const careEvent = await CareEvent.create({
    _id: `care_${nanoid(10)}`,
    dogId,
    type,
    title,
    description,
    dateTime: new Date(dateTime)
  });

  const calendarResult = await createCareEvent(dog, title, description || title, careEvent.dateTime.toISOString());
  careEvent.externalId = calendarResult.externalId || null;
  await careEvent.save();

  res.status(201).json(careEvent);
});

export default router;
