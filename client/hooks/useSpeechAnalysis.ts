"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const TARGET_FILLER_WORDS = [
  "um", "uh", "like", "basically", "literally", 
  "actually", "you know", "sort of", "kind of", "i mean", "right"
];

export interface AudioInputDevice {
  deviceId: string;
  label: string;
}

export interface MicDiagnostic {
  testing: boolean;
  maxLevel: number;
  soundDetected: boolean;
  transcript: string;
  message: string;
  success?: boolean;
}

export interface SpeechAnalysisState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  wordCount: number;
  wpm: number;
  fillerCount: number;
  fillerBreakdown: Record<string, number>;
  speechDuration: number;
  isSupported: boolean;
  micLevel: number; // 0 to 100 real-time audio volume
  isSoundDetected: boolean;
  micError: string | null;
  speechLang: string;
  audioDevices: AudioInputDevice[];
  selectedDeviceId: string;
  isTranscribingWithGemini: boolean;
  micDiagnostic: MicDiagnostic | null;
}

export function useSpeechAnalysis() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [fillerCount, setFillerCount] = useState(0);
  const [fillerBreakdown, setFillerBreakdown] = useState<Record<string, number>>({});
  const [speechDuration, setSpeechDuration] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const [micLevel, setMicLevel] = useState(0);
  const [isSoundDetected, setIsSoundDetected] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [speechLang, setSpeechLangState] = useState<string>("en-US");
  const [audioDevices, setAudioDevices] = useState<AudioInputDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceIdState] = useState<string>("");
  const [isTranscribingWithGemini, setIsTranscribingWithGemini] = useState(false);
  const [micDiagnostic, setMicDiagnostic] = useState<MicDiagnostic | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const startTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const interimIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTranscriptRef = useRef<string>("");

  // Web Audio VU Meter references
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // MediaRecorder backup engine references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Filler word analyzer
  const analyzeFillers = useCallback((text: string) => {
    const textLower = text.toLowerCase();
    const breakdown: Record<string, number> = {};
    let total = 0;

    TARGET_FILLER_WORDS.forEach((filler) => {
      const regex = new RegExp(`\\b${filler}\\b`, "gi");
      const matches = textLower.match(regex);
      if (matches && matches.length > 0) {
        breakdown[filler] = matches.length;
        total += matches.length;
      }
    });

    return { total, breakdown };
  }, []);

  // Update speech recognition language
  const setSpeechLang = useCallback((lang: string) => {
    setSpeechLangState(lang);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = lang;
      } catch (e) {}
    }
  }, []);

  // Enumerate audio input devices safely
  const refreshAudioDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices
        .filter((d) => d.kind === "audioinput")
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${index + 1}`,
        }));
      setAudioDevices(inputs);

      const savedDevice = localStorage.getItem("preppulse_mic_device");
      if (savedDevice && inputs.some((d) => d.deviceId === savedDevice)) {
        setSelectedDeviceIdState(savedDevice);
      } else if (inputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceIdState(inputs[0].deviceId);
      }
    } catch (e) {
      console.warn("Could not enumerate audio devices:", e);
    }
  }, [selectedDeviceId]);

  // Set selected device
  const setSelectedDeviceId = useCallback((devId: string) => {
    setSelectedDeviceIdState(devId);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("preppulse_mic_device", devId);
    }
  }, []);

  // Initialize devices on mount
  useEffect(() => {
    refreshAudioDevices();
    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener("devicechange", refreshAudioDevices);
      return () => {
        navigator.mediaDevices.removeEventListener("devicechange", refreshAudioDevices);
      };
    }
  }, [refreshAudioDevices]);

  // Helper: Convert Blob to Base64
  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        resolve(res);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  // Transcribe audio blob with backend Gemini API
  const transcribeWithGeminiBackend = useCallback(async (blob: Blob, lang: string): Promise<string> => {
    if (!blob || blob.size < 100) return "";
    try {
      const base64Audio = await blobToBase64(blob);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/transcribe-audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio_base64: base64Audio,
          mime_type: blob.type || "audio/webm",
          language: lang,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      return (data.transcription || "").trim();
    } catch (err) {
      console.warn("Backend Gemini transcription request error:", err);
      return "";
    }
  }, [blobToBase64]);

  // Resilient Web Audio Capture stream (NEVER crashes from device constraints)
  const startAudioCapture = useCallback(async (): Promise<MediaStream | null> => {
    try {
      let stream: MediaStream | null = null;

      // 1. First attempt with ideal device constraint
      try {
        const constraints: MediaStreamConstraints = {
          audio: selectedDeviceId
            ? {
                deviceId: { ideal: selectedDeviceId },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
          video: false,
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn("Targeted audio constraint failed, attempting default audio:", err);
        // Fallback to simple unconstrained audio
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }

      if (!stream) throw new Error("No media stream returned");

      micStreamRef.current = stream;
      setMicError(null);

      // Re-enumerate to get human labels now that permission is granted
      refreshAudioDevices();

      // Setup Web Audio Volume Meter
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        if (audioCtx.state === "suspended") {
          await audioCtx.resume().catch(() => {});
        }

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.2;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        // Connect silent gain node to destination so Chromium keeps processing audio continuously
        try {
          const silentGain = audioCtx.createGain();
          silentGain.gain.value = 0;
          analyser.connect(silentGain);
          silentGain.connect(audioCtx.destination);
        } catch (e) {}

        const dataArray = new Uint8Array(analyser.fftSize);

        const checkVolume = () => {
          if (!isListeningRef.current || !analyserRef.current) return;

          // Time-domain amplitude measurement for real-time speech responsiveness
          analyserRef.current.getByteTimeDomainData(dataArray);

          let sumSquares = 0;
          let peakDev = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const dev = Math.abs(dataArray[i] - 128);
            if (dev > peakDev) peakDev = dev;
            sumSquares += dev * dev;
          }
          const rms = Math.sqrt(sumSquares / dataArray.length);
          const metric = Math.max(peakDev, rms * 1.6);
          // Scale so normal speaking voice yields 40-90%
          const normalizedLevel = Math.min(100, Math.round((metric / 36) * 100));

          setMicLevel(normalizedLevel);
          setIsSoundDetected(normalizedLevel > 3);

          animFrameRef.current = requestAnimationFrame(checkVolume);
        };

        animFrameRef.current = requestAnimationFrame(checkVolume);
      }

      return stream;
    } catch (err: any) {
      console.warn("Microphone hardware stream access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMicError("Microphone permission was denied. Click the lock/camera icon in your address bar and allow Microphone access.");
      } else {
        setMicError("Microphone hardware could not be reached. Please check your system sound settings.");
      }
      return null;
    }
  }, [selectedDeviceId, refreshAudioDevices]);

  const stopAudioCapture = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setMicLevel(0);
    setIsSoundDetected(false);
  }, []);

  // Update transcript helper
  const updateTranscriptText = useCallback((text: string) => {
    accumulatedTranscriptRef.current = text;
    setTranscript(text);
    setInterimTranscript("");

    const words = text ? text.split(/\s+/).filter(Boolean) : [];
    setWordCount(words.length);

    const { total, breakdown } = analyzeFillers(text);
    setFillerCount(total);
    setFillerBreakdown(breakdown);

    if (startTimeRef.current) {
      const elapsedMinutes = Math.max(0.05, (Date.now() - startTimeRef.current) / 60000);
      setWpm(Math.round(words.length / elapsedMinutes));
    }
  }, [analyzeFillers]);

  // Run a quick 3-second sound check test
  const runMicDiagnosticTest = useCallback(async () => {
    setMicDiagnostic({
      testing: true,
      maxLevel: 0,
      soundDetected: false,
      transcript: "",
      message: "Listening... Please say: 'Testing audio one two three'",
    });

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedDeviceId ? { deviceId: { ideal: selectedDeviceId } } : true,
          video: false,
        });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === "suspended") await audioCtx.resume();

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let highestLevel = 0;

      const chunks: Blob[] = [];
      let mimeType = "";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) mimeType = "audio/webm;codecs=opus";
        else if (MediaRecorder.isTypeSupported("audio/webm")) mimeType = "audio/webm";
        else if (MediaRecorder.isTypeSupported("audio/mp4")) mimeType = "audio/mp4";
        else if (MediaRecorder.isTypeSupported("audio/aac")) mimeType = "audio/aac";
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.start(100);

      const interval = setInterval(() => {
        analyser.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        let peakDev = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const dev = Math.abs(dataArray[i] - 128);
          if (dev > peakDev) peakDev = dev;
          sumSquares += dev * dev;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        const metric = Math.max(peakDev, rms * 1.6);
        const level = Math.min(100, Math.round((metric / 36) * 100));
        if (level > highestLevel) highestLevel = level;

        setMicDiagnostic((prev) =>
          prev
            ? {
                ...prev,
                maxLevel: highestLevel,
                soundDetected: highestLevel > 4,
              }
            : null
        );
      }, 50);

      // Record for 3.2 seconds
      await new Promise((res) => setTimeout(res, 3200));

      clearInterval(interval);
      try {
        if (recorder.state !== "inactive") {
          recorder.requestData();
          recorder.stop();
        }
      } catch (e) {}
      stream.getTracks().forEach((t) => t.stop());
      await audioCtx.close();

      await new Promise((res) => setTimeout(res, 200));
      const testBlob = new Blob(chunks, { type: mimeType || recorder.mimeType || "audio/webm" });

      if (highestLevel <= 3) {
        setMicDiagnostic({
          testing: false,
          maxLevel: highestLevel,
          soundDetected: false,
          transcript: "",
          message: "⚠️ No audio signal received (0%). Please unmute in macOS Sound Settings or select another mic.",
          success: false,
        });
        return;
      }

      setMicDiagnostic((prev) =>
        prev
          ? {
              ...prev,
              message: "Verifying speech with Gemini Neural Transcriber...",
            }
          : null
      );

      const testTrans = await transcribeWithGeminiBackend(testBlob, speechLang);

      setMicDiagnostic({
        testing: false,
        maxLevel: highestLevel,
        soundDetected: true,
        transcript: testTrans || "Voice audio detected clearly",
        message: testTrans
          ? `✅ Microphone Verified! Heard: "${testTrans}"`
          : `✅ Microphone Active! Signal volume: ${highestLevel}%`,
        success: true,
      });
    } catch (err: any) {
      setMicDiagnostic({
        testing: false,
        maxLevel: 0,
        soundDetected: false,
        transcript: "",
        message: `Microphone error: ${err?.message || "Permission issue"}`,
        success: false,
      });
    }
  }, [selectedDeviceId, speechLang, transcribeWithGeminiBackend]);

  // Start listening with Dual Engines (Web Speech API + MediaRecorder)
  const startListening = useCallback(async () => {
    setMicError(null);
    accumulatedTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setWordCount(0);
    setWpm(0);
    setFillerCount(0);
    setFillerBreakdown({});
    setSpeechDuration(0);

    startTimeRef.current = Date.now();
    isListeningRef.current = true;
    setIsListening(true);

    // 1. Start hardware audio capture & live VU meter
    const stream = await startAudioCapture();
    if (!stream) {
      setIsListening(false);
      isListeningRef.current = false;
      return;
    }

    // 2. Start MediaRecorder background backup
    audioChunksRef.current = [];
    try {
      let mime = "";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) mime = "audio/webm;codecs=opus";
        else if (MediaRecorder.isTypeSupported("audio/webm")) mime = "audio/webm";
        else if (MediaRecorder.isTypeSupported("audio/mp4")) mime = "audio/mp4";
        else if (MediaRecorder.isTypeSupported("audio/aac")) mime = "audio/aac";
      }

      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      recorder.start(250);
      mediaRecorderRef.current = recorder;
    } catch (e) {
      console.warn("MediaRecorder could not start:", e);
    }

    // 3. Start Web Speech Recognition (Engine A) with a fresh instance
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch (e) {}
        }

        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = speechLang || "en-US";

        recognition.onstart = () => {
          setMicError(null);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = "";
          let currentFinal = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
              currentFinal += res[0].transcript + " ";
            } else {
              currentInterim += res[0].transcript;
            }
          }

          if (currentFinal) {
            accumulatedTranscriptRef.current += currentFinal;
            setTranscript(accumulatedTranscriptRef.current);
          }
          setInterimTranscript(currentInterim);

          const fullText = (accumulatedTranscriptRef.current + " " + currentInterim).trim();
          const words = fullText ? fullText.split(/\s+/).filter(Boolean) : [];
          setWordCount(words.length);

          const { total, breakdown } = analyzeFillers(fullText);
          setFillerCount(total);
          setFillerBreakdown(breakdown);

          if (startTimeRef.current) {
            const elapsedMinutes = Math.max(0.05, (Date.now() - startTimeRef.current) / 60000);
            setWpm(Math.round(words.length / elapsedMinutes));
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("SpeechRecognition event:", event.error);
          if (event.error === "no-speech") return;
          if (event.error === "network") {
            console.warn("Web Speech API network limitation detected. Gemini Audio Engine will handle transcription upon submit.");
          }
        };

        recognition.onend = () => {
          if (isListeningRef.current) {
            try {
              recognition.start();
            } catch (e) {}
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.warn("Speech recognition initialization error:", err);
      }
    }

    // 4. Timer interval for speaking duration
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
        setSpeechDuration(Math.round(elapsedSec));
      }
    }, 500);

    // 5. Periodic live Gemini transcription if Web Speech API is completely silent
    if (interimIntervalRef.current) clearInterval(interimIntervalRef.current);
    interimIntervalRef.current = setInterval(async () => {
      if (!isListeningRef.current) return;
      // If candidate has spoken audio chunks but Web Speech API produced zero words:
      if (audioChunksRef.current.length >= 8 && accumulatedTranscriptRef.current.trim().length === 0) {
        const recorder = mediaRecorderRef.current;
        const mime = recorder?.mimeType || "audio/webm";
        const snapshotBlob = new Blob([...audioChunksRef.current], { type: mime });
        setIsTranscribingWithGemini(true);
        const liveText = await transcribeWithGeminiBackend(snapshotBlob, speechLang);
        setIsTranscribingWithGemini(false);
        if (liveText && liveText.length > 0 && isListeningRef.current) {
          updateTranscriptText(liveText);
        }
      }
    }, 4500);
  }, [speechLang, startAudioCapture, analyzeFillers, transcribeWithGeminiBackend, updateTranscriptText]);

  // Stop listening and return the final transcribed text (GUARANTEED with Gemini fallback)
  const stopListening = useCallback(async (): Promise<string> => {
    isListeningRef.current = false;
    setIsListening(false);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (interimIntervalRef.current) {
      clearInterval(interimIntervalRef.current);
      interimIntervalRef.current = null;
    }

    // Stop Web Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }

    let finalSpokenText = accumulatedTranscriptRef.current.trim();

    // Stop MediaRecorder and wait for final data
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        try {
          recorder.requestData();
          recorder.stop();
        } catch (e) {
          resolve();
        }
      });
    }

    stopAudioCapture();

    // If Web Speech API captured fewer than 3 words, transcribe via Gemini!
    if (audioChunksRef.current.length > 0 && (!finalSpokenText || finalSpokenText.split(/\s+/).length <= 2)) {
      setIsTranscribingWithGemini(true);
      try {
        const mime = recorder?.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });
        const geminiTrans = await transcribeWithGeminiBackend(audioBlob, speechLang);
        if (geminiTrans && geminiTrans.trim().length > 0) {
          finalSpokenText = geminiTrans.trim();
          updateTranscriptText(finalSpokenText);
        }
      } catch (e) {
        console.warn("Gemini transcription fallback error:", e);
      } finally {
        setIsTranscribingWithGemini(false);
      }
    }

    return finalSpokenText;
  }, [stopAudioCapture, transcribeWithGeminiBackend, speechLang, updateTranscriptText]);

  // Manual text entry fallback
  const manualSetTranscript = useCallback(
    (text: string) => {
      updateTranscriptText(text);
    },
    [updateTranscriptText]
  );

  return {
    isListening,
    transcript: (transcript + " " + interimTranscript).trim(),
    interimTranscript,
    wordCount,
    wpm,
    fillerCount,
    fillerBreakdown,
    speechDuration,
    isSupported,
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
  };
}


