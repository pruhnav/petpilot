const ANOMALY_TYPES = new Set([
  "PROLONGED_INACTIVITY",
  "PACING",
  "BOWL_APPROACH",
  "FOOD_INTERACTION_MISSING",
  "LOCATION_MISMATCH",
  "POSSIBLE_BATHROOM_EVENT"
]);

const NORMAL_TYPES = new Set([
  "MOVING",
  "RESTING",
  "BOWL_INTERACTION",
  "WATER_INTERACTION",
  "IN_KENNEL",
  "OUTSIDE_KENNEL",
  "HUMAN_INTERACTION"
]);

// Volunteer/foster-reported events always warrant a human look, regardless of type.
export function classifyEvent(event) {
  if (event.source === "VOLUNTEER" || event.source === "FOSTER") return "NEEDS_REVIEW";
  if (ANOMALY_TYPES.has(event.type)) return "NEEDS_REVIEW";
  if (NORMAL_TYPES.has(event.type)) return "NORMAL";
  return "WATCH";
}
