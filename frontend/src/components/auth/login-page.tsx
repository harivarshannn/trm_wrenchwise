"use client";

import React, { useState } from "react";
import { KeyRound, ShieldAlert, Sparkles, UserPlus, LogIn, Loader2, CheckCircle2 } from "lucide-react";
import { apiClient } from "../../services/api";

interface LoginPageProps {
  onLoginSuccess: (user: { username: string; role: string; token?: string }) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage("Please enter both username and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await apiClient.post("/api/auth/login", {
        username: username.trim(),
        password,
      });

      if (response.data.success) {
        const user = response.data.data;
        onLoginSuccess({
          username: user.username,
          role: user.role,
        });
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      const detail = error.response?.data?.detail;
      setErrorMessage(detail || "Invalid username or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || !confirmPassword) {
      setErrorMessage("Please fill in all registration fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await apiClient.post("/api/auth/register", {
        username: username.trim(),
        password,
      });

      if (response.data.success) {
        setSuccessMessage(
          "Registration request submitted! Your account is pending review. The Superior Admin must approve your profile before you can log in."
        );
        // Clear registration fields
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setIsLoginTab(true);
      }
    } catch (error: any) {
      console.error("Registration failed:", error);
      const detail = error.response?.data?.detail;
      setErrorMessage(detail || "Failed to submit registration request. Username may be taken.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-50 px-4 select-none relative overflow-hidden font-sans">
      {/* Decorative backdrop shapes */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-400/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 relative z-10 animate-in fade-in zoom-in duration-300">
        
        {/* Portal Header branding */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white mb-4 shadow-md shadow-blue-500/20">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Wrenchwise TRMS</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-wider">Recruiter Portal Access</p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 bg-slate-50 p-1 rounded-xl mb-6 border border-slate-100">
          <button
            onClick={() => {
              setIsLoginTab(true);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              isLoginTab ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => {
              setIsLoginTab(false);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              !isLoginTab ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Request Access</span>
          </button>
        </div>

        {/* Dynamic Forms */}
        {isLoginTab ? (
          /* LOGIN FORM */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. superadmin"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-xs"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-xs"
                disabled={isLoading}
              />
            </div>

            {errorMessage && (
              <div className="flex gap-2.5 rounded-xl border border-red-100 bg-red-50 p-3.5 text-xs text-red-700 font-semibold leading-normal">
                <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex gap-2.5 rounded-xl border border-green-100 bg-green-50 p-3.5 text-xs text-green-700 font-semibold leading-normal">
                <CheckCircle2 className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white uppercase tracking-wider shadow-md shadow-blue-500/10 hover:bg-blue-700 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Requested Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. recruiter_john"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-xs"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Secure Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-xs"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-4 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-xs"
                disabled={isLoading}
              />
            </div>

            {errorMessage && (
              <div className="flex gap-2.5 rounded-xl border border-red-100 bg-red-50 p-3.5 text-xs text-red-700 font-semibold leading-normal">
                <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white uppercase tracking-wider shadow-md shadow-blue-500/10 hover:bg-blue-700 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <span>Request Account Access</span>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center border-t border-slate-50 pt-5 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
          <span>Secured TRMS System v1.0</span>
        </div>

      </div>
    </div>
  );
}
