import type { ResumeData, AtsKeywords } from "./types";

function resumeToText(resume: ResumeData): string {
  const parts: string[] = [
    resume.summary,
    ...resume.skills,
    ...resume.experience.flatMap((j) => [j.title, j.company, ...j.bullets]),
    ...resume.education.flatMap((e) => [e.degree, e.school, ...(e.details ?? [])]),
    ...(resume.projects ?? []).flatMap((p) => [p.name, p.description, ...(p.bullets ?? [])]),
    ...(resume.certifications ?? [])
  ];
  return parts.join("\n").toLowerCase();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Boundary check so short keywords ("R", "Go", "ML") don't match inside
// unrelated words, while still allowing punctuation like "C++" or "CI/CD".
function keywordInText(keyword: string, text: string): boolean {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return false;
  const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(kw)}([^a-z0-9]|$)`);
  return re.test(text);
}

// Classify the JD's keywords as matched/missing against arbitrary CV text
// (used for the "before" score on the raw base CV).
export function computeAtsKeywordsFromText(jdKeywords: string[], cvText: string): AtsKeywords {
  const text = cvText.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];
  for (const kw of jdKeywords) {
    (keywordInText(kw, text) ? matched : missing).push(kw);
  }
  return { matched, missing };
}

// Classify the JD's keywords against the text of the tailored resume as it
// currently stands (generated output plus any manual edits).
export function computeAtsKeywords(jdKeywords: string[], resume: ResumeData): AtsKeywords {
  return computeAtsKeywordsFromText(jdKeywords, resumeToText(resume));
}
