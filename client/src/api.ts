import axios from "axios";
import type { ResumeData, TailorResponse } from "./types";

export async function uploadCv(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await axios.post<{ text: string }>("/api/upload-cv", form, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data.text;
}

export async function tailorResume(
  baseCvText: string,
  jobDescription: string
): Promise<TailorResponse> {
  const { data } = await axios.post<TailorResponse>("/api/tailor", {
    baseCvText,
    jobDescription
  });
  return data;
}

export async function saveResumePdf(pdf: Blob, filename: string): Promise<string> {
  const { data } = await axios.post<{ savedTo: string }>("/api/save-resume", pdf, {
    params: { filename },
    headers: { "Content-Type": "application/pdf" }
  });
  return data.savedTo;
}

export interface OutreachMessages {
  linkedin: string;
  email: { subject: string; body: string };
}

export async function generateOutreach(
  resume: ResumeData,
  jobDescription: string,
  company?: string,
  recruiterName?: string
): Promise<OutreachMessages> {
  const { data } = await axios.post<OutreachMessages>("/api/outreach", {
    resume,
    jobDescription,
    company,
    recruiterName
  });
  return data;
}

export async function generateCoverLetter(
  resume: ResumeData,
  jobDescription: string,
  company?: string
): Promise<string> {
  const { data } = await axios.post<{ coverLetter: string }>("/api/cover-letter", {
    resume,
    jobDescription,
    company
  });
  return data.coverLetter;
}
