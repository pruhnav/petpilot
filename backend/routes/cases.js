import { Router } from "express";
import Case from "../models/Case.js";
import Dog from "../models/Dog.js";

const router = Router();

router.get("/", async (req, res) => {
  res.json(await Case.find().sort({ createdAt: -1 }).lean());
});

router.get("/:caseId", async (req, res) => {
  const caseDoc = await Case.findById(req.params.caseId).lean();
  if (!caseDoc) return res.status(404).json({ error: "Case not found" });
  res.json(caseDoc);
});

router.post("/:caseId/acknowledge", async (req, res) => {
  const caseDoc = await Case.findById(req.params.caseId);
  if (!caseDoc) return res.status(404).json({ error: "Case not found" });
  caseDoc.status = "ACKNOWLEDGED";
  caseDoc.acknowledgedBy = req.body.acknowledgedBy || "shelter_medicine";
  await caseDoc.save();
  res.json(caseDoc);
});

router.post("/:caseId/resolve", async (req, res) => {
  const caseDoc = await Case.findById(req.params.caseId);
  if (!caseDoc) return res.status(404).json({ error: "Case not found" });
  caseDoc.status = "RESOLVED";
  caseDoc.resolvedAt = new Date();
  await caseDoc.save();
  await Dog.findByIdAndUpdate(caseDoc.dogId, { dogosStatus: "RESOLVED", nextStep: "ROUTINE_MONITORING" });
  res.json(caseDoc);
});

export default router;
