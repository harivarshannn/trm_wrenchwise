export type CandidateStatus = "in_progress" | "selected" | "rejected";

export interface EducationItem {
  degree: string | null;
  level: "UG" | "PG" | null;
}

export interface ExperienceItem {
  company: string | null;
  role: string | null;
  years: string | null;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedin_url: string;
  github_url: string;
  status: CandidateStatus;
  skills: string[];
  education: EducationItem[];
  experience: ExperienceItem[];
  certifications: string[];
  created_at: string; // ISO date string
}

export interface ParsedResume {
  name: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  education: EducationItem[];
  experience: ExperienceItem[];
  certifications: string[];
  linkedin_url: string | null;
  github_url: string | null;
}

export interface UploadResumeResponse {
  success: boolean;
  raw_text: string;
  parsed_data: ParsedResume;
  ocr_confidence: number | null;
}
