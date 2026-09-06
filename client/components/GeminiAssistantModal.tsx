"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  X,
  Bot,
  HelpCircle,
  Lightbulb,
  CheckCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { ClarificationResponse, AssistantChatMessage } from "@/types/interview";
import { optimizeTextForFluency, scoreVoice } from "@/hooks/useVoiceInterviewer";

interface GeminiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId?: string;
  questionText?: string;
  targetRole?: string;
  experienceLevel?: string;
  sessionId?: string;
  ws?: WebSocket | null;
}

const QUICK_PROMPTS = [
  "🎙️ Explain this question in simple terms and how to structure my answer",
  "What assumptions can I state to the interviewer?",
  "How should I structure my answer for this question?",
  "Can you break down the core concept in simple terms?",
  "What are common edge cases or trade-offs here?",
];

export default function GeminiAssistantModal({
  isOpen,
  onClose,
  questionId = "q1",
  questionText = "Active Interview Question",
  targetRole = "Full-Stack Engineer",
  experienceLevel = "Mid-Level",
  sessionId,
  ws,
}: GeminiAssistantModalProps) {
  const [messages, setMessages] = useState<AssistantChatMessage[]>([
    {
      id: "welcome",
      sender: "gemini",
      text: `Hi! I'm your Gemini AI Voice Assistant. If you have any doubts, need clarification on what this question is testing, or want guidance on assumptions to state, speak into your microphone or type below!`,
      timestamp: "Just now",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Speech Recognition setup for Voice Input
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const rec = new SpeechRec();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onresult = (event: any) => {
          let current = "";
          for (let i = 0; i < event.results.length; ++i) {
            current += event.results[i][0].transcript;
          }
          setInputValue(current);
        };

        rec.onerror = (e: any) => {
          console.warn("Assistant speech recognition error:", e);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      } catch (err) {
        console.warn("SpeechRec error:", err);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Toggle Voice Input
  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          setInputValue("");
          recognitionRef.current.start();
          setIsListening(true);
        } catch (err) {
          console.warn("Recognition start error:", err);
        }
      }
    }
  };

  // Text-To-Speech Playback for Gemini's Answers
  const handleSpeakText = (text: string, msgId: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      setSpeakingMsgId(null);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const cleanText = optimizeTextForFluency(text);
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      // Executive 0.94x delivery
      utterance.rate = 0.94;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = "en-US";

      // Select top-ranked natural voice
      const voices = window.speechSynthesis.getVoices();
      const englishVoices = voices
        .filter((v) => v.lang.toLowerCase().startsWith("en"))
        .sort((a, b) => scoreVoice(b) - scoreVoice(a));

      const preferred = englishVoices[0] || voices[0];
      if (preferred) {
        utterance.voice = preferred;
      }

      // GC Protection
      const globalSet = (window as any).__activeSpeechUtterances;
      if (globalSet) {
        globalSet.add(utterance);
      }

      utterance.onstart = () => {
        setSpeakingMsgId(msgId);
      };

      utterance.onend = () => {
        if (globalSet) globalSet.delete(utterance);
        setSpeakingMsgId(null);
      };

      utterance.onerror = () => {
        if (globalSet) globalSet.delete(utterance);
        setSpeakingMsgId(null);
      };

      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.resume();
    } catch (e) {
      console.warn("TTS error:", e);
      setSpeakingMsgId(null);
    }
  };

  if (!isOpen) return null;

  const handleSendMessage = async (promptText?: string) => {
    const textToSend = promptText || inputValue.trim();
    if (!textToSend || isLoading) return;

    // Stop speech recognition if listening
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }

    const userMsg: AssistantChatMessage = {
      id: "user-" + Date.now(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInputValue("");
    setIsLoading(true);

    try {
      const isExplanationRequest =
        textToSend.toLowerCase().includes("explain") ||
        textToSend.toLowerCase().includes("break down") ||
        textToSend.toLowerCase().includes("understand");

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      if (isExplanationRequest) {
        // Call /api/explain-question for structured breakdown and voice script
        const res = await fetch(`${apiUrl}/api/explain-question`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            question_id: questionId,
            question_text: questionText,
            target_role: targetRole,
            experience_level: experienceLevel,
          }),
        });

        if (res.ok) {
          const expData = await res.json();
          const explanationText = `${expData.plain_english_meaning}\n\nSuggested Opening: "${expData.suggested_opening_sentence}"`;

          const botMsgId = "gemini-" + Date.now();
          const botMsg: AssistantChatMessage = {
            id: botMsgId,
            sender: "gemini",
            text: explanationText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            clarification: {
              answer: expData.plain_english_meaning,
              tips_for_answering: expData.step_by_step_approach || [],
              suggested_assumptions: expData.key_concepts_tested || [],
            },
          };

          setMessages((prev) => [...prev, botMsg]);

          // Vocalize the explanation script aloud
          if (expData.voice_explanation_script) {
            handleSpeakText(expData.voice_explanation_script, botMsgId);
          }
          return;
        }
      }

      // Default: Call /api/clarify
      const res = await fetch(`${apiUrl}/api/clarify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: questionId,
          question_text: questionText,
          target_role: targetRole,
          experience_level: experienceLevel,
          doubt: textToSend,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const clarification: ClarificationResponse = await res.json();
      const botMsgId = "gemini-" + Date.now();
      const botMsg: AssistantChatMessage = {
        id: botMsgId,
        sender: "gemini",
        text: clarification.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        clarification: clarification,
      };

      setMessages((prev) => [...prev, botMsg]);
      handleSpeakText(clarification.answer, botMsgId);
    } catch (err) {
      console.warn("REST clarification fallback error, using local assistant simulation:", err);
      // Client-side fallback clarification
      const fallbackResponse: ClarificationResponse = {
        answer: `Regarding "${questionText}": The interviewer wants to test your problem-solving process and architectural decisions. In technical interviews, asking clarifying questions or stating your scope out loud is a strong positive signal.`,
        tips_for_answering: [
          "State your thesis in one sentence before diving into low-level details.",
          "Explicitly compare at least two alternatives (e.g. In-memory state vs Redis Pub/Sub).",
          "Conclude with automated testing and observability metrics.",
        ],
        suggested_assumptions: [
          "Assume a cloud-native microservice architecture with standard latency budgets.",
          "State that you prioritize high availability over strict multi-region ACID transactions if appropriate.",
        ],
      };

      const botMsgId = "gemini-" + Date.now();
      const fallbackMsg: AssistantChatMessage = {
        id: botMsgId,
        sender: "gemini",
        text: fallbackResponse.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        clarification: fallbackResponse,
      };

      setMessages((prev) => [...prev, fallbackMsg]);
      handleSpeakText(fallbackResponse.answer, botMsgId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-zinc-950 font-bold">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Gemini AI Voice Doubt & Question Assistant
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold uppercase">
                  Voice Enabled
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Speak or type any question to get plain-English explanations and step-by-step answering frameworks
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
              onClose();
            }}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Question Context Strip with Instant Voice Explain Button */}
        <div className="px-4 py-2.5 bg-zinc-950/80 border-b border-zinc-800/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-zinc-300 line-clamp-1">
              <strong className="text-zinc-100">Question: </strong>
              {questionText}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleSendMessage("🎙️ Explain this question in simple terms and how to structure my answer")}
            disabled={isLoading}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold transition-all hover:scale-105"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Explain Aloud</span>
          </button>
        </div>

        {/* Message Thread Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-900/60 min-h-[260px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[92%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed relative group ${
                  msg.sender === "user"
                    ? "bg-emerald-600 text-white rounded-br-none"
                    : "bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-bl-none shadow-md"
                }`}
              >
                {msg.sender === "gemini" && (
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                      <Bot className="w-3.5 h-3.5" />
                      <span>Gemini Assistant</span>
                    </div>

                    {/* Speaker Readout Button */}
                    <button
                      onClick={() => handleSpeakText(msg.text, msg.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all ${
                        speakingMsgId === msg.id
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 animate-pulse"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                      title="Listen to explanation aloud"
                    >
                      {speakingMsgId === msg.id ? (
                        <>
                          <VolumeX className="w-3 h-3 text-emerald-400" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span>Listen Aloud</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Rich Clarification Extensions */}
                {msg.clarification && (
                  <div className="mt-3 space-y-2.5 pt-2 border-t border-zinc-800">
                    {/* Answering Tips */}
                    {msg.clarification.tips_for_answering &&
                      msg.clarification.tips_for_answering.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-900/50">
                          <span className="font-bold text-cyan-300 flex items-center gap-1 text-[11px] uppercase tracking-wider mb-1">
                            <Lightbulb className="w-3 h-3" />
                            <span>Recommended Structure / Steps:</span>
                          </span>
                          <ul className="space-y-1 text-zinc-300 text-xs">
                            {msg.clarification.tips_for_answering.map((tip, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-cyan-400 font-bold">&bull;</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {/* Suggested Assumptions / Concepts */}
                    {msg.clarification.suggested_assumptions &&
                      msg.clarification.suggested_assumptions.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-900/50">
                          <span className="font-bold text-emerald-300 flex items-center gap-1 text-[11px] uppercase tracking-wider mb-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Key Concepts & Assumptions:</span>
                          </span>
                          <ul className="space-y-1 text-zinc-300 text-xs">
                            {msg.clarification.suggested_assumptions.map((asm, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-emerald-400 font-bold">&bull;</span>
                                <span>{asm}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-zinc-400 text-xs p-3 bg-zinc-950 border border-zinc-800 rounded-xl max-w-sm">
              <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span>Gemini is generating explanation and voice script...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-800/80">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1.5">
            Quick Clarifications:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Field Form with Voice Input (Microphone) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2"
        >
          {/* Voice Input Microphone Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-2.5 rounded-xl border transition-all ${
              isListening
                ? "bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse"
                : "bg-zinc-900 border-zinc-700/80 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500"
            }`}
            title={isListening ? "Listening... click to stop" : "Speak question using your microphone"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              isListening
                ? "Listening to your voice doubt..."
                : "Speak or type your doubt, concept question, or ask to explain..."
            }
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />

          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all ${
              isLoading || !inputValue.trim()
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 hover:brightness-110 font-bold"
            }`}
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
