import "dotenv/config";
import mongoose from "mongoose";
import Dog from "../models/Dog.js";
import MedicalRecord from "../models/MedicalRecord.js";
import Shelter from "../models/Shelter.js";
import DogEvent from "../models/DogEvent.js";
import Case from "../models/Case.js";
import CareEvent from "../models/CareEvent.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dogos";

const SHELTER = {
  _id: "petzen_demo",
  name: "PetZen Demo Shelter",
  rooms: [{ id: "room_A", cameraId: "camera_01", kennels: ["A1", "A2", "A3", "A4", "A5", "A6", "A7"] }],
  routing: { medical: "all-petpilot-demo", behavior: "all-petpilot-demo", operations: "all-petpilot-demo" }
};

// Canonical 7 (CLAUDE.md section 6). Do not change these IDs without telling the whole team.
const DOGS = [
  {
    _id: "dog_bella", name: "Bella", breed: "Labrador Mix", age: 4, sex: "female", kennel: "A3",
    medical: {
      vaccinations: [{ type: "Rabies", lastDate: "2025-08-25", nextDue: "2026-08-25", status: "DUE_SOON" }],
      procedures: [{ name: "Minor procedure", date: "2026-08-21", status: "COMPLETED" }]
    }
  },
  {
    _id: "dog_bruno", name: "Bruno", breed: "Boxer Mix", age: 5, sex: "male", kennel: "A1",
    medical: { vaccinations: [{ type: "Rabies", lastDate: "2025-08-20", nextDue: "2026-08-27", status: "DUE_SOON" }] }
  },
  { _id: "dog_milo", name: "Milo", breed: "Beagle Mix", age: 3, sex: "male", kennel: "A2", medical: {} },
  { _id: "dog_luna", name: "Luna", breed: "Shepherd Mix", age: 5, sex: "female", kennel: "A4", medical: {}, inFoster: true },
  { _id: "dog_charlie", name: "Charlie", breed: "Golden Retriever Mix", age: 2, sex: "male", kennel: "A5", medical: {} },
  { _id: "dog_coco", name: "Coco", breed: "Poodle Mix", age: 6, sex: "female", kennel: "A6", medical: {} },
  { _id: "dog_max", name: "Max", breed: "Mixed Breed", age: 4, sex: "male", kennel: "A7", medical: {} }
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected:", MONGODB_URI);

  await Promise.all([
    Dog.deleteMany({}),
    MedicalRecord.deleteMany({}),
    Shelter.deleteMany({}),
    DogEvent.deleteMany({}),
    Case.deleteMany({}),
    CareEvent.deleteMany({})
  ]);

  await Shelter.create(SHELTER);

  for (const d of DOGS) {
    await Dog.create({
      _id: d._id,
      name: d.name,
      breed: d.breed,
      age: d.age,
      sex: d.sex,
      photoUrl: `/dogs/${d._id.replace("dog_", "")}.jpg`,
      shelter: {
        shelterId: "petzen_demo",
        room: "room_A",
        kennel: d.kennel,
        status: d.inFoster ? "IN_FOSTER" : "IN_SHELTER",
        lastVerifiedLocationAt: new Date()
      },
      care: { foodSchedule: ["08:00", "17:00"], walkSchedule: ["10:00", "16:00"] },
      dogosStatus: "NORMAL",
      nextStep: "ROUTINE_MONITORING"
    });

    await MedicalRecord.create({
      _id: `med_${d._id.replace("dog_", "")}`,
      dogId: d._id,
      vaccinations: d.medical.vaccinations || [],
      procedures: d.medical.procedures || [],
      medications: [],
      restrictions: [],
      clinicalNotes: []
    });
  }

  // Hero + location-conflict demo data, precomputed per CLAUDE.md's fallback guidance (F16)
  // so the Truth Queue has real content without a live vision pipeline running yet.
  await DogEvent.create([
    {
      _id: "event_bella_food",
      dogId: "dog_bella",
      source: "CAMERA",
      type: "FOOD_INTERACTION_MISSING",
      confidence: 0.83,
      description: "Food interaction was not observed during Bella's expected breakfast window.",
      evidence: { videoSource: "youtube_demo_1", startTime: 121, endTime: 151, trackId: 4 }
    },
    {
      _id: "event_bella_activity",
      dogId: "dog_bella",
      source: "CAMERA",
      type: "PROLONGED_INACTIVITY",
      confidence: 0.71,
      description: "Bella's morning activity differed from her recent routine.",
      evidence: { videoSource: "youtube_demo_1", startTime: 300, endTime: 340, trackId: 4 }
    },
    {
      _id: "event_max_location",
      dogId: "dog_max",
      source: "CAMERA",
      type: "LOCATION_MISMATCH",
      confidence: 0.79,
      description: "Max was not observed in kennel A7; a volunteer reports him near the medical wing.",
      evidence: { videoSource: "youtube_demo_2", startTime: 40, endTime: 70, trackId: 2 }
    }
  ]);

  await Dog.updateMany({ _id: { $in: ["dog_bella", "dog_max"] } }, { dogosStatus: "NEEDS_REVIEW" });

  console.log("Seed complete: 1 shelter, 7 dogs, medical records, 3 pending observations.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
