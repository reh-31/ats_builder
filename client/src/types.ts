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

export interface AtsKeywords {
  matched: string[];
  missing: string[];
}

export interface TailorResponse {
  resume: ResumeData;
  atsKeywords: AtsKeywords;
}
