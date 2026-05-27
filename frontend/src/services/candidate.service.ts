import { Candidate, CandidateStatus, ParsedResume } from "../types";
import { useCandidateStore } from "../hooks/useCandidateStore";
import { apiClient } from "./api";

// Simulates network latency for professional loading states
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type CandidateApiResponse = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  status: CandidateStatus;
  created_at: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

const mapApiCandidate = (
  candidate: CandidateApiResponse,
  parsed?: Partial<ParsedResume>
): Candidate => ({
  id: candidate.id,
  name: candidate.name || "Anonymous Candidate",
  email: candidate.email || "",
  phone: candidate.phone || "",
  linkedin_url: candidate.linkedin_url || "",
  github_url: candidate.github_url || "",
  status: candidate.status,
  skills: parsed?.skills || [],
  education: parsed?.education || [],
  experience: parsed?.experience || [],
  certifications: parsed?.certifications || [],
  created_at: candidate.created_at,
});

export const candidateService = {
  getCandidates: async (filters?: {
    search?: string;
    status?: string;
    hasLinkedin?: boolean;
    hasGithub?: boolean;
  }): Promise<Candidate[]> => {
    try {
      const response = await apiClient.get<
        ApiResponse<{
          items: CandidateApiResponse[];
          pagination: { total: number; page: number; limit: number; total_pages: number };
        }>
      >("/api/candidates/search", {
        params: {
          q: filters?.search || undefined,
          status: filters?.status && filters.status !== "ALL" ? filters.status : undefined,
          has_linkedin: filters?.hasLinkedin || undefined,
          has_github: filters?.hasGithub || undefined,
          limit: 100,
        },
      });

      if (response.data.success) {
        const candidates = response.data.data.items.map((candidate) => mapApiCandidate(candidate));
        useCandidateStore.setState({ candidates });
        return candidates;
      }
    } catch (error) {
      console.warn("Backend candidates fetch failed. Falling back to local state.", error);
    }

    await delay(300);
    const state = useCandidateStore.getState();
    let list = [...state.candidates];

    if (filters) {
      const { search, status, hasLinkedin, hasGithub } = filters;
      if (search) {
        const query = search.toLowerCase().trim();
        list = list.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.email.toLowerCase().includes(query) ||
            c.phone.includes(query) ||
            c.skills.some((s) => s.toLowerCase().includes(query))
        );
      }
      if (status && status !== "ALL") {
        list = list.filter((c) => c.status === status);
      }
      if (hasLinkedin) {
        list = list.filter((c) => c.linkedin_url && c.linkedin_url.trim().length > 0);
      }
      if (hasGithub) {
        list = list.filter((c) => c.github_url && c.github_url.trim().length > 0);
      }
    }
    return list;
  },

  getCandidateById: async (id: string): Promise<Candidate | null> => {
    await delay(100);
    const state = useCandidateStore.getState();
    return state.candidates.find((c) => c.id === id) || null;
  },

  createCandidateFromParsedResume: async (
    parsed: ParsedResume,
    resumeText?: string
  ): Promise<Candidate> => {
    const response = await apiClient.post<ApiResponse<CandidateApiResponse>>("/api/candidates", {
      name: parsed.name || null,
      email: parsed.email || null,
      phone: parsed.phone || null,
      linkedin_url: parsed.linkedin_url || null,
      github_url: parsed.github_url || null,
      resume_text: resumeText || null,
    });

    if (!response.data.success) {
      throw new Error(response.data.message || "Candidate creation failed.");
    }

    return mapApiCandidate(response.data.data, parsed);
  },

  updateCandidateStatus: async (id: string, status: CandidateStatus): Promise<Candidate> => {
    try {
      const response = await apiClient.patch<ApiResponse<CandidateApiResponse>>(`/api/candidates/${id}/status`, {
        status,
      });

      if (response.data.success) {
        const updated = mapApiCandidate(response.data.data);
        useCandidateStore.getState().updateCandidate(id, updated);
        return updated;
      }
    } catch (error) {
      console.warn("Backend status update failed. Falling back to local state.", error);
    }

    await delay(200);
    const store = useCandidateStore.getState();
    store.updateCandidate(id, { status });
    const updated = store.candidates.find((c) => c.id === id);
    if (!updated) throw new Error("Candidate not found.");
    return updated;
  },

  deleteCandidate: async (id: string): Promise<string> => {
    try {
      await apiClient.delete(`/api/candidates/${id}`);
    } catch (error) {
      console.warn("Backend delete failed. Falling back to local state.", error);
    }

    await delay(200);
    const store = useCandidateStore.getState();
    store.deleteCandidate(id);
    return id;
  },

  checkDuplicate: async (email: string, linkedinUrl?: string): Promise<Candidate | null> => {
    try {
      const response = await apiClient.get<
        ApiResponse<{
          items: CandidateApiResponse[];
          pagination: { total: number; page: number; limit: number; total_pages: number };
        }>
      >("/api/candidates/search", {
        params: { q: email || linkedinUrl || undefined, limit: 20 },
      });

      if (response.data.success) {
        const match = response.data.data.items.find((candidate) => {
          const sameEmail =
            email && candidate.email?.toLowerCase().trim() === email.toLowerCase().trim();
          const sameLinkedin =
            linkedinUrl &&
            candidate.linkedin_url?.toLowerCase().trim() === linkedinUrl.toLowerCase().trim();
          return sameEmail || sameLinkedin;
        });
        if (match) return mapApiCandidate(match);
      }
    } catch (error) {
      console.warn("Backend duplicate check failed. Falling back to local state.", error);
    }

    await delay(300);
    const store = useCandidateStore.getState();
    
    // Check by email
    if (email) {
      const match = store.candidates.find((c) => c.email.toLowerCase().trim() === email.toLowerCase().trim());
      if (match) return match;
    }
    
    // Check by linkedin
    if (linkedinUrl) {
      const match = store.candidates.find(
        (c) =>
          c.linkedin_url &&
          c.linkedin_url.toLowerCase().trim() === linkedinUrl.toLowerCase().trim()
      );
      if (match) return match;
    }
    return null;
  },
};
