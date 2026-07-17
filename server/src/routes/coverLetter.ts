import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ResumeData } from "../resumeSchema.js";

export const coverLetterRouter = Router();

const SYSTEM_INSTRUCTION = `You write cover letters that sound like a real person wrote them, not an AI or a template.

You will be given a candidate's resume (JSON), a target job description, and optionally a company name.

Voice and style rules — these matter more than anything else:
- Write in first person, plain conversational-professional English, like a thoughtful email to a future manager.
- NEVER use these clichés or anything like them: "I am writing to express my interest", "I am excited to apply", "esteemed organization", "proven track record", "passionate about", "leverage my skills", "align with", "unique blend of", "hit the ground running", "dynamic", "synergy".
- No bullet points, no headers, no placeholders like [Company]. Flowing paragraphs only.
- Vary sentence length. Some short. Others longer, the way people actually write.
- Be specific: pick the 2-3 most relevant things from the resume for THIS job and talk about them concretely — what was built, why it was hard or interesting, what happened as a result. Do not list skills.
- It's fine to show mild personality: genuine curiosity about the company's problem space, a matter-of-fact tone about achievements rather than boasting.
- Keep it honest: use ONLY facts from the resume. Never invent employers, metrics, or experience.
- Length: 220-320 words. Three or four paragraphs.
- Structure loosely: why this role caught their eye (specific, not flattery) → what they've done that maps to it → a grounded closing line that invites a conversation. Sign off with the candidate's full name.

Return ONLY the letter text. No subject line, no addresses, no date.`;

coverLetterRouter.post("/cover-letter", async (req, res) => {
  try {
    const { resume, jobDescription, company } = req.body as {
      resume?: ResumeData;
      jobDescription?: string;
      company?: string;
    };

    if (!resume || !jobDescription?.trim()) {
      return res.status(400).json({ error: "resume and jobDescription are required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const prompt = `RESUME (JSON):\n"""\n${JSON.stringify(resume, null, 2)}\n"""\n\n${
      company?.trim() ? `COMPANY: ${company.trim()}\n\n` : ""
    }JOB DESCRIPTION:\n"""\n${jobDescription}\n"""`;

    const result = await model.generateContent(prompt);
    res.json({ coverLetter: result.response.text().trim() });
  } catch (err) {
    console.error("Cover letter error:", err);
    res.status(500).json({ error: "Failed to generate cover letter." });
  }
});
