import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { candidateService } from "../services/candidate.service";
import { notesService } from "../services/notes.service";
import { CandidateStatus, Candidate } from "../types";

export const useCandidates = (filters?: {
  search?: string;
  status?: string;
  hasLinkedin?: boolean;
  hasGithub?: boolean;
}) => {
  return useQuery({
    queryKey: ["candidates", filters],
    queryFn: () => candidateService.getCandidates(filters),
    staleTime: 0, // Force instant query refresh to sync with intake screen edits
  });
};

export const useCandidate = (id: string | null) => {
  return useQuery({
    queryKey: ["candidate", id],
    queryFn: () => (id ? candidateService.getCandidateById(id) : null),
    enabled: !!id,
  });
};

export const useUpdateCandidateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, candidateName }: { id: string; status: CandidateStatus; candidateName: string }) => {
      const oldCandidate = await candidateService.getCandidateById(id);
      const oldStatus = oldCandidate ? oldCandidate.status : "Unknown";
      
      const updated = await candidateService.updateCandidateStatus(id, status);
      
      // Auto-inject timeline event
      const statusLabels: Record<string, string> = {
        in_progress: "In Progress",
        selected: "Selected",
        rejected: "Rejected"
      };
      
      await notesService.addEvent(
        id,
        "status_change",
        "Pipeline Stage Transition",
        `Candidate status shifted: ${statusLabels[oldStatus] || oldStatus} ➔ ${statusLabels[status]}`
      );
      
      return updated;
    },
    onSuccess: (data, variables) => {
      // Invalidate both candidate lists and single candidate details
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["timeline", variables.id] });
    },
  });
};

export const useDeleteCandidate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => candidateService.deleteCandidate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
  });
};

export const useCheckDuplicate = () => {
  return useMutation({
    mutationFn: ({ email, linkedinUrl }: { email: string; linkedinUrl?: string }) =>
      candidateService.checkDuplicate(email, linkedinUrl),
  });
};
