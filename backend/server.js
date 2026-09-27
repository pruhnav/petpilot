import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import dogsRouter from "./routes/dogs.js";
import observationsRouter from "./routes/observations.js";
import reviewRouter from "./routes/review.js";
import casesRouter from "./routes/cases.js";
import careEventsRouter from "./routes/careEvents.js";
import askRouter from "./routes/ask.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/dogs", dogsRouter);
app.use("/api/observations", observationsRouter);
app.use("/api/review", reviewRouter);
app.use("/api/cases", casesRouter);
app.use("/api/care-events", careEventsRouter);
app.use("/api/ask", askRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dogos";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`DogOS backend listening on :${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
