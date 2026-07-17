import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ResumeData } from "../resumeSchema.js";

export const outreachRouter = Router();

const SYSTEM_INSTRUCTION = `You write short job-outreach messages that sound like a real person, not a template or an AI.

You will be given a candidate's resume (JSON), a target job description, and optionally a company name and a recruiter/hiring-manager name.

Produce TWO messages:

1. "linkedin" — a LinkedIn DM to the recruiter or hiring manager.
   - Maximum 550 characters. Shorter is better.
   - Casual-professional, like messaging a colleague you haven't met. No "Dear Sir/Madam".
   - One specific hook from the candidate's background that maps to the role — a thing they built or did, not a list of skills.
   - End with a light, low-pressure ask (a quick chat, or simply expressing interest in the role).
   - If a name is given, open with "Hi {first name}," — otherwise just "Hi,".

2. "email" — a cold email for Gmail with "subject" and "body".
   - Subject: under 60 characters, specific and plain — mention the role. No clickbait, no "Opportunity!!".
   - Body: 100-160 words, 2-3 short paragraphs. Greeting matches the same name rule as LinkedIn.
   - First line says why they're writing (the specific role). Middle ties 1-2 concrete resume items to what the JD needs. Close with one clear, easy ask.
   - Sign off with the candidate's full name and phone number from the resume.

Voice rules for BOTH (these matter most):
- NEVER use: "I am writing to express my interest", "I'm excited about the opportunity", "passionate", "proven track record", "leverage", "align", "dynamic", "I believe I would be a great fit".
- Vary sentence length; write like a person typing, not composing.
- Facts ONLY from the resume. Never invent experience, metrics, or mutual connections.
- No placeholders like [Company] or [Name] — if information is missing, write around it naturally.

Return ONLY the structured JSON described by the response schema.`;

const OUTREACH_SCHEMA = {
  type: "object",
  properties: {
    linkedin: { type: "string" },
    email: {
      type: "object",
      properties: {
        subject: { type: "string" },
        body: { type: "string" }
      },
      required: ["subject", "body"]
    }
  },
  required: ["linkedin", "email"]
} as const;

outreachRouter.post("/outreach", async (req, res) => {
  try {
    const { resume, jobDescription, company, recruiterName } = req.body as {
      resume?: ResumeData;
      jobDescription?: string;
      company?: string;
      recruiterName?: string;
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
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: OUTREACH_SCHEMA as any
      }
    });

    const prompt = `RESUME (JSON):\n"""\n${JSON.stringify(resume, null, 2)}\n"""\n\n${
      company?.trim() ? `COMPANY: ${company.trim()}\n` : ""
    }${recruiterName?.trim() ? `RECRUITER/HIRING MANAGER NAME: ${recruiterName.trim()}\n` : ""}\nJOB DESCRIPTION:\n"""\n${jobDescription}\n"""`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    try {
      res.json(JSON.parse(raw));
    } catch {
      console.error("Outreach returned non-JSON response:", raw);
      res.status(502).json({ error: "AI response could not be parsed. Please try again." });
    }
  } catch (err) {
    console.error("Outreach error:", err);
    res.status(500).json({ error: "Failed to generate outreach messages." });
  }
});
