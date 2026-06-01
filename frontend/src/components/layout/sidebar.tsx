"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  UploadCloud,
  FileSpreadsheet,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarClock,
  Briefcase
} from "lucide-react";
import { NAVIGATION_ITEMS } from "../../constants";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard: LayoutDashboard,
  Users: Users,
  UploadCloud: UploadCloud,
  FileSpreadsheet: FileSpreadsheet,
  MessageSquare: MessageSquare,
  BarChart3: BarChart3,
  Settings: Settings,
  CalendarClock: CalendarClock,
  Briefcase: Briefcase,
};

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarLinks = NAVIGATION_ITEMS;

  const renderLink = (item: typeof NAVIGATION_ITEMS[0]) => {
    const IconComponent = iconMap[item.icon] || Settings;
    const isActive = pathname === item.href;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setIsMobileOpen(false)}
        className={`group flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-50/50"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <IconComponent
          className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${
            isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
          }`}
        />
        <span
          className={`ml-3 transition-opacity duration-300 ${
            isCollapsed ? "lg:opacity-0 lg:w-0 lg:overflow-hidden" : "opacity-100"
          }`}
        >
          {item.name}
        </span>
        {!item.isPage && (
          <span
            className={`ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 transition-all duration-300 ${
              isCollapsed ? "lg:scale-0" : "scale-100"
            }`}
          >
            Soon
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed bottom-0 top-0 z-50 flex flex-col border-r border-slate-100 bg-white transition-all duration-300 ease-in-out lg:sticky ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-64`}
      >
        {/* Header/Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-50 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-150 bg-white shadow-sm overflow-hidden flex-shrink-0">
              <Image
                src="/logo.jpg"
                alt="Wrench Wise logo"
                width={44}
                height={44}
                className="h-11 w-11 object-contain rounded-xl"
                priority
              />
            </div>
            <span
              className={`font-black text-blue-600 tracking-wider text-xl transition-opacity duration-300 ${
                isCollapsed ? "lg:opacity-0 lg:w-0 lg:overflow-hidden" : "opacity-100"
              }`}
            >
              TRMS
            </span>
          </div>

          {/* Close button inside drawer for mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {sidebarLinks.map(renderLink)}
        </nav>

        {/* Bottom Collapse Toggle (Desktop only) */}
        <div className="hidden border-t border-slate-50 p-4 lg:flex items-center justify-center">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors shadow-sm"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
