"use client";

import React, { useState, useEffect } from "react";
import { X, User, Mail, Phone, Calendar, Award, Briefcase, FileText, MessageSquare, Clock, GraduationCap, Link2 } from "lucide-react";
import { Candidate, CandidateStatus } from "../../types";
import { useNotes, useAddNote, useDeleteNote, useTimelineEvents } from "../../hooks/useNotes";
import { useUpdateCandidateStatus } from "../../hooks/useCandidates";
import { useCandidateStore } from "../../hooks/useCandidateStore";
import ResumeViewer from "./resume-viewer";
import NotesSection from "../notes/notes-section";
import ActivityTimeline from "../timeline/activity-timeline";

interface DetailsDrawerProps {
  candidateId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// Custom inline SVG icons to prevent lucide-react brand icon version conflicts
const Linkedin = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Github = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function DetailsDrawer({ candidateId, isOpen, onClose }: DetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<"resume" | "notes" | "timeline">("resume");
  const [candidate, setCandidate] = useState<Candidate | null>(null);

  // Queries & Mutations
  const { data: notesList = [], isLoading: isLoadingNotes } = useNotes(candidateId);
  const { data: eventsList = [], isLoading: isLoadingEvents } = useTimelineEvents(candidateId);
  const addNoteMutation = useAddNote();
  const deleteNoteMutation = useDeleteNote();
  const updateStatusMutation = useUpdateCandidateStatus();

  // Keep primary candidate data in local state and sync it with updates in primary list
  useEffect(() => {
    if (candidateId) {
      // Find candidate from primary store
      const match = useCandidateStore.getState().candidates.find((c: Candidate) => c.id === candidateId);
      if (match) {
        setCandidate(match);
      }
    }
  }, [candidateId, updateStatusMutation.isSuccess]);

  if (!isOpen || !candidateId) return null;

  const handleStatusChange = async (newStatus: CandidateStatus) => {
    if (candidate) {
      await updateStatusMutation.mutateAsync({
        id: candidate.id,
        status: newStatus,
        candidateName: candidate.name,
      });
      // Sync local status
      setCandidate({
        ...candidate,
        status: newStatus,
      });
    }
  };

  const handleAddNote = async (content: string, followupDate?: string) => {
    return addNoteMutation.mutateAsync({
      candidateId: candidateId,
      content,
      recruiterName: "Jane Doe (HR Lead)", // Standard default recruiter
      followupDate,
    });
  };

  const handleDeleteNote = async (noteId: string) => {
    return deleteNoteMutation.mutateAsync({
      noteId,
      candidateId: candidateId,
    });
  };

  const getStatusClasses = (status: CandidateStatus) => {
    switch (status) {
      case "selected":
        return "bg-green-50 text-green-700 border-green-200 focus:ring-green-100 hover:bg-green-100/50";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200 focus:ring-red-100 hover:bg-red-100/50";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-100 hover:bg-blue-100/50";
    }
  };

  const tabs = [
    { id: "resume", name: "Resume Viewer", icon: <FileText className="h-3.5 w-3.5" /> },
    { id: "notes", name: "Recruiter Notes", icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { id: "timeline", name: "Activity Timeline", icon: <Clock className="h-3.5 w-3.5" /> },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm p-0 animate-in fade-in duration-200">
      
      {/* Sliding Side sheet content */}
      <div className="w-full max-w-4xl bg-white h-full flex flex-col md:flex-row shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 focus:outline-none transition-all cursor-pointer shadow-sm"
          title="Close Panel"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* ========================================== */}
        {/* LEFT COLUMN: BASIC INFORMATION CARD PANEL */}
        {/* ========================================== */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/40 p-6 flex flex-col overflow-y-auto h-full justify-between">
          
          <div className="space-y-6">
            
            {/* Candidate Header Summary */}
            <div className="space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-base shadow-md shadow-blue-500/20">
                {candidate ? candidate.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() : "CV"}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">
                  {candidate ? candidate.name : "Anonymous Candidate"}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                  Trainer Profile
                </p>
              </div>
            </div>

            {/* Ingestion Status Badges */}
            <div className="relative">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Recruitment status
              </label>
              {candidate && (
                <div className="relative">
                  <select
                    value={candidate.status}
                    onChange={(e) => handleStatusChange(e.target.value as CandidateStatus)}
                    className={`appearance-none w-full border rounded-xl py-2 px-3 pr-8 text-xs font-bold uppercase tracking-wider cursor-pointer outline-none transition-all focus:ring-2 border-slate-100 focus:outline-none ${getStatusClasses(
                      candidate.status
                    )}`}
                  >
                    <option value="in_progress">In Progress</option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                </div>
              )}
            </div>

            {/* Basic Info Rows */}
            {candidate && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                
                {/* Email Address */}
                <div className="flex items-start gap-2.5 overflow-hidden">
                  <Mail className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                    <p className="text-xs font-semibold text-slate-700 truncate" title={candidate.email}>
                      {candidate.email}
                    </p>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                    <p className="text-xs font-semibold text-slate-700">{candidate.phone}</p>
                  </div>
                </div>

                {/* Uploaded Date */}
                <div className="flex items-start gap-2.5">
                  <Calendar className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ingestion Date</p>
                    <p className="text-xs font-semibold text-slate-700">
                      {new Date(candidate.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* Social profiles */}
            {candidate && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Social profiles</p>
                <div className="flex gap-2">
                  
                  {candidate.linkedin_url ? (
                    <a
                      href={candidate.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-600 hover:bg-blue-50/30 hover:border-blue-300 transition-all shadow-sm"
                      title="LinkedIn Profile"
                    >
                      <Linkedin className="h-4.5 w-4.5" />
                    </a>
                  ) : (
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-dashed border-slate-200 text-slate-300" title="No LinkedIn found">
                      <Linkedin className="h-4.5 w-4.5" />
                    </div>
                  )}

                  {candidate.github_url ? (
                    <a
                      href={candidate.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                      title="GitHub Profile"
                    >
                      <Github className="h-4.5 w-4.5" />
                    </a>
                  ) : (
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-dashed border-slate-200 text-slate-300" title="No GitHub found">
                      <Github className="h-4.5 w-4.5" />
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>

          {/* SYSTEM ID AUDIT */}
          {candidate && (
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-normal pt-6 mt-6 border-t border-slate-100">
              SYS INTEGRATION ID<br />
              <span className="font-mono text-[9px] text-slate-500 font-medium normal-case tracking-normal">
                {candidate.id}
              </span>
            </div>
          )}

        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: INTERACTIVE TABS WORKSPACE */}
        {/* ========================================== */}
        <div className="flex-1 h-full flex flex-col min-w-0">
          
          {/* Glassmorphic Tabs Headers bar */}
          <div className="bg-white border-b border-slate-100 px-6 pt-4 flex items-center justify-between">
            <div className="flex gap-4">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 pb-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive 
                        ? "border-blue-600 text-blue-600" 
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabs Panels Container */}
          <div className="flex-1 overflow-y-auto p-6 min-w-0">
            
            {/* PDF Viewer Tab */}
            {activeTab === "resume" && candidate && (
              <div className="h-full animate-in fade-in duration-200">
                <ResumeViewer candidateName={candidate.name} />
              </div>
            )}

            {/* Recruiter Notes Tab */}
            {activeTab === "notes" && (
              <div className="animate-in fade-in duration-200">
                <NotesSection
                  notes={notesList}
                  isLoading={isLoadingNotes}
                  onAddNote={handleAddNote}
                  onDeleteNote={handleDeleteNote}
                />
              </div>
            )}

            {/* Activity Timelines Tab */}
            {activeTab === "timeline" && (
              <div className="animate-in fade-in duration-200">
                <ActivityTimeline events={eventsList} isLoading={isLoadingEvents} />
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
