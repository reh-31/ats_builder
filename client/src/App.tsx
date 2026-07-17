import { useEffect, useMemo, useState } from "react";

// Debounce the value fed to the PDF preview: PDFViewer re-renders the whole
// document, which is too slow to run on every keystroke.
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
import { PDFViewer } from "@react-pdf/renderer";
import { uploadCv, tailorResume } from "./api";
import { loadBaseCvText, saveBaseCvText } from "./storage";
import { ResumeEditor } from "./components/ResumeEditor";
import { AtsFindings } from "./components/AtsFindings";
import { CoverLetterPane } from "./components/CoverLetterPane";
import { OutreachPane } from "./components/OutreachPane";
import { DownloadButton } from "./components/DownloadButton";
import { ResumePDF } from "./components/ResumePDF";
import { computeAtsKeywords, computeAtsKeywordsFromText } from "./ats";
import type { ResumeData } from "./types";

function pct(matched: number, total: number): number {
  return total > 0 ? Math.round((matched / total) * 100) : 0;
}

export default function App() {
  const [baseCvText, setBaseCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [jdKeywords, setJdKeywords] = useState<string[] | null>(null);
  // The JD whose keywords we extracted; regenerating with the same JD keeps
  // the list stable so before/after scores stay comparable across runs.
  const [jdOfKeywords, setJdOfKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generation, setGeneration] = useState(0);
  // Setup (inputs) vs workspace (review) — the two phases of the flow.
  const [showSetup, setShowSetup] = useState(true);
  const [tab, setTab] = useState<"edit" | "keywords" | "cover" | "outreach">("edit");
  const previewResume = useDebouncedValue(resume, 400);

  // "Before" scores the raw base CV against the JD keywords; "after" scores
  // the generated resume (including manual edits), i.e. what gets downloaded.
  const baseAtsKeywords = useMemo(
    () => (jdKeywords && baseCvText ? computeAtsKeywordsFromText(jdKeywords, baseCvText) : null),
    [jdKeywords, baseCvText]
  );
  const atsKeywords = useMemo(
    () => (resume && jdKeywords ? computeAtsKeywords(jdKeywords, resume) : null),
    [resume, jdKeywords]
  );

  const beforePct = baseAtsKeywords
    ? pct(baseAtsKeywords.matched.length, jdKeywords?.length ?? 0)
    : null;
  const afterPct = atsKeywords ? pct(atsKeywords.matched.length, jdKeywords?.length ?? 0) : null;

  useEffect(() => {
    setBaseCvText(loadBaseCvText());
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const text = await uploadCv(file);
      setBaseCvText(text);
      saveBaseCvText(text);
    } catch {
      setError("Could not read that file. Try a PDF or DOCX.");
    } finally {
      // Reset so picking the same file again re-triggers onChange.
      e.target.value = "";
    }
  }

  async function handleGenerate() {
    if (!baseCvText.trim() || !jobDescription.trim()) {
      setError("Upload your base CV and paste a job description first.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await tailorResume(baseCvText, jobDescription);
      setResume(result.resume);
      // The server's matched/missing split reflects the LLM's own judgment;
      // we only keep the keyword list and re-verify against the final resume.
      if (!jdKeywords || jobDescription !== jdOfKeywords) {
        setJdKeywords([...new Set([...result.atsKeywords.matched, ...result.atsKeywords.missing])]);
        setJdOfKeywords(jobDescription);
      }
      setGeneration((g) => g + 1);
      setShowSetup(false);
      setTab("edit");
    } catch {
      setError("Failed to generate tailored resume. Check the server logs / API key.");
    } finally {
      setLoading(false);
    }
  }

  // ---------- Setup phase: one focused card, nothing else ----------
  if (showSetup || !resume) {
    return (
      <div className="setup">
        <div className="setup-card">
          <div className="brand setup-brand">
            <span className="brand-mark">ATS</span>
            <span className="brand-slash">/</span>
            <span>BUILDER</span>
          </div>
          <h1>Tailor your resume to the job</h1>
          <p className="lede">
            Upload your CV once, paste a job description, and get an ATS-optimized resume you
            can fine-tune and download.
          </p>

          <label className={baseCvText ? "upload-zone loaded" : "upload-zone"}>
            <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} hidden />
            {baseCvText ? (
              <>
                <span className="upload-check">✓</span> Base CV loaded (
                {baseCvText.length.toLocaleString()} chars) — click to replace
              </>
            ) : (
              <>Upload base CV — PDF or DOCX</>
            )}
          </label>

          <textarea
            rows={9}
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />

          <button
            type="button"
            className="primary block"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Tailoring your resume…" : "Generate tailored resume"}
          </button>
          {error && <p className="error">{error}</p>}

          {resume && (
            <button type="button" className="ghost block" onClick={() => setShowSetup(false)}>
              ← Back to your tailored resume
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---------- Workspace phase: preview is the centerpiece ----------
  return (
    <div className="workspace">
      <header className="wsbar">
        <div className="brand">
          <span className="brand-mark">ATS</span>
          <span className="brand-slash">/</span>
          <span>BUILDER</span>
        </div>

        {beforePct !== null && afterPct !== null && (
          <div className="score" title="ATS keyword match: base CV → tailored resume">
            <strong className="score-num">{afterPct}</strong>
            <div className="score-meta">
              <span className="score-label">Keyword match</span>
              <div className="segbar">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={i}
                    className={i < Math.round(afterPct / 10) ? "seg on" : "seg"}
                  />
                ))}
              </div>
            </div>
            <span className="score-was">was {beforePct}</span>
          </div>
        )}

        <div className="wsbar-actions">
          <button type="button" className="ghost outline" onClick={() => setShowSetup(true)}>
            Change job/CV
          </button>
          <DownloadButton resume={resume} />
        </div>
      </header>

      <div className="workspace-body">
        <section className="side-pane">
          <div className="tabs">
            <button
              type="button"
              className={tab === "edit" ? "tab active" : "tab"}
              onClick={() => setTab("edit")}
            >
              Edit
            </button>
            <button
              type="button"
              className={tab === "keywords" ? "tab active" : "tab"}
              onClick={() => setTab("keywords")}
            >
              Keywords
              {atsKeywords && atsKeywords.missing.length > 0 && (
                <span className="badge">{atsKeywords.missing.length}</span>
              )}
            </button>
            <button
              type="button"
              className={tab === "cover" ? "tab active" : "tab"}
              onClick={() => setTab("cover")}
            >
              Cover letter
            </button>
            <button
              type="button"
              className={tab === "outreach" ? "tab active" : "tab"}
              onClick={() => setTab("outreach")}
            >
              Outreach
            </button>
          </div>

          <div className="side-pane-body">
            {tab === "edit" ? (
              // Key remounts the editor per generation so fields with local
              // state (skills) reset to the newly generated resume.
              <ResumeEditor key={generation} resume={resume} onChange={setResume} />
            ) : tab === "cover" ? (
              <CoverLetterPane key={generation} resume={resume} jobDescription={jobDescription} />
            ) : tab === "outreach" ? (
              <OutreachPane key={generation} resume={resume} jobDescription={jobDescription} />
            ) : (
              jdKeywords &&
              atsKeywords && (
                <div className="keywords-pane">
                  <div className="overview-row">
                    <span>Base CV match</span>
                    <strong>{beforePct}%</strong>
                  </div>
                  <div className="ats-bar dim">
                    <div className="ats-bar-fill" style={{ width: `${beforePct ?? 0}%` }} />
                  </div>
                  <div className="overview-row">
                    <span>Tailored match</span>
                    <strong>{afterPct}%</strong>
                  </div>
                  <div className="ats-bar">
                    <div className="ats-bar-fill" style={{ width: `${afterPct ?? 0}%` }} />
                  </div>
                  <p className="hint pane-hint">
                    Updates live as you edit. Add missing keywords to your skills or bullets —
                    only if they're true.
                  </p>
                  <AtsFindings
                    jdKeywords={jdKeywords}
                    before={baseAtsKeywords}
                    after={atsKeywords}
                  />
                </div>
              )
            )}
          </div>
        </section>

        <section className="preview-pane">
          <PDFViewer width="100%" height="100%" showToolbar={false}>
            <ResumePDF resume={previewResume ?? resume} />
          </PDFViewer>
        </section>
      </div>
    </div>
  );
}
