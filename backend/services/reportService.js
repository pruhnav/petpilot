import DogEvent from "../models/DogEvent.js";
import Case from "../models/Case.js";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function dailyReport(dog) {
  const since = startOfToday();
  const events = await DogEvent.find({ dogId: dog._id, timestamp: { $gte: since } }).sort({ timestamp: 1 }).lean();

  const bowlEvents = events.filter((e) => e.type === "BOWL_INTERACTION");
  const foodMissing = events.some((e) => e.type === "FOOD_INTERACTION_MISSING");
  const waterEvents = events.filter((e) => e.type === "WATER_INTERACTION");
  const humanEvents = events.filter((e) => e.type === "HUMAN_INTERACTION");
  const inactivity = events.some((e) => e.type === "PROLONGED_INACTIVITY");
  const confirmedAnomalies = events.filter((e) => e.verification?.status === "CONFIRMED");

  const activeCase = await Case.findOne({ dogId: dog._id, status: { $nin: ["RESOLVED", "DISMISSED"] } })
    .sort({ createdAt: -1 })
    .lean();

  return {
    dogId: dog._id,
    name: dog.name,
    food: foodMissing
      ? "An expected feeding interaction was not observed."
      : `${bowlEvents.length} observed bowl interaction(s).`,
    water: `${waterEvents.length} observed water interaction(s).`,
    activity: inactivity ? "Activity was lower than recent routine." : "Activity was consistent with recent routine.",
    humanInteraction: `${humanEvents.length} volunteer/staff interaction(s).`,
    events: `${confirmedAnomalies.length} anomaly(ies) confirmed.`,
    action: activeCase ? `${activeCase.route || "Review"} requested.` : "No action required.",
    nextCare: dog.nextStep || "Routine monitoring."
  };
}
