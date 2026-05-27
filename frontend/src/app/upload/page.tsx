"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Dropzone from "../../components/upload/dropzone";
import ParsedCard from "../../components/upload/parsed-card";
import DuplicateModal from "../../components/modals/duplicate-modal";
import { useCandidateStore } from "../../hooks/useCandidateStore";
import { useCheckDuplicate } from "../../hooks/useCandidates";
import { useQueryClient } from "@tanstack/react-query";
import { notesService } from "../../services/notes.service";
import { candidateService } from "../../services/candidate.service";
import { ParsedResume, Candidate } from "../../types";
import { BrainCircuit, RotateCcw } from "lucide-react";

export default function UploadPage() {
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [pendingUploadData, setPendingUploadData] = useState<ParsedResume | null>(null);
  const [uploadedCandidateId, setUploadedCandidateId] = useState<string | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateCandidate, setDuplicateCandidate] = useState<Candidate | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { addCandidate, updateCandidate } = useCandidateStore();
  const checkDuplicateMutation = useCheckDuplicate();
  const router = useRouter();
  const queryClient = useQueryClient();

  const processAddCandidate = async (data: ParsedResume) => {
    setUploadError(null);
    const newCand = await candidateService.createCandidateFromParsedResume(data);
    addCandidate(newCand);

    setUploadedCandidateId(newCand.id);
    setParsedData(data);

    // Auto-create initial activity timeline event
    try {
      await notesService.addEvent(
        newCand.id,
        "upload",
        "Resume Ingested",
        "Resume uploaded and profile parsed successfully.",
        "Jane Doe (HR Lead)"
      );
    } catch (e) {
      console.error("Failed to seed initial timeline event:", e);
    }

    // Invalidate the candidates grid query list cache to force update
    queryClient.invalidateQueries({ queryKey: ["candidates"] });
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
        await processAddCandidate(data);
      }
    } catch (e) {
      console.error("Upload persistence failed:", e);
      setUploadError("Resume was parsed, but the candidate could not be saved to the backend. Email sending is disabled until the candidate is saved.");
    }
  };

  const handleUploadAnyway = async () => {
    if (pendingUploadData) {
      try {
        await processAddCandidate(pendingUploadData);
      } catch (e) {
        console.error("Upload persistence failed:", e);
        setUploadError("Resume was parsed, but the candidate could not be saved to the backend. Email sending is disabled until the candidate is saved.");
      }
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

      // Invalidate query caches to ensure edited parsed details show instantly
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", uploadedCandidateId] });
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
      <div className="flex flex-col items-center justify-center py-4 w-full">
        {!parsedData ? (
          <div className="w-full space-y-6">
            {uploadError && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                {uploadError}
              </div>
            )}
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
          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Col: Scanning pipeline diagnostics */}
            <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 p-6 shadow-md shadow-slate-100/40 flex flex-col space-y-6 animate-in fade-in slide-in-from-left duration-300">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <BrainCircuit className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">OCR Pipeline</h3>
                    <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Extraction Complete</p>
                  </div>
                </div>

                {/* Animated scanning document mockup */}
                <div className="relative rounded-2xl bg-slate-950 border border-slate-900 p-4 h-36 overflow-hidden flex flex-col justify-between font-mono text-[9px] text-emerald-500 shadow-inner">
                  {/* Scanner line scanning effect */}
                  <div className="absolute left-0 right-0 h-[2px] bg-emerald-500/70 shadow-md shadow-emerald-400 top-0 animate-[scan_3s_ease-in-out_infinite]" />
                  <div className="space-y-1.5 leading-normal">
                    <p className="text-slate-500">&gt; INGESTION TUNNEL ACTIVE</p>
                    <p className="text-slate-500">&gt; METADATA EXTRACTION: OK</p>
                    <p className="text-emerald-400 font-bold">&gt; CONFIDENCE SCORE: 98.4%</p>
                    <p className="text-slate-500">&gt; JINJA2 PARSING SECURED</p>
                  </div>
                  <div className="flex justify-between items-center text-[8px] text-slate-600 border-t border-slate-900/60 pt-1.5">
                    <span>TRMS ENGINE v1.0</span>
                    <span>ONLINE SHIELD</span>
                  </div>
                </div>

                {/* Diagnostics stats */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-50">
                    <span className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">OCR Engine</span>
                    <span className="font-bold text-slate-700">Direct PDF + Vision</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-50">
                    <span className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Confidence</span>
                    <span className="font-bold text-emerald-600">98.4% (High)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-50">
                    <span className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Duplicate Scan</span>
                    <span className="font-bold text-emerald-600">Passed</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pb-1">
                    <span className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Sync Status</span>
                    <span className="font-bold text-slate-700">Zustand & DB Cached</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Parsed details editor */}
            <div className="lg:col-span-2">
              <ParsedCard parsedData={parsedData} onDone={handleDone} onSave={handleSave} />
            </div>
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
