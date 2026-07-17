export interface ResumeData {
  contact: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
  };
  summary: string;
  skills: string[];
  experience: {
    company: string;
    title: string;
    location?: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }[];
  education: {
    school: string;
    degree: string;
    location?: string;
    startDate: string;
    endDate: string;
    details?: string[];
  }[];
  projects?: {
    name: string;
    description: string;
    bullets?: string[];
    link?: string;
  }[];
  certifications?: string[];
}

export interface TailorResponse {
  resume: ResumeData;
  atsKeywords: {
    matched: string[];
    missing: string[];
  };
}

// JSON schema handed to Gemini so it returns a strictly-shaped object.
export const RESUME_JSON_SCHEMA = {
  type: "object",
  properties: {
    resume: {
      type: "object",
      properties: {
        contact: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            location: { type: "string" },
            linkedin: { type: "string" },
            website: { type: "string" }
          },
          required: ["name", "email", "phone", "location"]
        },
        summary: { type: "string" },
        skills: { type: "array", items: { type: "string" } },
        experience: {
          type: "array",
          items: {
            type: "object",
            properties: {
              company: { type: "string" },
              title: { type: "string" },
              location: { type: "string" },
              startDate: { type: "string" },
              endDate: { type: "string" },
              bullets: { type: "array", items: { type: "string" } }
            },
            required: ["company", "title", "startDate", "endDate", "bullets"]
          }
        },
        education: {
          type: "array",
          items: {
            type: "object",
            properties: {
              school: { type: "string" },
              degree: { type: "string" },
              location: { type: "string" },
              startDate: { type: "string" },
              endDate: { type: "string" },
              details: { type: "array", items: { type: "string" } }
            },
            required: ["school", "degree", "startDate", "endDate"]
          }
        },
        projects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              bullets: { type: "array", items: { type: "string" } },
              link: { type: "string" }
            },
            required: ["name", "description"]
          }
        },
        certifications: { type: "array", items: { type: "string" } }
      },
      // projects/certifications required so the model returns them (possibly
      // empty) instead of silently dropping sections present in the base CV.
      required: ["contact", "summary", "skills", "experience", "education", "projects", "certifications"]
    },
    atsKeywords: {
      type: "object",
      properties: {
        matched: { type: "array", items: { type: "string" } },
        missing: { type: "array", items: { type: "string" } }
      },
      required: ["matched", "missing"]
    }
  },
  required: ["resume", "atsKeywords"]
} as const;
