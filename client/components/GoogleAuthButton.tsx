"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  LogOut,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  X,
  Lock,
  Key,
  ExternalLink,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function GoogleAuthButton() {
  const { user, isAuthenticated, isLoading, loginWithGoogleCredential, devLogin, logout } =
    useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientIdInput, setClientIdInput] = useState("");
  const [activeClientId, setActiveClientId] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const googleBtnContainerRef = useRef<HTMLDivElement | null>(null);

  // Set mounted flag for safe React Portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load configured Client ID from env or localStorage
  useEffect(() => {
    const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const storedClientId =
      typeof window !== "undefined"
        ? localStorage.getItem("interviewx_google_client_id") ||
          localStorage.getItem("preppulse_google_client_id")
        : null;
    const effective = envClientId || storedClientId || "";
    if (effective) {
      setActiveClientId(effective);
      setClientIdInput(effective);
    }
  }, []);

  // Initialize official Google Identity Services button
  const initializeGoogleGIS = useCallback(() => {
    if (typeof window === "undefined" || !activeClientId) return;

    if ((window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: activeClientId,
          callback: async (response: any) => {
            if (response.credential) {
              setAuthError(null);
              const success = await loginWithGoogleCredential(response.credential);
              if (success) {
                setIsModalOpen(false);
              } else {
                setAuthError("Failed to verify Google token with backend. Please try again.");
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render official Google Sign-In button if container exists
        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = "";
          (window as any).google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: "outline",
            size: "large",
            type: "standard",
            shape: "pill",
            text: "signin_with",
            logo_alignment: "left",
            width: 280,
          });
        }
      } catch (err: any) {
        console.warn("Error rendering Google Identity button:", err);
      }
    }
  }, [activeClientId, loginWithGoogleCredential]);

  // Re-run initialization whenever modal opens or client ID updates
  useEffect(() => {
    if (activeClientId && isModalOpen) {
      const timer = setTimeout(() => {
        initializeGoogleGIS();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [activeClientId, isModalOpen, initializeGoogleGIS]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = clientIdInput.trim();
    if (!trimmed) return;
    localStorage.setItem("interviewx_google_client_id", trimmed);
    localStorage.setItem("preppulse_google_client_id", trimmed);
    setActiveClientId(trimmed);
    setAuthError(null);
  };

  const handleOpenAuth = () => {
    setIsModalOpen(true);
    // If client ID is already set, attempt Google One Tap prompt
    if (activeClientId && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt();
      } catch (e) {}
    }
  };

  const handleDevSignIn = async (profile: "alex" | "sarah") => {
    await devLogin(profile);
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
        <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Authenticating...</span>
      </div>
    );
  }

  // Authenticated State: Verified Google Profile
  if (isAuthenticated && user) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition-all hover:scale-[1.02]"
        >
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-6 h-6 rounded-full object-cover border border-emerald-500/60"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[11px] font-bold text-white uppercase">
              {user.name.charAt(0)}
            </div>
          )}

          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-white truncate max-w-[110px]">
              {user.name}
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>Verified</span>
            </span>
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </button>

        {/* User Profile Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#111827] border border-slate-700 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 p-2 border-b border-slate-800 mb-2">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover border border-emerald-500"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Candidate ID:</span>
                  <span className="font-mono text-indigo-400">{user.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span>Verified Identity:</span>
                  <span className="text-emerald-400 font-semibold">Google Account</span>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Unauthenticated State: Sign in with Google Button & Real Auth Modal
  return (
    <>
      <button
        onClick={handleOpenAuth}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shadow-md transition-all hover:scale-[1.02]"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Sign in with Google</span>
      </button>

      {/* Real Google Authentication Modal - Rendered via React Portal directly into body */}
      {isModalOpen &&
        mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Clickable Backdrop to close */}
            <div
              className="fixed inset-0 -z-10 bg-transparent cursor-pointer"
              onClick={() => setIsModalOpen(false)}
            />

            {/* Modal Card - Centered vertically & horizontally, never cropped */}
            <div
              className="relative w-full max-w-lg bg-[#111827] border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-7 my-auto max-h-[88vh] overflow-y-auto text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/60"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3.5 mb-5 pr-8">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-black/30 shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Google Account Authentication
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sign in with your verified Google account for certified evaluation
                  </p>
                </div>
              </div>

              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}

              {/* SECTION 1: Active Real Google Sign-In Button */}
              {activeClientId ? (
                <div className="mb-5 p-4 rounded-xl bg-[#0B0F19] border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Google Identity Ready</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Client ID Configured
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Click below to open Google&apos;s genuine sign-in prompt and link your profile to this session.
                  </p>

                  {/* Google Official Rendered Iframe Button Container */}
                  <div className="flex justify-center py-2">
                    <div
                      ref={googleBtnContainerRef}
                      className="min-h-[44px] flex items-center justify-center"
                    />
                  </div>
                </div>
              ) : (
                /* If Client ID not yet set, guide user to enter or configure it */
                <div className="mb-5 p-4 rounded-xl bg-[#0B0F19] border border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Key className="w-4 h-4" />
                    <span>Configure Google OAuth Client ID</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    To authenticate live Google accounts, paste your <strong>OAuth 2.0 Web Client ID</strong> from Google Cloud Console.
                  </p>

                  <form onSubmit={handleSaveClientId} className="space-y-2.5 pt-1">
                    <input
                      type="text"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      placeholder="Enter Client ID (e.g. 123456...apps.googleusercontent.com)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="submit"
                      disabled={!clientIdInput.trim()}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-xs transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20"
                    >
                      Activate Real Google Sign-In
                    </button>
                  </form>

                  {/* Quick Guide */}
                  <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                    <div className="font-semibold text-slate-300 flex items-center justify-between">
                      <span>Quick Setup (Google Cloud Console):</span>
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <span>Open Console</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-400">
                      <li>Create an OAuth Client ID with application type <strong>Web application</strong>.</li>
                      <li>Add Authorized JavaScript origin: <code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded font-mono">http://localhost:3000</code></li>
                      <li>Copy the Client ID and paste it in the box above!</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* SECTION 2: Instant Test Members */}
              <div className="pt-4 border-t border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                  Or Test Immediately With Sample Verified Member:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleDevSignIn("alex")}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0B0F19] hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition-all hover:scale-[1.01]"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
                      alt="Alex"
                      className="w-8 h-8 rounded-full object-cover border border-emerald-500"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate">Alex Chen</span>
                      <span className="text-[10px] text-slate-400 block truncate">alex.chen@gmail.com</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDevSignIn("sarah")}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0B0F19] hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition-all hover:scale-[1.01]"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                      alt="Sarah"
                      className="w-8 h-8 rounded-full object-cover border border-cyan-500"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate">Sarah Lin</span>
                      <span className="text-[10px] text-slate-400 block truncate">sarah.lin@gmail.com</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-4">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Google JWTs are cryptographically verified via FastAPI &amp; Google Public Keys</span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
