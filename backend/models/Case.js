import mongoose from "mongoose";

const { Schema } = mongoose;

const CaseSchema = new Schema(
  {
    _id: { type: String },
    dogId: { type: String, required: true, index: true },
    eventIds: { type: [String], default: [] },
    status: {
      type: String,
      enum: [
        "DETECTED",
        "PENDING_REVIEW",
        "CONFIRMED",
        "TRIAGED",
        "ACTION_SENT",
        "ACKNOWLEDGED",
        "RESOLVED",
        "DISMISSED"
      ],
      default: "CONFIRMED",
      index: true
    },
    route: {
      type: String,
      enum: ["ROUTINE_ONLY", "VOLUNTEER_REVIEW", "SHELTER_MEDICINE", "BEHAVIOR", "OPERATIONS"],
      default: null
    },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
    context: {
      summary: { type: String, default: "" }
    },
    actions: {
      type: [
        {
          type: { type: String },
          status: { type: String, default: "PENDING" },
          externalId: { type: String, default: null },
          createdAt: { type: Date, default: Date.now }
        }
      ],
      default: []
    },
    acknowledgedBy: { type: String, default: null },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("Case", CaseSchema, "cases");
