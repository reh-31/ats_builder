import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { uploadRouter } from "./routes/upload.js";
import { tailorRouter } from "./routes/tailor.js";
import { coverLetterRouter } from "./routes/coverLetter.js";
import { saveResumeRouter } from "./routes/saveResume.js";
import { outreachRouter } from "./routes/outreach.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5174;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api", uploadRouter);
app.use("/api", tailorRouter);
app.use("/api", coverLetterRouter);
app.use("/api", saveResumeRouter);
app.use("/api", outreachRouter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Resume builder server running on http://localhost:${PORT}`);
});
