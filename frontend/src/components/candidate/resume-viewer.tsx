"use client";

import React, { useState } from "react";
import { Download, Maximize, Minimize, FileText, ExternalLink, AlertCircle } from "lucide-react";

interface ResumeViewerProps {
  resumeUrl?: string; // Optional custom URL
  candidateName: string;
}

export default function ResumeViewer({ resumeUrl, candidateName }: ResumeViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // If no custom resumeUrl is supplied, serve sample PDF
  const defaultIframeUrl = "https://pdfobject.com/pdf/sample.pdf";
  
  // Prepend backend API base URL if relative path is given
  const getFullUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `http://localhost:8000${url}`;
  };

  const activeUrl = getFullUrl(resumeUrl) || defaultIframeUrl;
  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(activeUrl);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`flex flex-col border border-slate-100 bg-slate-50/50 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${
      isFullscreen 
        ? "fixed inset-0 z-50 p-4 bg-slate-900/90 backdrop-blur-md" 
        : "w-full h-[520px]"
    }`}>
      
      {/* Interactive Controls Bar */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between gap-3 shadow-xs">
        
        {/* Left Side: Document Meta */}
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Document Preview</p>
            <p className="text-xs font-bold text-slate-700 truncate">{candidateName}_Resume.{isImage ? "Image" : "pdf"}</p>
          </div>
        </div>

        {/* Right Side: Tools */}
        <div className="flex items-center gap-2 flex-shrink-0">
          
          {/* Zoom controls (Only relevant for iframe) */}
          {!isFullscreen && !isImage && (
            <div className="hidden sm:flex items-center gap-2 border-r border-slate-100 pr-2 mr-1">
              <button
                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                className="rounded-lg p-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide min-w-[36px] text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
                className="rounded-lg p-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                title="Zoom In"
              >
                +
              </button>
            </div>
          )}

          {/* External Link */}
          <a
            href={activeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            title="Open in new window"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden xs:inline uppercase tracking-wide">Open Original</span>
          </a>

          {/* Download File */}
          <a
            href={activeUrl}
            download={`${candidateName}_Resume.${isImage ? "png" : "pdf"}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            title="Download document"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden xs:inline uppercase tracking-wide">Download</span>
          </a>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm cursor-pointer transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          </button>

        </div>

      </div>

      {/* Primary Frame Viewer */}
      <div className="flex-1 w-full bg-slate-200 overflow-hidden relative flex items-center justify-center">
        {isImage ? (
          <div className="w-full h-full flex items-center justify-center p-4 bg-slate-100 overflow-auto">
            <img
              src={activeUrl}
              alt={`${candidateName} Resume`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-md"
            />
          </div>
        ) : (
          <iframe
            src={`${activeUrl}#zoom=${zoomLevel}`}
            className="w-full h-full border-none"
            title={`${candidateName} Resume Document`}
            style={{ transformOrigin: "top left" }}
          />
        )}
        
        {/* Browser Sandbox Warning Banner */}
        <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md border border-slate-100 rounded-xl px-3 py-2 flex items-start gap-2 shadow-sm pointer-events-none">
          <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <span className="text-[10px] text-slate-500 font-semibold leading-relaxed">
            Directly viewing trainer CV. If the document fails to load or download immediately, click <strong>&quot;Open Original&quot;</strong> to view in a browser tab.
          </span>
        </div>
      </div>

    </div>
  );
}
