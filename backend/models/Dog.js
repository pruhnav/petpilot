import mongoose from "mongoose";

const { Schema } = mongoose;

const DogSchema = new Schema(
  {
    _id: { type: String },
    name: { type: String, required: true },
    breed: String,
    age: Number,
    sex: String,
    photoUrl: String,
    visualIdentity: {
      referenceImages: { type: [String], default: [] },
      embedding: { type: [Number], default: [] },
      currentTrackerId: { type: String, default: null },
      recognitionConfidence: { type: Number, default: null }
    },
    shelter: {
      shelterId: String,
      room: String,
      kennel: String,
      status: { type: String, enum: ["IN_SHELTER", "IN_FOSTER"], default: "IN_SHELTER" },
      lastVerifiedLocationAt: { type: Date, default: null }
    },
    care: {
      foodSchedule: { type: [String], default: [] },
      walkSchedule: { type: [String], default: [] }
    },
    dogosStatus: {
      type: String,
      enum: ["NORMAL", "WATCH", "NEEDS_REVIEW", "BEING_CHECKED", "RESOLVED"],
      default: "NORMAL"
    },
    nextStep: { type: String, default: "ROUTINE_MONITORING" }
  },
  { timestamps: true }
);

export default mongoose.model("Dog", DogSchema, "dogs");
