# PRD: ATS Resume Builder

## 1. Summary
A web app that takes a user's base CV and a target job description (JD), generates a tailored, ATS-optimized version of the CV, lets the user review/edit the result in-browser, and exports it as a PDF named `{company}_{name}.pdf`.

## 2. Problem
Manually tailoring a resume for every job application is slow and error-prone. Generic resumes often get filtered out by Applicant Tracking Systems (ATS) before a human ever sees them, because they lack keyword alignment with the JD. Users need a fast way to go from (base CV + JD) → tailored, ATS-friendly resume, with full control before download.

## 3. Goals
- Reduce time to produce a tailored resume from ~30-60 min to under 5 min.
- Improve ATS keyword match rate between resume and JD.
- Give the user final editorial control (never auto-download without review).
- Produce a clean, ATS-parseable PDF with a predictable filename.

### Non-goals (v1)
- No cover letter generation.
- No job-board scraping/auto-apply.
- No multi-user accounts/teams/collaboration.
- No design-heavy/graphical resume templates (ATS parsers struggle with these).

## Decisions (locked for v1)
- **CV input**: Upload PDF/DOCX (text extracted server-side/client-side on upload).
- **Architecture**: Local-only, single user. No accounts/login. Data persisted locally (browser storage / local files). Minimal backend, just enough to proxy the AI API call and handle file parsing.
- **AI backend**: Gemini API (free tier) for JD analysis and CV tailoring. Requires a free Gemini API key from Google AI Studio, kept server-side (never exposed to the browser).
- **PDF engine**: HTML/CSS → PDF (not LaTeX). Chosen because the live web editor needs instant preview on every edit; LaTeX would require recompiling and a heavy local engine install. Both produce real selectable text, so ATS-parsing is equivalent either way.

## 4. Target User
Individual job seekers applying to multiple roles who want each application tailored without starting from scratch each time. Primary user (per this project): a single self-hosted/personal user, but designed cleanly enough to extend to multiple users later.

## 5. User Flow
1. **Upload/paste base CV** — user provides their master CV once (PDF/DOCX upload, or paste as text/markdown). Stored as the reusable "base" profile.
2. **Paste job description** — user pastes JD text into a text box.
3. **Generate tailored resume** — system analyzes JD (extracts key skills, requirements, keywords) and rewrites/reorders CV content (summary, skills, bullet points) to align, using only truthful content from the base CV (no fabrication).
4. **Review & edit** — tailored resume shown in an editable web view (sections: contact info, summary, skills, experience, education, etc.). User can tweak any text inline, reorder bullets, add/remove lines.
5. **ATS score/check (optional but core value)** — show a match score or checklist (keyword coverage, formatting warnings e.g. tables/images/columns that break ATS parsing).
6. **Download** — user clicks Download. App prompts for **company name** (text input). PDF is generated and downloaded as `{CompanyName}_{UserName}.pdf` (sanitized, e.g. spaces → underscores).

## 6. Functional Requirements

### 6.1 Base CV Input
- Accept PDF/DOCX upload; extract text server-side (e.g. `pdf-parse` for PDF, `mammoth` for DOCX).
- Persist the extracted base CV locally (browser storage or local file) so the user doesn't re-upload every time.

### 6.2 JD Input
- Simple textarea paste.
- No character limit issues — support long JDs.

### 6.3 Tailoring Engine
- Extract key requirements/keywords/skills from JD.
- Rewrite professional summary to reflect JD language.
- Reorder/emphasize skills section to match JD priorities.
- Rewrite or reorder experience bullet points to surface relevant achievements, using JD terminology where truthful and applicable.
- Must not invent experience, employers, dates, or skills not present in the base CV — only rephrase/reprioritize/reword existing true content.
- Powered by the Gemini API with a structured prompt: base CV + JD in, structured tailored CV JSON out.

### 6.4 ATS Compatibility Checks
- Flag/avoid: multi-column layouts, text-in-images, tables, headers/footers with critical info, non-standard section headings, special characters/icons.
- Keyword match indicator: show which JD keywords appear / are missing in the tailored resume.
- Use standard, single-column, text-based PDF layout for output.

### 6.5 Web Editor
- Section-based editable view (contact, summary, skills, experience, education, certifications, projects).
- Inline text editing, add/remove/reorder bullet points and sections.
- Live preview of how the resume will look.

### 6.6 PDF Export
- Renders the current edited state to PDF (clean ATS-safe template, selectable text — not an image).
- On download click, prompt user for **Company Name** via a modal/input.
- Filename format: `{CompanyName}_{UserFullName}.pdf`, sanitized (trim, replace spaces/special chars with underscores, e.g. `Google_RehaanKhan.pdf`).

## 7. Non-Functional Requirements
- Tailoring generation should complete in under ~15-20 seconds.
- All data (base CV, generated resumes) stored locally or in user-owned storage — no third-party sharing.
- Works on desktop browser (mobile responsive is nice-to-have, not required for v1).

## 8. Tech Approach
- **Frontend**: React (SPA) — single-page app with upload, editor, and preview.
- **PDF generation**: HTML/CSS → PDF (e.g. `@react-pdf/renderer` or headless browser print-to-PDF) using a simple, single-column ATS-safe template.
- **File parsing**: `pdf-parse` (PDF) and `mammoth` (DOCX) to extract base CV text on upload.
- **Tailoring**: Gemini API call with structured prompt (base CV text + JD text → structured JSON resume sections).
- **Storage**: Local browser storage (localStorage/IndexedDB) for base CV persistence; no accounts, no database.
- **Backend**: Minimal local server (e.g. small Node/Express service) — handles file parsing and proxies the Gemini API call so the API key never reaches the browser.

## 9. Success Metrics
- Time from JD paste to downloaded PDF < 5 minutes.
- User edits required after generation are minor (qualitative: user doesn't need to rewrite from scratch).
- Resume passes basic ATS-safe formatting checks (no tables/images/columns).

## 10. Open Questions
- Do we need multiple resume templates, or one clean ATS-safe template for v1?
- Should generated tailored resumes be saved/versioned per company for later reference?

## 11. V1 Scope Cut
For a first working version: paste-only base CV + JD input, one LLM tailoring pass, one editable template, one ATS-safe PDF export with company-name-prompted filename. Defer: file upload parsing, ATS scoring detail, multiple templates, resume history/versioning.
