"use client";

import React, { useState } from "react";
import { Briefcase, Plus, Users, CheckCircle, Trash2, Calendar, FileText, X, AlertTriangle, Edit3, FolderClosed } from "lucide-react";
import { useJobs, useCreateJob, useDeleteJob, useUpdateJob } from "../../hooks/useJobs";
import { JobOpening } from "../../types";

export default function JobsPage() {
  const { data: jobs = [], isLoading, error } = useJobs();
  const createJobMutation = useCreateJob();
  const deleteJobMutation = useDeleteJob();
  const updateJobMutation = useUpdateJob();

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);
  
  // Form States
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [formError, setFormError] = useState("");

  // Edit States
  const [editingJob, setEditingJob] = useState<JobOpening | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError("Job title is required.");
      return;
    }
    setFormError("");
    try {
      await createJobMutation.mutateAsync({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
      });
      setNewTitle("");
      setNewDescription("");
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to create job opening.");
    }
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    if (!editTitle.trim()) {
      setFormError("Job title is required.");
      return;
    }
    setFormError("");
    try {
      await updateJobMutation.mutateAsync({
        id: editingJob.id,
        updated: {
          title: editTitle.trim(),
          description: editDescription.trim() || null,
        },
      });
      setEditingJob(null);
    } catch (err: any) {
      setFormError(err.message || "Failed to update job opening.");
    }
  };

  const handleCloseJob = async (job: JobOpening) => {
    try {
      await updateJobMutation.mutateAsync({
        id: job.id,
        updated: {
          status: job.status === "active" ? "closed" : "active",
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!isDeleteConfirmOpen) return;
    try {
      await deleteJobMutation.mutateAsync(isDeleteConfirmOpen);
      setIsDeleteConfirmOpen(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Summary Metrics calculations
  const activeJobsCount = jobs.filter((j) => j.status === "active").length;
  const closedJobsCount = jobs.filter((j) => j.status === "closed").length;
  const totalAppliedCandidates = jobs.reduce((acc, job) => acc + (job.total_candidates || 0), 0);
  const totalAcceptedCandidates = jobs.reduce((acc, job) => acc + (job.accepted_candidates || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-8 font-sans">
      
      {/* Top Header / Action Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-blue-600" />
            <span>Job Openings Hub</span>
          </h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">
            Manage open positions, candidates assignment pipelines, and conversion ratios.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Job Opening</span>
        </button>
      </div>

      {/* Global Analytics Overview Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        
        {/* Metric 1: Open Roles */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Postings</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">{activeJobsCount}</h3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        {/* Metric 2: Total Applied */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Applied Candidates</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">{totalAppliedCandidates}</h3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Metric 3: Accepted Offers */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accepted Offers</p>
            <h3 className="text-2xl font-black text-emerald-600 tracking-tight mt-1">{totalAcceptedCandidates}</h3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Metric 4: Closed Roles */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Archived Roles</p>
            <h3 className="text-2xl font-black text-slate-500 tracking-tight mt-1">{closedJobsCount}</h3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <FolderClosed className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* Main Jobs Listing Section */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-100 border-t-blue-500" />
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-3">Loading openings index...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-3xl border border-red-100 text-red-500 shadow-xs p-6">
          <AlertTriangle className="h-10 w-10 text-red-500 mb-2 animate-bounce" />
          <p className="text-sm font-bold text-slate-800">Connection Error</p>
          <p className="text-xs text-slate-400 text-center mt-1">Failed to communicate with jobs repository service. Please ensure API is online.</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-xs text-slate-400">
          <Briefcase className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Job Openings Found</h3>
          <p className="text-xs text-slate-400 text-center max-w-sm mt-1 leading-normal">
            To get started, create a new job role. Candidates can then be associated with it to build dynamic metric statistics.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-all cursor-pointer"
          >
            Create Your First Opening
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {jobs.map((job) => {
            const isActive = job.status === "active";
            const acceptedRate = job.total_candidates 
              ? Math.round(((job.accepted_candidates || 0) / job.total_candidates) * 100) 
              : 0;

            return (
              <div 
                key={job.id} 
                className={`rounded-3xl border bg-white p-6 shadow-xs relative flex flex-col justify-between transition-all duration-300 ${
                  isActive 
                    ? "border-slate-100 hover:shadow-lg hover:shadow-slate-100/50" 
                    : "border-slate-100 opacity-75 bg-slate-50/40"
                }`}
              >
                
                {/* Header Info */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-start">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      isActive 
                        ? "bg-blue-50/50 border-blue-100 text-blue-600" 
                        : "bg-slate-100 border-slate-200 text-slate-400"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-blue-500 animate-pulse" : "bg-slate-400"}`} />
                      {job.status}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setFormError("");
                          setEditingJob(job);
                          setEditTitle(job.title);
                          setEditDescription(job.description || "");
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                        title="Edit Job Details"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setIsDeleteConfirmOpen(job.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Job Opening"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800 tracking-tight leading-snug line-clamp-1">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      <span>Added {new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </p>
                  </div>

                  {job.description ? (
                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 bg-slate-50/40 p-2.5 rounded-xl border border-slate-50/50">
                      {job.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium italic leading-relaxed">
                      No descriptive criteria added for this vacancy.
                    </p>
                  )}
                </div>

                {/* Candidate Pipelines Metrics */}
                <div className="space-y-4 pt-4 border-t border-slate-100 mt-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100/50 flex flex-col justify-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Applied Index</p>
                      <p className="text-lg font-black text-slate-800 tracking-tight mt-0.5">{job.total_candidates || 0}</p>
                    </div>
                    <div className="bg-emerald-50/30 p-2.5 rounded-2xl border border-emerald-100/30 flex flex-col justify-center">
                      <p className="text-[9px] font-bold text-emerald-800/80 uppercase tracking-wider">Offer Accepted</p>
                      <p className="text-lg font-black text-emerald-600 tracking-tight mt-0.5">{job.accepted_candidates || 0}</p>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  {(job.total_candidates ?? 0) > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400 uppercase">Conversion rate</span>
                        <span className="text-slate-600">{acceptedRate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                          style={{ width: `${acceptedRate}%` }} 
                        />
                      </div>
                    </div>
                  )}

                  {/* Interactive Status toggle */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleCloseJob(job)}
                      className={`text-[10px] font-bold uppercase tracking-wider transition-colors bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer ${
                        isActive 
                          ? "text-slate-500 hover:bg-slate-100" 
                          : "text-blue-600 border-blue-100 hover:bg-blue-50/50"
                      }`}
                    >
                      {isActive ? "Close Posting" : "Activate Posting"}
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================== */}
      {/* ADD JOB OPENING FORM MODAL */}
      {/* ========================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header Section */}
            <div className="bg-blue-50 p-6 flex items-start gap-4 border-b border-blue-100 relative">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 leading-tight">Create Job Opening</h3>
                <p className="text-xs text-blue-700/80 font-medium leading-relaxed mt-1">
                  Add a brand new hiring opening to target specific candidate qualifications.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-blue-100/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateJob} className="p-6 space-y-4 font-sans">
              {formError && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-3.5 text-xs text-red-700 font-semibold">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Job Opening Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Lead React Native Developer"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-xs"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description / Core Criteria (Optional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Summarize key framework skills, notice requirements, etc..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-xs resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createJobMutation.isPending}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white uppercase tracking-wider shadow-md shadow-blue-500/10 hover:bg-blue-700 transition-all cursor-pointer disabled:bg-blue-400"
                >
                  {createJobMutation.isPending ? "Creating..." : "Create Opening"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* EDIT JOB OPENING FORM MODAL */}
      {/* ========================================== */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header Section */}
            <div className="bg-blue-50 p-6 flex items-start gap-4 border-b border-blue-100 relative">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 leading-tight">Edit Job Opening</h3>
                <p className="text-xs text-blue-700/80 font-medium leading-relaxed mt-1">
                  Modify the details of your active hiring posting.
                </p>
              </div>
              <button
                onClick={() => setEditingJob(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-blue-100/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateJob} className="p-6 space-y-4 font-sans">
              {formError && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-3.5 text-xs text-red-700 font-semibold">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Job Opening Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Lead React Native Developer"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-xs"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description / Core Criteria (Optional)
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Summarize key framework skills, notice requirements, etc..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-xs resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateJobMutation.isPending}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white uppercase tracking-wider shadow-md shadow-blue-500/10 hover:bg-blue-700 transition-all cursor-pointer disabled:bg-blue-400"
                >
                  {updateJobMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================== */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 font-sans animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 flex-shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Delete Job Opening?</h3>
                <p className="text-[10px] text-slate-400 font-medium">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium mb-5">
              Deleting this job opening will remove all metadata tracking for it. Any candidates currently associated with it will remain on the board but their applied role assignment will be cleared.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteJobMutation.isPending}
                className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white uppercase tracking-wider hover:bg-red-700 transition-all cursor-pointer shadow-md shadow-red-500/10 disabled:bg-red-400"
              >
                {deleteJobMutation.isPending ? "Deleting..." : "Delete Posting"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
