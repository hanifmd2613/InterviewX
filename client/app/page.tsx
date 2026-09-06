"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  GraduationCap,
  FileText,
  Sparkles,
  ArrowRight,
  Zap,
  CheckCircle2,
  Video,
  Mic,
  Cpu,
  ShieldCheck,
  BookOpen,
  Download,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const PRESET_ROLES = [
  "Full-Stack Engineer",
  "Frontend Engineer (React / Next.js)",
  "Backend & Distributed Systems Engineer",
  "Machine Learning / AI Engineer",
  "DevOps & Cloud Architect",
  "Technical Product Manager",
];

const EXPERIENCE_LEVELS = [
  "Junior (0-2 years)",
  "Mid-Level (3-5 years)",
  "Senior (5-8 years)",
  "Staff / Principal (8+ years)",
];

const SAMPLE_JDS: Record<string, string> = {
  "Full-Stack Engineer": `We are seeking a Senior Full-Stack Engineer to lead development on high-scale web platforms.
Responsibilities:
- Build responsive, accessible frontends using Next.js 14 App Router, React, and TypeScript.
- Design resilient microservices with Python (FastAPI) or Node.js, integrating WebSocket real-time pipelines.
- Architect high-throughput PostgreSQL and Redis caching layers.
- Optimize Core Web Vitals (LCP, INP) and diagnose frontend/backend latency bottlenecks.
Requirements: Strong proficiency in system design, distributed data handling, and automated CI/CD pipelines.`,
  "Frontend Engineer (React / Next.js)": `Seeking a specialist Frontend Engineer to drive our core user experience.
Responsibilities:
- Architect component libraries using React 18/19, Tailwind CSS, and headless UI patterns.
- Deliver sub-second Largest Contentful Paint and zero-layout shift interfaces.
- Integrate Web Audio API and WebRTC/WebSockets for interactive media.
Requirements: Deep mastery of the DOM, browser rendering performance, memory profiling, and modern state machines.`,
  "Backend & Distributed Systems Engineer": `Join our Core Platform team to scale distributed backend pipelines.
Responsibilities:
- Build distributed event-driven systems using Kafka, Redis, and high-concurrency APIs.
- Ensure strict idempotency, fault tolerance, and database transaction isolation.
- Lead root-cause analysis on complex production outages and telemetry metrics.
Requirements: In-depth understanding of database internals, concurrency locks, and distributed consensus.`,
};

