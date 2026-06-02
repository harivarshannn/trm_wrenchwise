import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { candidateService } from "../services/candidate.service";
import { notesService } from "../services/notes.service";
import { Candidate, CandidateStatus } from "../types";

export const useCandidates = (filters?: {
  search?: string;
  status?: string;
  hasLinkedin?: boolean;
  hasGithub?: boolean;
  location?: string;
  skills?: string;
  engagement_mode?: string;
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
    mutationFn: async ({
      id,
      status,
      selection_salary_per_month,
      selection_role,
      selection_duration_months,
      rejection_reason,
      rejection_snooze_until,
    }: {
      id: string;
      status: CandidateStatus;
      selection_salary_per_month?: string;
      selection_role?: string;
      selection_duration_months?: number;
      rejection_reason?: string;
      rejection_snooze_until?: string | null;
    }) => {
      const oldCandidate = await candidateService.getCandidateById(id);
      const oldStatus = oldCandidate ? oldCandidate.status : "Unknown";
      
      const updated = await candidateService.updateCandidateStatus(id, status, {
        selection_salary_per_month,
        selection_role,
        selection_duration_months,
        rejection_reason,
        rejection_snooze_until,
      });
      
      // Auto-inject timeline event
      const statusLabels: Record<string, string> = {
        in_progress: "In Progress",
        selected: "Selected",
        rejected: "Rejected"
      };
      
      let customDetails = "";
      if (status === "selected") {
        customDetails = ` (Role: ${selection_role || "N/A"}, Salary: ${selection_salary_per_month || "N/A"}, Duration: ${selection_duration_months || 0}mo)`;
      } else if (status === "rejected") {
        customDetails = ` (Reason: ${rejection_reason || "N/A"}${rejection_snooze_until ? `, Snoozed until: ${new Date(rejection_snooze_until).toLocaleDateString()}` : ""})`;
      }

      await notesService.addEvent(
        id,
        "status_change",
        "Pipeline Stage Transition",
        `Candidate status shifted: ${statusLabels[oldStatus] || oldStatus} ➔ ${statusLabels[status]}${customDetails}`
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

export const useUpdateCandidate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updated }: { id: string; updated: Partial<Candidate> }) =>
      candidateService.updateCandidate(id, updated),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", variables.id] });
    },
  });
};
