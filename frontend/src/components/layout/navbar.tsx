"use client";

import React, { useState } from "react";
import { Bell, Search, Menu, LogOut, User, Settings, HelpCircle } from "lucide-react";
import { usePathname } from "next/navigation";

interface NavbarProps {
  setIsMobileOpen: (open: boolean) => void;
}

export default function Navbar({ setIsMobileOpen }: NavbarProps) {
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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

  const mockNotifications = [
    { id: 1, text: "Resume uploaded successfully: Alex Rivera", time: "10 mins ago", type: "success" },
    { id: 2, text: "OCR parsed high-confidence: Sarah Chen", time: "1 hour ago", type: "info" },
    { id: 3, text: "New recruiter assigned to reminders flow", time: "4 hours ago", type: "system" }
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
        <h1 className="text-xl font-semibold text-slate-800 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right Side Tools */}
      <div className="flex items-center gap-4">
        
        {/* Mock Search Bar (Desktop only) */}
        <div className="relative hidden md:block w-72">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search candidates, skills, statuses..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

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
            <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white animate-pulse" />
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
                <div className="divide-y divide-slate-50 overflow-hidden">
                  {mockNotifications.map((notif) => (
                    <div key={notif.id} className="p-3 hover:bg-slate-50/70 transition-all rounded-xl mt-1">
                      <p className="text-xs text-slate-600 leading-normal">{notif.text}</p>
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
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-blue-500/20">
              AD
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-slate-800">Admin Recruiter</p>
              <p className="text-[9px] font-medium text-slate-400">HR Department</p>
            </div>
          </button>

          {/* Profile Menu Dropdown */}
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 mt-2.5 w-52 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-200/50 ring-1 ring-black/5 z-20">
                <div className="px-3 py-2 border-b border-slate-50">
                  <p className="text-xs font-semibold text-slate-800">Admin Account</p>
                  <p className="text-[10px] font-medium text-slate-400 overflow-hidden text-ellipsis">admin@wrenchwise.com</p>
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
                  <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors">
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
