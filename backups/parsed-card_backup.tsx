"use client";

import React, { useState } from "react";
import { Copy, Check, Mail, Phone, GraduationCap, Briefcase, Award, Sparkles, ArrowRight, BookOpen } from "lucide-react";
import { ParsedResume, EducationItem, ExperienceItem } from "../../types";

// Custom inline SVG icons to prevent lucide-react brand icon version conflicts
const Linkedin = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Github = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface ParsedCardProps {
  parsedData: ParsedResume;
  onDone: () => void;
  onSave?: (updatedData: ParsedResume) => void;
}

export default function ParsedCard({ parsedData, onDone, onSave }: ParsedCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Formatting helpers for structured objects to text area lines
  const formatEducation = (list: EducationItem[]) =>
    (list || [])
      .map((item) => [item.degree, item.level].filter(Boolean).join(" — "))
      .join("\n");

  const formatExperience = (list: ExperienceItem[]) =>
    (list || [])
      .map((item) => [item.company, item.role, item.years].filter(Boolean).join(" — "))
      .join("\n");

  // Editable fields states
  const [editedName, setEditedName] = useState(parsedData.name || "");
  const [editedEmail, setEditedEmail] = useState(parsedData.email || "");
  const [editedPhone, setEditedPhone] = useState(parsedData.phone || "");
  const [editedLinkedin, setEditedLinkedin] = useState(parsedData.linkedin_url || "");
  const [editedGithub, setEditedGithub] = useState(parsedData.github_url || "");
  
  // Array states (formatted for editing text areas)
  const [editedSkills, setEditedSkills] = useState((parsedData.skills || []).join(", "));
  const [editedExperience, setEditedExperience] = useState(formatExperience(parsedData.experience));
  const [editedEducation, setEditedEducation] = useState(formatEducation(parsedData.education));
  const [editedCertifications, setEditedCertifications] = useState((parsedData.certifications || []).join(", "));

  // Keep state sync with changes in parsedData (important for modal re-opens)
  React.useEffect(() => {
    setEditedName(parsedData.name || "");
    setEditedEmail(parsedData.email || "");
    setEditedPhone(parsedData.phone || "");
    setEditedLinkedin(parsedData.linkedin_url || "");
    setEditedGithub(parsedData.github_url || "");
    setEditedSkills((parsedData.skills || []).join(", "));
    setEditedExperience(formatExperience(parsedData.experience));
    setEditedEducation(formatEducation(parsedData.education));
    setEditedCertifications((parsedData.certifications || []).join(", "));
  }, [parsedData]);

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleSave = () => {
    // Parse text areas back to arrays of structured objects
    // Binds on en-dash, em-dash, and standard dash boundaries with whitespace trimming
    const parsedEducation: EducationItem[] = editedEducation
      .split("\n")
      .map((line) => {
        const parts = line.split(/\s*[-—–]\s*/).map((x) => x.trim());
        if (parts.length >= 2) {
          const rawLevel = parts[1]?.toUpperCase();
          const level = (rawLevel === "PG" ? "PG" : rawLevel === "UG" ? "UG" : null) as "UG" | "PG" | null;
          return { degree: parts[0] || null, level };
        }
        return { degree: line.trim() || null, level: null as "UG" | "PG" | null };
      })
      .filter((item) => item.degree);

    const parsedExperience: ExperienceItem[] = editedExperience
      .split("\n")
      .map((line) => {
        const parts = line.split(/\s*[-—–]\s*/).map((x) => x.trim());
        if (parts.length >= 3) {
          return { company: parts[0] || null, role: parts[1] || null, years: parts[2] || null };
        } else if (parts.length === 2) {
          return { company: parts[0] || null, role: parts[1] || null, years: null };
        }
        return { company: line.trim() || null, role: null, years: null };
      })
      .filter((item) => item.company);

    const updatedData: ParsedResume = {
      name: editedName.trim(),
      email: editedEmail.trim(),
      phone: editedPhone.trim(),
      linkedin_url: editedLinkedin.trim(),
      github_url: editedGithub.trim(),
      skills: editedSkills.split(",").map((s) => s.trim()).filter(Boolean),
      education: parsedEducation,
      experience: parsedExperience,
      certifications: editedCertifications.split(",").map((c) => c.trim()).filter(Boolean),
    };
    
    if (onSave) {
      onSave(updatedData);
    }
    setIsEditing(false);
  };

  // Reusable rendering list for simple skill and certificate badges
  const renderBadgeList = (title: string, list: string[], icon: React.ReactNode, emptyText: string) => (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {icon}
        <span>{title}</span>
      </div>
      {list && list.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {list.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-100 hover:scale-[1.02]"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs italic text-slate-400 pl-1">{emptyText}</p>
      )}
    </div>
  );

  // Customized bullet list renderer for structured EducationItem schemas
  const renderEducationList = (list: EducationItem[]) => {
    const icon = <GraduationCap className="h-3.5 w-3.5 text-blue-500" />;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {icon}
          <span>Education Background</span>
        </div>
        {list && list.length > 0 ? (
          <ul className="space-y-2.5 pl-1">
            {list.map((item, idx) => {
              const display = [item.degree, item.level].filter(Boolean).join(" — ");
              return (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                  <span>{display}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs italic text-slate-400 pl-1">No academic details identified.</p>
        )}
      </div>
    );
  };

  // Customized bullet list renderer for structured ExperienceItem schemas
  const renderExperienceList = (list: ExperienceItem[]) => {
    const icon = <Briefcase className="h-3.5 w-3.5 text-blue-500" />;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {icon}
          <span>Professional Experience</span>
        </div>
        {list && list.length > 0 ? (
          <ul className="space-y-2.5 pl-1">
            {list.map((item, idx) => {
              const experienceSegments = [
                item.company,
                item.role,
                item.years ? `${item.years} years` : null,
              ].filter(Boolean);
              
              const display = experienceSegments.join(" — ");
              return (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                  <span>{display}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs italic text-slate-400 pl-1">No experience details identified.</p>
        )}
      </div>
    );
  };

  // RENDERING EDIT FORM PANEL
  if (isEditing) {
    return (
      <div className="w-full max-w-2xl mx-auto rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-100/50 overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
          <h2 className="text-xl font-bold tracking-tight mb-1">Edit Candidate Details</h2>
          <p className="text-blue-100 text-xs font-medium tracking-wide">Manually correct OCR parsed variables</p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[480px]">
          
          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Candidate Name</label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-semibold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                value={editedEmail}
                onChange={(e) => setEditedEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-semibold text-slate-800"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="text"
                value={editedPhone}
                onChange={(e) => setEditedPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-semibold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* LinkedIn */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">LinkedIn Profile URL</label>
              <input
                type="text"
                value={editedLinkedin}
                onChange={(e) => setEditedLinkedin(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-semibold text-slate-800"
              />
            </div>

            {/* GitHub */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">GitHub Profile URL</label>
              <input
                type="text"
                value={editedGithub}
                onChange={(e) => setEditedGithub(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Technical Skills (Comma separated)</label>
            <input
              type="text"
              value={editedSkills}
              onChange={(e) => setEditedSkills(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-semibold text-slate-800"
              placeholder="React, TypeScript, Next.js..."
            />
          </div>

          {/* Certifications */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Certifications & Licenses (Comma separated)</label>
            <input
              type="text"
              value={editedCertifications}
              onChange={(e) => setEditedCertifications(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-semibold text-slate-800"
              placeholder="AWS Certified Solutions Architect, Scrum Master..."
            />
          </div>

          {/* Experience */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Professional Experience (Format: Company — Role — Years | One item per line)
            </label>
            <textarea
              value={editedExperience}
              onChange={(e) => setEditedExperience(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-semibold text-slate-800 leading-normal"
              placeholder="TechCorp — Senior Frontend Engineer — 3&#10;DevStudio — Software Engineer — 2"
            />
          </div>

          {/* Education */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Academic Background (Format: Degree — Level [UG/PG] | One degree item per line)
            </label>
            <textarea
              value={editedEducation}
              onChange={(e) => setEditedEducation(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-semibold text-slate-800 leading-normal"
              placeholder="B.S. in Computer Science - UT Austin — UG&#10;M.S. in Software Engineering - Stanford — PG"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-50 bg-slate-50/50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={() => setIsEditing(false)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-md cursor-pointer"
          >
            Save Changes
          </button>
        </div>

      </div>
    );
  }

  // RENDERING READ ONLY DISPLAY VIEW
  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-100/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full px-2.5 py-1 text-[10px] font-bold text-blue-100 border border-white/10 shadow-sm">
          <Sparkles className="h-3 w-3 text-yellow-300 animate-pulse" />
          <span>Parsed by OCR</span>
        </div>

        {onSave && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute bottom-4 right-4 flex items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-white border border-white/10 shadow-sm transition-all focus:outline-none cursor-pointer"
          >
            Edit Details
          </button>
        )}
        
        <h2 className="text-2xl font-bold tracking-tight mb-1">
          {parsedData.name || "Anonymous Candidate"}
        </h2>
        <p className="text-blue-100 text-xs font-medium tracking-wide">
          Trainer Candidate Profile Created
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="p-6">
        
        {/* Core Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 border-b border-slate-50 pb-6">
          
          {/* Email */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-3 bg-slate-50/30 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Mail className="h-4 w-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email</p>
                <p className="text-xs font-medium text-slate-700 truncate" title={parsedData.email || "N/A"}>
                  {parsedData.email || "No email parsed"}
                </p>
              </div>
            </div>
            {parsedData.email && (
              <button
                onClick={() => copyToClipboard(parsedData.email!, "email")}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700 hover:shadow-sm transition-all focus:outline-none cursor-pointer"
              >
                {copiedField === "email" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-3 bg-slate-50/30 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Phone className="h-4 w-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Phone</p>
                <p className="text-xs font-medium text-slate-700 truncate">
                  {parsedData.phone || "No phone parsed"}
                </p>
              </div>
            </div>
            {parsedData.phone && (
              <button
                onClick={() => copyToClipboard(parsedData.phone!, "phone")}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700 hover:shadow-sm transition-all focus:outline-none cursor-pointer"
              >
                {copiedField === "phone" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>

        </div>

        {/* Social Links Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 border-b border-slate-50 pb-6">
          
          {/* LinkedIn Button */}
          {parsedData.linkedin_url ? (
            <a
              href={parsedData.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 bg-white hover:border-blue-300 hover:bg-blue-50/10 hover:shadow-sm transition-all group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                <Linkedin className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">LinkedIn Profile</p>
                <p className="text-xs font-semibold text-blue-600 group-hover:underline truncate max-w-[180px]">
                  View LinkedIn Account
                </p>
              </div>
            </a>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 p-3 bg-slate-50/20 text-slate-400">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                <Linkedin className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">LinkedIn Profile</p>
                <p className="text-xs italic text-slate-400">Not found in resume</p>
              </div>
            </div>
          )}

          {/* GitHub Button */}
          {parsedData.github_url ? (
            <a
              href={parsedData.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 bg-white hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm transition-all group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-800 group-hover:scale-105 transition-transform">
                <Github className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">GitHub Profile</p>
                <p className="text-xs font-semibold text-slate-800 group-hover:underline truncate max-w-[180px]">
                  View GitHub Account
                </p>
              </div>
            </a>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 p-3 bg-slate-50/20 text-slate-400">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                <Github className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">GitHub Profile</p>
                <p className="text-xs italic text-slate-400">Not found in resume</p>
              </div>
            </div>
          )}

        </div>

        {/* Dynamic Lists */}
        {renderBadgeList("Technical Skills", parsedData.skills, <Award className="h-3.5 w-3.5 text-blue-500" />, "No technical skills identified.")}
        {renderExperienceList(parsedData.experience)}
        {renderEducationList(parsedData.education)}
        {renderBadgeList("Certifications & Licenses", parsedData.certifications, <BookOpen className="h-3.5 w-3.5 text-blue-500" />, "No certifications identified.")}

      </div>

      {/* Card Actions Footer */}
      <div className="border-t border-slate-50 bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className="text-[10px] font-semibold text-slate-400 tracking-wide">
          Automatically loaded to candidates store
        </span>
        <button
          onClick={onDone}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-slate-800 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
        >
          <span>View Candidates List</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

    </div>
  );
}
