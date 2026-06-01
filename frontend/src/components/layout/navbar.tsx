"use client";

import React, { useState } from "react";
import { Bell, Menu, LogOut, User, Settings, HelpCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "../../hooks/useAuthStore";
import { useReminders } from "../../hooks/useNotes";

interface NavbarProps {
  setIsMobileOpen: (open: boolean) => void;
}

export default function Navbar({ setIsMobileOpen }: NavbarProps) {
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuthStore();
  
  // Load today's reminders from backend
  const { data: reminders = [] } = useReminders(1);

  // Compute page title based on path
  const getPageTitle = () => {
    switch (pathname) {
      case "/":
        return "Recruitment Dashboard";
      case "/candidates":
        return "Candidates Directory";
      case "/upload":
        return "Resume OCR Parser";
      case "/reminders":
        return "Recruiter Reminders";
      case "/reports":
        return "Reports & Analytics";
      case "/settings":
        return "System Settings";
      default:
        return "Recruitment Management";
    }
  };

  const notificationItems = reminders.map((r) => ({
    id: r.note_id,
    text: `Follow-up with ${r.candidate_name || "Candidate"}: ${r.note}`,
    time: new Date(r.followup_date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    type: "reminder",
  }));

  const displayNotifications =
    notificationItems.length > 0
      ? notificationItems
      : [
          {
            id: "empty",
            text: "No active reminders scheduled for today. You are all caught up!",
            time: "Healthy Pipeline",
            type: "info",
          },
        ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md px-6 shadow-sm shadow-slate-100/20">
      
      {/* Page Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 lg:hidden focus:outline-none"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Image
            src="/logo.jpg"
            alt="Wrench Wise logo"
            width={38}
            height={38}
            className="h-9.5 w-9.5 rounded-xl border border-slate-150 bg-white p-0.5 object-contain shadow-sm"
            priority
          />
          <h1 className="text-xl font-semibold text-slate-800 tracking-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right Side Tools */}
      <div className="flex items-center gap-4">
        
        {/* Notifications Icon Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 focus:outline-none transition-colors border border-slate-100"
          >
            <Bell className="h-5 w-5" />
            {notificationItems.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white animate-pulse shadow-sm">
                {notificationItems.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-200/50 ring-1 ring-black/5 z-20">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-50">
                  <h3 className="text-xs font-semibold text-slate-800">Notifications</h3>
                  <button className="text-[10px] font-semibold text-blue-600 hover:underline">Mark all read</button>
                </div>
                <div className="divide-y divide-slate-50 overflow-hidden max-h-64 overflow-y-auto">
                  {displayNotifications.map((notif) => (
                    <div key={notif.id} className="p-3 hover:bg-slate-50/70 transition-all rounded-xl mt-1">
                      <p className="text-xs text-slate-600 leading-normal font-semibold">{notif.text}</p>
                      <span className="text-[10px] font-medium text-slate-400 mt-1 block">{notif.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Admin Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-slate-50 focus:outline-none transition-colors border border-slate-100"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-blue-500/20 uppercase">
              {user ? user.username.substring(0, 2) : "AD"}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-slate-800 capitalize">{user ? user.username : "Admin Recruiter"}</p>
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">
                {user && user.role === "superior_admin" ? "Superior Admin" : "Recruiter Admin"}
              </p>
            </div>
          </button>

          {/* Profile Menu Dropdown */}
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 mt-2.5 w-52 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-200/50 ring-1 ring-black/5 z-20">
                <div className="px-3 py-2 border-b border-slate-50">
                  <p className="text-xs font-semibold text-slate-800 capitalize">{user ? user.username : "Admin Account"}</p>
                  <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wide">
                    {user && user.role === "superior_admin" ? "Superior Access" : "Recruiter Access"}
                  </p>
                </div>
                <div className="mt-1">
                  <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                    <User className="h-3.5 w-3.5" />
                    My Profile
                  </button>
                  <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                    <Settings className="h-3.5 w-3.5" />
                    Settings
                  </button>
                  <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                    <HelpCircle className="h-3.5 w-3.5" />
                    Help & Docs
                  </button>
                  <div className="border-t border-slate-50 my-1" />
                  <button
                    onClick={() => logout()}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors uppercase tracking-wider font-bold cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Log Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
