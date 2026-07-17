import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { ResumePDF } from "./ResumePDF";
import { saveResumePdf } from "../api";
import type { ResumeData } from "../types";

function sanitizeForFilename(part: string): string {
  return part
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_");
}

export function DownloadButton({ resume }: { resume: ResumeData }) {
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedTo, setSavedTo] = useState("");
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (!company.trim()) return;
    setBusy(true);
    setError("");
    try {
      const blob = await pdf(<ResumePDF resume={resume} />).toBlob();
      const filename = `${sanitizeForFilename(company)}_${sanitizeForFilename(
        resume.contact.name || "resume"
      )}.pdf`;

      const path = await saveResumePdf(blob, filename);
      setSavedTo(path);
      setCompany("");
    } catch {
      setError("Could not save the PDF. Is the server running?");
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setOpen(false);
    setSavedTo("");
    setError("");
  }

  return (
    <>
      <button type="button" className="primary" onClick={() => setOpen(true)}>
        Download PDF
      </button>

      {open && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {savedTo ? (
              <>
                <h3>Saved ✓</h3>
                <p className="hint">
                  <code>{savedTo}</code>
                </p>
                <div className="modal-actions">
                  <button type="button" onClick={() => setSavedTo("")}>
                    Save another
                  </button>
                  <button type="button" className="primary" onClick={close}>
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Which company is this for?</h3>
                <input
                  autoFocus
                  placeholder="e.g. Google"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                />
                <p className="hint">
                  Will be saved to your resumes folder as{" "}
                  <code>
                    {sanitizeForFilename(company || "Company")}_
                    {sanitizeForFilename(resume.contact.name || "Name")}.pdf
                  </code>
                </p>
                {error && <p className="error">{error}</p>}
                <div className="modal-actions">
                  <button type="button" onClick={close}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="primary"
                    disabled={!company.trim() || busy}
                    onClick={handleConfirm}
                  >
                    {busy ? "Saving..." : "Save PDF"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
