"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Mail, User, Clock, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { CandidateEmail } from "../../types/email.types";

interface EmailCardProps {
  email: CandidateEmail;
}

export default function EmailCard({ email }: EmailCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusBadge = (status: CandidateEmail["email_status"]) => {
    switch (status) {
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 uppercase tracking-wide">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span>Sent</span>
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 uppercase tracking-wide">
            <AlertTriangle className="h-3 w-3 text-red-600" />
            <span>Failed</span>
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wide animate-pulse">
            <HelpCircle className="h-3 w-3 text-amber-600" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const getTemplateLabel = (key?: string) => {
    if (!key) return "Custom Outbox";
    return key
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="group rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 overflow-hidden">
      
      {/* Card Header summary (Clickable to collapse/expand) */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-4 p-4 cursor-pointer select-none"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 flex-shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
            <Mail className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-800 truncate pr-4" title={email.subject}>
              {email.subject}
            </h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-400 mt-1">
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3 text-slate-400" />
                <span>{email.sent_by || "Jane Doe (HR Lead)"}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" />
                <span>
                  {new Date(email.sent_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </span>
              <span className="rounded-lg bg-slate-50 border border-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                {getTemplateLabel(email.template_type)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {getStatusBadge(email.email_status)}
          <button className="text-slate-400 hover:text-slate-700 transition-colors">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Rendered Body content */}
      {isOpen && (
        <div className="border-t border-slate-50 bg-slate-50/20 px-6 py-4 animate-in slide-in-from-top-2 duration-200">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Recipient: <span className="text-slate-600 lowercase tracking-normal font-mono font-medium">{email.recipient_email}</span>
          </div>
          <div
            className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 leading-relaxed overflow-x-auto shadow-inner prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: email.body }}
          />
        </div>
      )}

    </div>
  );
}
