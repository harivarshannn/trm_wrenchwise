"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Dropzone from "../../components/upload/dropzone";
import ParsedCard from "../../components/upload/parsed-card";
import DuplicateModal from "../../components/modals/duplicate-modal";
import { useCandidateStore } from "../../hooks/useCandidateStore";
import { useCheckDuplicate } from "../../hooks/useCandidates";
import { ParsedResume, Candidate } from "../../types";
import { BrainCircuit, ArrowLeft, RotateCcw } from "lucide-react";

export default function UploadPage() {
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [pendingUploadData, setPendingUploadData] = useState<ParsedResume | null>(null);
  const [uploadedCandidateId, setUploadedCandidateId] = useState<string | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateCandidate, setDuplicateCandidate] = useState<Candidate | null>(null);

  const { addParsedCandidate, updateCandidate } = useCandidateStore();
  const checkDuplicateMutation = useCheckDuplicate();
  const router = useRouter();

  const triggerConfetti = async () => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.55 },
        colors: ["#2563eb", "#4f46e5", "#10b981", "#3b82f6"]
      });
    } catch (e) {
      console.warn("Confetti trigger skipped:", e);
    }
  };

  const processAddCandidate = (data: ParsedResume) => {
    const newCand = addParsedCandidate(data);
    setUploadedCandidateId(newCand.id);
    setParsedData(data);
    triggerConfetti();
  };

  const handleUploadSuccess = async (data: ParsedResume) => {
    // 1. Perform duplicate check (using React Query mutation layer)
    const email = data.email || "";
    const linkedin = data.linkedin_url || "";
    
    try {
      const existing = await checkDuplicateMutation.mutateAsync({ email, linkedinUrl: linkedin });
      if (existing) {
        // A duplicate candidate exists! Hold execution and trigger modal warning
        setDuplicateCandidate(existing);
        setPendingUploadData(data);
        setShowDuplicateModal(true);
      } else {
        // No duplicate found. Process ingestion normally
        processAddCandidate(data);
      }
    } catch (e) {
      console.error("Duplicate check failed, proceeding normally:", e);
      processAddCandidate(data);
    }
  };

  const handleUploadAnyway = () => {
    if (pendingUploadData) {
      processAddCandidate(pendingUploadData);
    }
    setShowDuplicateModal(false);
    setPendingUploadData(null);
    setDuplicateCandidate(null);
  };

  const handleViewExisting = () => {
    setShowDuplicateModal(false);
    setPendingUploadData(null);
    setDuplicateCandidate(null);
    // Route recruiter straight to Candidates board
    router.push("/candidates");
  };

  const handleCancelUpload = () => {
    setShowDuplicateModal(false);
    setPendingUploadData(null);
    setDuplicateCandidate(null);
    setParsedData(null);
    setUploadedCandidateId(null);
  };

  const handleSave = (updated: ParsedResume) => {
    if (uploadedCandidateId) {
      const mappedUpdate: Partial<Candidate> = {
        name: updated.name || "",
        email: updated.email || "",
        phone: updated.phone || "",
        linkedin_url: updated.linkedin_url || "",
        github_url: updated.github_url || "",
        skills: updated.skills,
        education: updated.education,
        experience: updated.experience,
        certifications: updated.certifications,
      };
      updateCandidate(uploadedCandidateId, mappedUpdate);
    }
    setParsedData(updated);
  };

  const handleDone = () => {
    setParsedData(null);
    setUploadedCandidateId(null);
    router.push("/candidates");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Trainer Intake</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Add resumes to train OCR scanners and feed parsed fields into the pipeline.
          </p>
        </div>

        {parsedData && (
          <button
            onClick={() => setParsedData(null)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Upload Another</span>
          </button>
        )}
      </div>

      {/* Main Workspace Frame */}
      <div className="flex flex-col items-center justify-center py-4">
        {!parsedData ? (
          <div className="w-full space-y-6">
            <div className="text-center max-w-md mx-auto mb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 shadow-sm">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">OCR Extraction Tunnel</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">
                Drag any trainer CV here. The backend scanner uses direct PDF text extractors and vision OCR fallback systems to index profiles.
              </p>
            </div>
            <Dropzone onUploadSuccess={handleUploadSuccess} />
          </div>
        ) : (
          <div className="w-full">
            <ParsedCard parsedData={parsedData} onDone={handleDone} onSave={handleSave} />
          </div>
        )}
      </div>

      {/* Duplicate detection popup alert */}
      {showDuplicateModal && duplicateCandidate && (
        <DuplicateModal
          isOpen={showDuplicateModal}
          existingCandidate={duplicateCandidate}
          onUploadAnyway={handleUploadAnyway}
          onViewExisting={handleViewExisting}
          onCancel={handleCancelUpload}
        />
      )}

    </div>
  );
}
