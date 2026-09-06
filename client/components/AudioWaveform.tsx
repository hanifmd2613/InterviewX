"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, Bot } from "lucide-react";

interface AudioWaveformProps {
  isRecording: boolean;
  isAISpeaking?: boolean;
  className?: string;
}

export default function AudioWaveform({
  isRecording,
  isAISpeaking = false,
  className = "",
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [hasMicAccess, setHasMicAccess] = useState<boolean | null>(null);

  useEffect(() => {
    let isCancelled = false;

    // AI is speaking: render synthetic speech soundwaves
    if (isAISpeaking) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      drawAISpeakingWaveform();
      return;
    }

    // Candidate is speaking (Microphone active)
    if (isRecording) {
      const initAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          if (isCancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          streamRef.current = stream;
          setHasMicAccess(true);

          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioCtxRef.current = audioCtx;

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          sourceRef.current = source;
          source.connect(analyser);

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const draw = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            analyser.getByteTimeDomainData(dataArray);

            ctx.fillStyle = "rgba(18, 18, 21, 0.3)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, "#10b981");
            gradient.addColorStop(0.5, "#06b6d4");
            gradient.addColorStop(1, "#8b5cf6");

            ctx.lineWidth = 2.5;
            ctx.strokeStyle = gradient;
            ctx.beginPath();

            const sliceWidth = (canvas.width * 1.0) / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
              const v = dataArray[i] / 128.0;
              const y = (v * canvas.height) / 2;

              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }

              x += sliceWidth;
            }

            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();

            animFrameRef.current = requestAnimationFrame(draw);
          };

          draw();
        } catch (err) {
          console.warn("Audio input not granted or unavailable:", err);
          setHasMicAccess(false);
          drawIdleWaveform();
        }
      }

      initAudio();
    } else {
      // Idle mode
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      drawIdleWaveform();
    }

    return () => {
      isCancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [isRecording, isAISpeaking]);

  // Synthetic speech animation for AI voice
  const drawAISpeakingWaveform = () => {
    let tick = 0;
    const renderAISpeech = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      tick += 0.08;
      ctx.fillStyle = "rgba(18, 18, 21, 0.25)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, "#8b5cf6");
      gradient.addColorStop(0.5, "#06b6d4");
      gradient.addColorStop(1, "#10b981");

      ctx.lineWidth = 3;
      ctx.strokeStyle = gradient;
      ctx.beginPath();

      const width = canvas.width;
      const height = canvas.height;
      for (let x = 0; x < width; x += 3) {
        const envelope = Math.sin((x / width) * Math.PI); // tapering edges
        const wave1 = Math.sin(x * 0.04 + tick * 3) * 12;
        const wave2 = Math.cos(x * 0.08 - tick * 2) * 8;
        const y = height / 2 + (wave1 + wave2) * envelope;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (isAISpeaking) {
        animFrameRef.current = requestAnimationFrame(renderAISpeech);
      }
    };
    renderAISpeech();
  };

  const drawIdleWaveform = () => {
    let tick = 0;
    const renderIdle = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      tick += 0.05;
      ctx.fillStyle = "rgba(18, 18, 21, 0.4)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
      ctx.beginPath();

      const width = canvas.width;
      const height = canvas.height;
      for (let x = 0; x < width; x += 4) {
        const y = height / 2 + Math.sin(x * 0.05 + tick) * 4;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (!isRecording && !isAISpeaking) {
        animFrameRef.current = requestAnimationFrame(renderIdle);
      }
    };
    renderIdle();
  };

  return (
    <div className={`relative flex items-center bg-zinc-950/70 border border-zinc-800/80 rounded-xl overflow-hidden px-4 py-2 ${className}`}>
      <div className="flex items-center gap-2 mr-3 shrink-0">
        {isAISpeaking ? (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-semibold animate-pulse">
            <Bot className="w-3.5 h-3.5 text-violet-400" />
            <span>AI Speaking</span>
          </div>
        ) : isRecording ? (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Mic className="w-3.5 h-3.5 animate-bounce" />
            <span>Listening</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800/50 border border-zinc-700/40 text-zinc-400 text-xs">
            <MicOff className="w-3.5 h-3.5" />
            <span>Mic Idle</span>
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={360}
        height={40}
        className="w-full h-10 rounded"
      />
    </div>
  );
}
