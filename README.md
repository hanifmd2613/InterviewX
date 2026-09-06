<<<<<<< HEAD
# InterviewX — Autonomous Multimodal Technical Interview Platform 🎙️👁️🤖

<div align="center">

![InterviewX Platform](https://img.shields.io/badge/Platform-InterviewX-6366F1?style=for-the-badge)
![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014%20App%20Router-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)
![Google Gemini 2.5](https://img.shields.io/badge/AI%20Engine-Gemini%202.5%20Flash-4285F4?style=for-the-badge&logo=google)
![MediaPipe](https://img.shields.io/badge/Computer%20Vision-MediaPipe%20FaceMesh-00C4CC?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript)
![Python 3.12](https://img.shields.io/badge/Language-Python%203.12-3776AB?style=for-the-badge&logo=python)

**Simulate high-stakes technical engineering interviews with real-time vocal cadence analytics, computer vision attention tracking, neural voice synthesis, and comprehensive Gemini-powered architectural critique.**

[Quickstart](#-quickstart-guide) • [Core Features](#-core-features) • [System Architecture](#-system-architecture) • [API Reference](#-api--websocket-reference) • [Microphone & Camera Guide](#-audio--camera-troubleshooting)

</div>

---

## 🌟 Overview

**InterviewX** is a full-stack, multimodal AI technical interview simulation platform. It replicates an authentic Silicon Valley / Big Tech engineering interview experience:

- **Speaks questions aloud** using natural executive pacing and prosody.
- **Listens and transcribes answers in real-time** via dual engines (Web Speech API + Gemini 2.5 Flash Multimodal Audio Transcriber fallback).
- **Tracks visual attention and posture** via an on-device MediaPipe 468-landmark FaceMesh tracker with movable picture-in-picture window.
- **Captures live candidate verification photos** and embeds them directly into certified PDF report cards.
- **Evaluates answers instantly** with objective architectural scoring, WPM pacing analysis, and exemplary "Better Answer" phrasing.
- **Exports high-contrast printable PDF report cards** with white/emerald typography on a Midnight Navy canvas.

---

## 🚀 Core Features

### 1. 🎙️ Natural Voice Synthesis ("AI Senior Interviewer")
- **Fluent Conversational Pacing**: Calibrated 0.94x speech delivery with breathing pauses and technical acronym expansion (A.P.I., Kubernetes, C.I./C.D., PostgreSQL).
- **Read Question Out Loud**: 1-click voice replay with automatic audio context unmuting.
- **Voice Tuning Studio**: Modal to audition and select regional accents (US, UK, Australia) and delivery speeds (Calm, Executive, Brisk).
- **Explain Simply**: Explains complex question intent in plain English with a suggested conversational opening sentence.

### 2. 🎤 Resilient Dual-Engine Speech Recognition
- **Real-Time Web Audio Amplitude Meter**: High-sensitivity time-domain RMS/peak volume analyzer with dynamic visualizer bars that dance to your voice.
- **Dual-Engine Speech Recognition**:
  - **Engine A**: Client-side Web Speech API for instantaneous transcription, live word counts, and WPM computation.
  - **Engine B (Gemini Neural Backup)**: If browser speech recognition is blocked, drops words, or encounters cloud network timeouts, the system automatically sends recorded audio chunks to backend Gemini 2.5 Flash (`/api/transcribe-audio`) for 100% transcription reliability.
- **Speech Cadence Analytics**: Monitors verbal filler words (`"um"`, `"uh"`, `"like"`, `"basically"`, `"literally"`) and calculates words-per-minute (optimal: 120–165 WPM).
- **Typing Fallback**: Full support for typing answers if working in quiet or restricted environments.

### 3. 👁️ Movable Computer Vision Attention Tracker
- **MediaPipe 468-Point FaceMesh**: Client-side, privacy-first computer vision tracking eye contact ratio, iris gaze vectors, and head tilt/slouching.
- **Movable & Resizable PIP Window**: Drag the vision tracker anywhere on your screen or toggle between standard and enlarged modes.
- **📸 Candidate Photo Capture**: Prominent shutter button allows candidates to take their photo with real-time flash animation and thumbnail preview. Auto-captures a backup photo upon first face detection.
- **Live Gaze HUD**: Visual feedback indicating whether you maintain direct camera eye contact during technical explanations.

### 4. 🧠 Gemini Doubt Assistant
- **In-Interview AI Doubt Resolution**: Candidate can ask doubts, clarify edge cases, or request conceptual hints without sacrificing evaluation scores.
- **Multimodal Voice Input**: Speak doubts using your microphone or choose from pre-built prompt pills.
- **Context-Aware Responses**: Tailored specifically to the active interview question, candidate role, and seniority level.

### 5. 📊 Comprehensive Evaluation & High-Contrast PDF Export
- **Weighted 4-Tier Scoring Rubric**:
  - `40%` Technical Depth & Architecture
  - `30%` Delivery, Cadence & Filler Word Absence
  - `20%` Job Description Alignment
  - `10%` Eye Contact & Posture Composure
- **Competency Radar Chart**: 6-axis SVG visual distribution (Technical, Delivery, Relevance, Clarity, Confidence, Eye Contact).
- **Exemplary "Better Answer" Phrasing**: Senior/Staff-level model answers for every question.
- **Verified Candidate Profile**: Embeds candidate webcam photo, Google verification status, and completion timestamp.
- **High-Contrast Dark PDF Export**: Custom `html2canvas` / `jsPDF` pipeline rendering crisp `#FFFFFF` white and `#34D399` emerald typography on `#0B0F19` Midnight Navy background.

---

## ⚡ Quickstart Guide

### Option 1: 1-Click Startup Script (Recommended)

From the project root directory, run:
```bash
./start.sh
```
This script validates your Python virtual environment, starts the FastAPI backend on port 8000, and boots the Next.js frontend on port 3000.

---

### Option 2: Manual Step-by-Step Setup

#### 1. Prerequisites
- **Node.js**: `v18.17.0+` (Node 20+ recommended)
- **Python**: `3.10+` (Python 3.12 recommended)
- **Google Gemini API Key**: Obtain from [Google AI Studio](https://aistudio.google.com/).

#### 2. Backend Setup
```bash
cd server

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Open .env and insert your GEMINI_API_KEY:
# GEMINI_API_KEY=AIzaSy...

# Start the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend runs on `http://localhost:8000` (Swagger docs available at `http://localhost:8000/docs`).*

#### 3. Frontend Setup
```bash
cd client

# Install frontend dependencies
npm install

# Start development server
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 🏗️ System Architecture

```
preppulse-ai/
├── server/
│   ├── main.py                     # FastAPI REST API & WebSocket /ws/interview handler
│   ├── requirements.txt            # Python dependencies (fastapi, uvicorn, pydantic, google-genai)
│   ├── .env                        # Server configuration & GEMINI_API_KEY
│   ├── test_backend.py             # Automated test suite
│   └── services/
│       ├── llm_evaluator.py        # Gemini 2.5 Flash structured evaluation, STT & doubt assistant
│       └── analytics.py            # WPM pacing heuristics, filler word regex & scoring rubric
│
├── client/
│   ├── app/
│   │   ├── page.tsx                # Role & JD calibration screen
│   │   ├── interview/page.tsx      # Active mock interview room with controls & dialogue timeline
│   │   ├── report/page.tsx         # Certified report card & high-contrast PDF export
│   │   └── globals.css             # Tailwind dark-mode styles & midnight navy theme
│   ├── components/
│   │   ├── WebcamTracker.tsx       # MediaPipe FaceMesh vision HUD & candidate snapshot capture
│   │   ├── CompetencyRadar.tsx     # SVG 6-axis competency radar distribution
│   │   ├── GeminiAssistantModal.tsx# Floating AI doubt assistant with voice input
│   │   ├── VoiceSettingsModal.tsx  # Speech synthesizer voice & cadence audition modal
│   │   ├── GoogleAuthButton.tsx    # Google Identity Services / One-tap sign-in
│   │   └── Navbar.tsx              # Brand header & room status indicator
│   ├── hooks/
│   │   ├── useVoiceInterviewer.ts  # Web Speech Synthesis, fluency optimization & voice ranking
│   │   └── useSpeechAnalysis.ts    # Dual-engine audio capture, RMS volume meter & Gemini STT
│   └── types/
│       └── interview.ts            # TypeScript interfaces for session, evaluation, and reports
│
├── start.sh                        # 1-Click launch script for backend & frontend
└── README.md                       # Comprehensive platform documentation
```

---

## 📡 API & WebSocket Reference

### REST Endpoints

| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/init-session` | Generates a 5-question interview plan calibrated to role, level, and JD. |
| `POST` | `/api/evaluate-answer` | Evaluates a single answer on Technical Depth, Relevance, and Delivery. |
| `POST` | `/api/conversational-turn` | Formulates conversational interviewer speech and follow-up probes. |
| `POST` | `/api/explain-question` | Generates plain-English breakdown and suggested opening sentence. |
| `POST` | `/api/clarify-doubt` | Interactive Q&A for doubts and edge-case assistance. |
| `POST` | `/api/transcribe-audio` | Gemini 2.5 Flash multimodal audio transcriber for candidate speech. |
| `POST` | `/api/final-report` | Synthesizes full 4-tier report card, radar metrics, and executive summary. |
| `GET`  | `/api/session/{id}` | Retrieves session state and question history. |

### WebSocket Endpoint (`/ws/interview`)

Bidirectional low-latency communication protocol:
- **Client -> Server**:
  - `join_session`: Authenticates and joins interview room.
  - `submit_answer`: Submits candidate transcript or audio buffer for instant critique.
  - `skip_question`: Skips current question and requests the next turn.
  - `request_final_report`: Requests synthesis of final evaluation report card.
- **Server -> Client**:
  - `turn_evaluation`: Returns live score, critique, and follow-up question.
  - `final_report`: Returns comprehensive report payload.

---

## 🔧 Audio & Camera Troubleshooting

### 1. Microphone Not Listening (macOS / Chrome)
1. **Check Address Bar Permissions**: Click the lock or camera icon on the left side of the address bar (`localhost:3000`) and ensure **Microphone** is set to **Allow**.
2. **System Preferences on macOS**:
   - Open **System Settings > Privacy & Security > Microphone**.
   - Verify that your browser (Google Chrome, Brave, Arc, or Safari) is toggled **ON**.
3. **Sound Input Volume**:
   - Open **System Settings > Sound > Input**.
   - Select your active microphone and speak. Ensure the input volume meter shows active movement.
4. **Use In-App "Test Mic" Button**:
   - Click the **"Test Mic"** button on the interview page. It performs a 3-second sound check with live feedback.
5. **Gemini Transcriber Safety Net**: Even if the browser's Web Speech API is blocked, InterviewX's background recorder captures audio and uses Gemini 2.5 Flash to transcribe your speech automatically.

### 2. "Read Question" Audio
- Web browsers require user interaction before playing audio. Click anywhere in the room, or click **"Read Question"** to unlock the browser audio pipeline.
- You can change voices or test speech delivery at any time by clicking the **Voice** button in the header.

### 3. Camera & Candidate Photo Capture
- When prompted, grant **Camera** access in your browser.
- Position your face in the center of the frame. The tracker will display a green indicator when your face is detected.
- Click **"Take Photo for Report"** in the camera window. A camera flash confirms your photo is saved and will appear on your final evaluation PDF.

---

## 🧪 Testing & Verification

### Frontend TypeScript & Build Check
```bash
cd client
# Validate TypeScript
npx tsc --noEmit

# Test Production Build
npm run build
```

### Backend Automated Test Suite
```bash
cd server
source venv/bin/activate
python -m pytest test_backend.py -v
```

---

## 📄 License

This project is licensed under the MIT License — see the LICENSE file for details.

Developed with ❤️ using Google Gemini 2.5 Flash, Next.js, and FastAPI.
=======
# InterviewX
AI Interview Selection test
>>>>>>> 6035617376b5cc7bf0cb50475cc13363c0e152c6
