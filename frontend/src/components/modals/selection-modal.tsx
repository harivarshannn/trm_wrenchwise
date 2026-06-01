"use client";

import React, { useState } from "react";
import { CheckCircle2, DollarSign, Briefcase, Calendar, X } from "lucide-react";

interface SelectionModalProps {
  isOpen: boolean;
  candidateName: string;
  defaultRole: string;
  onConfirm: (data: {
    selection_salary_per_month: string;
    selection_role: string;
    selection_duration_months: number;
  }) => void;
  onCancel: () => void;
}

export default function SelectionModal({
  isOpen,
  candidateName,
  defaultRole,
  onConfirm,
  onCancel,
}: SelectionModalProps) {
  const [salary, setSalary] = useState("");
  const [role, setRole] = useState(defaultRole || "");
  const [duration, setDuration] = useState<number>(12);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salary.trim()) {
      setError("Please specify the offered monthly salary.");
      return;
    }
    if (!role.trim()) {
      setError("Please specify the offer role or job title.");
      return;
    }
    if (duration <= 0) {
      setError("Please specify a valid contract duration in months.");
      return;
    }

    setError("");
    onConfirm({
      selection_salary_per_month: salary.trim(),
      selection_role: role.trim(),
      selection_duration_months: duration,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Section */}
        <div className="bg-green-50 p-6 flex items-start gap-4 border-b border-green-100 relative">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-600 shadow-sm">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 leading-tight">Select Candidate Offer Details</h3>
            <p className="text-xs text-green-700/80 font-medium leading-relaxed mt-1">
              Adding evaluation metrics for {candidateName} to issue the contract.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-green-100/50 transition-colors"
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

          {/* Offer Role */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Briefcase className="h-3 w-3 text-slate-400" />
              <span>Offer Role / Job Title</span>
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Backend Architect"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-xs"
            />
          </div>

          {/* Salary per Month */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <DollarSign className="h-3 w-3 text-slate-400" />
              <span>Monthly Offered Salary</span>
            </label>
            <input
              type="text"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="e.g. $6,000 or 50,000 INR"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-xs"
            />
          </div>

          {/* Working Duration */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span>Contract Working Duration (Months)</span>
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              min="1"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-xs"
            />
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
              className="flex-1 rounded-xl bg-green-600 py-2.5 text-xs font-bold text-white uppercase tracking-wider shadow-md shadow-green-500/10 hover:bg-green-700 transition-all cursor-pointer"
            >
              Confirm Selection
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
