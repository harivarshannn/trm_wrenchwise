import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobService } from "../services/job.service";
import { JobOpening } from "../types";

export const useJobs = () => {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: () => jobService.getJobs(),
    staleTime: 5000,
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (job: { title: string; description?: string }) => jobService.createJob(job),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updated }: { id: string; updated: Partial<JobOpening> }) =>
      jobService.updateJob(id, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobService.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      // Invalidate candidates too since some candidate relations might change
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
  });
};
