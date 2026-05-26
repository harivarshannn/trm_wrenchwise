"use client";

import React from "react";
import { AlertTriangle, User, Calendar, Tag, ArrowRight, X } from "lucide-react";
import { Candidate } from "../../types";

interface DuplicateModalProps {
  isOpen: boolean;
  existingCandidate: Candidate;
  onViewExisting: () => void;
  onUploadAnyway: () => void;
  onCancel: () => void;
}

export default function DuplicateModal({
  isOpen,
  existingCandidate,
  onViewExisting,
  onUploadAnyway,
  onCancel,
}: DuplicateModalProps) {
  if (!isOpen) return null;

  const getStatusClasses = (status: Candidate["status"]) => {
    switch (status) {
      case "selected":
        return "bg-green-50 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const statusLabels: Record<string, string> = {
    in_progress: "In Progress",
    selected: "Selected",
    rejected: "Rejected",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Warning Bar */}
        <div className="bg-amber-50 p-6 flex items-start gap-4 border-b border-amber-100">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-sm animate-bounce">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 leading-tight">Duplicate Candidate Identified</h3>
            <p className="text-xs text-amber-700/80 font-medium leading-relaxed mt-1">
              A trainer profile with this exact email or LinkedIn account has already been registered in the database.
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-6 space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Existing Candidate Record</p>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
            
            {/* Candidate Name */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-100 text-slate-600 shadow-sm">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Candidate Name</p>
                <p className="text-xs font-bold text-slate-800">{existingCandidate.name}</p>
              </div>
            </div>

            {/* Candidate Status */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-100 text-slate-600 shadow-sm">
                <Tag className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Current Status</p>
                <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusClasses(
                  existingCandidate.status
                )}`}>
                  {statusLabels[existingCandidate.status] || existingCandidate.status}
                </span>
              </div>
            </div>

            {/* Ingestion Date */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-100 text-slate-600 shadow-sm">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Uploaded Date</p>
                <p className="text-xs font-semibold text-slate-700">
                  {new Date(existingCandidate.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Footnote Warning */}
        <div className="px-6 pb-2 text-[10px] font-semibold text-slate-400 leading-relaxed">
          Ingesting duplicate candidate entries can clutter recruitment pipelines, and compromise metrics. Double check existing notes before overriding.
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-50 bg-slate-50/50 px-6 py-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          
          <button
            onClick={onCancel}
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            Cancel Ingestion
          </button>

          <button
            onClick={onUploadAnyway}
            className="w-full sm:w-auto rounded-xl border border-slate-100 bg-slate-200/50 hover:bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors shadow-sm cursor-pointer"
          >
            Upload Anyway
          </button>

          <button
            onClick={onViewExisting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
          >
            <span>View Existing</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

        </div>

      </div>
    </div>
  );
}
