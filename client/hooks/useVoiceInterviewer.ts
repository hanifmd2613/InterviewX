"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Persistent global utterance set to prevent Chrome/Safari V8 Garbage Collection
const activeUtterances = new Set<SpeechSynthesisUtterance>();
if (typeof window !== "undefined") {
  (window as any).__activeSpeechUtterances = activeUtterances;
}

/**
 * Intelligent voice quality scorer:
 * Prioritizes ultra-realistic Natural/Neural online voices and enhanced Apple/Google models.
 * Strictly deprioritizes obsolete robotic synthesizers (Alex, Fred, Victoria, Albert, etc.).
 */
export function scoreVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();

  // Strictly filter for English voices
  if (!lang.startsWith("en")) return -1000;

  let score = 50;

  // Modern Neural / Natural Online voices (Microsoft Edge, Google Chrome Neural)
  if (name.includes("natural") || name.includes("online")) score += 120;
  if (name.includes("google") && (name.includes("us english") || name.includes("uk english female"))) score += 110;
  if (name.includes("google") && name.includes("uk english male")) score += 105;
  if (name.includes("enhanced") || name.includes("premium")) score += 100;
  
  // Apple High-Quality Voices (macOS / iOS)
  if (name.includes("samantha")) score += 85;
  if (name.includes("ava") || name.includes("serena") || name.includes("allison")) score += 80;
  if (name.includes("tom") || name.includes("oliver") || name.includes("kate") || name.includes("jamie")) score += 80;
  if (name.includes("daniel")) score += 75;
  if (name.includes("siri")) score += 70;
  if (name.includes("google")) score += 65;
  if (name.includes("karen") || name.includes("moira") || name.includes("fiona")) score += 60;

  // Cloud/Remote neural services usually have richer prosody
  if (voice.localService === false) score += 30;
  if (voice.default) score += 10;

  // Heavily penalize legacy robotic/novelty synthesizers that destroy fluency
  if (
    name.includes("alex") ||
    name.includes("fred") ||
    name.includes("victoria") ||
    name.includes("albert") ||
    name.includes("junior") ||
    name.includes("ralph") ||
    name.includes("bad news") ||
    name.includes("bahh") ||
    name.includes("bells") ||
    name.includes("boing") ||
    name.includes("bubbles") ||
    name.includes("cellos") ||
    name.includes("deranged") ||
    name.includes("good news") ||
    name.includes("hysterical") ||
    name.includes("pipe organ") ||
    name.includes("trinoids") ||
    name.includes("whisper") ||
    name.includes("zarvox")
  ) {
    score -= 200;
  }

  return score;
}

/**
 * Optimizes text for speech synthesis fluency:
 * - Expands technical acronyms so the engine doesn't stutter or mispronounce them.
 * - Inserts natural breathing micro-pauses at transitional phrases and punctuation.
 * - Strips markdown artifacts and bullets.
 */
