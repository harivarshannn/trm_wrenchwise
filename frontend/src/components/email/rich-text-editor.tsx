"use client";

import React, { useRef, useEffect } from "react";
import { Bold, Italic, List, Link, Unlink } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your message here...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync value from parent (only if it differs from current innerHTML to avoid cursor jumping)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, arg: string = "") => {
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleLink = () => {
    const url = prompt("Enter URL:", "https://");
    if (url) {
      executeCommand("createLink", url);
    }
  };

  return (
    <>
      <style>{`
        .rte-content:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          font-style: italic;
          cursor: text;
          pointer-events: none;
        }
      `}</style>
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        
        {/* Editor Toolbar */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/50 p-2.5">
          <button
            type="button"
            onClick={() => executeCommand("bold")}
            className="rounded-lg p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("italic")}
            className="rounded-lg p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("insertUnorderedList")}
            className="rounded-lg p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-200 mx-1" />
          <button
            type="button"
            onClick={handleLink}
            className="rounded-lg p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            title="Insert Link"
          >
            <Link className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("unlink")}
            className="rounded-lg p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Remove Link"
          >
            <Unlink className="h-4 w-4" />
          </button>
        </div>

        {/* contentEditable Input area */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          data-placeholder={placeholder}
          className="rte-content min-h-[180px] max-h-[300px] overflow-y-auto px-4 py-3 text-xs text-slate-800 outline-none leading-relaxed prose prose-sm max-w-none focus:outline-none"
          style={{ wordBreak: "break-word" }}
        />
      </div>
    </>
  );
}
