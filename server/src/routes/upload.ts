import { Router } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

export const uploadRouter = Router();

uploadRouter.post("/upload-cv", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { originalname, buffer, mimetype } = req.file;
    let text: string;

    if (mimetype === "application/pdf" || originalname.toLowerCase().endsWith(".pdf")) {
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      originalname.toLowerCase().endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return res.status(400).json({ error: "Unsupported file type. Upload a PDF or DOCX." });
    }

    text = text.trim();
    if (!text) {
      return res.status(422).json({ error: "Could not extract any text from the file." });
    }

    res.json({ text });
  } catch (err) {
    console.error("Upload parse error:", err);
    res.status(500).json({ error: "Failed to parse the uploaded file." });
  }
});
