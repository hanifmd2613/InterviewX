"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  ExternalLink,
  Code2,
  Cpu,
  Layers,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Printer,
  Archive,
  Terminal,
  Shield,
  Eye,
  Mic,
  Brain
} from "lucide-react";

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<"readme" | "techstack">("readme");

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-white">
      {/* Top Banner / Breadcrumb */}
      <div className="border-b border-slate-800/80 bg-[#0F172A]/70 backdrop-blur-md sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors bg-slate-800/60 hover:bg-slate-700/60 px-3 py-1.5 rounded-lg border border-slate-700/60"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <div className="h-4 w-[1px] bg-slate-800" />
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Documentation & Architecture Center
            </span>
          </div>

          {/* Quick ZIP Download */}
          <div className="flex items-center gap-2">
            <a
              href="/downloads/InterviewX_Documentation_Bundle.zip"
              download
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Download All Docs (.zip)</span>
            </a>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Header Hero */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-300 font-medium mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>Complete Technical Specifications & Source Manual</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            InterviewX Documentation Hub
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Download raw Markdown specifications, standalone self-contained HTML manual files, or open print-ready PDFs for the platform manual and in-depth technology stack breakdown.
          </p>
        </div>

        {/* Download Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Card 1: README */}
          <div className="rounded-2xl border border-slate-800 bg-[#111827]/90 p-6 flex flex-col justify-between shadow-xl shadow-black/20 hover:border-indigo-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                  Platform Manual
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                InterviewX README.md
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mb-4 leading-relaxed">
                Complete platform guide covering core features, natural TTS voice synthesis, dual-engine speech recognition, MediaPipe eye tracking, candidate photo verification, 1-click startup, and REST/WebSocket API endpoints.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6 text-[11px] font-mono text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">Quickstart</span>
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">Audio Setup</span>
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">API Table</span>
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">Testing</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap gap-2.5">
              <a
                href="/downloads/README.md"
                download
                className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Download .MD</span>
              </a>
              <a
                href="/downloads/README.html"
                download
                className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download .HTML</span>
              </a>
              <a
                href="/downloads/README.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-xs font-semibold text-indigo-300 border border-indigo-500/30 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open & Print PDF</span>
              </a>
            </div>
          </div>

          {/* Card 2: TECH STACK */}
          <div className="rounded-2xl border border-slate-800 bg-[#111827]/90 p-6 flex flex-col justify-between shadow-xl shadow-black/20 hover:border-violet-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <Cpu className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-semibold">
                  Architecture Specification
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                InterviewX TECH_STACK.md
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mb-4 leading-relaxed">
                In-depth technical architecture breakdown: Next.js 14 App Router, FastAPI ASGI, Google Gemini 2.5 Flash SDK, Web Audio RMS calculations, MediaPipe FaceMesh 468-landmark gaze math, and exact package version manifests.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6 text-[11px] font-mono text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">Edge vs Cloud</span>
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">Pydantic v2</span>
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">WPM Algorithms</span>
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">Exact Versions</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap gap-2.5">
              <a
                href="/downloads/TECH_STACK.md"
                download
                className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-violet-400" />
                <span>Download .MD</span>
              </a>
              <a
                href="/downloads/TECH_STACK.html"
                download
                className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download .HTML</span>
              </a>
              <a
                href="/downloads/TECH_STACK.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-xs font-semibold text-violet-300 border border-violet-500/30 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open & Print PDF</span>
              </a>
            </div>
          </div>
        </div>

        {/* Technology Stack Visual Grid */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Technology Stack Architecture At A Glance
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Full-stack breakdown of libraries, frameworks, algorithms, and models deployed in InterviewX.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Box 1 */}
            <div className="p-4 rounded-xl bg-[#111827] border border-slate-800/80 hover:border-slate-700 transition-all">
              <div className="flex items-center gap-2.5 text-indigo-400 font-semibold text-sm mb-3">
                <Code2 className="w-4 h-4" />
                <span>Frontend Architecture</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-1.5"><span className="text-indigo-400 font-mono font-bold">•</span> Next.js 14.2 (App Router)</li>
                <li className="flex items-center gap-1.5"><span className="text-indigo-400 font-mono font-bold">•</span> React 18.3 & React DOM</li>
                <li className="flex items-center gap-1.5"><span className="text-indigo-400 font-mono font-bold">•</span> TypeScript 5.6 Strict Types</li>
                <li className="flex items-center gap-1.5"><span className="text-indigo-400 font-mono font-bold">•</span> Tailwind CSS 3.4 & PostCSS</li>
                <li className="flex items-center gap-1.5"><span className="text-indigo-400 font-mono font-bold">•</span> Framer Motion 11 Animations</li>
                <li className="flex items-center gap-1.5"><span className="text-indigo-400 font-mono font-bold">•</span> Lucide React Icons</li>
              </ul>
            </div>

            {/* Box 2 */}
            <div className="p-4 rounded-xl bg-[#111827] border border-slate-800/80 hover:border-slate-700 transition-all">
              <div className="flex items-center gap-2.5 text-violet-400 font-semibold text-sm mb-3">
                <Brain className="w-4 h-4" />
                <span>AI & Multimodal Core</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-1.5"><span className="text-violet-400 font-mono font-bold">•</span> Google Gemini 2.5 Flash</li>
                <li className="flex items-center gap-1.5"><span className="text-violet-400 font-mono font-bold">•</span> google-genai Python SDK</li>
                <li className="flex items-center gap-1.5"><span className="text-violet-400 font-mono font-bold">•</span> 5-Question Adaptive Planner</li>
                <li className="flex items-center gap-1.5"><span className="text-violet-400 font-mono font-bold">•</span> 4-Tier Rubric Critique Engine</li>
                <li className="flex items-center gap-1.5"><span className="text-violet-400 font-mono font-bold">•</span> Senior "Better Answer" Phrasing</li>
                <li className="flex items-center gap-1.5"><span className="text-violet-400 font-mono font-bold">•</span> Multimodal Audio STT Fallback</li>
              </ul>
            </div>

            {/* Box 3 */}
            <div className="p-4 rounded-xl bg-[#111827] border border-slate-800/80 hover:border-slate-700 transition-all">
              <div className="flex items-center gap-2.5 text-cyan-400 font-semibold text-sm mb-3">
                <Eye className="w-4 h-4" />
                <span>Edge Vision & Speech</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-1.5"><span className="text-cyan-400 font-mono font-bold">•</span> MediaPipe 468-pt FaceMesh</li>
                <li className="flex items-center gap-1.5"><span className="text-cyan-400 font-mono font-bold">•</span> Iris Gaze & Head Pose (Wasm)</li>
                <li className="flex items-center gap-1.5"><span className="text-cyan-400 font-mono font-bold">•</span> Candidate Photo Shutter API</li>
                <li className="flex items-center gap-1.5"><span className="text-cyan-400 font-mono font-bold">•</span> Web Audio 2048 RMS Meter</li>
                <li className="flex items-center gap-1.5"><span className="text-cyan-400 font-mono font-bold">•</span> Web Speech Synthesis (0.94x)</li>
                <li className="flex items-center gap-1.5"><span className="text-cyan-400 font-mono font-bold">•</span> Technical Acronym Parser</li>
              </ul>
            </div>

            {/* Box 4 */}
            <div className="p-4 rounded-xl bg-[#111827] border border-slate-800/80 hover:border-slate-700 transition-all">
              <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-sm mb-3">
                <Terminal className="w-4 h-4" />
                <span>Backend & Infrastructure</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-1.5"><span className="text-emerald-400 font-mono font-bold">•</span> FastAPI 0.141 (Async ASGI)</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-400 font-mono font-bold">•</span> Uvicorn 0.52 with uvloop</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-400 font-mono font-bold">•</span> WebSockets 16.1 Protocol</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-400 font-mono font-bold">•</span> Pydantic 2.13 Strict Schemas</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-400 font-mono font-bold">•</span> html2canvas & jsPDF Export</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-400 font-mono font-bold">•</span> 1-Click Startup Automation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section: Direct File Links & Terminal Command */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-6">
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            Direct File Paths on Your Machine
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            If you are running the project locally, these files are saved in your project repository:
          </p>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300 truncate">InterviewX/README.md</span>
              <span className="text-[10px] text-slate-500 font-sans">Raw Markdown</span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300 truncate">InterviewX/TECH_STACK.md</span>
              <span className="text-[10px] text-slate-500 font-sans">Raw Markdown</span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300 truncate">InterviewX/client/public/downloads/README.html</span>
              <span className="text-[10px] text-slate-500 font-sans">Styled HTML with Print & PDF</span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300 truncate">InterviewX/client/public/downloads/TECH_STACK.html</span>
              <span className="text-[10px] text-slate-500 font-sans">Styled HTML with Print & PDF</span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
              <span className="text-emerald-400 truncate">InterviewX/client/public/downloads/InterviewX_Documentation_Bundle.zip</span>
              <span className="text-[10px] text-emerald-500 font-sans">Zipped Bundle</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