export function optimizeTextForFluency(text: string): string {
  if (!text) return "";
  return text
    // Remove markdown formatting
    .replace(/[*#_`~]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Expand technical acronyms and abbreviations for natural human pronunciation
    .replace(/\be\.g\.,?\b/gi, "for example, ")
    .replace(/\bi\.e\.,?\b/gi, "that is, ")
    .replace(/\bvs\b/gi, "versus")
    .replace(/\bvs\.\b/gi, "versus")
    .replace(/\bAPI\b/g, "A.P.I.")
    .replace(/\bAPIs\b/g, "A.P.I.s")
    .replace(/\bDB\b/g, "database")
    .replace(/\bDBs\b/g, "databases")
    .replace(/\bUI\b/g, "U.I.")
    .replace(/\bWPM\b/g, "words per minute")
    .replace(/\bQ(\d)\b/gi, "Question $1")
    .replace(/\bk8s\b/gi, "Kubernetes")
    .replace(/\bPostgres\b/gi, "Postgres")
    .replace(/\bAWS\b/g, "A.W.S.")
    .replace(/\bGCP\b/g, "Google Cloud")
    .replace(/\bCI\/CD\b/gi, "C.I. C.D.")
    // Natural breathing pause after step numbers
    .replace(/Step (\d+):/gi, "Step $1, ")
    // Convert harsh bullet points and dashes into natural breathing commas
    .replace(/[•\-\—]/g, ", ")
    // Soften colons to conversational pauses
    .replace(/:\s+/g, ", ")
    // Clean redundant commas and multi-spaces
    .replace(/\s*,\s*,+/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Natural paragraph segmenter:
 * Avoids chopping into tiny 3-word sentences (which destroys prosody and introduces robotic stutter).
 * Only splits long texts into generous, melodic chunks (300-450 characters) if necessary.
 */
function splitIntoFluentChunks(text: string, maxChunkLen = 420): string[] {
  if (text.length <= maxChunkLen) return [text];

  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkLen && currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

/**
 * Plays an acoustic chime via Web Audio API to immediately unlock the browser audio pipeline
 */
export function playAudioPing() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {
    // Non-fatal if audio context blocked
  }
}

export function useVoiceInterviewer() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSupported, setIsSupported] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  // 0.94 is the benchmark natural pace for articulate executive delivery
  const [speechRate, setSpeechRateState] = useState<number>(0.94);

  const lastSpokenTextRef = useRef<string>("");
  const onEndCallbackRef = useRef<(() => void) | null>(null);
  const queueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef<boolean>(false);

  // Initialize available voices and sort by natural fluency
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }

    const updateVoices = () => {
      const rawVoices = window.speechSynthesis.getVoices();
      if (!rawVoices || rawVoices.length === 0) return;

      // Filter for English voices and rank by natural quality score
      const englishVoices = rawVoices
        .filter((v) => v.lang.toLowerCase().startsWith("en"))
        .sort((a, b) => scoreVoice(b) - scoreVoice(a));

      setAvailableVoices(englishVoices);

      // Check if user previously saved a voice preference
      const savedVoiceURI = localStorage.getItem("preppulse_speech_voice_uri");
      const matchedSaved = englishVoices.find((v) => v.voiceURI === savedVoiceURI);

      if (matchedSaved) {
        setSelectedVoice(matchedSaved);
      } else if (englishVoices.length > 0) {
        // Automatically assign the highest-scored natural voice
        setSelectedVoice(englishVoices[0]);
      }
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    // Load saved speech rate preference
    try {
      const savedRate = localStorage.getItem("preppulse_speech_rate");
      if (savedRate) {
        const parsed = parseFloat(savedRate);
        if (!isNaN(parsed) && parsed >= 0.7 && parsed <= 1.3) {
          setSpeechRateState(parsed);
        }
      }
    } catch (e) {}

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Update speech rate and persist preference
  const setSpeechRate = useCallback((rate: number) => {
    setSpeechRateState(rate);
    try {
      localStorage.setItem("preppulse_speech_rate", rate.toString());
    } catch (e) {}
  }, []);

  // Update selected voice and persist preference
  const handleSetSelectedVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
    try {
      localStorage.setItem("preppulse_speech_voice_uri", voice.voiceURI);
    } catch (e) {}
  }, []);

  // Chrome keep-alive watchdog: periodically unpauses Chrome speech dispatcher
  useEffect(() => {
    if (!isSpeaking) return;
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Synchronous audio unlock for click events
  const unlockAudio = useCallback(() => {
    playAudioPing();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
  }, []);

  const speak = useCallback(
    (
      text: string,
      onEnd?: () => void,
      options?: { force?: boolean; rate?: number; pitch?: number; voice?: SpeechSynthesisVoice }
    ) => {
      if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) {
        if (onEnd) onEnd();
        return;
      }

      // If voice is muted and force is not passed, do not speak
      if (!autoSpeak && !options?.force) {
        if (onEnd) onEnd();
        return;
      }

      // Stop previous speech and unfreeze queue
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      } catch (e) {}

      // If force speech was requested, ensure audio pipeline is active
      if (options?.force) {
        try {
          playAudioPing();
          window.speechSynthesis.resume();
        } catch (e) {}
      }

      lastSpokenTextRef.current = text;
      onEndCallbackRef.current = onEnd || null;

      // Optimize text for natural human conversational fluency
      const fluentText = optimizeTextForFluency(text);
      if (!fluentText) {
        if (onEnd) onEnd();
        return;
      }

      // Generate generous fluent chunks (avoids robotic sentence-by-sentence restarts)
      const chunks = splitIntoFluentChunks(fluentText);
      queueRef.current = chunks;
      isSpeakingRef.current = true;
      setIsSpeaking(true);

      let currentChunkIndex = 0;

      const speakNextChunk = () => {
        if (!isSpeakingRef.current || currentChunkIndex >= chunks.length) {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          if (onEndCallbackRef.current) {
            const cb = onEndCallbackRef.current;
            onEndCallbackRef.current = null;
            cb();
          }
          return;
        }

        const chunkText = chunks[currentChunkIndex];
        currentChunkIndex++;

        try {
          const utterance = new SpeechSynthesisUtterance(chunkText);

          // Dynamically fetch voices in case they loaded late
          const runtimeVoices =
            typeof window !== "undefined" && "speechSynthesis" in window
              ? window.speechSynthesis.getVoices()
              : [];

          // Determine optimal voice
          const voiceToUse =
            options?.voice ||
            selectedVoice ||
            (availableVoices.length > 0 ? availableVoices[0] : null) ||
            runtimeVoices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
            runtimeVoices[0] ||
            null;

          if (voiceToUse) {
            utterance.voice = voiceToUse;
            utterance.lang = voiceToUse.lang || "en-US";
          } else {
            utterance.lang = "en-US";
          }

          // Calibrated natural delivery: 0.94x rate for articulate executive pacing
          utterance.volume = 1.0;
          utterance.rate = options?.rate ?? speechRate ?? 0.94;
          utterance.pitch = options?.pitch ?? 1.0;

          // Prevent Chrome V8 Garbage Collection bug
          activeUtterances.add(utterance);

          utterance.onstart = () => {
            setIsSpeaking(true);
          };

          utterance.onend = () => {
            activeUtterances.delete(utterance);
            speakNextChunk();
          };

          utterance.onerror = (e: any) => {
            // Canceled error is expected when switching questions
            if (e?.error !== "canceled") {
              console.warn("Speech synthesis utterance event:", e);
            }
            activeUtterances.delete(utterance);
            speakNextChunk();
          };

          window.speechSynthesis.resume();
          window.speechSynthesis.speak(utterance);
          window.speechSynthesis.resume();
        } catch (err) {
          console.warn("Speech synthesis chunk exception:", err);
          speakNextChunk();
        }
      };

      // 50ms delay lets Chrome reset its speech dispatcher after cancel()
      setTimeout(() => {
        if (isSpeakingRef.current) {
          speakNextChunk();
        }
      }, 50);
    },
    [autoSpeak, selectedVoice, availableVoices, speechRate]
  );

  const stopSpeaking = useCallback(() => {
    isSpeakingRef.current = false;
    queueRef.current = [];
    activeUtterances.clear();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      } catch (e) {}
    }

    setIsSpeaking(false);
    if (onEndCallbackRef.current) {
      const cb = onEndCallbackRef.current;
      onEndCallbackRef.current = null;
      cb();
    }
  }, []);

  const repeatLast = useCallback(() => {
    if (lastSpokenTextRef.current) {
      speak(lastSpokenTextRef.current, undefined, { force: true });
    }
  }, [speak]);

  const toggleAutoSpeak = useCallback(() => {
    setAutoSpeak((prev) => !prev);
  }, []);

  // Voice audition / testing helper
  const testVoice = useCallback(
    (voiceToTest?: SpeechSynthesisVoice, rateToTest?: number) => {
      stopSpeaking();
      unlockAudio();
      const sample =
        "Hello! I'm your AI Interview Coach. My speech is tuned for clear, fluent conversational delivery.";
      speak(sample, undefined, {
        force: true,
        voice: voiceToTest || selectedVoice || undefined,
        rate: rateToTest || speechRate,
      });
    },
    [stopSpeaking, unlockAudio, speak, selectedVoice, speechRate]
  );

  return {
    isSpeaking,
    autoSpeak,
    isSupported,
    selectedVoice,
    availableVoices,
    speechRate,
    setSelectedVoice: handleSetSelectedVoice,
    setSpeechRate,
    speak,
    stopSpeaking,
    repeatLast,
    toggleAutoSpeak,
    unlockAudio,
    testVoice,
  };
}
