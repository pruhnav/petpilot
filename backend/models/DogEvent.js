import mongoose from "mongoose";

const { Schema } = mongoose;

const DogEventSchema = new Schema(
  {
    _id: { type: String },
    dogId: { type: String, required: true, index: true },
    source: { type: String, enum: ["CAMERA", "VOLUNTEER", "FOSTER", "SYSTEM"], required: true },
    type: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    confidence: { type: Number, default: null },
    description: String,
    evidence: {
      videoSource: { type: String, default: null },
      startTime: { type: Number, default: null },
      endTime: { type: Number, default: null },
      trackId: { type: Number, default: null }
    },
    verification: {
      status: {
        type: String,
        enum: ["PENDING", "CONFIRMED", "DISMISSED", "CORRECTED", "HUMAN_REPORTED"],
        default: "PENDING",
        index: true
      },
      reviewedBy: { type: String, default: null },
      reviewedAt: { type: Date, default: null },
      correction: { type: Schema.Types.Mixed, default: null }
    },
    routing: { type: Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("DogEvent", DogEventSchema, "observations");
