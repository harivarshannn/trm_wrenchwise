import { JobOpening } from "../types";
import { apiClient } from "./api";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

// Simulates network latency for professional loading states
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const jobService = {
  getJobs: async (): Promise<JobOpening[]> => {
    try {
      const response = await apiClient.get<ApiResponse<JobOpening[]>>("/api/jobs");
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error("Backend jobs fetch failed.", error);
    }
    await delay(300);
    return [];
  },

  createJob: async (job: { title: string; description?: string }): Promise<JobOpening> => {
    const response = await apiClient.post<ApiResponse<JobOpening>>("/api/jobs", job);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to create job opening.");
  },

  updateJob: async (id: string, updated: Partial<JobOpening>): Promise<JobOpening> => {
    const response = await apiClient.patch<ApiResponse<JobOpening>>(`/api/jobs/${id}`, updated);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to update job opening.");
  },

  deleteJob: async (id: string): Promise<string> => {
    const response = await apiClient.delete<ApiResponse<{ id: string }>>(`/api/jobs/${id}`);
    if (response.data.success) {
      return id;
    }
    throw new Error(response.data.message || "Failed to delete job opening.");
  },
};
