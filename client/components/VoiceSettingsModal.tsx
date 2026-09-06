"use client";

import React, { useState } from "react";
import {
  Settings2,
  Volume2,
  Sparkles,
  Check,
  RotateCcw,
  Sliders,
  Play,
  Square,
  X,
  Radio,
  Award,
  Zap,
} from "lucide-react";
import { scoreVoice } from "@/hooks/useVoiceInterviewer";

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: SpeechSynthesisVoice | null;
  availableVoices: SpeechSynthesisVoice[];
  speechRate: number;
  onSelectVoice: (voice: SpeechSynthesisVoice) => void;
  onSetSpeechRate: (rate: number) => void;
  onTestVoice: (voice?: SpeechSynthesisVoice, rate?: number) => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

export default function VoiceSettingsModal({
  isOpen,
  onClose,
  selectedVoice,
  availableVoices,
  speechRate,
  onSelectVoice,
  onSetSpeechRate,
  onTestVoice,
  isSpeaking,
  onStopSpeaking,
}: VoiceSettingsModalProps) {
  if (!isOpen) return null;

  // Rate presets for quick selection
  const ratePresets = [
    { label: "Calm & Reflective", rate: 0.88, desc: "Gentle, thoughtful tempo" },
    { label: "Natural Executive", rate: 0.94, desc: "Articulate, confident (Recommended)" },
    { label: "Standard 1.0x", rate: 1.0, desc: "Default synthesizer pace" },
    { label: "Brisk Delivery", rate: 1.08, desc: "Energetic and quick" },
  ];

  // Helper to extract clean voice label and region
  const formatVoiceInfo = (v: SpeechSynthesisVoice) => {
    const isUS = v.lang.toLowerCase().includes("us") || v.name.toLowerCase().includes("us");
    const isUK = v.lang.toLowerCase().includes("gb") || v.name.toLowerCase().includes("uk");
    const isAU = v.lang.toLowerCase().includes("au");
    const region = isUS ? "🇺🇸 US" : isUK ? "🇬🇧 UK" : isAU ? "🇦🇺 AU" : "🌐 EN";

    let cleanName = v.name
      .replace(/Microsoft /i, "")
      .replace(/Online \(Natural\)/i, "Neural")
      .replace(/\(Enhanced\)/i, "Enhanced")
      .replace(/\(Premium\)/i, "Premium")
      .replace(/ - English \([^)]+\)/i, "");

    const score = scoreVoice(v);
    const isRecommended = score >= 80;

    return { cleanName, region, isRecommended, score };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">AI Voice &amp; Fluency Tuning</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  Fluency Engine v2
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configure natural speech synthesis prosody, accent, and executive pacing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Settings Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Active Voice Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>Select English Voice ({availableVoices.length} Available)</span>
              </label>
              <span className="text-[11px] text-zinc-400">Ranked by natural human prosody</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 border border-zinc-800/70 rounded-2xl bg-zinc-900/30">
              {availableVoices.slice(0, 12).map((v) => {
                const isSelected = selectedVoice?.voiceURI === v.voiceURI;
                const { cleanName, region, isRecommended } = formatVoiceInfo(v);

                return (
                  <button
                    key={v.voiceURI}
                    type="button"
                    onClick={() => onSelectVoice(v)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold truncate">{cleanName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                          {region}
                        </span>
                        {isRecommended && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            Natural
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 block truncate mt-0.5">
                        {v.lang} {v.localService ? "(Local)" : "(Cloud Neural)"}
                      </span>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Speech Rate / Pacing */}
          <div className="space-y-3 pt-2 border-t border-zinc-900">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Executive Pacing ({speechRate.toFixed(2)}x)</span>
              </label>
              <span className="text-xs font-bold text-emerald-400">
                {speechRate === 0.94 ? "Recommended: 0.94x (Natural Executive)" : `${speechRate.toFixed(2)}x`}
              </span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ratePresets.map((preset) => {
                const isCurrent = Math.abs(speechRate - preset.rate) < 0.02;
                return (
                  <button
                    key={preset.rate}
                    type="button"
                    onClick={() => onSetSpeechRate(preset.rate)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? "bg-cyan-500/15 border-cyan-400 text-cyan-200 font-bold shadow-md shadow-cyan-500/10"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <span className="text-xs block font-semibold">{preset.rate}x</span>
                    <span className="text-[10px] text-zinc-400 block truncate mt-0.5">{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Continuous Slider */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[11px] text-zinc-500">0.80x (Calm)</span>
              <input
                type="range"
                min="0.80"
                max="1.20"
                step="0.02"
                value={speechRate}
                onChange={(e) => onSetSpeechRate(parseFloat(e.target.value))}
                className="flex-1 accent-emerald-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
              />
              <span className="text-[11px] text-zinc-500">1.20x (Brisk)</span>
            </div>
          </div>

          {/* Active Fluency Pipeline Enhancements */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-zinc-900/50 to-cyan-950/20 border border-emerald-500/20 space-y-2">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active Fluency Pipeline Features</span>
            </span>
            <ul className="text-xs text-zinc-300 space-y-1.5">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>Unified Continuous Prosody:</strong> Eliminates awkward pauses and stutter between sentences.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>Technical Acronym Expansion:</strong> Naturally pronounces API, AWS, CI/CD, DB, and Kubernetes.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>Conversational Contractions:</strong> Speaks warm, encouraging engineering lead phrases.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer & Live Audition Button */}
        <div className="p-6 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onSetSpeechRate(0.94)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default (0.94x)</span>
          </button>

          <div className="flex items-center gap-2">
            {isSpeaking ? (
              <button
                type="button"
                onClick={onStopSpeaking}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all shadow-md"
              >
                <Square className="w-3.5 h-3.5 text-rose-400" />
                <span>Stop Audio</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onTestVoice()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all hover:scale-105 shadow-md shadow-emerald-500/10"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Test Voice Fluency</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
