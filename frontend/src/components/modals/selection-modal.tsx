"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, DollarSign, Briefcase, Calendar, X, Loader2, AlertTriangle } from "lucide-react";
import { useJobs } from "../../hooks/useJobs";

interface SelectionModalProps {
  isOpen: boolean;
  candidateName: string;
  defaultRole: string;
  defaultJobOpeningId?: string | null;
  onConfirm: (data: {
    selection_salary_per_month: string;
    selection_role: string;
    selection_duration_months: number;
    job_opening_id: string;
  }) => void;
  onCancel: () => void;
}

export default function SelectionModal({
  isOpen,
  candidateName,
  defaultRole,
  defaultJobOpeningId,
  onConfirm,
  onCancel,
}: SelectionModalProps) {
  const { data: jobs = [], isLoading } = useJobs();
  const [salary, setSalary] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [duration, setDuration] = useState<number>(12);
  const [error, setError] = useState("");

  // Only keep active job openings for assignment
  const activeJobs = jobs.filter((j) => j.status === "active" || j.status === "Active");

  // Sync state when jobs load or default id is supplied
  useEffect(() => {
    if (activeJobs.length > 0) {
      if (defaultJobOpeningId && activeJobs.some(j => j.id === defaultJobOpeningId)) {
        setSelectedJobId(defaultJobOpeningId);
      } else {
        setSelectedJobId(activeJobs[0].id);
      }
    } else if (jobs.length > 0) {
      // Fallback to any job if no explicitly active jobs
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, defaultJobOpeningId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (activeJobs.length === 0 && jobs.length === 0) {
      setError("No job openings available. Please configure an active job opening in the Hiring Hub first.");
      return;
    }

    if (!selectedJobId) {
      setError("Please select an active job opening from the dropdown.");
      return;
    }

    if (!salary.trim()) {
      setError("Please specify the offered monthly salary.");
      return;
    }

    if (duration <= 0) {
      setError("Please specify a valid contract duration in months.");
      return;
    }

    const matchedJob = jobs.find((j) => j.id === selectedJobId);
    if (!matchedJob) {
      setError("Selected job opening is invalid.");
      return;
    }

    setError("");
    onConfirm({
      selection_salary_per_month: salary.trim(),
      selection_role: matchedJob.title, // Synchronizes offered role with selected Job Opening
      selection_duration_months: duration,
      job_opening_id: selectedJobId,
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
            <h3 className="text-base font-bold text-slate-800 leading-tight">Candidate Offer & Job Assignment</h3>
            <p className="text-xs text-green-700/80 font-medium leading-relaxed mt-1">
              Assign {candidateName} to an active Job Opening and enter the contract offer.
            </p>
          </div>
          <button
            onClick={onCancel}
            type="button"
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-green-100/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 font-sans">
          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3.5 text-xs text-red-700 font-semibold flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Assigned Job Opening Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Briefcase className="h-3 w-3 text-slate-400" />
              <span>Assigned Job Opening</span>
            </label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium py-2.5 px-4 bg-slate-50 rounded-xl border border-slate-100">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                <span>Loading active vacancies...</span>
              </div>
            ) : activeJobs.length === 0 ? (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700 font-semibold flex flex-col gap-1">
                <span>No active job openings available.</span>
                <span className="font-normal text-slate-500">Go to the Hiring Hub to activate or create a job posting first.</span>
              </div>
            ) : (
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-xs font-semibold text-slate-855 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-xs cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
              >
                {activeJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            )}
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
              disabled={isLoading || activeJobs.length === 0}
              className="flex-1 rounded-xl bg-green-600 py-2.5 text-xs font-bold text-white uppercase tracking-wider shadow-md shadow-green-500/10 hover:bg-green-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Selection
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
