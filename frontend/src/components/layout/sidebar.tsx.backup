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
        {/* Header/Logo - Vertical stack perfectly centered, borderless, no container box */}
        <div className={`flex flex-col items-center justify-center border-b border-slate-50 gap-2 flex-shrink-0 relative transition-all duration-300 ${
          isCollapsed ? "px-2 py-4" : "px-6 py-6"
        }`}>
          {/* Logo Container - centered and sized dynamically */}
          <div className="flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Wrench Wise logo"
              width={isCollapsed ? 44 : 88}
              height={isCollapsed ? 44 : 88}
              className="object-contain transition-all duration-300"
              priority
            />
          </div>

          {/* Close button inside drawer for mobile (positioned absolutely on the right) */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 lg:hidden focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>

          {/* TRMS text on the next line - perfectly centered and vertically aligned */}
          <span
            className={`font-black text-blue-600 tracking-widest text-center transition-all duration-300 leading-none ${
              isCollapsed ? "lg:opacity-0 lg:h-0 lg:overflow-hidden text-xs mt-0" : "opacity-100 text-xl mt-2"
            }`}
          >
            TRMS
          </span>
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
