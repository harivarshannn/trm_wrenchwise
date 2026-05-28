"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "../components/layout/sidebar";
import Navbar from "../components/layout/navbar";
import LoginPage from "../components/auth/login-page";
import { useAuthStore } from "../hooks/useAuthStore";
import { useReminders } from "../hooks/useNotes";
import { Bell, Clock, X } from "lucide-react";
import Link from "next/link";

function AlertNotificationTracker() {
  const { data: reminders = [] } = useReminders(1); // Today's reminders
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<{ note_id: string; candidate_name: string; note: string; followup_date: string; secondsLeft: number }[]>([]);

  // Update countdown timers every second
  React.useEffect(() => {
    if (reminders.length === 0) {
      setActiveAlerts([]);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const oneHour = 60 * 60 * 1000;
      const currentAlerts: typeof activeAlerts = [];

      reminders.forEach((r) => {
        if (dismissedAlerts.includes(r.note_id)) return;
        const fTime = new Date(r.followup_date).getTime();
        const diff = fTime - now;

        // If follow-up is within 1 hour in the future (diff > 0 && diff <= 1 hour)
        if (diff > 0 && diff <= oneHour) {
          currentAlerts.push({
            note_id: r.note_id,
            candidate_name: r.candidate_name || "Candidate",
            note: r.note,
            followup_date: r.followup_date,
            secondsLeft: Math.floor(diff / 1000),
          });
        }
      });

      setActiveAlerts(currentAlerts);
    }, 1000);

    return () => clearInterval(interval);
  }, [reminders, dismissedAlerts]);

  if (activeAlerts.length === 0) return null;

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-auto">
      {activeAlerts.map((alert) => (
        <div
          key={alert.note_id}
          className="rounded-2xl border border-red-100 bg-white p-4 shadow-2xl shadow-slate-300/40 flex flex-col gap-2.5 animate-in slide-in-from-bottom duration-300 relative overflow-hidden"
        >
          {/* Top colored indicator bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
          
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 flex-shrink-0">
              <Bell className="h-4 w-4 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <h4 className="text-xs font-bold text-slate-800 truncate">
                Upcoming Call: {alert.candidate_name}
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3 text-red-500" /> Starts in {formatCountdown(alert.secondsLeft)}
              </p>
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-normal">
                {alert.note}
              </p>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => setDismissedAlerts(prev => [...prev, alert.note_id])}
              className="text-slate-400 hover:text-slate-600 transition-colors absolute top-3 right-3 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-50 pt-2.5">
            <button
              onClick={() => setDismissedAlerts(prev => [...prev, alert.note_id])}
              className="rounded-lg px-2.5 py-1 text-[10px] font-bold text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
            <Link
              href={`/candidates`}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-1 text-[10px] font-bold text-white shadow-sm hover:bg-slate-800 transition-colors cursor-pointer"
            >
              View Profile
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, login } = useAuthStore();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes stale time
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <LoginPage onLoginSuccess={login} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased">
        
        {/* Collapsible/Drawer Sidebar */}
        <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

        {/* Main Panel Viewport */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          
          {/* Sticky Header Top Navbar */}
          <Navbar setIsMobileOpen={setIsMobileOpen} />

          {/* Dynamic Page Routing Scroller */}
          <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>

        </div>

        {/* Live Followup Alarms Countdown Tracker */}
        <AlertNotificationTracker />

      </div>
    </QueryClientProvider>
  );
}
