"use client";

import React, { useState } from "react";
import Sidebar from "../components/layout/sidebar";
import Navbar from "../components/layout/navbar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
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

    </div>
  );
}
