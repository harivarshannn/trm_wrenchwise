"use client";

import React from "react";
import Link from "next/link";
import { CalendarClock, ArrowUpRight, User } from "lucide-react";
import { useReminders } from "../../hooks/useNotes";

export default function RemindersPage() {
  const { data: reminders = [], isLoading } = useReminders(30);

  const getStatusClasses = (status?: string | null) => {
    switch (status) {
      case "selected":
        return "bg-green-50 text-green-700 border-green-100";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-blue-50 text-blue-700 border-blue-100";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Reminders</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Upcoming follow-ups from recruiter notes and communication scheduling.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 text-[11px] font-bold text-slate-500 shadow-sm">
          <CalendarClock className="h-4 w-4 text-blue-500" />
          Next 30 days
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-md shadow-slate-100/40 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-blue-500" />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Follow-up schedule</h3>
        </div>

        <div className="p-5 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-50 animate-pulse" />
              ))}
            </div>
          ) : reminders.length > 0 ? (
            reminders.map((reminder) => (
              <div
                key={reminder.note_id}
                className="rounded-xl border border-slate-100 bg-slate-50/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/80 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                     <User className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800">
                        {reminder.candidate_name || "Candidate"}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getStatusClasses(
                          reminder.candidate_status
                        )}`}
                      >
                        {reminder.candidate_status?.replace("_", " ") || "in progress"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {reminder.note}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Follow-up</p>
                    <p className="text-xs font-semibold text-slate-700">
                      {new Date(reminder.followup_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Link
                    href={`/candidates?status=${reminder.candidate_status || "in_progress"}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-800 hover:border-slate-300 transition-colors"
                  >
                    View
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-400">
              <p className="text-sm font-semibold">No follow-ups scheduled yet.</p>
              <p className="text-xs mt-1">Add a follow-up date in recruiter notes or communication.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
