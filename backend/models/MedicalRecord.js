import mongoose from "mongoose";

const { Schema } = mongoose;

const MedicalRecordSchema = new Schema(
  {
    _id: { type: String },
    dogId: { type: String, required: true, index: true },
    vaccinations: {
      type: [
        {
          type: { type: String },
          lastDate: String,
          nextDue: String,
          status: { type: String, enum: ["CURRENT", "DUE_SOON", "OVERDUE"], default: "CURRENT" }
        }
      ],
      default: []
    },
    medications: { type: [Schema.Types.Mixed], default: [] },
    procedures: {
      type: [
        {
          name: String,
          date: String,
          status: { type: String, enum: ["SCHEDULED", "COMPLETED", "CANCELLED"], default: "SCHEDULED" }
        }
      ],
      default: []
    },
    restrictions: { type: [String], default: [] },
    clinicalNotes: { type: [Schema.Types.Mixed], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("MedicalRecord", MedicalRecordSchema, "medicalRecords");
