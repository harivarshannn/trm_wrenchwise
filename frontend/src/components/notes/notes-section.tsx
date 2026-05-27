"use client";

import React, { useState } from "react";
import { MessageSquare, Trash2, Send, Clock, AlertCircle, Calendar } from "lucide-react";
import { Note } from "../../types";

interface NotesSectionProps {
  notes: Note[];
  isLoading: boolean;
  onAddNote: (content: string, followupDate?: string) => Promise<Note>;
  onDeleteNote: (noteId: string) => Promise<string>;
}

export default function NotesSection({
  notes,
  isLoading,
  onAddNote,
  onDeleteNote,
}: NotesSectionProps) {
  const [newNote, setNewNote] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddNote(newNote, followupDate || undefined);
      setNewNote("");
      setFollowupDate("");
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await onDeleteNote(noteId);
      setNoteToDelete(null);
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Add Note Input Area */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Add Recruiter Feedback / Note
        </label>
        <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Type your notes here... (e.g. Technical evaluation results, screening notes, follow-up comments)"
            rows={3}
            maxLength={1000}
            className="w-full border-none bg-transparent px-3 py-1.5 text-xs text-slate-800 outline-none leading-relaxed resize-none"
          />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100/50 pt-2 px-3">
            
            {/* Follow-up Date Selector */}
            <div className="flex items-center gap-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Next Follow-up:
              </label>
              <input
                type="date"
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 focus:border-blue-500 focus:outline-none transition-colors cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 flex-1 sm:flex-none">
              <span className="text-[10px] font-semibold text-slate-400">
                {newNote.length}/1000 characters
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !newNote.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <span>Submit Note</span>
                <Send className="h-3 w-3" />
              </button>
            </div>

          </div>
        </div>
      </form>

      {/* 2. Notes Timeline */}
      <div className="space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-50 pb-3">
          <MessageSquare className="h-4 w-4 text-blue-500" />
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Notes Timeline ({notes.length})
          </h4>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50/20 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-200" />
                  <div className="space-y-1">
                    <div className="h-3 w-28 bg-slate-200 rounded" />
                    <div className="h-2.5 w-16 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="h-3 w-full bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : notes && notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note) => {
              const isDeleting = noteToDelete === note.id;
              
              return (
                <div
                  key={note.id}
                  className="group relative rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 animate-in fade-in duration-300"
                >
                  
                  {/* Notes Header Details */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
                        {getInitials(note.recruiterName)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-none">{note.recruiterName}</p>
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(note.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete Note Option */}
                    {!isDeleting && (
                      <button
                        onClick={() => setNoteToDelete(note.id)}
                        className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                        title="Delete note"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Notes Body content */}
                  {isDeleting ? (
                    <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] font-semibold text-red-700 leading-normal">
                          Are you sure you want to permanently delete this note? This action is irreversible.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 justify-end">
                        <button
                          onClick={() => setNoteToDelete(null)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="rounded-lg bg-red-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-red-700 cursor-pointer shadow-sm"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <p className="text-xs text-slate-600 leading-relaxed pl-1 whitespace-pre-line">
                        {note.content}
                      </p>
                      
                      {note.followup_date && (
                        <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-1.5 text-[10px] font-bold text-amber-800 shadow-sm leading-none mt-1 animate-in fade-in duration-200">
                          <Calendar className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                          <span>Follow-up Scheduled: {new Date(note.followup_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}</span>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/20">
            <MessageSquare className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide">No recruiter notes yet</h5>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto mt-1">
              Add technical evaluations, reference feedback, or general screening summaries above.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
