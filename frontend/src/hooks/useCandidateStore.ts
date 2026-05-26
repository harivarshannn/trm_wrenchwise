import { create } from "zustand";
import { Candidate, CandidateStatus, ParsedResume } from "../types";
import { MOCK_CANDIDATES } from "../constants";

interface CandidateState {
  candidates: Candidate[];
  addCandidate: (candidate: Candidate) => void;
  addParsedCandidate: (parsed: ParsedResume) => Candidate;
  updateCandidateStatus: (id: string, status: CandidateStatus) => void;
  updateCandidate: (id: string, updated: Partial<Candidate>) => void;
  deleteCandidate: (id: string) => void;
}

export const useCandidateStore = create<CandidateState>((set, get) => ({
  candidates: MOCK_CANDIDATES,
  
  addCandidate: (candidate) =>
    set((state) => ({ candidates: [candidate, ...state.candidates] })),

  addParsedCandidate: (parsed) => {
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `cand_${Date.now()}`;
    const newCandidate: Candidate = {
      id,
      name: parsed.name || "Anonymous Candidate",
      email: parsed.email || "no-email@example.com",
      phone: parsed.phone || "N/A",
      linkedin_url: parsed.linkedin_url || "",
      github_url: parsed.github_url || "",
      status: "in_progress",
      skills: parsed.skills || [],
      education: parsed.education || [],
      experience: parsed.experience || [],
      certifications: parsed.certifications || [],
      created_at: new Date().toISOString(),
    };
    
    get().addCandidate(newCandidate);
    return newCandidate;
  },

  updateCandidateStatus: (id, status) =>
    set((state) => ({
      candidates: state.candidates.map((cand) =>
        cand.id === id ? { ...cand, status } : cand
      ),
    })),

  updateCandidate: (id, updated) =>
    set((state) => ({
      candidates: state.candidates.map((cand) =>
        cand.id === id ? { ...cand, ...updated } : cand
      ),
    })),

  deleteCandidate: (id) =>
    set((state) => ({
      candidates: state.candidates.filter((cand) => cand.id !== id),
    })),
}));
