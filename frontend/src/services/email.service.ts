import { apiClient } from "./api";
import { CandidateEmail, EmailTemplate, EmailSendPayload } from "../types/email.types";

const EMAILS_STORAGE_KEY = "trms_candidate_emails";

// Seeded local template fallbacks for sandbox testing when backend is offline
const LOCAL_TEMPLATES: EmailTemplate[] = [
  {
    id: "temp_1",
    template_name: "Initial Outreach",
    template_key: "initial_outreach",
    subject: "Career Opportunity: Technical Trainer Role",
    html_content: `Dear {{ candidate_name }},

I hope this email finds you well.

We recently reviewed your profile and were highly impressed by your background. We are currently looking for a talented technical trainer to join our team for the {{ role_name }} role at {{ company_name }}.

Please let us know your availability for a brief introductory call sometime this week.

Best regards,
{{ recruiter_name }}
Recruitment Team`
  },
  {
    id: "temp_2",
    template_name: "Interview Invitation",
    template_key: "interview_invitation",
    subject: "Technical Interview Invitation: Trainer Position",
    html_content: `Dear {{ candidate_name }},

Thank you for your interest in joining {{ company_name }} as a trainer.

We are pleased to invite you for a technical interview to discuss the {{ role_name }} position.

Your interview is scheduled for:
{{ interview_date }}

Please reply to this email to confirm if this timing works for you.

Warm regards,
{{ recruiter_name }}
Recruitment Team`
  },
  {
    id: "temp_3",
    template_name: "Follow Up",
    template_key: "follow_up",
    subject: "Following up on your Application Status",
    html_content: `Dear {{ candidate_name }},

I hope you are doing well.

We are following up on your application progress for the {{ role_name }} trainer opportunity at {{ company_name }}.

We will share more concrete updates with you shortly.

Best regards,
{{ recruiter_name }}
Recruitment Team`
  },
  {
    id: "temp_4",
    template_name: "Application Rejected",
    template_key: "rejection",
    subject: "Update on your Trainer Application",
    html_content: `Dear {{ candidate_name }},

Thank you for taking the time to discuss the {{ role_name }} trainer opportunity with us at {{ company_name }}.

We appreciated learning more about your technical expertise. After careful consideration, we have decided to move forward with other candidates whose experiences align more closely with our immediate requirements.

We wish you the absolute best in your future career endeavors.

Sincerely,
{{ recruiter_name }}
Recruitment Team`
  },
  {
    id: "temp_5",
    template_name: "Selection Offer",
    template_key: "selection",
    subject: "Congratulations! Offer for Trainer Position",
    html_content: `Dear {{ candidate_name }},

Congratulations!

We are absolutely thrilled to inform you that you have been selected for the {{ role_name }} trainer role at {{ company_name }}.

Our team was highly impressed by your technical proficiency and teaching methodology. We will send over the formal offer letter and onboarding packet shortly.

We are very excited to welcome you to the team!

Warmest regards,
{{ recruiter_name }}
Recruitment Team`
  }
];

const getStoredLocalEmails = (): CandidateEmail[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(EMAILS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const emailService = {
  getTemplates: async (): Promise<EmailTemplate[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: EmailTemplate[] }>("/api/email/templates");
      if (response.data && response.data.success) {
        return response.data.data;
      }
    } catch (e) {
      console.warn("Backend API templates fetch failed. Falling back to local templates.", e);
    }
    return LOCAL_TEMPLATES;
  },

  getCandidateEmails: async (candidateId: string): Promise<CandidateEmail[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: CandidateEmail[] }>(`/api/candidates/${candidateId}/emails`);
      if (response.data && response.data.success) {
        return response.data.data;
      }
    } catch (e) {
      console.warn("Backend API emails fetch failed. Falling back to localStorage sandbox.", e);
    }
    
    // Fallback sandbox
    return getStoredLocalEmails().filter(email => email.candidate_id === candidateId);
  },

  sendEmail: async (payload: EmailSendPayload): Promise<CandidateEmail> => {
    try {
      const response = await apiClient.post<{ success: boolean; data: CandidateEmail }>("/api/emails/send", payload);
      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error("Email API did not confirm delivery queueing.");
    } catch (e) {
      console.warn("Backend API dispatch failed.", e);
      throw e;
    }
  }
};
