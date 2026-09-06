"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Award,
  TrendingUp,
  Clock,
  Eye,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import CompetencyRadar from "@/components/CompetencyRadar";
import GeminiAssistantModal from "@/components/GeminiAssistantModal";
import { FinalInterviewReport, QuestionEvaluationItem } from "@/types/interview";
import { useAuth } from "@/context/AuthContext";

export default function ReportPage() {
  const { user } = useAuth();
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [report, setReport] = useState<FinalInterviewReport | null>(null);
  const [candidatePhoto, setCandidatePhoto] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>("q1");
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [clarifyQuestionText, setClarifyQuestionText] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPhoto = localStorage.getItem("interviewx_candidate_photo");
      if (savedPhoto) {
        setCandidatePhoto(savedPhoto);
      }
    }

    const raw =
      localStorage.getItem("interviewx_final_report") ||
      localStorage.getItem("preppulse_final_report");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setReport(parsed);
      } catch (e) {
        console.error("Failed to parse report:", e);
      }
    } else {
      // High-quality mock report if accessed directly
      const mockReport: FinalInterviewReport = {
        overall_score: 84,
        rating_tier: "Strong Hire",
        breakdown: {
          technical: 86.0,
          delivery: 81.5,
          relevance: 88.0,
          eye_contact: 84.0,
        },
        radar_competencies: {
          Technical: 86,
          Delivery: 82,
          Relevance: 88,
          Clarity: 85,
          Confidence: 80,
          "Eye Contact": 84,
        },
        summary_stats: {
          total_words: 420,
          avg_wpm: 142.5,
          total_fillers: 4,
          avg_eye_contact: 84.0,
          total_duration_seconds: 185.0,
        },
        key_strengths: [
          "Thorough explanation of distributed state synchronization trade-offs",
          "Maintained strong conversational composure and clear pacing (142 WPM)",
          "Direct eye contact remained above 80% throughout technical explanations",
        ],
        priority_improvements: [
          "Delve deeper into operational failure recovery and automated telemetry",
          "Eliminate subtle vocal fillers ('like', 'basically') during technical pauses",
        ],
        executive_summary:
          "Candidate demonstrated Strong Hire readiness for the Mid-Level Full-Stack Engineer role. Technical proficiency scored 86/100 with an 88% relevance match to the target JD. Delivery pacing was well within optimal range with consistent eye contact.",
        questions: [
          {
            question_id: "q1",
            question_text: "How do you establish end-to-end type safety and contract verification between your frontend and backend APIs?",
            category: "Technical",
            transcript: "In our applications, we use TypeScript on the client side coupled with OpenAPI schemas generated from our backend FastAPI endpoints. We use Pydantic models on the server which guarantee strict deserialization and runtime validation. For client consumption, we generate TypeScript interfaces automatically using an openapi-generator CI task, ensuring compile-time contract safety.",
            duration_seconds: 42.0,
            wpm: 140.0,
            filler_count: 1,
            eye_contact_score: 88.0,
            technical_score: 92,
            relevance_score: 94,
            clarity_score: 90,
            confidence_score: 88,
            delivery_score: 90.0,
            weighted_score: 91.6,
            strengths: ["Clear explanation of OpenAPI schema generator", "Highlighted runtime vs compile-time guarantees"],
            weaknesses: ["Could mention how to handle breaking change migrations or schema versioning"],
            critique: "Superb answer! Demonstrates senior architectural intuition by differentiating runtime Pydantic validation from client compile-time TypeScript types.",
            model_answer: "I structure end-to-end contract safety through single-source-of-truth schemas. In FastAPI, Pydantic models define our request/response payloads, from which an OpenAPI JSON spec is generated on CI build. Tools like openapi-typescript-codegen then generate immutable client SDKs. We also enforce backwards compatibility via automated breaking-change detection tests in our CI pipeline.",
          },
          {
            question_id: "q2",
            question_text: "Walk me through your design for a real-time collaborative feature supporting thousands of concurrent active rooms.",
            category: "System Design",
            transcript: "For a real-time collaborative workspace, I would leverage WebSockets for bidirectional communication. To handle thousands of rooms across multiple backend instances, we need a distributed Pub/Sub message broker like Redis or Kafka. Each room maintains an in-memory document state with CRDTs to resolve conflict-free concurrent edits without requiring distributed locks. When users disconnect, the state is persisted to PostgreSQL.",
            duration_seconds: 48.0,
            wpm: 145.0,
            filler_count: 2,
            eye_contact_score: 82.0,
            technical_score: 88,
            relevance_score: 90,
            clarity_score: 86,
            confidence_score: 84,
            delivery_score: 85.0,
            weighted_score: 86.7,
            strengths: ["Correctly identified CRDTs for conflict resolution", "Separated transient WebSocket state from durable DB storage"],
            weaknesses: ["Address heartbeat and reconnection backoff protocols under sudden network disconnects"],
            critique: "Strong system design response with sensible distributed building blocks. Excellent choice of CRDTs over pessimistic locking.",
            model_answer: "I recommend a horizontally scalable WebSocket cluster sitting behind an Application Load Balancer with sticky routing or Redis Pub/Sub for room federation. State synchronization is governed by CRDTs (like Yjs or Automerge) to guarantee convergence without blocking. Offline sync is handled with client-side indexedDB and exponential backoff reconnects.",
          },
          {
            question_id: "q3",
            question_text: "Walk me through how you optimize Core Web Vitals (specifically LCP and INP) for an interactive, asset-heavy web application.",
            category: "Performance",
            transcript: "To optimize LCP, we prioritize loading the hero elements by using priority hints like fetchpriority='high', converting image assets to AVIF/WebP, and preloading critical web fonts. For INP, we break down long tasks on the main thread using requestIdleCallback or scheduler.yield(), minimize expensive React re-renders with useMemo/useCallback, and debounce high-frequency input handlers.",
            duration_seconds: 40.0,
            wpm: 138.0,
            filler_count: 1,
            eye_contact_score: 85.0,
            technical_score: 85,
            relevance_score: 88,
            clarity_score: 84,
            confidence_score: 82,
            delivery_score: 88.0,
            weighted_score: 85.7,
            strengths: ["Mentioned modern scheduler.yield() and fetchpriority hints", "Clear distinction between rendering (LCP) and responsiveness (INP)"],
            weaknesses: ["Could touch upon SSR/Streaming Hydration trade-offs"],
            critique: "Well-targeted technical response demonstrating modern browser performance literacy.",
            model_answer: "For LCP, optimize resource discovery by inlining critical CSS, serving AVIF with responsive srcset, and setting fetchpriority='high' on the hero image while preconnecting to CDN origins. For INP, eliminate long tasks (>50ms) by yielding to the main thread via scheduler.yield(), decoupling non-critical state updates with useTransition, and offloading heavy compute to Web Workers.",
          },
        ],
      };
      setReport(mockReport);
    }
  }, []);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
      const html2canvasModule = await import("html2canvas");
      const jsPDFModule = await import("jspdf");

      const html2canvas = html2canvasModule.default;
      const jsPDF = jsPDFModule.default;

      // Ensure all content, white text styling, and expanded accordions are captured
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0B0F19",
        logging: false,
        onclone: (clonedDoc) => {
          try {
            clonedDoc.documentElement.classList.add("dark");
            clonedDoc.body.style.backgroundColor = "#0B0F19";
            clonedDoc.body.style.color = "#FFFFFF";

            const el = clonedDoc.querySelector("#printable-report") as HTMLElement;
            if (el) {
              el.style.backgroundColor = "#0B0F19";
              el.style.color = "#FFFFFF";

              // Expand all question accordions so full answers, critiques, and model answers print in the PDF
              const accordions = el.querySelectorAll("[data-accordion-content]");
              accordions.forEach((acc: any) => {
                acc.style.display = "block";
              });

              // Ensure every text node renders with bright, high-contrast colors
              const allElements = el.querySelectorAll("*");
              allElements.forEach((child: any) => {
                const comp = window.getComputedStyle(child);

                // 1. Fix gradient text / transparent text (html2canvas cannot render background-clip: text)
                if (
                  child.classList.contains("text-transparent") ||
                  comp.color === "transparent" ||
                  comp.color === "rgba(0, 0, 0, 0)" ||
                  comp.webkitBackgroundClip === "text" ||
                  comp.backgroundClip === "text"
                ) {
                  child.style.webkitBackgroundClip = "unset";
                  child.style.backgroundClip = "unset";
                  child.style.backgroundImage = "none";
                  child.style.color = "#34D399"; // Vibrant emerald
                }
                // 2. Fix any black or dark text to crisp, high-contrast white
                else if (
                  comp.color === "rgb(0, 0, 0)" ||
                  comp.color === "rgba(0, 0, 0, 1)" ||
                  comp.color === "#000000" ||
                  comp.color === "#000"
                ) {
                  child.style.color = "#FFFFFF";
                }

                // 3. Make muted zinc/slate text significantly lighter for clean PDF readability
                if (child.classList.contains("text-slate-400") || child.classList.contains("text-zinc-400")) {
                  child.style.color = "#CBD5E1";
                }
                if (child.classList.contains("text-slate-500") || child.classList.contains("text-zinc-500")) {
                  child.style.color = "#94A3B8";
                }

                // 4. Ensure card backgrounds are solid dark
                if (comp.backgroundColor === "rgb(255, 255, 255)" || comp.backgroundColor === "rgba(255, 255, 255, 1)") {
                  child.style.backgroundColor = "#0F172A";
                }
              });
            }
          } catch (e) {
            console.warn("Error applying clone PDF styles:", e);
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let position = 0;
      let heightLeft = pdfHeight;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`InterviewX-Evaluation-Report-${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      // Native print dialog fallback
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  if (!report) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Synthesizing comprehensive evaluation report...</span>
        </div>
      </div>
    );
  }

  const toggleExpand = (qId: string) => {
    setExpandedQuestion(expandedQuestion === qId ? null : qId);
  };

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Evaluation Complete
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Interview Performance Report Card
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Practice Again</span>
          </Link>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Generating PDF..." : "Export PDF Report"}</span>
          </button>
        </div>
      </div>

      {/* Printable Report Container */}
      <div
        ref={reportRef}
        id="printable-report"
        className="space-y-6 bg-[#0B0F19] border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl shadow-indigo-950/20 text-white"
      >
        {/* Verified Google & Candidate Profile Header */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {candidatePhoto ? (
              <div className="relative group shrink-0">
                <img
                  src={candidatePhoto}
                  alt={user ? user.name : "Candidate"}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400 shadow-md shadow-emerald-500/20"
                />
                <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-[9px] text-slate-950 font-black px-1.5 py-0.2 rounded-full border border-slate-900 shadow">
                  LIVE
                </span>
              </div>
            ) : user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/80 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-lg shrink-0">
                {user ? user.name[0] : "C"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {user ? user.name : "Alex Chen (Candidate)"}
                </h2>
                <span className="flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{candidatePhoto ? "Live Webcam Verified" : "Google Verified"}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {user ? user.email : "candidate@interviewx.ai"} &bull; InterviewX Certified Technical Evaluation
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono block">
              Evaluation Certified Date
            </span>
            <span className="text-xs font-semibold text-slate-200">
              {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Tier 1: Aggregate Score & Rating Banner */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Overall Score Circle (4 Cols) */}
          <div className="md:col-span-4 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Weighted Overall Score
            </span>
            <div className="relative flex items-center justify-center my-2">
              <div className="w-32 h-32 rounded-full border-4 border-slate-800 flex items-center justify-center bg-slate-950/80">
                <span className="text-5xl font-black bg-gradient-to-br from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  {report.overall_score}
                </span>
              </div>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>{report.rating_tier}</span>
            </div>
            <p className="text-xs text-slate-400 mt-3 font-mono text-[11px]">
              40% Tech &bull; 30% Delivery &bull; 20% Relevance &bull; 10% Vision
            </p>
          </div>

          {/* Metric Breakdown Cards (8 Cols) */}
          <div className="md:col-span-8 grid grid-cols-2 gap-4">
            {/* Technical Depth */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-2">
                <span>Technical Depth (40%)</span>
                <span className="text-indigo-400 font-mono font-bold">{report.breakdown.technical}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                  style={{ width: `${report.breakdown.technical}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400">
                Accuracy, mastery of trade-offs, architecture & code sanity.
              </span>
            </div>

            {/* Delivery & Fluency */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-2">
                <span>Delivery & Fluency (30%)</span>
                <span className="text-cyan-400 font-mono font-bold">{report.breakdown.delivery}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full"
                  style={{ width: `${report.breakdown.delivery}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400">
                WPM pacing, speech cadence, and absence of filler words.
              </span>
            </div>

            {/* Relevance to JD */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-2">
                <span>Relevance to JD (20%)</span>
                <span className="text-violet-400 font-mono font-bold">{report.breakdown.relevance}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full"
                  style={{ width: `${report.breakdown.relevance}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400">
                Targeted alignment with specific role challenges and expectations.
              </span>
            </div>

            {/* Eye Contact & Posture */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-2">
                <span>Eye Contact (10%)</span>
                <span className="text-amber-400 font-mono font-bold">{report.breakdown.eye_contact}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
                  style={{ width: `${report.breakdown.eye_contact}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400">
                MediaPipe gaze centering vector and posture stability.
              </span>
            </div>
          </div>
        </div>

        {/* Tier 2: Competency Radar & Executive Summary */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Radar Chart (5 Cols) */}
          <div className="md:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col items-center">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
              Competency Radar Distribution
            </h3>
            <CompetencyRadar competencies={report.radar_competencies} size={300} />
          </div>

          {/* Executive Summary & Key Highlights (7 Cols) */}
          <div className="md:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                  Executive Evaluation Summary
                </h3>
              </div>
              <p className="text-sm text-slate-100 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                {report.executive_summary}
              </p>
            </div>

            {/* Key Strengths & Growth Areas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900/50">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Key Strengths</span>
                </span>
                <ul className="text-xs text-slate-200 space-y-1">
                  {report.key_strengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-emerald-400">&bull;</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-900/50">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Priority Focus</span>
                </span>
                <ul className="text-xs text-slate-200 space-y-1">
                  {report.priority_improvements.map((imp, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-amber-400">&bull;</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Tier 3: Question-by-Question Deep Dive Analysis */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white tracking-tight">
              Question-by-Question Diagnostic Analysis
            </h3>
            <span className="text-xs text-slate-300">
              {report.questions.length} Question{report.questions.length === 1 ? "" : "s"} Evaluated
            </span>
          </div>

          <div className="space-y-4">
            {report.questions.map((q, idx) => {
              const isExpanded = expandedQuestion === q.question_id;
              return (
                <div
                  key={q.question_id}
                  className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden transition-all"
                >
                  {/* Header Row */}
                  <div
                    onClick={() => toggleExpand(q.question_id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 pr-4">
                      <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                          {q.category}
                        </span>
                        <h4 className="text-sm font-semibold text-white">
                          {q.question_text}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-400">
                          {q.weighted_score}%
                        </span>
                        <span className="text-[10px] text-slate-300 block">
                          {q.wpm} WPM &bull; {q.filler_count} Fillers
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-300" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div
                      data-accordion-content="true"
                      className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-4 text-xs"
                    >
                      {/* Spoken Transcript */}
                      <div>
                        <span className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
                          Candidate Spoken Transcript:
                        </span>
                        <p className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 italic leading-relaxed">
                          &quot;{q.transcript}&quot;
                        </p>
                      </div>

                      {/* AI Critique */}
                      <div>
                        <span className="font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                          AI Coach Evaluation:
                        </span>
                        <p className="text-slate-200 leading-relaxed">
                          {q.critique}
                        </p>
                      </div>

                      {/* Better Answer (Model Senior Response) */}
                      <div className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-900/50">
                        <span className="font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Exemplary &quot;Better Answer&quot; Phrasing:</span>
                        </span>
                        <p className="text-slate-200 italic leading-relaxed">
                          {q.model_answer}
                        </p>
                      </div>

                      {/* Gemini Clarify Doubts Button */}
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setClarifyQuestionText(q.question_text);
                            setIsAssistantOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Ask Gemini to clarify or deep-dive this topic</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gemini AI Assistant Modal */}
      <GeminiAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        questionText={clarifyQuestionText || "Interview Report Performance"}
      />
    </div>
  );
}