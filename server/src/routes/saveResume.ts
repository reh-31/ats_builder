import { Router, raw } from "express";
import fs from "node:fs";
import path from "node:path";

export const saveResumeRouter = Router();

const SAVE_DIR = process.env.RESUMES_DIR || "D:/resumes_ai";

saveResumeRouter.post(
  "/save-resume",
  raw({ type: "application/pdf", limit: "10mb" }),
  (req, res) => {
    try {
      const rawName = String(req.query.filename || "resume.pdf");
      // Strip any path components so the filename can't escape SAVE_DIR.
      const filename = path.basename(rawName).replace(/[\\/:*?"<>|]/g, "_");
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: "Empty PDF body." });
      }

      fs.mkdirSync(SAVE_DIR, { recursive: true });
      const target = path.join(SAVE_DIR, filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
      fs.writeFileSync(target, req.body);
      res.json({ savedTo: target });
    } catch (err) {
      console.error("Save resume error:", err);
      res.status(500).json({ error: "Failed to save resume to disk." });
    }
  }
);
