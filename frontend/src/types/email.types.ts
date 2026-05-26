export interface CandidateEmail {
  id: string;
  candidate_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  template_type?: string;
  email_status: "sent" | "failed" | "pending";
  sent_by?: string;
  sent_at: string;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  template_name: string;
  template_key: string;
  subject: string;
  html_content: string;
}

export interface EmailSendPayload {
  candidate_id: string;
  template_type: string;
  custom_subject?: string;
  custom_body?: string;
  variables?: Record<string, any>;
}
