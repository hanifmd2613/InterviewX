"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  LogOut,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  Brain,
  Radio,
  Sliders,
  RefreshCw,
  Camera,
  CameraOff,
  Edit3,
  Check,
  X,
  Send,
  User,
  ArrowRight,
  Award,
  SkipForward,
  Maximize2,
  Minimize2,
  GripHorizontal,
} from "lucide-react";

import { motion } from "framer-motion";
import WebcamTracker from "@/components/WebcamTracker";
import GeminiAssistantModal from "@/components/GeminiAssistantModal";
import VoiceSettingsModal from "@/components/VoiceSettingsModal";
import { useSpeechAnalysis } from "@/hooks/useSpeechAnalysis";
import { useVoiceInterviewer } from "@/hooks/useVoiceInterviewer";
import { useAuth } from "@/context/AuthContext";
import {
  InterviewQuestion,
  QuestionEvaluationItem,
  FinalInterviewReport,
  WSIncomingMessage,
  ConversationalTurnResponse,
  DialogueMessage,
  QuestionExplanationResponse,
} from "@/types/interview";

export default function InterviewRoomPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [sessionId, setSessionId] = useState<string>("");
  const [targetRole, setTargetRole] = useState<string>("Full-Stack Engineer");
  const [experienceLevel, setExperienceLevel] = useState<string>("Mid-Level");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  const [dialogueHistory, setDialogueHistory] = useState<DialogueMessage[]>([]);
  const [latestAIThought, setLatestAIThought] = useState<string>(
    "Analyzing your background to ask relevant architectural questions..."
  );
  const [currentTopic, setCurrentTopic] = useState<string>("Technical Architecture");
  const [activeSpokenQuestion, setActiveSpokenQuestion] = useState<string>("");
  const [isSelfThinking, setIsSelfThinking] = useState<boolean>(false);

  const [evaluations, setEvaluations] = useState<QuestionEvaluationItem[]>([]);
  const [currentEvaluation, setCurrentEvaluation] = useState<QuestionEvaluationItem | null>(null);

  const [questionExplanation, setQuestionExplanation] = useState<QuestionExplanationResponse | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isSpeakingExplanation, setIsSpeakingExplanation] = useState<boolean>(false);

  const [eyeContact, setEyeContact] = useState<number>(85);
  const [postureStable, setPostureStable] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>("AI Interviewer Ready");
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState<boolean>(false);
  const [showCamera, setShowCamera] = useState<boolean>(true);
  const [isCameraExpanded, setIsCameraExpanded] = useState<boolean>(false);
  const [isTypingMode, setIsTypingMode] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);

  const {
    isSpeaking,
    speak,
    stopSpeaking,
    unlockAudio,
    selectedVoice,
    availableVoices,
    speechRate,
    setSpeechRate,
    setSelectedVoice,
    testVoice,
  } = useVoiceInterviewer();

  const {
    isListening,
    transcript,
    wordCount,
    wpm,
    fillerCount,
    speechDuration,
    micLevel,
    isSoundDetected,
    micError,
    speechLang,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    isTranscribingWithGemini,
    micDiagnostic,
    runMicDiagnosticTest,
    setSpeechLang,
    startListening,
    stopListening,
    manualSetTranscript,
  } = useSpeechAnalysis();

  const handleAISpeechFinished = useCallback(() => {
    setStatusMessage("AI finished speaking. Click 'Start Speaking' whenever you are ready.");
  }, []);

  useEffect(() => {
    const raw =
      localStorage.getItem("interviewx_session") ||
      localStorage.getItem("preppulse_session");
    if (raw) {
      try {
        const session = JSON.parse(raw);
        setSessionId(session.session_id || "default-session");
        setTargetRole(session.target_role || "Full-Stack Engineer");
        setExperienceLevel(session.experience_level || "Mid-Level");
        setJobDescription(session.job_description || "");
        if (session.questions && session.questions.length > 0) {
          setQuestions(session.questions);
          const initialQ = session.questions[0].question;
          setActiveSpokenQuestion(initialQ);

          const welcomeMsg: DialogueMessage = {
            id: "msg-0",
            sender: "interviewer",
            text: `Hello! I'm your AI Interviewer. We're hiring for a ${session.experience_level || "Mid-Level"} ${session.target_role || "Full-Stack Engineer"}. Here is your first question: ${initialQ}`,
            timestamp: "Start",
            reasoning: "Opening interview with core architectural baseline calibrated to candidate experience level.",
          };
          setDialogueHistory([welcomeMsg]);

          setTimeout(() => {
            speak(welcomeMsg.text, handleAISpeechFinished);
          }, 800);
        }
      } catch (err) {
        console.error("Failed to parse stored session:", err);
      }
    } else {
      const initialQ = "How do you ensure state synchronization and avoid race conditions in asynchronous distributed architectures?";
      setActiveSpokenQuestion(initialQ);
      setSessionId("local-" + Date.now());
      const welcomeMsg: DialogueMessage = {
        id: "msg-0",
        sender: "interviewer",
        text: `Hello! I'm your AI Interviewer. To kick things off: ${initialQ}`,
        timestamp: "Start",
        reasoning: "Probing distributed systems concurrency primitives.",
      };
      setDialogueHistory([welcomeMsg]);
      setTimeout(() => {
        speak(welcomeMsg.text, handleAISpeechFinished);
      }, 800);
    }
  }, [speak, handleAISpeechFinished]);

  useEffect(() => {
    if (!sessionId) return;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/interview";
    const fullWsUrl = `${wsUrl}?session_id=${encodeURIComponent(sessionId)}`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(fullWsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatusMessage("AI Interview Coach Connected");
        ws.send(JSON.stringify({ type: "bind_session", session_id: sessionId }));
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSIncomingMessage = JSON.parse(event.data);

          if (msg.type === "interviewer_voice_turn") {
            setIsSelfThinking(false);
            const turn: ConversationalTurnResponse = msg.data;

            if (turn.internal_reasoning) {
              setLatestAIThought(turn.internal_reasoning);
            }
            if (turn.topic_category) {
              setCurrentTopic(turn.topic_category);
            }

            const aiMsg: DialogueMessage = {
              id: "ai-" + Date.now(),
              sender: "interviewer",
              text: turn.interviewer_speech,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              reasoning: turn.internal_reasoning,
              intent: turn.detected_candidate_intent,
              quick_feedback: turn.quick_feedback || undefined,
            };
            setDialogueHistory((prev) => [...prev, aiMsg]);
            setActiveSpokenQuestion(turn.interviewer_speech);

            speak(turn.interviewer_speech, handleAISpeechFinished);
          } else if (msg.type === "final_report") {
            localStorage.setItem("interviewx_final_report", JSON.stringify(msg.data));
            localStorage.setItem("preppulse_final_report", JSON.stringify(msg.data));
            router.push("/report");
          }
        } catch (e) {
          console.error("Error parsing WS message:", e);
        }
      };

      ws.onerror = () => {
        setStatusMessage("Operating in Intelligent Offline Mode");
      };
    } catch (e) {
      console.warn("WS setup warning:", e);
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [sessionId, router, speak, handleAISpeechFinished]);

  const explanationCacheRef = useRef<Record<string, QuestionExplanationResponse>>({});

  useEffect(() => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;
    const qId = currentQ.id || `q${currentQuestionIndex + 1}`;
    if (explanationCacheRef.current[qId]) return;

    const prefetch = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        await fetch(`${apiUrl}/api/explain-question`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            question_id: qId,
            question_text: currentQ.question,
          }),
        });
      } catch (e) {}
    };
    prefetch();
  }, [currentQuestionIndex, questions, sessionId, targetRole, experienceLevel, jobDescription]);

  const handleExplainQuestionAloud = async () => {
    if (isSpeakingExplanation) {
      stopSpeaking();
      setIsSpeakingExplanation(false);
      return;
    }

    unlockAudio();
    stopListening();
    stopSpeaking();

    const activeQ = questions[currentQuestionIndex]?.question || activeSpokenQuestion;
    if (!activeQ) return;

    const curQ = questions[currentQuestionIndex];
    const qId = curQ?.id || `q${currentQuestionIndex + 1}`;

    setShowExplanation(true);

    const cached = explanationCacheRef.current[qId];
    if (cached) {
      setQuestionExplanation(cached);
      setIsLoadingExplanation(false);
      setIsSpeakingExplanation(true);
      unlockAudio();
      speak(
        cached.voice_explanation_script || cached.plain_english_meaning,
        () => setIsSpeakingExplanation(false),
        { force: true }
      );
      return;
    }

    setIsLoadingExplanation(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/explain-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: qId,
          question_text: activeQ,
        }),
      });
      if (res.ok) {
        const data: QuestionExplanationResponse = await res.json();
        explanationCacheRef.current[qId] = data;
        setQuestionExplanation(data);
        setIsLoadingExplanation(false);
        setIsSpeakingExplanation(true);
        unlockAudio();
        speak(
          data.voice_explanation_script || data.plain_english_meaning,
          () => setIsSpeakingExplanation(false),
          { force: true }
        );
      } else {
        throw new Error("Failed to fetch explanation");
      }
    } catch (e) {
      setIsLoadingExplanation(false);
      const fallbackMsg = `Here is what the question is asking: ${activeQ}. Frame your response with your technical approach, specific tools, and real-world trade-offs.`;
      unlockAudio();
      speak(fallbackMsg, () => setIsSpeakingExplanation(false), { force: true });
    }
  };

  const handleFinishVoiceTurn = async () => {
    setIsSelfThinking(true);
    setStatusMessage("Processing your response with Gemini...");

    const spokenText = (await stopListening()) || transcript.trim() || manualText.trim();

    if (!spokenText) {
      setIsSelfThinking(false);
      setStatusMessage("No speech was detected. Please speak into your mic or type your answer below.");
      return;
    }

    setManualText("");

    const candMsg: DialogueMessage = {
      id: "cand-" + Date.now(),
      sender: "candidate",
      text: spokenText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const updatedHistory = [...dialogueHistory, candMsg];
    setDialogueHistory(updatedHistory);

    const curQ = questions[currentQuestionIndex];
    const qId = curQ?.id || `q${currentQuestionIndex + 1}`;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "submit_answer",
          question_id: qId,
          transcript: spokenText,
        })
      );
    } else {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/conversational-turn`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            candidate_utterance: spokenText,
            dialogue_history: updatedHistory.map((m) => ({ sender: m.sender, text: m.text })),
          }),
        });

        if (res.ok) {
          const turn: ConversationalTurnResponse = await res.json();
          setIsSelfThinking(false);
          if (turn.internal_reasoning) setLatestAIThought(turn.internal_reasoning);
          if (turn.topic_category) setCurrentTopic(turn.topic_category);

          const aiMsg: DialogueMessage = {
            id: "ai-" + Date.now(),
            sender: "interviewer",
            text: turn.interviewer_speech,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            reasoning: turn.internal_reasoning,
            intent: turn.detected_candidate_intent,
            quick_feedback: turn.quick_feedback || undefined,
          };
          setDialogueHistory((prev) => [...prev, aiMsg]);
          setActiveSpokenQuestion(turn.interviewer_speech);
          speak(turn.interviewer_speech, handleAISpeechFinished);
        }
      } catch (err) {
        setIsSelfThinking(false);
        console.error("Conversational turn REST fallback failed:", err);
      }
    }
  };

  const handleNextQuestion = () => {
    stopSpeaking();
    stopListening();
    setIsSpeakingExplanation(false);

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      const nextQ = questions[nextIndex];
      setActiveSpokenQuestion(nextQ.question);
      setCurrentTopic(nextQ.category || "Technical");
      manualSetTranscript("");
      setManualText("");
      setCurrentEvaluation(null);
      setShowExplanation(false);
      setQuestionExplanation(null);

      const introMsg = `Moving on to Question ${nextIndex + 1}: ${nextQ.question}`;
      speak(introMsg, handleAISpeechFinished);
    } else {
      handleEndInterview();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      stopSpeaking();
      stopListening();
      setIsSpeakingExplanation(false);
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      const prevQ = questions[prevIndex];
      setActiveSpokenQuestion(prevQ.question);
      setCurrentTopic(prevQ.category || "Technical");
      manualSetTranscript("");
      setManualText("");
      setCurrentEvaluation(null);
      setShowExplanation(false);
      setQuestionExplanation(null);

      const introMsg = `Returning to Question ${prevIndex + 1}: ${prevQ.question}`;
      speak(introMsg);
    }
  };

  const handleSelectQuestion = (index: number) => {
    if (index === currentQuestionIndex || index < 0 || index >= questions.length) return;
    stopSpeaking();
    stopListening();
    setIsSpeakingExplanation(false);
    setCurrentQuestionIndex(index);
    const targetQ = questions[index];
    setActiveSpokenQuestion(targetQ.question);
    setCurrentTopic(targetQ.category || "Technical");
    manualSetTranscript("");
    setManualText("");
    setCurrentEvaluation(null);
    setShowExplanation(false);
    setQuestionExplanation(null);

    const introMsg = `Question ${index + 1}: ${targetQ.question}`;
    speak(introMsg, handleAISpeechFinished);
  };

  const handleSkipQuestion = () => {
    stopSpeaking();
    stopListening();
    setIsSpeakingExplanation(false);
    const currentQ = questions[currentQuestionIndex];
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentQ) {
      wsRef.current.send(JSON.stringify({ type: "skip_question", question_id: currentQ.id }));
    }
    handleNextQuestion();
  };

  const handleEndInterview = async () => {
    stopSpeaking();
    stopListening();
    setStatusMessage("Compiling comprehensive interview assessment report...");

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "request_final_report" }));
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/finalize-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          target_role: targetRole,
          experience_level: experienceLevel,
          dialogue_history: dialogueHistory,
          evaluations: evaluations,
        }),
      });

      if (res.ok) {
        const reportData: FinalInterviewReport = await res.json();
        localStorage.setItem("interviewx_final_report", JSON.stringify(reportData));
        localStorage.setItem("preppulse_final_report", JSON.stringify(reportData));
        router.push("/report");
      } else {
        router.push("/report");
      }
    } catch (e) {
      router.push("/report");
    }
  };

  const currentQ = questions[currentQuestionIndex];
  const questionText = currentQ?.question || activeSpokenQuestion || "Loading question...";
  const displayTranscript = transcript || manualText;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Ambient background glows for attractive depth */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[380px] bg-gradient-to-b from-indigo-500/15 via-purple-500/10 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-1/3 -left-40 w-[450px] h-[450px] bg-blue-600/10 blur-3xl rounded-full" />
        <div className="absolute bottom-10 -right-40 w-[450px] h-[450px] bg-violet-600/10 blur-3xl rounded-full" />
      </div>

      <header className="relative z-20 border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-xl px-4 lg:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/25">
              <span className="font-mono text-xs font-bold text-white tracking-wider">IX</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                Interview<span className="text-indigo-400 font-semibold">X</span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                  {targetRole}
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {experienceLevel} &bull; Technical Mock Interview
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full">
            <span className="text-xs font-medium text-slate-300 mr-1.5">
              Q{currentQuestionIndex + 1}/{questions.length || 5}
            </span>
            {(questions.length > 0 ? questions : [1, 2, 3, 4, 5]).map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              const isPassed = idx < currentQuestionIndex;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectQuestion(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    isCurrent
                      ? "bg-indigo-400 ring-4 ring-indigo-500/30 scale-125"
                      : isPassed
                      ? "bg-emerald-400"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                  title={`Jump to Question ${idx + 1}`}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCamera(!showCamera)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showCamera
                  ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
                  : "bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200"
              }`}
              title="Toggle Webcam Preview"
            >
              {showCamera ? <Camera className="w-3.5 h-3.5 text-cyan-400" /> : <CameraOff className="w-3.5 h-3.5 text-slate-500" />}
              <span className="hidden sm:inline">Camera</span>
            </button>

            <button
              onClick={() => setIsVoiceSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-indigo-300 text-xs font-medium transition-colors"
              title="Voice & Speech Rate Settings"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Voice</span>
            </button>

            <button
              onClick={handleEndInterview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition-colors"
              title="Finish interview and get final report"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">End</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 py-6 md:py-8 flex flex-col gap-6">
        <section className="rounded-2xl bg-slate-900/70 border border-slate-800/90 p-6 md:p-8 backdrop-blur-xl shadow-xl shadow-indigo-950/20 relative overflow-hidden transition-all">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isSpeaking
                  ? "bg-indigo-500/20 text-indigo-300 ring-2 ring-indigo-400/50"
                  : "bg-slate-800/90 text-indigo-300 border border-slate-700/80"
              }`}>
                <Bot className="w-5 h-5 text-indigo-400" />
                {isSpeaking && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200">AI Senior Interviewer</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/15 border border-violet-500/30 text-violet-300">
                    {currentTopic}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isSpeaking ? "Speaking question out loud..." : "Listening for your response"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  unlockAudio();
                  speak(questionText, undefined, { force: true });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-indigo-300 text-xs font-medium border border-slate-700/80 transition-colors active:scale-95"
                title="Listen to this question out loud"
              >
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Read Question</span>
              </button>

              <button
                type="button"
                onClick={handleExplainQuestionAloud}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isSpeakingExplanation
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse"
                    : isLoadingExplanation
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                    : "bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300"
                }`}
                title="Get plain-English breakdown of what this question is testing"
              >
                {isSpeakingExplanation ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-300" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Explain Simply</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsAssistantOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-colors"
                title="Ask a doubt or clarification about this question"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Ask Doubt</span>
              </button>
            </div>
          </div>

          <div className="py-5">
            <h2 className="text-xl md:text-2xl font-normal text-white leading-relaxed tracking-normal font-sans">
              {questionText}
            </h2>
          </div>

          {showExplanation && questionExplanation && (
            <div className="mt-2 p-5 rounded-xl bg-slate-950/80 border border-indigo-500/30 text-slate-200 text-xs space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-indigo-300 text-xs flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  Plain-English Breakdown
                </span>
                <button
                  onClick={() => setShowExplanation(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  Close &times;
                </button>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
                {questionExplanation.plain_english_meaning}
              </p>
              {questionExplanation.suggested_opening_sentence && (
                <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
                  <strong className="text-indigo-300">Suggested Opening: </strong> &ldquo;{questionExplanation.suggested_opening_sentence}&rdquo;
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-slate-900/60 border border-slate-800/90 p-6 md:p-8 backdrop-blur-xl shadow-xl shadow-indigo-950/15 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Your Answer
              </span>
              <span className="text-[11px] text-indigo-300/90 font-mono">
                ({wordCount} words)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {audioDevices.length > 0 && (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 max-w-[170px] truncate focus:outline-none focus:border-indigo-500"
                  title="Select Microphone Hardware"
                >
                  {audioDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={speechLang}
                onChange={(e) => setSpeechLang(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                title="Select Speech Accent Dialect"
              >
                <option value="en-US">English (US)</option>
                <option value="en-IN">English (India)</option>
                <option value="en-GB">English (UK)</option>
                <option value="en-AU">English (AU)</option>
              </select>

              <button
                type="button"
                onClick={runMicDiagnosticTest}
                disabled={isListening || micDiagnostic?.testing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-xs text-sky-300 font-medium transition-colors"
                title="Quick 3-second sound check"
              >
                {micDiagnostic?.testing ? (
                  <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                )}
                <span>{micDiagnostic?.testing ? "Testing..." : "Test Mic"}</span>
              </button>
            </div>
          </div>

          {micDiagnostic && (
            <div className={`p-3 rounded-xl text-xs flex items-center justify-between border transition-all ${
              micDiagnostic.testing
                ? "bg-sky-500/10 border-sky-500/30 text-sky-300"
                : micDiagnostic.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300"
            }`}>
              <div className="flex items-center gap-2.5">
                {micDiagnostic.testing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
                ) : micDiagnostic.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span>{micDiagnostic.message}</span>
              </div>
              {!micDiagnostic.testing && (
                <button
                  onClick={() => runMicDiagnosticTest()}
                  className="text-slate-300 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700"
                >
                  Test Again
                </button>
              )}
            </div>
          )}

          {micError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{micError}</span>
            </div>
          )}

          {isTranscribingWithGemini && (
            <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              <span>Gemini Neural Transcriber is processing your voice audio...</span>
            </div>
          )}

          <div className="flex flex-col items-center justify-center py-4 text-center">
            {/* If user is in Typing Mode */}
            {isTypingMode ? (
              <div className="w-full space-y-3">
                <textarea
                  rows={4}
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Type your answer here clearly and comprehensively..."
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors resize-none"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsTypingMode(false)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Switch to Voice Input</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFinishVoiceTurn}
                    disabled={!manualText.trim() || isSelfThinking}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Typed Answer</span>
                  </button>
                </div>
              </div>
            ) : !isListening ? (
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={startListening}
                  disabled={isSpeaking || isSelfThinking}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-sm shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mic className="w-4 h-4 text-white" />
                  </div>
                  <span>Click to Speak Answer</span>
                </button>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>Microphone ready to capture</span>
                  <span>&bull;</span>
                  <button
                    type="button"
                    onClick={() => setIsTypingMode(true)}
                    className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 flex items-center gap-1 transition-colors font-medium"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Prefer to type instead?</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                  <span>Recording in progress &bull; Speak clearly into your mic</span>
                </div>

                {/* Live sound level waveform with colorful gradient */}
                <div className="flex items-center gap-1.5 h-8 justify-center">
                  {[0.4, 0.7, 1.0, 0.6, 0.9, 1.0, 0.7, 0.5].map((mult, i) => {
                    const dynamicHeight = Math.max(
                      6,
                      Math.min(32, Math.round((micLevel / 100) * 26 * mult + (micLevel > 2 ? 6 : 0)))
                    );
                    return (
                      <span
                        key={i}
                        className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 via-violet-400 to-cyan-300 transition-all duration-75"
                        style={{ height: `${dynamicHeight}px` }}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleFinishVoiceTurn}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Done Speaking &bull; Submit Answer</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopListening}
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                    title="Cancel without submitting"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Realtime Transcript Preview Box */}
          {displayTranscript && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800">
                <span className="font-mono text-indigo-400 uppercase tracking-wider text-[10px] font-semibold">
                  Live Transcription
                </span>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-indigo-300">{wordCount} words</span>
                  <span className="text-cyan-300">{wpm} wpm</span>
                  {fillerCount > 0 && (
                    <span className="text-amber-400 font-semibold">
                      {fillerCount} filler {fillerCount === 1 ? "word" : "words"}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">
                {displayTranscript}
              </p>
            </div>
          )}

          {/* Navigation Controls: Prev, Skip, Next */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSkipQuestion}
                className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Skip</span>
              </button>

              <button
                onClick={handleNextQuestion}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.02]"
              >
                <span>
                  {currentQuestionIndex < (questions.length - 1) ? "Next Question" : "Finish Interview"}
                </span>
                {currentQuestionIndex < (questions.length - 1) ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <Award className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Instant Evaluation Feedback Banner & Highlighted Next Question Prompt */}
        {currentEvaluation && (
          <section className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/95 via-indigo-950/20 to-slate-900/95 border border-emerald-500/30 shadow-2xl shadow-emerald-950/20 space-y-4 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Answer Evaluated & Recorded!
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30">
                Score: {Math.round(currentEvaluation.weighted_score)}%
              </span>
            </div>

            {/* Mini Score Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Technical Depth</span>
                <span className="font-mono font-bold text-indigo-300 text-base">{currentEvaluation.technical_score}/100</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Relevance</span>
                <span className="font-mono font-bold text-emerald-400 text-base">{currentEvaluation.relevance_score}/100</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Delivery Pace</span>
                <span className="font-mono font-bold text-violet-300 text-base">{Math.round(currentEvaluation.delivery_score)}/100</span>
              </div>
            </div>

            {/* Critique Note */}
            <p className="text-xs text-slate-200 bg-slate-950/80 p-4 rounded-xl border border-slate-800 leading-relaxed">
              <strong className="text-emerald-400">Coach Feedback: </strong>
              {currentEvaluation.critique}
            </p>

            {/* Prominent Next Question Glowing Button */}
            <button
              onClick={handleNextQuestion}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>
                {currentQuestionIndex < (questions.length - 1)
                  ? `Proceed to Question ${currentQuestionIndex + 2} of ${questions.length || 5}`
                  : "Complete Interview & View Full Performance Report"}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </section>
        )}

        {/* AI Self-Thinking Loading Indicator */}
        {isSelfThinking && (
          <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 flex items-center justify-center gap-3 text-slate-200">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-indigo-300">
              Evaluating answer and formulating the next question...
            </span>
          </div>
        )}

        {/* Conversation History Timeline */}
        <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Interview Dialogue History
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {dialogueHistory.length} turns
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-3 pr-2">
            {dialogueHistory.map((item, idx) => (
              <div
                key={item.id || idx}
                className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                  item.sender === "candidate"
                    ? "bg-indigo-950/40 border border-indigo-500/30 text-slate-100 ml-6 md:ml-12"
                    : "bg-slate-950/80 border border-slate-800 text-slate-200 mr-6 md:mr-12"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`font-semibold text-xs flex items-center gap-1.5 ${
                      item.sender === "candidate" ? "text-indigo-300" : "text-violet-300"
                    }`}
                  >
                    {item.sender === "candidate" ? <User className="w-3.5 h-3.5 text-indigo-400" /> : <Bot className="w-3.5 h-3.5 text-violet-400" />}
                    {item.sender === "candidate" ? "You (Candidate)" : "AI Senior Interviewer"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{item.timestamp}</span>
                </div>
                <p className="text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Movable Picture-in-Picture Webcam Vision Tracker */}
      {showCamera && (
        <motion.div
          drag
          dragMomentum={false}
          className={`fixed top-16 md:top-20 left-4 md:left-6 z-40 transition-all duration-200 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl shadow-indigo-950/30 p-3.5 backdrop-blur-xl space-y-2.5 select-none ${
            isCameraExpanded
              ? "w-[440px] max-w-[calc(100vw-2rem)]"
              : "w-80 md:w-96 max-w-[calc(100vw-2rem)]"
          }`}
        >
          {/* Draggable Window Header Bar */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 cursor-grab active:cursor-grabbing">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 pointer-events-none">
              <GripHorizontal className="w-4 h-4 text-slate-400" />
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              Vision & Posture Tracker
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 hidden sm:inline mr-1 pointer-events-none">
                Drag to move
              </span>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setIsCameraExpanded(!isCameraExpanded)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isCameraExpanded ? "Standard Size" : "Enlarge Video"}
              >
                {isCameraExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowCamera(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Hide Video Tracker"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <WebcamTracker
            onEyeContactUpdate={(score) => setEyeContact(score)}
            onPostureUpdate={(isStable) => setPostureStable(isStable)}
            onCandidatePhotoCaptured={() => setStatusMessage("Candidate webcam photo saved for evaluation report ✓")}
            isActive={showCamera}
          />

          <div className="flex items-center justify-between text-xs text-slate-300 pt-1 px-1 pointer-events-none">
            <span>Eye Contact: <strong className="text-cyan-300 font-mono">{Math.round(eyeContact)}%</strong></span>
            <span>Posture: <strong className={postureStable ? "text-emerald-400" : "text-amber-400"}>{postureStable ? "Good" : "Adjust"}</strong></span>
          </div>
        </motion.div>
      )}

      {/* Floating Gemini AI Assistant Launcher Button */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-xs shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all"
      >
        <Sparkles className="w-4 h-4 text-white" />
        <span>Gemini Doubt Assistant</span>
      </button>

      {/* Gemini AI Assistant Modal */}
      <GeminiAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        questionText={activeSpokenQuestion}
        targetRole={targetRole}
        experienceLevel={experienceLevel}
        sessionId={sessionId}
        ws={wsRef.current}
      />

      {/* Voice & Fluency Tuning Settings Modal */}
      <VoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
        selectedVoice={selectedVoice}
        availableVoices={availableVoices}
        speechRate={speechRate}
        onSelectVoice={setSelectedVoice}
        onSetSpeechRate={setSpeechRate}
        onTestVoice={testVoice}
        isSpeaking={isSpeaking}
        onStopSpeaking={stopSpeaking}
      />
    </div>
  );
}
