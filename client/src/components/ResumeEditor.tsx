import { useState } from "react";
import type { ResumeData } from "../types";

interface Props {
  resume: ResumeData;
  onChange: (resume: ResumeData) => void;
}

function TextField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
    </label>
  );
}

// Skills need local text state: a controlled value of skills.join(", ") would
// strip a just-typed trailing comma on re-render, making new skills untypeable.
function SkillsField({
  skills,
  onChange
}: {
  skills: string[];
  onChange: (skills: string[]) => void;
}) {
  const [text, setText] = useState(skills.join(", "));
  return (
    <textarea
      rows={3}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
      }}
    />
  );
}

export function ResumeEditor({ resume, onChange }: Props) {
  function update(patch: Partial<ResumeData>) {
    onChange({ ...resume, ...patch });
  }

  function updateExperience(index: number, patch: Partial<ResumeData["experience"][number]>) {
    const experience = [...resume.experience];
    experience[index] = { ...experience[index], ...patch };
    update({ experience });
  }

  function updateExperienceBullet(expIndex: number, bulletIndex: number, value: string) {
    const experience = [...resume.experience];
    const bullets = [...experience[expIndex].bullets];
    bullets[bulletIndex] = value;
    experience[expIndex] = { ...experience[expIndex], bullets };
    update({ experience });
  }

  function addBullet(expIndex: number) {
    const experience = [...resume.experience];
    experience[expIndex] = {
      ...experience[expIndex],
      bullets: [...experience[expIndex].bullets, ""]
    };
    update({ experience });
  }

  function removeBullet(expIndex: number, bulletIndex: number) {
    const experience = [...resume.experience];
    experience[expIndex] = {
      ...experience[expIndex],
      bullets: experience[expIndex].bullets.filter((_, i) => i !== bulletIndex)
    };
    update({ experience });
  }

  return (
    <div className="editor">
      <h3>Contact</h3>
      <div className="grid">
        <TextField
          label="Name"
          value={resume.contact.name}
          onChange={(v) => update({ contact: { ...resume.contact, name: v } })}
        />
        <TextField
          label="Email"
          value={resume.contact.email}
          onChange={(v) => update({ contact: { ...resume.contact, email: v } })}
        />
        <TextField
          label="Phone"
          value={resume.contact.phone}
          onChange={(v) => update({ contact: { ...resume.contact, phone: v } })}
        />
        <TextField
          label="Location"
          value={resume.contact.location}
          onChange={(v) => update({ contact: { ...resume.contact, location: v } })}
        />
        <TextField
          label="LinkedIn"
          value={resume.contact.linkedin ?? ""}
          onChange={(v) => update({ contact: { ...resume.contact, linkedin: v } })}
        />
        <TextField
          label="Website"
          value={resume.contact.website ?? ""}
          onChange={(v) => update({ contact: { ...resume.contact, website: v } })}
        />
      </div>

      <h3>Summary</h3>
      <TextArea label="" value={resume.summary} onChange={(v) => update({ summary: v })} />

      <h3>Skills (comma-separated)</h3>
      <SkillsField skills={resume.skills} onChange={(skills) => update({ skills })} />

      <h3>Experience</h3>
      {resume.experience.map((job, i) => (
        <div key={i} className="card">
          <div className="grid">
            <TextField label="Title" value={job.title} onChange={(v) => updateExperience(i, { title: v })} />
            <TextField label="Company" value={job.company} onChange={(v) => updateExperience(i, { company: v })} />
            <TextField
              label="Location"
              value={job.location ?? ""}
              onChange={(v) => updateExperience(i, { location: v })}
            />
            <TextField
              label="Start date"
              value={job.startDate}
              onChange={(v) => updateExperience(i, { startDate: v })}
            />
            <TextField label="End date" value={job.endDate} onChange={(v) => updateExperience(i, { endDate: v })} />
          </div>
          <span className="field-label">Bullets</span>
          {job.bullets.map((b, j) => (
            <div key={j} className="bullet-row">
              <input value={b} onChange={(e) => updateExperienceBullet(i, j, e.target.value)} />
              <button type="button" onClick={() => removeBullet(i, j)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={() => addBullet(i)}>
            + Add bullet
          </button>
        </div>
      ))}
    </div>
  );
}
