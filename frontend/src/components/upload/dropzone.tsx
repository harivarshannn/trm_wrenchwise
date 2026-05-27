"use client";

import React, { useState, useRef } from "react";
import type { AxiosError } from "axios";
import { UploadCloud, File, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { resumeApi } from "../../services/api";
import { ParsedResume } from "../../types";

interface DropzoneProps {
  onUploadSuccess: (data: ParsedResume) => void;
}

export default function Dropzone({ onUploadSuccess }: DropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
    "image/png",
    "image/jpeg",
    "image/jpg"
  ];
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): boolean => {
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|png|jpg|jpeg)$/i)) {
      setErrorMessage("Unsupported file type. Please upload a PDF, DOCX, PNG, or JPG file.");
      setUploadState("error");
      return false;
    }
    if (file.size > maxSizeBytes) {
      setErrorMessage("File exceeds 10MB limit. Please upload a smaller resume.");
      setUploadState("error");
      return false;
    }
    return true;
  };

  type ErrorDetailItem = { loc?: Array<string | number>; msg?: string };
  type ErrorResponse = AxiosError<{ detail?: string | ErrorDetailItem[] | Record<string, unknown> }>;

  const getFriendlyMessage = (err: unknown) => {
    const fallback = "Failed to upload or parse resume.";
    if (!err || typeof err !== "object") {
      return fallback;
    }

    const error = err as ErrorResponse;
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          const loc = item.loc ? item.loc.join(".") : "";
          return loc ? `${loc}: ${item.msg ?? "Validation error"}` : item.msg ?? "Validation error";
        })
        .join(", ");
    }
    if (detail && typeof detail === "object") {
      return JSON.stringify(detail);
    }
    if (typeof error.message === "string" && error.message.length > 0) {
      return error.message;
    }
    return fallback;
  };

  const handleUpload = async (file: File) => {
    setSelectedFile(file);
    setUploadState("uploading");
    setUploadProgress(10); // Start progress bar

    try {
      // Simulate rapid progress loading for better UX before backend responds
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressTimer);
            return prev;
          }
          return prev + 15;
        });
      }, 200);

      // Perform backend upload via service layer
      const response = await resumeApi.upload(file, (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Let standard loaders take over
          if (percentCompleted > 10) {
            setUploadProgress(percentCompleted);
          }
        }
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      if (response.success && response.parsed_data) {
        setUploadState("success");
        setTimeout(() => {
          onUploadSuccess(response.parsed_data);
        }, 600);
      } else {
        throw new Error("Invalid response schema from resume parser.");
      }
    } catch (err: unknown) {
      console.error("Resume upload error:", err);
      setUploadState("error");
      
      const error = err as ErrorResponse;
      const isNetworkError = error.message === "Network Error" || !error.response;
      let friendlyMessage = getFriendlyMessage(err);
      
      if (isNetworkError) {
        friendlyMessage = "FastAPI backend is offline or unreachable. Please start your backend server (e.g., run `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`) to activate the OCR extraction tunnel.";
      }
      
      setErrorMessage(friendlyMessage);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        handleUpload(file);
      }
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        handleUpload(file);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetDropzone = () => {
    setSelectedFile(null);
    setUploadState("idle");
    setUploadProgress(0);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {uploadState === "idle" && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={triggerFileInput}
          className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all duration-300 cursor-pointer ${
            isDragActive
              ? "border-blue-500 bg-blue-50/40 shadow-inner"
              : "border-slate-200 hover:border-blue-400 hover:bg-slate-50/40"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept=".pdf,.docx,.png,.jpg,.jpeg"
            className="hidden"
          />

          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-50 group-hover:text-blue-500 shadow-sm">
            <UploadCloud className="h-7 w-7" />
          </div>

          <p className="mb-1 text-sm font-semibold text-slate-800">
            Drag & drop trainer resume here, or <span className="text-blue-600 hover:text-blue-700">browse file</span>
          </p>
          <p className="text-xs text-slate-400 mb-6">
            Supports PDF, DOCX, PNG, or JPG (Max 10MB)
          </p>

          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 group-hover:border-blue-200 transition-colors"
          >
            Select Document
          </button>
        </div>
      )}

      {uploadState === "uploading" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-md">
          <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500 animate-spin">
            <RefreshCw className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Parsing Resume via OCR...</h3>
          <p className="text-xs text-slate-400 mb-6 truncate max-w-sm mx-auto">
            Extracting fields from <span className="font-semibold text-slate-500">{selectedFile?.name}</span>
          </p>

          {/* Progress Bar */}
          <div className="w-full max-w-xs mx-auto bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-blue-600 mt-2 block">{uploadProgress}% Complete</span>
        </div>
      )}

      {uploadState === "success" && (
        <div className="rounded-2xl border border-green-100 bg-green-50/20 p-8 text-center shadow-md">
          <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-sm font-semibold text-green-800">Resume Uploaded & Parsed!</h3>
          <p className="text-xs text-green-600/70 mb-4">
            Structured details successfully extracted. Processing profile...
          </p>
        </div>
      )}

      {uploadState === "error" && (
        <div className="rounded-2xl border border-red-100 bg-red-50/20 p-8 text-center shadow-md">
          <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="mb-1 text-sm font-semibold text-red-800">OCR Extraction Failed</h3>
          <p className="text-xs text-red-600/70 mb-6 leading-relaxed max-w-md mx-auto">
            {errorMessage}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={resetDropzone}
              className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors shadow-sm"
            >
              Try Again
            </button>
            <button
              onClick={resetDropzone}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors shadow-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
