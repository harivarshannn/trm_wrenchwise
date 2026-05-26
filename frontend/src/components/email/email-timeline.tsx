"use client";

import React from "react";
import { Mail, MessageSquare, AlertCircle } from "lucide-react";
import { useCandidateEmails } from "../../hooks/useEmails";
import EmailCard from "./email-card";

interface EmailTimelineProps {
  candidateId: string;
}

export default function EmailTimeline({ candidateId }: EmailTimelineProps) {
  const { data: emails = [], isLoading, isError } = useCandidateEmails(candidateId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50/20 p-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-200" />
              <div className="space-y-2">
                <div className="h-3 w-48 bg-slate-200 rounded" />
                <div className="h-2 w-32 bg-slate-200 rounded" />
              </div>
            </div>
            <div className="h-6 w-16 bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-xs font-semibold text-red-700 shadow-sm">
        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
        <span>Failed to sync communications records from backend server.</span>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="text-center py-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/20">
        <Mail className="h-8 w-8 mx-auto text-slate-300 mb-2" />
        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide">No emails sent yet</h5>
        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto mt-1">
          Initiate conversations, schedule interviews, or extend congratulations to this candidate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {emails.map((email) => (
        <EmailCard key={email.id} email={email} />
      ))}
    </div>
  );
}
