// Deterministic triage rules per CLAUDE.md section 10/24 (Person 3's triage vocabulary).
// Never produces a diagnosis — only route + priority + a safe-language summary.

const MEDICAL_LEANING_TYPES = new Set(["FOOD_INTERACTION_MISSING", "PROLONGED_INACTIVITY", "POSSIBLE_BATHROOM_EVENT"]);
const BEHAVIOR_LEANING_TYPES = new Set(["PACING"]);
const OPERATIONS_TYPES = new Set(["LOCATION_MISMATCH"]);

function volunteerReportedMedicalSymptom(event) {
  const text = `${event.type} ${event.description || ""}`.toLowerCase();
  return (event.source === "VOLUNTEER" || event.source === "FOSTER") && /cough|vomit|limp|blood|diarrh/.test(text);
}

export function triage(event, context) {
  if (OPERATIONS_TYPES.has(event.type)) {
    return {
      route: "OPERATIONS",
      priority: "MEDIUM",
      summary: "A location mismatch was human-verified between the shelter record and the monitored feed. Operations should confirm current placement.",
      diagnosis: null
    };
  }

  if (volunteerReportedMedicalSymptom(event) || (MEDICAL_LEANING_TYPES.has(event.type) && context.hasRecentMedicalContext)) {
    return {
      route: "SHELTER_MEDICINE",
      priority: context.hasRecentMedicalContext ? "MEDIUM" : "LOW",
      summary:
        "A new feeding/activity deviation was human-verified" +
        (context.hasRecentMedicalContext ? " after a recent procedure" : "") +
        ". Human medical review is recommended.",
      diagnosis: null
    };
  }

  if (BEHAVIOR_LEANING_TYPES.has(event.type)) {
    return {
      route: "BEHAVIOR",
      priority: "LOW",
      summary: "Repeated pacing was human-verified with no relevant medical context. Behavior review is recommended.",
      diagnosis: null
    };
  }

  if (event.verification?.status === "DISMISSED") {
    return { route: "ROUTINE_ONLY", priority: "LOW", summary: "Reviewed and dismissed as routine.", diagnosis: null };
  }

  return {
    route: "VOLUNTEER_REVIEW",
    priority: "LOW",
    summary: "A human-verified observation differs from this dog's recent routine and may warrant a closer look.",
    diagnosis: null
  };
}
