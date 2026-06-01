"use client";

import React, { useState } from "react";
import { AlertCircle, Clock, Calendar, X, AlertTriangle } from "lucide-react";

interface RejectionModalProps {
  isOpen: boolean;
  candidateName: string;
  onConfirm: (data: {
    rejection_reason: string;
    rejection_snooze_until: string | null;
  }) => void;
  onCancel: () => void;
}

type SnoozeOption = "none" | "1_week" | "1_month" | "3_months" | "custom";

export default function RejectionModal({
  isOpen,
  candidateName,
  onConfirm,
  onCancel,
}: RejectionModalProps) {
  const [reason, setReason] = useState("");
  const [snoozeOption, setSnoozeOption] = useState<SnoozeOption>("none");
  const [customDate, setCustomDate] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const calculateSnoozeDate = (option: SnoozeOption): string | null => {
    const now = new Date();
    switch (option) {
      case "1_week":
        now.setDate(now.getDate() + 7);
        return now.toISOString();
      case "1_month":
        now.setMonth(now.getMonth() + 1);
        return now.toISOString();
      case "3_months":
        now.setMonth(now.getMonth() + 3);
        return now.toISOString();
      case "custom":
        if (!customDate) return null;
        return new Date(customDate).toISOString();
      default:
        return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please specify a reason for rejection.");
      return;
    }
    if (snoozeOption === "custom" && !customDate) {
      setError("Please pick a valid snooze expiration date.");
      return;
    }

    const snoozeDate = calculateSnoozeDate(snoozeOption);
    setError("");
    onConfirm({
      rejection_reason: reason.trim(),
      rejection_snooze_until: snoozeDate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Section */}
        <div className="bg-red-50 p-6 flex items-start gap-4 border-b border-red-100 relative">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-sm">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 leading-tight">Reject Candidate Profile</h3>
            <p className="text-xs text-red-700/80 font-medium leading-relaxed mt-1">
              Adding rejection reason and availability snoozes for {candidateName}.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-red-100/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 font-sans">
          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3.5 text-xs text-red-700 font-semibold">
              {error}
            </div>
          )}

          {/* Rejection Reason */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-slate-400" />
              <span>Reason for Rejection</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Under active contract; currently unable to join"
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 shadow-xs resize-none"
            />
          </div>

          {/* Temporary / Snooze Availability */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>Availability Snooze (Re-evaluate later?)</span>
            </label>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setSnoozeOption("none")}
                className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition-all ${
                  snoozeOption === "none"
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                No Snooze (Permanent)
              </button>
              <button
                type="button"
                onClick={() => setSnoozeOption("1_week")}
                className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition-all ${
                  snoozeOption === "1_week"
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Snooze 1 Week
              </button>
              <button
                type="button"
                onClick={() => setSnoozeOption("1_month")}
                className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition-all ${
                  snoozeOption === "1_month"
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Snooze 1 Month
              </button>
              <button
                type="button"
                onClick={() => setSnoozeOption("custom")}
                className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition-all ${
                  snoozeOption === "custom"
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Custom Snooze Date
              </button>
            </div>

            {/* Custom Date Input */}
            {snoozeOption === "custom" && (
              <div className="mt-3 animate-in slide-in-from-top-2 duration-150">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <span>Snooze Re-evaluation Date</span>
                </label>
                <input
                  type="date"
                  value={customDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-4 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 shadow-xs"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white uppercase tracking-wider shadow-md shadow-red-500/10 hover:bg-red-700 transition-all cursor-pointer"
            >
              Confirm Rejection
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
