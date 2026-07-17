import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RESUME_JSON_SCHEMA, type TailorResponse } from "../resumeSchema.js";

export const tailorRouter = Router();

const SYSTEM_INSTRUCTION = `You are an expert resume writer and ATS (Applicant Tracking System) optimization specialist.
You will be given a candidate's base CV text and a target job description (JD).

Your task:
1. Rewrite the candidate's resume so it is tailored to the JD, using ONLY facts, employers, dates, skills, and achievements that already appear in the base CV. Never invent experience, employers, dates, skills, or metrics that are not present or reasonably implied in the base CV.
2. Rewrite the professional summary to reflect the JD's language and priorities, while staying truthful to the candidate's actual background.
3. Reorder and prioritize the skills list so skills relevant to the JD appear first, using the terminology the JD uses when the candidate's underlying skill genuinely matches.
3b. Use the JD's EXACT wording for every skill or concept the candidate genuinely has — ATS systems match literally, so paraphrasing loses credit. If the JD says "Kubernetes" and the candidate has it, write "Kubernetes", not "container orchestration". Every keyword you list in "matched" MUST appear verbatim somewhere in the resume text (summary, skills, or bullets).
4. Rewrite/reorder experience bullet points to surface achievements most relevant to the JD, using strong action verbs and quantifiable impact where the base CV supports it.
5. Keep all dates, employer names, job titles, and education exactly as given in the base CV.
5b. Preserve every section present in the base CV: if the base CV lists projects or certifications, they MUST appear in the output (certifications copied verbatim). Never drop a section.
6. Produce a clean, single-column, ATS-safe structure: no tables, no columns, no icons, no images required.
7. Identify important keywords/requirements from the JD, then report which ones are matched in the tailored resume ("matched") and which important JD keywords could not be truthfully included because the candidate's CV has no supporting experience ("missing"). Do not pad "matched" with keywords that aren't genuinely reflected in the resume.

Return ONLY the structured JSON described by the response schema. Do not fabricate content.`;

tailorRouter.post("/tailor", async (req, res) => {
  try {
    const { baseCvText, jobDescription } = req.body as {
      baseCvText?: string;
      jobDescription?: string;
    };

    if (!baseCvText?.trim() || !jobDescription?.trim()) {
      return res.status(400).json({ error: "baseCvText and jobDescription are required." });
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
        responseSchema: RESUME_JSON_SCHEMA as any,
        // Low temperature: keyword usage should be consistent across runs so
        // the ATS score doesn't swing between regenerations of the same JD.
        temperature: 0.2
      }
    });

    const prompt = `BASE CV:\n"""\n${baseCvText}\n"""\n\nJOB DESCRIPTION:\n"""\n${jobDescription}\n"""`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    let parsed: TailorResponse;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("Gemini returned non-JSON response:", raw);
      return res.status(502).json({ error: "AI response could not be parsed. Please try again." });
    }

    res.json(parsed);
  } catch (err) {
    console.error("Tailor error:", err);
    res.status(500).json({ error: "Failed to generate tailored resume." });
  }
});
