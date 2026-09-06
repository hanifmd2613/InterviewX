# InterviewX — Comprehensive Technology Stack & Architecture Specification 🛠️📐

This document provides an exhaustive, enterprise-grade specification of the technology stack, software architecture, computational pipelines, and engineering design patterns implemented across the **InterviewX** autonomous multimodal technical interview platform.

---

## 📑 Table of Contents

1. [High-Level Architecture Overview](#1-high-level-architecture-overview)
2. [End-to-End System Architecture Diagram](#2-end-to-end-system-architecture-diagram)
3. [Frontend Application Stack](#3-frontend-application-stack)
4. [Client-Side Computer Vision & Multimodal Edge AI](#4-client-side-computer-vision--multimodal-edge-ai)
5. [Audio Engineering & Speech Synthesis Architecture](#5-audio-engineering--speech-synthesis-architecture)
6. [Backend API & Asynchronous Microservices](#6-backend-api--asynchronous-microservices)
7. [Large Language Model (LLM) & Generative AI Infrastructure](#7-large-language-model-llm--generative-ai-infrastructure)
8. [Computational Linguistics & Pacing Analytics](#8-computational-linguistics--pacing-analytics)
9. [Document Generation & Certified PDF Export Engine](#9-document-generation--certified-pdf-export-engine)
10. [Security, Data Privacy & Edge Governance](#10-security-data-privacy--edge-governance)
11. [Hardware, OS & Browser Compatibility Matrix](#11-hardware-os--browser-compatibility-matrix)
12. [Full Dependency Manifest with Exact Versions](#12-full-dependency-manifest-with-exact-versions)

---

## 1. High-Level Architecture Overview

InterviewX is built on a **hybrid edge-cloud architecture**:
- **Edge Layer (Client Browser)**: Real-time computer vision (MediaPipe FaceMesh), raw audio processing (Web Audio API RMS analysis), speech synthesis (Web Speech API), and camera snapshot capture operate **100% on-device** using WebAssembly (Wasm) and WebGL. No raw video feed ever leaves the candidate's machine, ensuring zero video latency and complete candidate privacy.
- **Cloud/Server Layer (FastAPI & Google Gemini)**: Deep reasoning, question curriculum generation, speech-to-text fallback, multimodal audio comprehension, and multi-factor answer evaluations are processed asynchronously via **FastAPI** and **Google Gemini 2.5 Flash**.

---

## 2. End-to-End System Architecture Diagram

```
+-----------------------------------------------------------------------------------------+
|                                    CANDIDATE BROWSER                                    |
|                                                                                         |
|  +---------------------+   +-----------------------+   +-----------------------------+  |
|  |   HTML5 Camera      |   |   HTML5 Microphone    |   |   User Interface & State    |  |
|  |  (WebcamTracker)    |   |  (useSpeechAnalysis)  |   |    (Next.js 14 App Router)  |  |
|  +----------+----------+   +-----------+-----------+   +--------------+--------------+  |
|             |                          |                              |                 |
|             v                          v                              v                 |
|  +---------------------+   +-----------------------+   +-----------------------------+  |
|  | MediaPipe FaceMesh  |   | Web Audio Analyser    |   |  Web Speech Synthesis       |  |
|  | • 468 3D Landmarks  |   | • 2048 FFT TimeDomain |   |  • Executive Prosody (0.94x)|  |
|  | • Iris Gaze Vectors |   | • RMS Amplitude Meter |   |  • Acronym Phonetic Expander|  |
|  | • Head Pose & Tilt  |   | • Dynamic Waveform    |   |  • Async Queue Debounce     |  |
|  | • Snapshot Capture  |   | • Web Speech STT      |   +-----------------------------+  |
|  +----------+----------+   +-----------+-----------+                  |                 |
|             |                          |                              |                 |
|             +------------+-------------+                              |                 |
|                          | (Transcripts, Cadence, Snapshot)           |                 |
+--------------------------|--------------------------------------------|-----------------+
                           |                                            |
                  REST (HTTP) / WebSocket                               |
                           |                                            |
+--------------------------v--------------------------------------------v-----------------+
|                                 FASTAPI APPLICATION SERVER                              |
|                                     (Python 3.12 / ASGI)                                |
|                                                                                         |
|  +--------------------+  +----------------------+  +---------------------------------+  |
|  | REST Endpoints     |  | WebSocket Router     |  | Pydantic v2 Schemas             |  |
|  | • /api/init-session|  | • /ws/interview      |  | • InitSessionRequest            |  |
|  | • /api/evaluate    |  | • Real-time turns    |  | • EvaluateAnswerRequest         |  |
|  | • /api/transcribe  |  | • Bi-directional sync|  | • QuestionBreakdownRequest      |  |
|  +---------+----------+  +----------+-----------+  +----------------+----------------+  |
|            |                        |                               |                   |
|            +------------------------+-------------------------------+                   |
|                                     |                                                   |
|                                     v                                                   |
|  +-----------------------------------------------------------------------------------+  |
|  | Computational Analytics Engine (server/services/analytics.py)                     |  |
|  | • WPM Pacing Calculator (120-165 WPM target)                                      |  |
|  | • Filler Word Detection Regex ("um", "uh", "like", "basically", "literally")      |  |
|  | • 4-Tier Weighted Rubric (40% Tech, 30% Delivery, 20% JD, 10% Composure)         |  |
|  +----------------------------------+------------------------------------------------+  |
|                                     |                                                   |
+-------------------------------------|---------------------------------------------------+
                                      |
                              Official SDK Call
                                      |
+-------------------------------------v---------------------------------------------------+
|                            GOOGLE GEMINI 2.5 FLASH                                      |
|                                (google-genai SDK)                                       |
|                                                                                         |
|  • Adaptive 5-Question Dynamic Plan Generation (calibrated to role, level & JD)         |
|  • Multi-Tier Real-Time Answer Critique & Scoring                                       |
|  • Exemplary Senior/Staff "Better Answer" Phrasing Generation                           |
|  • Conversational Follow-Up Probe Formulation                                           |
|  • Plain-English Question Breakdown & Icebreaker Sentence Generation                    |
|  • Multimodal Audio-to-Text Transcription Fallback                                      |
|  • Comprehensive 6-Axis Competency Radar & Executive Report Synthesis                   |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Frontend Application Stack

### Core Framework & Runtime
- **Next.js 14 (`14.2.15`)**:
  - React framework utilizing modern **App Router** (`app/page.tsx`, `app/interview/page.tsx`, `app/report/page.tsx`).
  - Strict separation of Client Components (`"use client"`) for stateful hardware access (camera, microphone, speech synthesis) and Server Components.
  - Built-in route compilation and static page pre-rendering.
- **React 18 (`18.3.1`) & React DOM (`18.3.1`)**:
  - Concurrent Mode and optimized re-rendering hooks (`useRef`, `useCallback`, `useMemo`).
  - Isolated custom hooks for clean domain-driven state encapsulation.
- **TypeScript 5.6 (`5.6.3`)**:
  - End-to-end static type verification.
  - Comprehensive TypeScript schemas in `types/interview.ts` covering sessions, turns, critiques, radar metrics, and evaluation summaries.

### UI Styling & Design System
- **Tailwind CSS (`3.4.14`)**:
  - Utility-first CSS architecture with custom color tokens.
  - **Theme**: Enterprise Midnight Navy (`#0B0F19`), Slate Card Surfaces (`#111827`), Emerald Highlights (`#34D399`), Indigo Accents (`#6366F1`), and Cyan Highlights (`#06B6D4`).
- **PostCSS (`8.4.47`) & Autoprefixer (`10.4.20`)**: Cross-browser CSS AST transformation and prefixing.
- **clsx (`2.1.1`) & tailwind-merge (`2.5.4`)**: Conditional class composition without specificity collisions.
- **Lucide React (`0.453.0`)**: High-performance SVG iconography across the entire application interface.
- **Framer Motion (`11.11.9`)**: Smooth GPU-accelerated UI transitions, camera shutter flash animations, modal popups, and radar reveals.

---

## 4. Client-Side Computer Vision & Multimodal Edge AI

### FaceMesh & Attention Tracking
- **MediaPipe FaceMesh (`@mediapipe/face_mesh` v0.4.1633559619)**:
  - Detects **468 3D facial landmarks** in real-time at 30+ FPS via WebGL/Wasm acceleration.
  - **Gaze Vector Estimation**: Tracks iris landmarks (468–472) relative to outer and inner eye corners (sclera) to quantify candidate eye contact ratio.
  - **Head Pose (Pitch, Yaw, Roll)**: Trigonometrically computes head alignment from nose bridge (landmark 1), forehead (landmark 10), and chin (landmark 152) to identify slouching, distraction, or looking away.
- **MediaPipe Camera Utilities (`@mediapipe/camera_utils` v0.3.1675466862)**:
  - Handles frame scheduling and camera acquisition via `HTMLVideoElement`.

### Candidate Photo Capture & Verification Pipeline
- **Real-Time Webcam Shutter**:
  - Live video stream captured to an in-memory `<canvas>`.
  - Triggered manually via "Take Photo for Report" button or automatically upon first confident face detection.
  - Generates instant visual shutter flash animation (`framer-motion`).
  - Serializes verified photo as JPEG DataURL and persists in `localStorage` under `interviewx_candidate_photo`.
  - Automatically loads candidate snapshot into Profile Card and certified PDF report.
- **Movable & Resizable Picture-in-Picture (PIP)**:
  - Candidates can drag the video tracker anywhere on screen or toggle standard vs. expanded modes to maintain comfort during technical discussions.

---

## 5. Audio Engineering & Speech Synthesis Architecture

### Real-Time Audio Analysis & Volume Visualization
- **Web Audio API**:
  - `AudioContext` operating at native hardware sample rates (44.1 kHz / 48 kHz).
  - `MediaStreamAudioSourceNode` capturing clean microphone input stream.
  - `AnalyserNode` configured with `fftSize = 2048` and `smoothingTimeConstant = 0.8`.
- **Time-Domain RMS & Peak Detection**:
  - Employs `analyser.getByteTimeDomainData()` to measure real-time vocal deviation from baseline (128).
  - Translates acoustic energy into a normalized 0–100% volume level, powering responsive animated waveform visualizer bars.
- **macOS / Chromium Audio Graph Safeguard**:
  - Routes analyser through a `GainNode` with `gain = 0` directly to `audioCtx.destination`. This prevents Chromium from suspending or throttling the audio graph on macOS while ensuring zero acoustic feedback.

### Dual-Engine Speech-to-Text (STT)
- **Engine A: Browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)**:
  - Low-latency continuous streaming transcription.
  - Emits interim and final transcripts directly into the candidate answer buffer.
- **Engine B: Gemini 2.5 Flash Cloud Audio Transcriber (Automatic Fallback)**:
  - If the browser lacks Web Speech support, encounters cloud network timeouts, or mic recognition stalls, a background `MediaRecorder` captures audio slices (`audio/webm;codecs=opus` or `audio/mp4`).
  - Audio data is base64 encoded and sent to `/api/transcribe-audio` where Google Gemini 2.5 Flash transcribes the spoken response with 100% reliability.

### Senior Interviewer Voice Synthesis (TTS)
- **Web Speech Synthesis API (`window.speechSynthesis`)**:
  - **Prosody Tuning**: Custom delivery rate of `0.94x` with natural cadence and pitch (`1.0`).
  - **Acronym Phonetic Parser**: Automatically pre-processes technical jargon into natural phonetic units (e.g., `API` -> `A.P.I.`, `CI/CD` -> `C.I./C.D.`, `SQL` -> `sequel`, `K8s` -> `Kubernetes`, `PostgreSQL` -> `Postgres-Q-L`).
  - **Chrome Queue Debounce Fix**: Prevents Chromium's known speech cancellation race condition by executing a 50ms queue pause and explicit `speechSynthesis.resume()` call after `cancel()`.
  - **Audio Pipeline Unlocking**: Programmatic `unlockAudio()` initializes a silent buffer on first user click, satisfying browser Autoplay Policy restrictions.
  - **Voice Tuning Studio**: Candidate can audition and select between United States, British, or Australian executive voices.

---

## 6. Backend API & Asynchronous Microservices

### Server Core
- **FastAPI (`0.115.0+` / `0.141.1`)**:
  - Asynchronous ASGI Python framework delivering sub-millisecond route handling.
  - Native support for dependency injection, CORS middleware, and automated OpenAPI 3.1 Swagger documentation at `/docs`.
- **Uvicorn (`0.30.0+` / `0.52.4`)**:
  - Enterprise ASGI server running on `uvloop` (high-performance libuv event loop wrapper) and `httptools`.
- **WebSockets (`12.0+` / `16.1.1`)**:
  - Low-latency full-duplex WebSocket endpoint (`/ws/interview`) for real-time room communication, turn events, and status heartbeats.
- **Pydantic v2 (`2.7.0+` / `2.13.5`)**:
  - Ultra-fast C-extension based data validation.
  - Strict type coercion and runtime schema validation for all API inputs and outputs.
- **HTTPX (`0.27.0+` / `0.28.1`)**: Non-blocking asynchronous HTTP client for external service communication.
- **Python Dotenv (`1.0.0+` / `1.2.3`)**: Secure environment variable loading isolating `GEMINI_API_KEY`.

### REST API Endpoints Specification

| Method | Route | Request Body | Response Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/init-session` | `InitSessionRequest` | `SessionData` | Generates 5-question interview curriculum tailored to role and seniority |
| `POST` | `/api/evaluate-answer` | `EvaluateAnswerRequest` | `TurnEvaluation` | Instant critique covering technical depth, relevance, communication, and model answer |
| `POST` | `/api/conversational-turn` | `ConversationalTurnRequest` | `ConversationalTurnResponse` | Generates conversational interviewer speech and contextual follow-up probes |
| `POST` | `/api/explain-question` | `QuestionBreakdownRequest` | `QuestionBreakdownResponse` | Generates plain-English question intent and suggested conversational opener |
| `POST` | `/api/clarify-doubt` | `DoubtRequest` | `DoubtResponse` | Interactive doubt resolution assistant answering candidate questions mid-interview |
| `POST` | `/api/transcribe-audio` | `TranscribeAudioRequest` | `TranscribeAudioResponse` | Multimodal speech-to-text audio transcription powered by Gemini 2.5 Flash |
| `POST` | `/api/final-report` | `FinalReportRequest` | `FinalReport` | Compiles full evaluation report, 6-axis radar metrics, and overall hire recommendation |
| `GET`  | `/api/session/{id}` | Path param `id` | `SessionData` | Retrieves active session state and question history |

---

## 7. Large Language Model (LLM) & Generative AI Infrastructure

### Foundation Model
- **Google Gemini 2.5 Flash (`gemini-2.5-flash`)**:
  - Integrated via the official **`google-genai` SDK (`>=1.0.0`)**.
  - Optimized for ultra-low time-to-first-token (TTFT) and multimodal audio/text processing.

### Prompt Engineering Architecture
1. **Curriculum Synthesis**:
   - Analyzes target role, seniority level (Junior, Mid, Senior, Staff/Lead), and optional job description text.
   - Generates a balanced 5-question technical interview progression:
     - Question 1: System architecture & fundamentals.
     - Question 2: Deep technical domain mechanics.
     - Question 3: Real-world scalability, performance, or concurrency challenge.
     - Question 4: Production failure debugging & edge cases.
     - Question 5: Trade-offs, design philosophy, or leadership perspective.
2. **Multi-Factor Turn Evaluation**:
   - Structured JSON output format via Pydantic model parsing.
   - Evaluates technical accuracy, missing architectural considerations, and concrete improvements.
   - Produces a Senior/Staff-level **"Better Answer"** demonstrating optimal phrasing and technical conciseness.
3. **Conversational Interviewer Persona**:
   - Emulates an experienced engineering leader (empathetic, inquisitive, rigorous).
   - Generates dynamic bridge transitions (e.g., *"That's a solid point on indexing; let's drill deeper into how that impacts write amplification..."*).
4. **Multimodal Audio STT**:
   - Ingests raw audio base64 buffers directly in multimodal prompts.
   - Accurately transcribes technical terms, framework names, and code syntax that traditional STT engines mishear.

---

## 8. Computational Linguistics & Pacing Analytics

Located in `server/services/analytics.py`:

### Pacing & Cadence Analytics
- **Words-Per-Minute (WPM) Calculator**:
  - Evaluates words spoken per unit time against an industry-standard technical presentation benchmark:
    - `< 100 WPM`: Hesitant / overly delayed.
    - `120 – 165 WPM`: **Optimal executive technical delivery**.
    - `> 180 WPM`: Rushed delivery; may reduce listener comprehension.

### Verbal Filler Detection
- **Multi-Word Regex Pattern Matching**:
  - Scans candidate answer transcripts for cognitive verbal fillers:
    - `"um"`, `"uh"`, `"er"`, `"ah"`
    - `"like"`, `"basically"`, `"literally"`
    - `"you know"`, `"sort of"`, `"kind of"`
  - Calculates **Filler Density Ratio** (fillers per 100 words) and penalizes delivery score accordingly.

### 4-Tier Weighted Scoring Rubric
- **40% Technical Depth & Architecture**: Correctness, systems thinking, algorithmic complexity, trade-off analysis.
- **30% Communication Delivery & Cadence**: Pacing, absence of fillers, clarity, structure.
- **20% Job Description Relevance**: Alignment with required tech stack, role requirements, and domain focus.
- **10% Composure & Eye Contact**: MediaPipe-measured visual gaze ratio, camera confidence, and posture stability.

---

## 9. Document Generation & Certified PDF Export Engine

### Rendering Pipeline
- **html2canvas (`1.4.1`)**:
  - Rasterizes the DOM node of the evaluation report into a high-resolution canvas.
  - **`onclone` Document Mutation Pipeline**:
    - Overrides gradient clips (`bg-clip-text text-transparent`) to enforce solid `#FFFFFF` white headers and `#34D399` emerald scores.
    - Locks background color to `#0B0F19` (Midnight Navy).
    - Scans for all accordion containers (`data-accordion-content`) and expands them to `display: block` with `height: auto` so that all question breakdowns, critiques, and model answers are visible in the PDF.
- **jsPDF (`2.5.2`)**:
  - Converts the rasterized canvas into an A4 vector document.
  - Dynamically calculates aspect ratios, page splits, and margins.
  - Embeds candidate photo with live webcam verification watermark and timestamp.

---

## 10. Security, Data Privacy & Edge Governance

1. **Client-Side Edge Privacy**:
   - Zero webcam video streaming: all face landmark calculations occur exclusively within the local browser WebAssembly sandbox.
   - Candidate snapshot photo is stored strictly in the candidate's browser `localStorage` and sent nowhere except into their own exported PDF.
2. **Credential Isolation**:
   - `GEMINI_API_KEY` is maintained exclusively on the backend server (`server/.env`).
   - The Next.js frontend never bundles or exposes API secrets to client-side assets.
3. **CORS & WebSocket Security**:
   - FastAPI CORS middleware configured with explicit allowed origins (`http://localhost:3000`).
   - WebSocket handshakes validated on session establishment.

---

## 11. Hardware, OS & Browser Compatibility Matrix

| Category | Recommended Specification | Minimum Specification | Notes |
| :--- | :--- | :--- | :--- |
| **Operating System** | macOS 14+ (Apple Silicon), Windows 11, Ubuntu 22.04+ | macOS 11+, Windows 10, Linux | Fully cross-platform |
| **Web Browser** | Google Chrome 110+, Brave, Arc, Edge 110+ | Chrome 90+, Safari 15+, Firefox 110+ | Chromium recommended for native Web Speech API |
| **Processor (CPU)** | Apple M-Series or Intel/AMD 4-Core+ | Dual-Core 2.0 GHz | MediaPipe runs smoothly on 2+ cores |
| **Memory (RAM)** | 8 GB or higher | 4 GB | MediaPipe + Next.js + FastAPI |
| **Camera** | 720p or 1080p Webcam | 480p Web Camera | Any standard USB/built-in webcam |
| **Microphone** | Built-in or external USB/Bluetooth mic | Built-in mic | Audio input sensitivity calibration included |

---

## 12. Full Dependency Manifest with Exact Versions

### Client-Side (`client/package.json`)

```json
{
  "dependencies": {
    "@mediapipe/camera_utils": "^0.3.1675466862",
    "@mediapipe/face_mesh": "^0.4.1633559619",
    "clsx": "^2.1.1",
    "framer-motion": "^11.11.9",
    "html2canvas": "^1.4.1",
    "jspdf": "^2.5.2",
    "lucide-react": "^0.453.0",
    "next": "14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^2.5.4"
  },
  "devDependencies": {
    "@types/node": "^20.17.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.6.3"
  }
}
```

### Server-Side (`server/requirements.txt`)

```
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
websockets>=12.0
pydantic>=2.7.0
google-genai>=1.0.0
python-dotenv>=1.0.0
httpx>=0.27.0
```

---

*InterviewX — Designed and Engineered with Next.js 14, FastAPI, MediaPipe, and Google Gemini 2.5 Flash.*
