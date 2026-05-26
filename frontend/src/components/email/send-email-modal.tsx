"use client";

import React, { useState, useEffect } from "react";
import { X, Send, Sparkles, AlertCircle, Info } from "lucide-react";
import { useEmailTemplates, useSendEmail } from "../../hooks/useEmails";
import RichTextEditor from "./rich-text-editor";
import { Candidate } from "../../types";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
}

export default function SendEmailModal({ isOpen, onClose, candidate }: SendEmailModalProps) {
  const { data: templates = [], isLoading: isLoadingTemplates } = useEmailTemplates();
  const sendEmailMutation = useSendEmail();

  const [selectedTemplateKey, setSelectedTemplateKey] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auto-fill template default details and replace placeholders when template is selected
  useEffect(() => {
    if (!selectedTemplateKey || templates.length === 0) return;

    const template = templates.find((t) => t.template_key === selectedTemplateKey);
    if (template) {
      setSubject(template.subject);
      
      // Local placeholder replacement logic for editor WYSIWYG convenience
      let processedContent = template.html_content;
      
      // Default to tomorrow at 10 AM if no interview date is selected
      const defaultDate = new Date(Date.now() + 1000 * 60 * 60 * 24);
      defaultDate.setHours(10, 0, 0, 0);

      const formattedDate = interviewDate 
        ? new Date(interviewDate).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })
        : defaultDate.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });

      const replacements: Record<string, string> = {
        candidate_name: candidate.name || "Candidate",
        recruiter_name: "Jane Doe (HR Lead)",
        company_name: "TRMS Recruitment",
        role_name: "Technical Trainer",
        interview_date: formattedDate
      };

      Object.entries(replacements).forEach(([key, val]) => {
        processedContent = processedContent.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), val);
      });

      setBody(processedContent);
    }
  }, [selectedTemplateKey, templates, candidate, interviewDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim() || !selectedTemplateKey) {
      setAlertMessage({ type: "error", text: "Please complete all required fields." });
      return;
    }

    setAlertMessage(null);
    try {
      // Package variables for backend parsing
      const variables: Record<string, any> = {
        candidate_name: candidate.name,
        recruiter_name: "Jane Doe (HR Lead)",
        company_name: "TRMS Recruitment",
        role_name: "Technical Trainer"
      };

      if (interviewDate) {
        variables.interview_date = new Date(interviewDate).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      }

      await sendEmailMutation.mutateAsync({
        candidate_id: candidate.id,
        template_type: selectedTemplateKey,
        custom_subject: subject,
        custom_body: body,
        variables
      });

      setAlertMessage({ type: "success", text: "Email dispatched successfully!" });
      setTimeout(() => {
        onClose();
        // Reset states
        setSelectedTemplateKey("");
        setSubject("");
        setBody("");
        setInterviewDate("");
        setAlertMessage(null);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Failed to dispatch email. Please verify backend state.";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail
            .map((d: any) => {
              const loc = d.loc ? d.loc.join(".") : "";
              return loc ? `${loc}: ${d.msg}` : d.msg;
            })
            .join(", ");
        } else if (typeof detail === "object") {
          errorMessage = JSON.stringify(detail);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setAlertMessage({
        type: "error",
        text: errorMessage
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Modal Dialog Body */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header bar */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <Sparkles className="h-4.5 w-4.5" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Send Recruiter Email
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-150 hover:text-slate-700 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Notification Alert Banner */}
          {alertMessage && (
            <div
              className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs font-semibold leading-relaxed animate-in slide-in-from-top-2 duration-200 ${
                alertMessage.type === "success"
                  ? "border-green-100 bg-green-50/50 text-green-800"
                  : "border-red-100 bg-red-50/50 text-red-800"
              }`}
            >
              <AlertCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                alertMessage.type === "success" ? "text-green-600" : "text-red-600"
              }`} />
              <span>{alertMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Recipient To Email (Readonly) */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Recipient To
              </label>
              <input
                type="text"
                readOnly
                value={`${candidate.name} <${candidate.email || "no-email@example.com"}>`}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold text-slate-500 outline-none cursor-not-allowed"
              />
            </div>

            {/* Template Dropdown Selection */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Email Template <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedTemplateKey}
                onChange={(e) => setSelectedTemplateKey(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer transition-all"
              >
                <option value="">-- Choose Template --</option>
                {templates.map((tmpl) => (
                  <option key={tmpl.template_key} value={tmpl.template_key}>
                    {tmpl.template_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Interview Invitation Timing Ingress */}
          {selectedTemplateKey === "interview_invitation" && (
            <div className="space-y-1 rounded-xl bg-indigo-50/40 border border-indigo-100/50 p-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-2">
                <Info className="h-3.5 w-3.5" />
                <span>Configure Interview Slot</span>
              </div>
              <input
                type="datetime-local"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
              />
            </div>
          )}

          {/* Subject Line */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Subject Line <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={255}
              placeholder="e.g. Schedule for technical screening call"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Custom Rich Text Message WYSIWYG Editor */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Message Content <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder="Load a template above, then customize the rendered HTML message freely inside this editor..."
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sendEmailMutation.isPending || !subject.trim() || !body.trim() || !selectedTemplateKey}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {sendEmailMutation.isPending ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  <span>Enqueuing...</span>
                </>
              ) : (
                <>
                  <span>Send Email</span>
                  <Send className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
