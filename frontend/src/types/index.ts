export type CandidateStatus = "in_progress" | "selected" | "rejected";

export interface EducationItem {
  degree: string | null;
  level: "UG" | "PG" | null;
}

export interface ExperienceItem {
  company: string | null;
  role: string | null;
  years: string | null;
  start_date?: string | null;
  end_date?: string | null;
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
  location?: string | null;
  engagement_mode?: string | null;
  salary_expectations?: string | null;
  availability?: string | null;
  resume_url?: string | null;
}

export interface ParsedResume {
  name: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  education: EducationItem[];
  experience: ExperienceItem[];
  certifications: string[];
  projects: string[];
  linkedin_url: string | null;
  github_url: string | null;
  location?: string | null;
  engagement_mode?: string | null;
  salary_expectations?: string | null;
  availability?: string | null;
  resume_url?: string | null;
}

export interface UploadResumeResponse {
  success: boolean;
  raw_text: string;
  parsed_data: ParsedResume;
  ocr_confidence: number | null;
}

export interface Note {
  id: string;
  candidateId: string;
  recruiterName: string;
  content: string;
  created_at: string; // ISO date string
  followup_date?: string; // Optional follow-up date string
}

export interface ReminderItem {
  note_id: string;
  candidate_id: string;
  candidate_name?: string | null;
  candidate_email?: string | null;
  candidate_status?: string | null;
  note: string;
  followup_date: string;
  created_by?: string | null;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  candidateId: string;
  type: "status_change" | "note_added" | "upload" | "duplicate_warning";
  title: string;
  description: string;
  recruiterName: string;
  created_at: string; // ISO date string
}

export * from "./email.types";