export default function RoleConfigPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [targetRole, setTargetRole] = useState(PRESET_ROLES[0]);
  const [customRole, setCustomRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState(EXPERIENCE_LEVELS[1]);
  const [jobDescription, setJobDescription] = useState(SAMPLE_JDS[PRESET_ROLES[0]]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  const activeRole = customRole.trim() ? customRole.trim() : targetRole;

  const handleRoleSelect = (role: string) => {
    setTargetRole(role);
    setCustomRole("");
    if (SAMPLE_JDS[role]) {
      setJobDescription(SAMPLE_JDS[role]);
    }
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      setLoadingStep("Connecting to InterviewX Engine...");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      setLoadingStep("Calibrating 5-question interview plan with Gemini 2.5...");
      const res = await fetch(`${apiUrl}/api/init-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_role: activeRole,
          experience_level: experienceLevel,
          job_description: jobDescription,
          user_id: user?.id,
          user_email: user?.email,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setLoadingStep("Provisioning real-time multimodal room...");

      localStorage.setItem("interviewx_session", JSON.stringify(data));
      localStorage.setItem("preppulse_session", JSON.stringify(data));

      // Navigate to interview room
      router.push("/interview");
    } catch (err) {
      console.warn("API initialization fallback mode:", err);
      setLoadingStep("Initializing local offline simulation plan...");

      // Graceful offline fallback plan
      const fallbackSession = {
        session_id: "local-" + Date.now(),
        target_role: activeRole,
        experience_level: experienceLevel,
        job_description: jobDescription,
        questions: [
          {
            id: "q1",
            question: `How do you approach architectural design and state synchronization in a high-scale ${activeRole} project?`,
            category: "Technical Architecture",
            difficulty: "Medium",
            expected_focus: "Modularity, separation of concerns, scalability, state isolation",
          },
          {
            id: "q2",
            question: `Based on your target JD, how would you design an idempotent real-time data or audio pipeline that gracefully handles high network latency?`,
            category: "System Design",
            difficulty: "Hard",
            expected_focus: "WebSockets, backpressure, idempotency, retry mechanisms",
          },
          {
            id: "q3",
            question: "Describe your methodology for optimizing end-to-end performance and diagnosing subtle memory leaks or frame drops.",
            category: "Performance & Profiling",
            difficulty: "Hard",
            expected_focus: "Chrome DevTools, profiling, event listeners, heap snapshots",
          },
          {
            id: "q4",
            question: "Walk me through a production failure or critical bug you investigated under high pressure. What was your triage protocol?",
            category: "Troubleshooting",
            difficulty: "Medium",
            expected_focus: "Systematic root cause analysis, telemetry, blameless post-mortem",
          },
          {
            id: "q5",
            question: "Tell me about a time you had to align cross-functional stakeholders on a controversial engineering decision.",
            category: "Behavioral & Leadership",
            difficulty: "Medium",
            expected_focus: "Communication, empathy, trade-off clarity, business outcomes",
          },
        ],
      };

      localStorage.setItem("interviewx_session", JSON.stringify(fallbackSession));
      localStorage.setItem("preppulse_session", JSON.stringify(fallbackSession));
      setTimeout(() => {
        router.push("/interview");
      }, 700);
    }
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8 flex flex-col justify-center relative">
      {/* Ambient background glows for attractive depth */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-500/15 via-purple-500/10 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-1/3 -left-40 w-[450px] h-[450px] bg-blue-600/10 blur-3xl rounded-full" />
        <div className="absolute bottom-10 -right-40 w-[450px] h-[450px] bg-violet-600/10 blur-3xl rounded-full" />
      </div>

      {/* Platform Badge */}
      <div className="relative z-10 flex items-center justify-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-medium tracking-wide shadow-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span>InterviewX &bull; Autonomous Technical Interview Platform</span>
        </div>
      </div>

      {/* Main Title */}
      <div className="relative z-10 text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
          Master Your Next{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Technical Interview
          </span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Simulated high-stakes interviews with real-time vocal cadence analytics, computer vision attention tracking, and comprehensive Gemini-powered technical critique.
        </p>

        <div className="mt-5 flex items-center justify-center gap-3">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700/80 hover:border-indigo-500/50 shadow-md shadow-black/30 transition-all hover:scale-105"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>View & Download Architecture & Tech Stack</span>
          </Link>
          <a
            href="/downloads/InterviewX_Documentation_Bundle.zip"
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition-all hover:scale-105"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All (.zip)</span>
          </a>
        </div>
      </div>

      {/* 3 Core Capabilities */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 transition-colors flex items-start gap-3 shadow-md shadow-slate-950/40">
          <div className="p-2.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-xs sm:text-sm">Gaze & Posture Analysis</h3>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Monitors visual attention and head stability in real-time to build natural on-camera poise.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition-colors flex items-start gap-3 shadow-md shadow-slate-950/40">
          <div className="p-2.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shrink-0">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-xs sm:text-sm">Speech Cadence & Fillers</h3>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Dynamically gauges words-per-minute pacing and eliminates verbal filler word habits.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition-colors flex items-start gap-3 shadow-md shadow-slate-950/40">
          <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-xs sm:text-sm">Objective Technical Rubric</h3>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Scores technical depth and architecture mastery with 1-click exportable PDF report cards.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="relative z-10 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-indigo-950/20">
        <form onSubmit={handleStartInterview} className="space-y-6">
          {/* Target Role Selector */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              <span>Target Engineering Role</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {PRESET_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs text-left border transition-all ${
                    targetRole === role && !customRole
                      ? "bg-indigo-600 border-indigo-500 text-white font-semibold shadow-md shadow-indigo-500/25 scale-[1.01]"
                      : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-indigo-500/40 hover:text-white"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Or specify a custom role (e.g. Platform Infrastructure Lead)..."
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
            />
          </div>

          {/* Experience Level */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Seniority & Experience</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setExperienceLevel(level)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs border transition-all text-center ${
                    experienceLevel === level
                      ? "bg-indigo-600 border-indigo-500 text-white font-semibold shadow-md shadow-indigo-500/25 scale-[1.01]"
                      : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-indigo-500/40 hover:text-white"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Job Description (JD) Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Job Description / Key Requirements</span>
              </label>
              <span className="text-[11px] text-indigo-300/80 font-mono">
                Used to tailor interview questions
              </span>
            </div>
            <textarea
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste target job description or requirements here..."
              className="w-full p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors leading-relaxed font-mono"
            />
          </div>

          {/* Launch Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
              isLoading
                ? "bg-slate-800 cursor-not-allowed text-slate-500"
                : "bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.01] active:scale-[0.99]"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{loadingStep || "Preparing interview session..."}</span>
              </div>
            ) : (
              <>
                <span>Enter Interview Room</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
