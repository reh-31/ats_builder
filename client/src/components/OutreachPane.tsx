import { useState } from "react";
import { generateOutreach, type OutreachMessages } from "../api";
import type { ResumeData } from "../types";

interface Props {
  resume: ResumeData;
  jobDescription: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="ghost"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

export function OutreachPane({ resume, jobDescription }: Props) {
  const [company, setCompany] = useState("");
  const [recruiter, setRecruiter] = useState("");
  const [messages, setMessages] = useState<OutreachMessages | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setError("");
    setLoading(true);
    try {
      setMessages(await generateOutreach(resume, jobDescription, company, recruiter));
    } catch {
      setError("Failed to generate messages. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="outreach-pane">
      <p className="hint">
        Personalized first-contact messages for this job — a LinkedIn DM and a cold email,
        grounded in your tailored resume.
      </p>

      <div className="outreach-controls">
        <input
          placeholder="Company name (optional)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <input
          placeholder="Recruiter / hiring manager name (optional)"
          value={recruiter}
          onChange={(e) => setRecruiter(e.target.value)}
        />
        <button type="button" className="primary" onClick={handleGenerate} disabled={loading}>
          {loading ? "Writing…" : messages ? "Rewrite both" : "Write messages"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      {messages && (
        <>
          <div className="message-card">
            <div className="message-card-head">
              <strong>LinkedIn DM</strong>
              <span className="hint">{messages.linkedin.length} chars</span>
              <CopyButton text={messages.linkedin} />
            </div>
            <textarea
              rows={6}
              value={messages.linkedin}
              onChange={(e) => setMessages({ ...messages, linkedin: e.target.value })}
            />
          </div>

          <div className="message-card">
            <div className="message-card-head">
              <strong>Gmail</strong>
              <span className="hint">
                {messages.email.body.trim().split(/\s+/).length} words
              </span>
              <CopyButton text={`Subject: ${messages.email.subject}\n\n${messages.email.body}`} />
            </div>
            <input
              className="subject-input"
              value={messages.email.subject}
              onChange={(e) =>
                setMessages({ ...messages, email: { ...messages.email, subject: e.target.value } })
              }
            />
            <textarea
              rows={12}
              value={messages.email.body}
              onChange={(e) =>
                setMessages({ ...messages, email: { ...messages.email, body: e.target.value } })
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
