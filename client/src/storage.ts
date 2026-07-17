const BASE_CV_KEY = "resume-builder:base-cv-text";

export function loadBaseCvText(): string {
  return localStorage.getItem(BASE_CV_KEY) ?? "";
}

export function saveBaseCvText(text: string): void {
  localStorage.setItem(BASE_CV_KEY, text);
}
