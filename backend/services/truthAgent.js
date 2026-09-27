import Dog from "../models/Dog.js";
import MedicalRecord from "../models/MedicalRecord.js";
import DogEvent from "../models/DogEvent.js";

// Trust order (CLAUDE.md section 24):
// HUMAN VERIFIED CURRENT EVENT > CLINICAL RECORD > STAFF/VOLUNTEER REPORT > AI CAMERA OBSERVATION > STALE SYSTEM RECORD

export async function gatherContext(dogId, confirmedEvent) {
  const [dog, medical, recentEvents] = await Promise.all([
    Dog.findById(dogId).lean(),
    MedicalRecord.findOne({ dogId }).lean(),
    DogEvent.find({ dogId }).sort({ timestamp: -1 }).limit(10).lean()
  ]);

  const recentProcedure = (medical?.procedures || []).find((p) => p.status === "COMPLETED");
  const volunteerReports = recentEvents.filter((e) => e.source === "VOLUNTEER" || e.source === "FOSTER");
  const priorNormalDay = recentEvents.find(
    (e) => e.verification?.status !== "DISMISSED" && e._id !== confirmedEvent?._id && e.type !== confirmedEvent?.type
  );

  const lines = [];
  lines.push(`Camera:\n${confirmedEvent.description}`);
  if (volunteerReports.length) {
    lines.push(`Volunteer:\n${volunteerReports[0].description}`);
  }
  if (recentProcedure) {
    lines.push(`Medical:\n${recentProcedure.name} completed ${recentProcedure.date}.`);
  }
  if (priorNormalDay) {
    lines.push(`Previous:\n${priorNormalDay.description}`);
  }

  const hasRecentMedicalContext = Boolean(recentProcedure) || (medical?.clinicalNotes || []).length > 0;
  const hasVolunteerCorroboration = volunteerReports.length > 0;

  return {
    dog,
    medical,
    recentEvents,
    hasRecentMedicalContext,
    hasVolunteerCorroboration,
    summaryText: lines.join("\n\n")
  };
}
