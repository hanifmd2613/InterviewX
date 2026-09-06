"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserProfile, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on mount
  useEffect(() => {
    const savedToken =
      localStorage.getItem("interviewx_session_token") ||
      localStorage.getItem("preppulse_session_token");
    const savedUser =
      localStorage.getItem("interviewx_user") ||
      localStorage.getItem("preppulse_user");

    if (savedToken && savedUser) {
      try {
        setSessionToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Verify token with backend
        verifySessionWithBackend(savedToken);
      } catch (e) {
        console.warn("Failed to parse stored auth session:", e);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifySessionWithBackend = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const verifiedUser: UserProfile = await res.json();
        setUser(verifiedUser);
        localStorage.setItem("interviewx_user", JSON.stringify(verifiedUser));
        localStorage.setItem("preppulse_user", JSON.stringify(verifiedUser));
      } else {
        // Token expired or invalid
        logout();
      }
    } catch (err) {
      console.warn("Session check failed (offline mode):", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogleCredential = useCallback(async (credential: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      if (!res.ok) {
        throw new Error(`Auth endpoint returned status ${res.status}`);
      }

      const data = await res.json();
      setUser(data.user);
      setSessionToken(data.session_token);
      localStorage.setItem("interviewx_session_token", data.session_token);
      localStorage.setItem("preppulse_session_token", data.session_token);
      localStorage.setItem("interviewx_user", JSON.stringify(data.user));
      localStorage.setItem("preppulse_user", JSON.stringify(data.user));
      return true;
    } catch (err) {
      console.error("Google login failed:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const devLogin = useCallback(async (profile: "alex" | "sarah") => {
    const devToken = `dev-token-${profile}`;
    await loginWithGoogleCredential(devToken);
  }, [loginWithGoogleCredential]);

  const logout = useCallback(() => {
    setUser(null);
    setSessionToken(null);
    localStorage.removeItem("interviewx_session_token");
    localStorage.removeItem("preppulse_session_token");
    localStorage.removeItem("interviewx_user");
    localStorage.removeItem("preppulse_user");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionToken,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogleCredential,
        devLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
