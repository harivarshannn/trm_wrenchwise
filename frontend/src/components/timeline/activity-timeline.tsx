"use client";

import React from "react";
import { UploadCloud, MessageSquare, RefreshCw, AlertTriangle, User, Clock, ArrowRight } from "lucide-react";
import { ActivityEvent } from "../../types";

interface ActivityTimelineProps {
  events: ActivityEvent[];
  isLoading: boolean;
}

export default function ActivityTimeline({ events, isLoading }: ActivityTimelineProps) {
  const getEventIcon = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "upload":
        return <UploadCloud className="h-3.5 w-3.5" />;
      case "status_change":
        return <RefreshCw className="h-3.5 w-3.5" />;
      case "note_added":
        return <MessageSquare className="h-3.5 w-3.5" />;
      case "duplicate_warning":
        return <AlertTriangle className="h-3.5 w-3.5" />;
      default:
        return <User className="h-3.5 w-3.5" />;
    }
  };

  const getEventColor = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "upload":
        return "bg-blue-50 border-blue-100 text-blue-600";
      case "status_change":
        return "bg-green-50 border-green-100 text-green-600";
      case "note_added":
        return "bg-indigo-50 border-indigo-100 text-indigo-600";
      case "duplicate_warning":
        return "bg-amber-50 border-amber-100 text-amber-600";
      default:
        return "bg-slate-50 border-slate-100 text-slate-600";
    }
  };

  return (
    <div className="relative">
      
      {/* Central Connector vertical Line */}
      {events && events.length > 1 && (
        <span
          className="absolute left-4.5 top-2 bottom-2 w-0.5 bg-slate-100"
          aria-hidden="true"
        />
      )}

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-40 bg-slate-200 rounded" />
                <div className="h-2.5 w-full bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : events && events.length > 0 ? (
        <div className="space-y-6">
          {events.map((event) => (
            <div key={event.id} className="relative flex items-start gap-4 group">
              
              {/* Event Circle Node Icon */}
              <div className={`relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border shadow-sm transition-all group-hover:scale-105 ${getEventColor(
                event.type
              )}`}>
                {getEventIcon(event.type)}
              </div>

              {/* Event Content Description */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <h5 className="text-xs font-bold text-slate-800 leading-snug">
                    {event.title}
                  </h5>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(event.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {event.description}
                </p>

                {event.recruiterName && (
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold text-slate-400">
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span>Logged by: {event.recruiterName}</span>
                  </div>
                )}

              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/20">
          <Clock className="h-8 w-8 mx-auto text-slate-300 mb-2" />
          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide">No activity events</h5>
          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto mt-1">
            Status changes, uploaded documents, notes logs, and warning audits appear inside this timeline.
          </p>
        </div>
      )}

    </div>
  );
}
