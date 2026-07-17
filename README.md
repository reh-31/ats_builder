# ATS Resume Builder

Upload your base CV, paste a job description, get a tailored, ATS-safe resume you can edit in the browser and export as a PDF named `Company_YourName.pdf`.

See [PRD.md](PRD.md) for the full product spec and design decisions.

## Structure

- `server/` — Node/Express API. Parses uploaded PDF/DOCX CVs and calls the Gemini API to tailor the resume against a job description.
- `client/` — Vite + React app. Upload, JD input, live-editable resume, ATS keyword match panel, and PDF export (via `@react-pdf/renderer`, no LaTeX/headless browser needed).

## Setup

### 1. Get a free Gemini API key
Go to [Google AI Studio](https://aistudio.google.com/apikey) and create a free API key.

### 2. Configure the server
```
cd server
cp .env.example .env
```
Edit `.env` and set `GEMINI_API_KEY=your_key_here`.

### 3. Install dependencies
```
cd server && npm install
cd ../client && npm install
```

### 4. Run both apps (two terminals)
```
cd server && npm run dev      # http://localhost:5174
cd client && npm run dev      # http://localhost:5173
```

Open http://localhost:5173.

## How it works

1. **Upload base CV** (PDF or DOCX) — text is extracted server-side and cached in your browser's localStorage so you don't need to re-upload every time.
2. **Paste a job description** — plain text.
3. **Generate** — the server sends your CV text + the JD to Gemini with a strict JSON schema and a system prompt that forbids fabricating experience; it returns a tailored resume plus a list of matched/missing ATS keywords.
4. **Review & edit** — edit any field inline; the PDF preview updates live.
5. **Download** — click Download, enter the company name, and the file downloads as `Company_YourName.pdf`.

## Notes / v1 limitations

- Education, projects, and certifications are generated and shown in the PDF preview but not yet editable in the form (only contact/summary/skills/experience are). Easy to extend in `client/src/components/ResumeEditor.tsx`.
- No accounts or backend database — everything is local to your machine/browser.
- One clean, single-column ATS-safe PDF template (by design — multi-column/graphical templates hurt ATS parsing).
