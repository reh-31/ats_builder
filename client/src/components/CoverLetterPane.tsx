import { useState } from "react";
import { generateCoverLetter } from "../api";
import type { ResumeData } from "../types";

interface Props {
  resume: ResumeData;
  jobDescription: string;
}

export function CoverLetterPane({ resume, jobDescription }: Props) {
  const [company, setCompany] = useState("");
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setError("");
    setLoading(true);
    try {
      const text = await generateCoverLetter(resume, jobDescription, company);
      setLetter(text);
    } catch {
      setError("Failed to generate cover letter. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="cover-letter-pane">
      <p className="hint">
        Written from your tailored resume and the job description, in a natural voice — read it
        and make it yours before sending.
      </p>

      <div className="cover-letter-controls">
        <input
          placeholder="Company name (optional)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <button type="button" className="primary" onClick={handleGenerate} disabled={loading}>
          {loading ? "Writing…" : letter ? "Rewrite" : "Write cover letter"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      {letter && (
        <>
          <textarea
            className="cover-letter-text"
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            rows={22}
          />
          <div className="cover-letter-actions">
            <span className="hint">
              {letter.trim().split(/\s+/).length} words · editable
            </span>
            <button type="button" onClick={handleCopy}>
              {copied ? "Copied ✓" : "Copy to clipboard"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
