import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { emailService } from "../services/email.service";
import { EmailSendPayload } from "../types/email.types";

export const useEmailTemplates = () => {
  return useQuery({
    queryKey: ["emailTemplates"],
    queryFn: () => emailService.getTemplates(),
    staleTime: 1000 * 60 * 15, // Cache templates list for 15 minutes
  });
};

export const useCandidateEmails = (candidateId: string | null) => {
  return useQuery({
    queryKey: ["candidateEmails", candidateId],
    queryFn: () => (candidateId ? emailService.getCandidateEmails(candidateId) : []),
    enabled: !!candidateId,
  });
};

export const useSendEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EmailSendPayload) => emailService.sendEmail(payload),
    onSuccess: (data, variables) => {
      // Invalidate query caches to trigger instant UI refresh in email timeline and candidate timeline
      queryClient.invalidateQueries({ queryKey: ["candidateEmails", variables.candidate_id] });
      queryClient.invalidateQueries({ queryKey: ["timeline", variables.candidate_id] });
    },
  });
};
