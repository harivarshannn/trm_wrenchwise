"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, Hourglass } from "lucide-react";

interface PlaceholderSoonProps {
  title: string;
  description: string;
}

export default function PlaceholderSoon({ title, description }: PlaceholderSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 animate-in fade-in duration-300 max-w-md mx-auto">
      
      {/* Dynamic Animated Spinner Icon */}
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-6 shadow-sm border border-blue-100 animate-pulse">
        <Hourglass className="h-6 w-6 text-blue-600" />
      </div>

      {/* Feature Label */}
      <div className="inline-flex items-center gap-1 bg-blue-50 rounded-full px-2.5 py-1 text-[9px] font-extrabold text-blue-700 border border-blue-100 mb-3.5 uppercase tracking-widest">
        <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />
        <span>System Placeholder</span>
      </div>

      {/* Message and Description */}
      <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
      <p className="mt-2 text-slate-400 text-xs leading-relaxed font-medium">
        {description}
      </p>

      {/* Back to Dashboard Link */}
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Dashboard</span>
      </Link>

    </div>
  );
}
