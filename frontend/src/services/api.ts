import axios, { type AxiosProgressEvent } from "axios";
import { UploadResumeResponse } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Accept": "application/json",
  },
});

export const resumeApi = {
  upload: async (
    file: File,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
  ): Promise<UploadResumeResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<UploadResumeResponse>(
      "/api/resume/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress,
      }
    );

    return response.data;
  },
};
export default apiClient;
