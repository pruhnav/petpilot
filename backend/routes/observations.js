import { Router } from "express";
import { nanoid } from "nanoid";
import Dog from "../models/Dog.js";
import DogEvent from "../models/DogEvent.js";
import { classifyEvent } from "../services/routineAgent.js";

const router = Router();
const ALLOWED_SOURCES = new Set(["CAMERA", "VOLUNTEER", "FOSTER", "SYSTEM"]);

router.post("/", async (req, res) => {
  const { dogId, source, type, timestamp, confidence, description, evidence } = req.body;

  if (!dogId || !source || !type) return res.status(400).json({ error: "dogId, source and type are required" });
  if (!ALLOWED_SOURCES.has(source)) {
    return res.status(400).json({ error: `source must be one of ${[...ALLOWED_SOURCES].join(", ")}` });
  }

  const dog = await Dog.findById(dogId);
  if (!dog) return res.status(404).json({ error: "Dog not found" });

  const event = await DogEvent.create({
    _id: `event_${nanoid(10)}`,
    dogId,
    source,
    type,
    timestamp: timestamp ? new Date(timestamp) : new Date(),
    confidence: confidence ?? null,
    description: description || "",
    evidence: evidence || {}
  });

  const classification = classifyEvent(event);
  if (dog.dogosStatus === "NORMAL" && classification !== "NORMAL") {
    dog.dogosStatus = classification;
    await dog.save();
  }

  res.status(201).json(event);
});

export default router;
