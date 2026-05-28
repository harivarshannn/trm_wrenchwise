"use client";

import React from "react";
import Link from "next/link";
import { CalendarClock, ArrowUpRight, User, AlertCircle, Clock } from "lucide-react";
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

  // Split reminders into today's and upcoming schedules
  const { todayReminders, upcomingReminders } = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayList: typeof reminders = [];
    const upcomingList: typeof reminders = [];

    reminders.forEach((r) => {
      const fDate = new Date(r.followup_date);
      if (fDate >= today && fDate < tomorrow) {
        todayList.push(r);
      } else if (fDate >= tomorrow) {
        upcomingList.push(r);
      }
    });

    return { todayReminders: todayList, upcomingReminders: upcomingList };
  }, [reminders]);

  const renderReminderCard = (reminder: typeof reminders[0]) => (
    <div
      key={reminder.note_id}
      className="rounded-xl border border-slate-100 bg-slate-50/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/80 transition-all shadow-xs"
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
        <div className="text-left sm:text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 justify-start sm:justify-end">
            <Clock className="h-3 w-3 text-slate-400" /> Scheduled
          </p>
          <p className="text-xs font-semibold text-slate-700">
            {new Date(reminder.followup_date).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Link
          href={`/candidates?status=${reminder.candidate_status || "in_progress"}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-800 hover:border-slate-300 transition-colors cursor-pointer"
        >
          View Pipeline
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Follow-up Schedule</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Keep track of upcoming candidate calls and scheduled recruitment touchpoints.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 text-[11px] font-bold text-slate-500 shadow-sm">
          <CalendarClock className="h-4 w-4 text-blue-500" />
          Next 30 days
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          
          {/* TODAY'S SCHEDULE */}
          <div className="rounded-2xl border border-blue-100 bg-white shadow-xl shadow-blue-100/10 overflow-hidden">
            <div className="border-b border-blue-50 bg-blue-50/10 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <h3 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">Today's Reminders</h3>
              </div>
              <span className="text-[10px] font-bold bg-blue-600 text-white rounded-full px-2 py-0.5">
                {todayReminders.length} Active
              </span>
            </div>

            <div className="p-5 space-y-3">
              {todayReminders.length > 0 ? (
                todayReminders.map(renderReminderCard)
              ) : (
                <div className="text-center py-6 text-slate-400 italic text-xs">
                  No reminders scheduled for today. You are all caught up!
                </div>
              )}
            </div>
          </div>

          {/* UPCOMING SCHEDULE */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-md shadow-slate-100/40 overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Schedule</h3>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
                {upcomingReminders.length} Scheduled
              </span>
            </div>

            <div className="p-5 space-y-3">
              {upcomingReminders.length > 0 ? (
                upcomingReminders.map(renderReminderCard)
              ) : (
                <div className="text-center py-6 text-slate-400 italic text-xs">
                  No upcoming follow-ups scheduled.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
