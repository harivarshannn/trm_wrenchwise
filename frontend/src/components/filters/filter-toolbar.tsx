"use client";

import React, { useState, useEffect } from "react";
import { Search, RotateCcw, ChevronDown, Check } from "lucide-react";

interface FilterToolbarProps {
  onFiltersChange: (filters: {
    search: string;
    status: string;
    hasLinkedin: boolean;
    hasGithub: boolean;
    location: string;
    skills: string;
    engagementMode: string;
  }) => void;
  isLoading?: boolean;
  initialStatus?: string;
}

export default function FilterToolbar({ onFiltersChange, isLoading, initialStatus }: FilterToolbarProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus || "ALL");
  const [hasLinkedin, setHasLinkedin] = useState(false);
  const [hasGithub, setHasGithub] = useState(false);
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [engagementMode, setEngagementMode] = useState("ALL");

  // Sync initialStatus when URL query parameters change
  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus);
    }
  }, [initialStatus]);

  // Trigger filters update with debounce for text fields
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        search,
        status,
        hasLinkedin,
        hasGithub,
        location,
        skills,
        engagementMode,
      });
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [search, status, hasLinkedin, hasGithub, location, skills, engagementMode, onFiltersChange]);

  const handleReset = () => {
    setSearch("");
    setStatus("ALL");
    setHasLinkedin(false);
    setHasGithub(false);
    setLocation("");
    setSkills("");
    setEngagementMode("ALL");
  };

  return (
    <div className="w-full rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-100/50 mb-6 flex flex-col gap-4 animate-in fade-in duration-200">
      
      {/* Top row: Search, Status, and Toggles */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        
        {/* Left side: Search & Status Filter */}
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          
          {/* Global Search */}
          <div className="relative flex-1 max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className={`h-4 w-4 ${isLoading ? "animate-pulse text-blue-500" : ""}`} />
            </div>
            <input
              type="text"
              placeholder="Search name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-sm"
            />
          </div>

          {/* Status Dropdown */}
          <div className="relative w-full sm:w-48">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-3 pr-8 text-xs font-bold text-slate-700 uppercase tracking-wide cursor-pointer outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-slate-400">
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>

        </div>

        {/* Right side: Checkbox Toggles & Reset */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          
          {/* LinkedIn Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <div className="relative">
              <input
                type="checkbox"
                checked={hasLinkedin}
                onChange={(e) => setHasLinkedin(e.target.checked)}
                className="sr-only"
              />
              <div className={`h-5 w-5 rounded-lg border transition-all flex items-center justify-center shadow-sm ${
                hasLinkedin 
                  ? "border-blue-600 bg-blue-600 text-white" 
                  : "border-slate-200 bg-slate-50 group-hover:border-blue-400"
              }`}>
                {hasLinkedin && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
            </div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide group-hover:text-slate-800 transition-colors">
              Has LinkedIn
            </span>
          </label>

          {/* GitHub Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <div className="relative">
              <input
                type="checkbox"
                checked={hasGithub}
                onChange={(e) => setHasGithub(e.target.checked)}
                className="sr-only"
              />
              <div className={`h-5 w-5 rounded-lg border transition-all flex items-center justify-center shadow-sm ${
                hasGithub 
                  ? "border-slate-800 bg-slate-800 text-white" 
                  : "border-slate-200 bg-slate-50 group-hover:border-slate-400"
              }`}>
                {hasGithub && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
            </div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide group-hover:text-slate-800 transition-colors">
              Has GitHub
            </span>
          </label>

          {/* Reset Action */}
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Reset Filters"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>

        </div>

      </div>

      {/* Bottom row: Advanced Filters (Location, Skills, Engagement Mode) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-slate-100 pt-3">
        {/* Location Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter by Location</label>
          <input
            type="text"
            placeholder="e.g. New York, London..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-sm"
          />
        </div>

        {/* Skills Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter by Skills</label>
          <input
            type="text"
            placeholder="e.g. React, Python, AWS..."
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-sm"
          />
        </div>

        {/* Engagement Mode Filter */}
        <div className="relative">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Engagement Model</label>
          <div className="relative">
            <select
              value={engagementMode}
              onChange={(e) => setEngagementMode(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-3 pr-8 text-xs font-bold text-slate-700 uppercase tracking-wide cursor-pointer outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-sm"
            >
              <option value="ALL">All Engagement Modes</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-slate-400">
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
