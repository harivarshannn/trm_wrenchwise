import { Candidate, CandidateStatus, ParsedResume } from "../types";
import { useCandidateStore } from "../hooks/useCandidateStore";

// Simulates network latency for professional loading states
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const candidateService = {
  getCandidates: async (filters?: {
    search?: string;
    status?: string;
    hasLinkedin?: boolean;
    hasGithub?: boolean;
  }): Promise<Candidate[]> => {
    await delay(300); // Simulate API latency
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

  updateCandidateStatus: async (id: string, status: CandidateStatus): Promise<Candidate> => {
    await delay(200);
    const store = useCandidateStore.getState();
    store.updateCandidate(id, { status });
    const updated = store.candidates.find((c) => c.id === id);
    if (!updated) throw new Error("Candidate not found.");
    return updated;
  },

  deleteCandidate: async (id: string): Promise<string> => {
    await delay(200);
    const store = useCandidateStore.getState();
    store.deleteCandidate(id);
    return id;
  },

  checkDuplicate: async (email: string, linkedinUrl?: string): Promise<Candidate | null> => {
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
