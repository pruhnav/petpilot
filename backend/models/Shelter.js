import mongoose from "mongoose";

const { Schema } = mongoose;

const ShelterSchema = new Schema(
  {
    _id: { type: String },
    name: { type: String, required: true },
    rooms: {
      type: [
        {
          id: String,
          cameraId: String,
          kennels: { type: [String], default: [] }
        }
      ],
      default: []
    },
    routing: {
      medical: String,
      behavior: String,
      operations: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("Shelter", ShelterSchema, "shelters");
