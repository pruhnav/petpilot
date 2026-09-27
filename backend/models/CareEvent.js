import mongoose from "mongoose";

const { Schema } = mongoose;

const CareEventSchema = new Schema(
  {
    _id: { type: String },
    dogId: { type: String, required: true, index: true },
    caseId: { type: String, default: null },
    type: { type: String, enum: ["VACCINATION", "RECHECK", "PROCEDURE", "FOSTER_FOLLOWUP"], required: true },
    title: { type: String, required: true },
    description: String,
    dateTime: { type: Date, required: true },
    status: { type: String, enum: ["SCHEDULED", "COMPLETED", "CANCELLED"], default: "SCHEDULED" },
    externalId: { type: String, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("CareEvent", CareEventSchema, "careEvents");
