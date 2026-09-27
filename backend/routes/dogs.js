import { Router } from "express";
import Dog from "../models/Dog.js";
import MedicalRecord from "../models/MedicalRecord.js";
import DogEvent from "../models/DogEvent.js";
import { dailyReport } from "../services/reportService.js";

const router = Router();

router.get("/", async (req, res) => {
  res.json(await Dog.find().lean());
});

router.get("/:dogId", async (req, res) => {
  const dog = await Dog.findById(req.params.dogId).lean();
  if (!dog) return res.status(404).json({ error: "Dog not found" });
  const medical = await MedicalRecord.findOne({ dogId: dog._id }).lean();
  res.json({ ...dog, medical });
});

router.get("/:dogId/timeline", async (req, res) => {
  res.json(await DogEvent.find({ dogId: req.params.dogId }).sort({ timestamp: -1 }).lean());
});

router.get("/:dogId/report", async (req, res) => {
  const dog = await Dog.findById(req.params.dogId).lean();
  if (!dog) return res.status(404).json({ error: "Dog not found" });
  res.json(await dailyReport(dog));
});

router.post("/:dogId/move-to-foster", async (req, res) => {
  const dog = await Dog.findById(req.params.dogId);
  if (!dog) return res.status(404).json({ error: "Dog not found" });
  dog.shelter.status = "IN_FOSTER";
  dog.shelter.lastVerifiedLocationAt = new Date();
  await dog.save();
  res.json(dog);
});

export default router;
