"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, BrainCircuit, Activity, BookOpen } from "lucide-react";
import GoogleAuthButton from "@/components/GoogleAuthButton";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/25 transition-all group-hover:scale-105">
            <span className="font-mono text-sm font-bold text-white tracking-wider">IX</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base tracking-tight text-white flex items-center gap-1">
              Interview<span className="text-indigo-400 font-semibold">X</span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
              Technical Interview Platform
            </span>
          </div>
        </Link>

        {/* Status Indicators & Navigation */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Evaluator Ready</span>
          </div>

          <Link
            href="/docs"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800/60"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Docs & Tech Stack</span>
          </Link>

          <Link
            href="/"
            className="text-xs font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800/60"
          >
            New Session
          </Link>

          <Link
            href="/interview"
            className="flex items-center gap-1.5 text-xs font-medium bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white px-4 py-1.5 rounded-lg shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Interview Room</span>
          </Link>

          {/* Google Authentication Button */}
          <div className="border-l border-slate-800 pl-3">
            <GoogleAuthButton />
          </div>
        </div>
      </div>
    </header>
  );
}
