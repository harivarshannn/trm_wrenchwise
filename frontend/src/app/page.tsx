"use client";

import React from "react";
import Link from "next/link";
import { Users, Hourglass, CheckCircle2, XCircle, ArrowUpRight, ArrowRight, Sparkles, UserPlus } from "lucide-react";
import { useCandidates } from "../hooks/useCandidates";

export default function DashboardPage() {
  const { data: candidates = [] } = useCandidates();

  const total = candidates.length;
  const inProgress = candidates.filter(c => c.status === "in_progress").length;
  const selected = candidates.filter(c => c.status === "selected").length;
  const rejected = candidates.filter(c => c.status === "rejected").length;

  const recentCandidates = candidates.slice(0, 3);

  // Compute status ratios for the SVG chart
  const selectedPct = total > 0 ? (selected / total) * 100 : 0;
  const progressPct = total > 0 ? (inProgress / total) * 100 : 0;
  const rejectedPct = total > 0 ? (rejected / total) * 100 : 0;

  const statCards = [
    {
      title: "Total Candidates",
      value: total,
      icon: Users,
      color: "blue",
      change: "+12% vs last month",
      bgClass: "bg-blue-50 text-blue-600 border-blue-100",
      href: "/candidates",
    },
    {
      title: "In Progress",
      value: inProgress,
      icon: Hourglass,
      color: "yellow",
      change: "Active screening",
      bgClass: "bg-amber-50 text-amber-600 border-amber-100",
      href: "/candidates?status=in_progress",
    },
    {
      title: "Selected",
      value: selected,
      icon: CheckCircle2,
      color: "green",
      change: "Offers dispatched",
      bgClass: "bg-green-50 text-green-600 border-green-100",
      href: "/candidates?status=selected",
    },
    {
      title: "Rejected",
      value: rejected,
      icon: XCircle,
      color: "red",
      change: "Polite letters sent",
      bgClass: "bg-red-50 text-red-600 border-red-100",
      href: "/candidates?status=rejected",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full px-2.5 py-1 text-[10px] font-bold text-blue-100 border border-white/10 mb-3">
            <Sparkles className="h-3 w-3 text-yellow-300 animate-pulse" />
            <span>Recruiting Portal Online</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Trainer Recruitment Management</h2>
          <p className="mt-1.5 text-blue-100 text-sm sm:text-base font-medium max-w-xl">
            Upload resumes, verify OCR parsing results in real time, and manage candidate progression schedules.
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <UserPlus className="h-4.5 w-4.5" />
          <span>Upload Resume</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-100/40 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.title}</span>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${stat.bgClass}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3.5">
              <span className="text-3xl font-bold text-slate-800 tracking-tight">{stat.value}</span>
              <p className="text-[10px] font-semibold text-slate-400 mt-1">{stat.change}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Primary widgets split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Recent Uploads */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-100/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-50 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-800">Recent Uploads</h3>
                <p className="text-xs text-slate-400 font-medium">Quick dashboard candidate reference list</p>
              </div>
              <Link
                href="/candidates"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {total > 0 ? (
              <div className="space-y-4">
                {recentCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-50 bg-slate-50/20 p-4 transition-all hover:bg-slate-50/70"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{cand.name}</h4>
                      <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs">{cand.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Status Tag */}
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          cand.status === "selected"
                            ? "bg-green-50 text-green-700 border border-green-100"
                            : cand.status === "rejected"
                            ? "bg-red-50 text-red-700 border border-red-100"
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}
                      >
                        {cand.status.replace("_", " ")}
                      </span>
                      <Link
                        href={`/candidates?open=${cand.id}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700 hover:shadow-sm border border-transparent hover:border-slate-100 transition-all"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-400 italic">No candidates uploaded yet.</p>
                <Link href="/upload" className="text-xs font-semibold text-blue-600 hover:underline mt-2 inline-block">
                  Upload your first resume
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Ratio Chart and Timeline */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md shadow-slate-100/40 space-y-6">
          
          {/* SVG Ratio Chart */}
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Recruitment Funnel</h3>
            <p className="text-xs text-slate-400 font-medium mb-5">OCR screening pipeline ratios</p>

            {total > 0 ? (
              <div className="flex items-center gap-5 justify-center py-2">
                {/* Visual Donut Chart using clean SVG */}
                <div className="relative h-28 w-28 flex-shrink-0">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    {/* Background Circle */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    
                    {/* Selected Segment (Green) */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="3.2"
                      strokeDasharray={`${selectedPct} ${100 - selectedPct}`}
                      strokeDashoffset="0"
                    />

                    {/* Progress Segment (Blue) */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3.2"
                      strokeDasharray={`${progressPct} ${100 - progressPct}`}
                      strokeDashoffset={`-${selectedPct}`}
                    />

                    {/* Rejected Segment (Red) */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="3.2"
                      strokeDasharray={`${rejectedPct} ${100 - rejectedPct}`}
                      strokeDashoffset={`-${selectedPct + progressPct}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-extrabold text-slate-700 tracking-tighter">{total}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Total</span>
                  </div>
                </div>

                {/* Chart Legends */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded bg-blue-600" />
                    <span className="text-xs font-semibold text-slate-600">In Progress ({inProgress})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded bg-green-600" />
                    <span className="text-xs font-semibold text-slate-600">Selected ({selected})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded bg-red-600" />
                    <span className="text-xs font-semibold text-slate-600">Rejected ({rejected})</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 italic">No charts to display.</div>
            )}
          </div>

          <div className="border-t border-slate-50 pt-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Recruiter Activity Feed</h3>
            
            {/* Timeline */}
            <div className="space-y-4 pl-1">
              <div className="flex gap-3 items-start relative">
                <span className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-slate-100" />
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-500 border border-blue-200 z-10">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">OCR Parser active</p>
                  <p className="text-[10px] text-slate-400 font-medium">FastAPI backend online & verified</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-50 text-slate-400 border border-slate-100 z-10">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600">Recruiter Session initiated</p>
                  <p className="text-[10px] text-slate-400 font-medium">Dashboard session loaded successfully</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
