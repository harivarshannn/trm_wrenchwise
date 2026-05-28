"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Sliders, 
  Lock, 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  Loader2, 
  Database, 
  Key, 
  Clock, 
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useAuthStore } from "../../hooks/useAuthStore";
import { apiClient } from "../../services/api";

interface UserItem {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"users" | "config">("users");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Config settings mock states for high-fidelity interactive feeling
  const [ocrKey, setOcrKey] = useState("AIzaSyB_GoogleVisionAPI_EnterpriseKey_V2");
  const [geminiModel, setGeminiModel] = useState("gemini-1.5-pro");
  const [rateLimit, setRateLimit] = useState(60);
  const [backupSchedule, setBackupSchedule] = useState("daily");

  const isSuperiorAdmin = user?.role === "superior_admin";

  const fetchUsers = async () => {
    if (!isSuperiorAdmin) return;
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await apiClient.get("/api/auth/users");
      if (response.data?.success) {
        setUsers(response.data.data || []);
      } else {
        setErrorMessage("Failed to fetch registered users list.");
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || "An unexpected error occurred while loading users."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await apiClient.post(`/api/auth/users/${userId}/approve`, {
        is_active: true
      });
      if (response.data?.success) {
        setSuccessMessage(response.data.message || "Recruiter access approved successfully.");
        await fetchUsers();
      } else {
        setErrorMessage(response.data.message || "Failed to approve recruiter.");
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || "Could not complete approval request."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (userId: string) => {
    setActionLoading(userId);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await apiClient.post(`/api/auth/users/${userId}/approve`, {
        is_active: false
      });
      if (response.data?.success) {
        setSuccessMessage(response.data.message || "Recruiter access revoked successfully.");
        await fetchUsers();
      } else {
        setErrorMessage(response.data.message || "Failed to revoke recruiter access.");
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || "Could not complete revocation request."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // 1. Render Lockscreen / Access Denied for regular admins
  if (!isSuperiorAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 animate-in fade-in duration-300">
        <div className="relative max-w-md w-full rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-2xl shadow-slate-200/50 overflow-hidden">
          {/* Neon background decorations */}
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-red-500/5 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-indigo-500/5 blur-3xl" />

          {/* Locked Badge Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-6 shadow-sm border border-rose-100/60 animate-pulse">
            <Lock className="h-6 w-6 text-rose-600" />
          </div>

          <div className="inline-flex items-center gap-1.5 bg-rose-50 rounded-full px-3 py-1 text-[10px] font-extrabold text-rose-700 border border-rose-100 mb-4 uppercase tracking-widest">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
            <span>Superior Access Required</span>
          </div>

          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Administrative Lockscreen
          </h2>
          <p className="mt-2 text-slate-400 text-xs leading-relaxed font-semibold">
            Hello, <span className="text-slate-700 font-bold">@{user?.username || "Recruiter"}</span>. The System Administration portal controls recruiter logins, approvals, and credentials. 
            These settings require a <span className="text-rose-600 font-bold">superior_admin</span> clear-level account.
          </p>

          <div className="mt-8 border-t border-slate-50 pt-6">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Need administrative rights?
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">
              Please contact the primary system administrator or your engineering lead to approve your registered account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Render Full Settings Dashboard for Superior Admin
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            System Administration
          </h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
            Recruiter Access Hub & OCR Configuration
          </p>
        </div>

        {/* Action button to fetch latest updates */}
        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh List
        </button>
      </div>

      {/* Error & Success Alert Banners */}
      {errorMessage && (
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4 flex items-start gap-3 text-red-700 animate-in slide-in-from-top duration-300">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div className="text-xs font-semibold leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-green-100 bg-green-50/50 p-4 flex items-start gap-3 text-green-700 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
          <div className="text-xs font-semibold leading-relaxed">{successMessage}</div>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === "users"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Users className="h-4 w-4" />
          Recruiter Access Control
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === "config"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Sliders className="h-4 w-4" />
          Global Config Settings
        </button>
      </div>

      {/* Tab 1: Users Access Control Panel */}
      {activeTab === "users" && (
        <div className="rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-100/40 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Pending & Registered Recruiters</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">
                Authorized administrators logged in the system
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-600">
              {users.length} Total Users
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
              <p className="text-xs font-semibold uppercase tracking-wider">Querying credentials database...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <p className="text-sm font-semibold">No registered users found.</p>
              <p className="text-xs mt-1">Please try refreshing or registering a new administrator account.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="py-3 px-6">Recruiter Username</th>
                    <th className="py-3 px-6">Access Level</th>
                    <th className="py-3 px-6">Registration Date</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => {
                    const isSelf = u.username === user?.username;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/30 transition-all text-xs">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold uppercase">
                              {u.username.substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                @{u.username}
                                {isSelf && (
                                  <span className="rounded-md bg-slate-100 border border-slate-200 px-1.5 py-0.2 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">ID: {u.id.substring(0, 8)}...</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest border ${
                              u.role === "superior_admin"
                                ? "bg-purple-50 text-purple-700 border-purple-100"
                                : "bg-blue-50 text-blue-700 border-blue-100"
                            }`}
                          >
                            {u.role === "superior_admin" ? "Superior Admin" : "Recruiter"}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-slate-500 font-semibold">
                          {new Date(u.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>

                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                              u.is_active
                                ? "bg-green-50 text-green-700"
                                : "bg-amber-50 text-amber-700 animate-pulse"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? "bg-green-500" : "bg-amber-500"}`} />
                            {u.is_active ? "Active" : "Pending Approval"}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Superior admin cannot revoke themselves to avoid locking the system */}
                            {u.role === "superior_admin" ? (
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic pr-2">
                                Locked Level
                              </span>
                            ) : !u.is_active ? (
                              <button
                                onClick={() => handleApprove(u.id)}
                                disabled={actionLoading !== null}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-[10px] font-bold shadow-sm transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                              >
                                {actionLoading === u.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <UserCheck className="h-3 w-3" />
                                )}
                                Approve Access
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRevoke(u.id)}
                                disabled={actionLoading !== null}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 px-3 py-1.5 text-[10px] font-bold transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                              >
                                {actionLoading === u.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin text-rose-500" />
                                ) : (
                                  <UserX className="h-3 w-3" />
                                )}
                                Revoke Access
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Global Config Settings Panel */}
      {activeTab === "config" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main settings form */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/40 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Core Parser Configuration</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">
                  OCR Engine Settings & Model Hyperparameters
                </p>
              </div>

              <div className="space-y-4">
                {/* 1. OCR credentials config */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <Key className="h-3.5 w-3.5 text-slate-400" />
                    Google Cloud Vision OCR Key
                  </label>
                  <input
                    type="password"
                    value={ocrKey}
                    onChange={(e) => setOcrKey(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:border-slate-800 focus:outline-hidden transition-all bg-slate-50/40"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    This key authorizes document image extraction requests via the Google Vision API.
                  </p>
                </div>

                {/* 2. Model selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                    Active LLM Extractor
                  </label>
                  <select
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:border-slate-800 focus:outline-hidden transition-all bg-slate-50/40"
                  >
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Recommended)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Low-Latency)</option>
                    <option value="gemini-2.0-experimental">Gemini 2.0 Experimental</option>
                  </select>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Model selection used to structure unstructured text coordinates back into normalized schemas.
                  </p>
                </div>

                {/* 3. Slider rate limits */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                      OCR Rate limit (Minutes)
                    </label>
                    <span className="text-xs font-bold text-slate-800">{rateLimit} requests / min</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={rateLimit}
                    onChange={(e) => setRateLimit(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Tolerant threshold controls the maximum concurrent thread pool execution to prevent resource exhaustion.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-5 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setOcrKey("AIzaSyB_GoogleVisionAPI_EnterpriseKey_V2");
                    setGeminiModel("gemini-1.5-pro");
                    setRateLimit(60);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Reset Defaults
                </button>
                <button
                  onClick={() => {
                    setSuccessMessage("Global parser configurations saved successfully.");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="rounded-xl bg-slate-900 text-white px-4 py-2 text-xs font-bold shadow-md hover:bg-slate-800 cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar system details summary cards */}
          <div className="space-y-6">
            
            {/* System Status info */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-100/40 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Database className="h-4 w-4 text-indigo-500" />
                Database Engine Context
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Active Service:</span>
                  <span className="font-bold text-slate-700">PostgreSQL (AsyncPG)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Programmatic Alembic:</span>
                  <span className="font-bold text-green-600 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-green-500" /> Enabled
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Primary SSL Mode:</span>
                  <span className="font-bold text-slate-700">Require</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Server Host Location:</span>
                  <span className="font-bold text-slate-700">Oregon Regional Endpoint</span>
                </div>
              </div>
            </div>

            {/* Scheduler system info */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-100/40 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-emerald-500" />
                Follow-up Notifications
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Alarms Sync Window:</span>
                  <span className="font-bold text-slate-700">1 Hour Alerts Active</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Tray Sync Frequency:</span>
                  <span className="font-bold text-slate-700">Real-time (1s ticks)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Auto Backup Interval:</span>
                  <select
                    value={backupSchedule}
                    onChange={(e) => setBackupSchedule(e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700 focus:outline-hidden"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
