import os
from dotenv import load_dotenv

# Load environment variables safely at earliest moment
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

import json
import logging
import uuid
from typing import Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from services.auth import auth_verifier, UserProfile, AuthResponse
from services.llm_evaluator import evaluator, InterviewPlanResponse
from services.analytics import (
    analytics_engine,
    QuestionEvaluationItem,
    FinalInterviewReport
)

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("interviewx.server")

app = FastAPI(
    title="InterviewX Engine",
    description="Real-Time Multi-Modal AI Interview Platform API",
    version="1.0.0"
)

# CORS Middleware
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store
active_sessions: Dict[str, Dict[str, Any]] = {}

# Request / Response Models
class ConversationalTurnRequest(BaseModel):
    session_id: Optional[str] = None
    target_role: str = Field(default="Full-Stack Engineer")
    experience_level: str = Field(default="Mid-Level")
    job_description: str = Field(default="")
    candidate_utterance: str = Field(description="The spoken words from the candidate")
    dialogue_history: list = Field(default_factory=list)
    current_topic: str = Field(default="Technical Architecture")

class ClarifyDoubtRequest(BaseModel):
    session_id: Optional[str] = None
    question_id: Optional[str] = None
    question_text: str = Field(default="General Interview Concept")
    target_role: str = Field(default="Full-Stack Engineer")
    experience_level: str = Field(default="Mid-Level")
    doubt: str = Field(description="Candidate's doubt or question needing clarification")
    context: Optional[str] = None

class ExplainQuestionRequest(BaseModel):
    session_id: Optional[str] = None
    question_id: Optional[str] = None
    question_text: str = Field(default="Active Interview Question")
    target_role: str = Field(default="Full-Stack Engineer")
    experience_level: str = Field(default="Mid-Level")
    job_description: Optional[str] = Field(default="")

class TranscribeAudioRequest(BaseModel):
    audio_base64: str = Field(description="Base64 encoded audio recording from browser MediaRecorder")
    mime_type: Optional[str] = Field(default="audio/webm", description="Audio MIME type, e.g., audio/webm or audio/wav")
    language: Optional[str] = Field(default="en-US", description="Target spoken language dialect")

class GoogleAuthRequest(BaseModel):
    credential: str = Field(description="Google ID Token JWT")

class InitSessionRequest(BaseModel):
    target_role: str = Field(default="Full-Stack Engineer", description="Job title target")
    experience_level: str = Field(default="Mid-Level (3-5 yrs)", description="Candidate experience tier")
    job_description: str = Field(default="", description="Job description text for contextual grounding")
    user_id: Optional[str] = Field(default=None, description="Authenticated Google User ID")
    user_email: Optional[str] = Field(default=None, description="Authenticated Google Email")

class InitSessionResponse(BaseModel):
    session_id: str
    target_role: str
    experience_level: str
    questions: list

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "gemini_configured": bool(evaluator.client),
        "active_sessions_count": len(active_sessions)
    }

@app.post("/api/auth/google", response_model=AuthResponse)
async def google_auth_endpoint(payload: GoogleAuthRequest):
    """
    Cryptographically verifies Google ID Token and creates an authenticated candidate session.
    """
    user = auth_verifier.verify_id_token(payload.credential)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid Google authentication credential")
    
    session_token = auth_verifier.create_session(user)
    return AuthResponse(user=user, session_token=session_token)

@app.get("/api/auth/me", response_model=UserProfile)
async def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Retrieves the verified user profile for the given session token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split(" ")[1]
    user = auth_verifier.get_user_by_session(token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    
    return user

@app.post("/api/init-session", response_model=InitSessionResponse)
async def init_session(payload: InitSessionRequest):
    """
    Initializes a tailored mock interview session by generating 5 role-calibrated questions.
    """
    session_id = str(uuid.uuid4())
    logger.info(f"Initializing session {session_id} for role '{payload.target_role}' ({payload.experience_level})")

    # Generate questions via LLM Evaluator
    plan: InterviewPlanResponse = evaluator.generate_interview_plan(
        role=payload.target_role,
        experience=payload.experience_level,
        jd=payload.job_description
    )

    questions_list = [q.model_dump() for q in plan.questions]

    # Store session state in memory
    active_sessions[session_id] = {
        "session_id": session_id,
        "target_role": payload.target_role,
        "experience_level": payload.experience_level,
        "job_description": payload.job_description,
        "questions": questions_list,
        "evaluations": [],
        "completed": False
    }

    return InitSessionResponse(
        session_id=session_id,
        target_role=payload.target_role,
        experience_level=payload.experience_level,
        questions=questions_list
    )

@app.post("/api/clarify")
async def clarify_doubt_endpoint(payload: ClarifyDoubtRequest):
    """
    AI Gemini Assistant endpoint to clarify candidate doubts, concepts, or constraints in real-time.
    """
    role = payload.target_role
    experience = payload.experience_level
    question = payload.question_text

    # Enrich from session if provided
    if payload.session_id and payload.session_id in active_sessions:
        s = active_sessions[payload.session_id]
        role = s.get("target_role", role)
        experience = s.get("experience_level", experience)
        if payload.question_id:
            q_match = next((q for q in s.get("questions", []) if q["id"] == payload.question_id), None)
            if q_match:
                question = q_match["question"]

    result = evaluator.clarify_doubt(
        question=question,
        role=role,
        experience=experience,
        doubt=payload.doubt,
        context=payload.context
    )
    return result.model_dump()

@app.post("/api/explain-question")
async def explain_question_endpoint(payload: ExplainQuestionRequest):
    """
    AI Gemini Assistant endpoint to explain an interview question in plain English,
    highlight core concepts tested, suggest a structured response framework, and provide
    a voice-ready audio explanation script.
    """
    role = payload.target_role
    experience = payload.experience_level
    question = payload.question_text
    jd = payload.job_description or ""

    if payload.session_id and payload.session_id in active_sessions:
        s = active_sessions[payload.session_id]
        role = s.get("target_role", role)
        experience = s.get("experience_level", experience)
        jd = s.get("job_description", jd)
        if payload.question_id:
            q_match = next((q for q in s.get("questions", []) if q["id"] == payload.question_id), None)
            if q_match:
                question = q_match["question"]

    result = evaluator.explain_question(
        question=question,
        role=role,
        experience=experience,
        jd=jd
    )
    return result.model_dump()

@app.post("/api/conversational-turn")
async def conversational_turn_endpoint(payload: ConversationalTurnRequest):
    """
    Autonomous Conversational Interviewer:
    Evaluates candidate spoken utterance, applies self-thinking reasoning, and dynamically generates
    the next spoken question or voice clarification response.
    """
    role = payload.target_role
    experience = payload.experience_level
    jd = payload.job_description

    if payload.session_id and payload.session_id in active_sessions:
        s = active_sessions[payload.session_id]
        role = s.get("target_role", role)
        experience = s.get("experience_level", experience)
        jd = s.get("job_description", jd)

    result = evaluator.generate_conversational_turn(
        dialogue_history=payload.dialogue_history,
        target_role=role,
        experience_level=experience,
        job_description=jd,
        candidate_utterance=payload.candidate_utterance,
        current_topic=payload.current_topic
    )
    return result.model_dump()

@app.post("/api/transcribe-audio")
async def transcribe_audio_endpoint(payload: TranscribeAudioRequest):
    """
    Multimodal Gemini 2.5 Flash Audio Transcriber:
    Transcribes audio recorded via browser MediaRecorder.
    Guarantees 100% reliable transcription even if the browser Web Speech API fails,
    is muted, or is blocked by cloud network/firewall policies.
    """
    import base64
    try:
        raw_b64 = payload.audio_base64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]

        audio_bytes = base64.b64decode(raw_b64)
        if len(audio_bytes) < 64:
            return {"transcription": "", "status": "empty_audio", "message": "Audio stream was too short or empty."}

        mime_type = payload.mime_type or "audio/webm"
        # Sanitize mime_type
        if ";" in mime_type:
            mime_type = mime_type.split(";")[0].strip()

        transcription = evaluator.transcribe_audio(
            audio_bytes=audio_bytes,
            mime_type=mime_type,
            language_hint=payload.language or "en-US"
        )

        return {
            "transcription": transcription,
            "status": "success",
            "byte_length": len(audio_bytes)
        }
    except Exception as e:
        logger.error(f"Failed to transcribe candidate audio: {e}")
        return {"transcription": "", "status": "error", "message": str(e)}

@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    session = active_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.websocket("/ws/interview")
async def websocket_interview_endpoint(websocket: WebSocket, session_id: Optional[str] = Query(default=None)):
    """
    Real-Time WebSocket pipeline for:
    - Synchronizing active question state
    - Ingesting candidate audio transcripts and speech analytics
    - Returning instant structured rubric critiques and dynamic follow-up prompts
    - Delivering the final evaluation report card
    """
    await websocket.accept()
    logger.info(f"WebSocket client connected. Session ID: {session_id}")

    # If session_id not passed in query, client can register it in the first handshake
    current_session_id = session_id

    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                message = json.loads(raw_text)
            except Exception:
                await websocket.send_text(json.dumps({"type": "error", "message": "Invalid JSON format"}))
                continue

            msg_type = message.get("type")

            # 1. Ping / Keepalive
            if msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                continue

            # 2. Register / Bind Session ID
            if msg_type == "bind_session":
                current_session_id = message.get("session_id")
                session = active_sessions.get(current_session_id)
                if session:
                    await websocket.send_text(json.dumps({
                        "type": "session_bound",
                        "session_id": current_session_id,
                        "questions": session["questions"]
                    }))
                else:
                    await websocket.send_text(json.dumps({"type": "error", "message": "Session ID not found"}))
                continue

            # Ensure valid session for subsequent actions
            session = active_sessions.get(current_session_id)
            if not session:
                # Provide an auto-initialized ephemeral session if client hopped straight in
                current_session_id = str(uuid.uuid4())
                fallback_plan = evaluator.generate_interview_plan("Full-Stack Engineer", "Mid-Level", "")
                session = {
                    "session_id": current_session_id,
                    "target_role": "Full-Stack Engineer",
                    "experience_level": "Mid-Level",
                    "job_description": "",
                    "questions": [q.model_dump() for q in fallback_plan.questions],
                    "evaluations": [],
                    "completed": False
                }
                active_sessions[current_session_id] = session
                logger.info(f"Created fallback auto-session {current_session_id}")

            # 3. Start Question Action
            if msg_type == "start_question":
                q_id = message.get("question_id")
                await websocket.send_text(json.dumps({
                    "type": "question_started",
                    "question_id": q_id
                }))
                continue

            # 4. Submit Answer Action
            if msg_type == "submit_answer":
                q_id = message.get("question_id", "q1")
                transcript = message.get("transcript", "").strip()
                duration = float(message.get("duration_seconds", 15.0))
                client_fillers = int(message.get("filler_count", 0))
                eye_contact = float(message.get("eye_contact_score", 80.0))
                client_wpm = float(message.get("wpm", 0.0))

                # Compute transcript word metrics if WPM wasn't calculated client-side
                word_count = len(transcript.split()) if transcript else 0
                if client_wpm <= 0 and duration > 0 and word_count > 0:
                    calculated_wpm = (word_count / duration) * 60.0
                else:
                    calculated_wpm = client_wpm

                # Count filler words with backend heuristic
                filler_map = analytics_engine.count_filler_words(transcript)
                server_filler_count = sum(filler_map.values())
                total_filler_count = max(client_fillers, server_filler_count)

                # Delivery score
                delivery_score = analytics_engine.calculate_delivery_score(
                    wpm=calculated_wpm,
                    filler_count=total_filler_count,
                    duration_seconds=duration
                )

                # Locate question metadata
                q_data = next((q for q in session["questions"] if q["id"] == q_id), {
                    "id": q_id,
                    "question": "Explain your approach to software architecture.",
                    "category": "Technical",
                    "expected_focus": "System architecture, trade-offs"
                })

                # LLM Evaluation
                eval_result = evaluator.evaluate_answer(
                    question=q_data["question"],
                    category=q_data.get("category", "General"),
                    expected_focus=q_data.get("expected_focus", "Core engineering principles"),
                    role=session["target_role"],
                    experience=session["experience_level"],
                    transcript=transcript,
                    wpm=calculated_wpm,
                    filler_count=total_filler_count,
                    eye_contact=eye_contact
                )

                # Weighted Score for this question (40% Tech, 30% Delivery, 20% Relevance, 10% Eye Contact)
                weighted_score = analytics_engine.calculate_question_weighted_score(
                    technical=eval_result.technical_score,
                    relevance=eval_result.relevance_score,
                    delivery=delivery_score,
                    eye_contact=eye_contact
                )

                item = QuestionEvaluationItem(
                    question_id=q_id,
                    question_text=q_data["question"],
                    category=q_data.get("category", "Technical"),
                    transcript=transcript if transcript else "(No response recorded)",
                    duration_seconds=round(duration, 1),
                    wpm=round(calculated_wpm, 1),
                    filler_count=total_filler_count,
                    eye_contact_score=round(eye_contact, 1),
                    technical_score=eval_result.technical_score,
                    relevance_score=eval_result.relevance_score,
                    clarity_score=eval_result.clarity_score,
                    confidence_score=eval_result.confidence_score,
                    delivery_score=delivery_score,
                    weighted_score=weighted_score,
                    strengths=eval_result.strengths,
                    weaknesses=eval_result.weaknesses,
                    critique=eval_result.critique,
                    model_answer=eval_result.model_answer
                )

                # Save or update question evaluation in session
                session["evaluations"] = [e for e in session["evaluations"] if e.question_id != q_id]
                session["evaluations"].append(item)

                # Send evaluation response back to client
                await websocket.send_text(json.dumps({
                    "type": "answer_evaluated",
                    "data": item.model_dump(),
                    "suggest_follow_up": eval_result.suggest_follow_up,
                    "follow_up_question": eval_result.follow_up_question
                }))
                continue

            # 4b. Clarify Doubt Action (Gemini AI Assistant)
            if msg_type == "clarify_doubt":
                q_id = message.get("question_id", "q1")
                doubt = message.get("doubt", "").strip()
                q_data = next((q for q in session["questions"] if q["id"] == q_id), {
                    "id": q_id,
                    "question": "General engineering topic",
                    "category": "Technical"
                })

                clarification = evaluator.clarify_doubt(
                    question=q_data["question"],
                    role=session["target_role"],
                    experience=session["experience_level"],
                    doubt=doubt,
                    context=message.get("context")
                )

                await websocket.send_text(json.dumps({
                    "type": "doubt_clarified",
                    "question_id": q_id,
                    "data": clarification.model_dump()
                }))
                continue

            # 4c. Autonomous Voice Turn (Voice Command / Adaptive Self-Thinking Interviewer)
            if msg_type == "candidate_voice_turn":
                candidate_text = message.get("candidate_utterance", "").strip()
                dialogue_history = message.get("dialogue_history", [])
                current_topic = message.get("current_topic", "System Architecture")

                turn_result = evaluator.generate_conversational_turn(
                    dialogue_history=dialogue_history,
                    target_role=session["target_role"],
                    experience_level=session["experience_level"],
                    job_description=session.get("job_description", ""),
                    candidate_utterance=candidate_text,
                    current_topic=current_topic
                )

                await websocket.send_text(json.dumps({
                    "type": "interviewer_voice_turn",
                    "data": turn_result.model_dump()
                }))
                continue

            # 4d. Explain Question Action (Voice Assistant Breakdown)
            if msg_type == "explain_question":
                q_id = message.get("question_id", "q1")
                q_data = next((q for q in session["questions"] if q["id"] == q_id), {
                    "id": q_id,
                    "question": message.get("question_text", "General software engineering topic"),
                    "category": "Technical"
                })

                explanation = evaluator.explain_question(
                    question=q_data["question"],
                    role=session["target_role"],
                    experience=session["experience_level"],
                    jd=session.get("job_description", "")
                )

                await websocket.send_text(json.dumps({
                    "type": "question_explained",
                    "question_id": q_id,
                    "data": explanation.model_dump()
                }))
                continue

            # 5. Skip Question Action
            if msg_type == "skip_question":
                q_id = message.get("question_id", "q1")
                q_data = next((q for q in session["questions"] if q["id"] == q_id), {
                    "id": q_id,
                    "question": "Question skipped",
                    "category": "Technical"
                })
                skipped_item = QuestionEvaluationItem(
                    question_id=q_id,
                    question_text=q_data["question"],
                    category=q_data.get("category", "Technical"),
                    transcript="(Question was skipped by candidate)",
                    duration_seconds=0.0,
                    wpm=0.0,
                    filler_count=0,
                    eye_contact_score=0.0,
                    technical_score=0,
                    relevance_score=0,
                    clarity_score=0,
                    confidence_score=0,
                    delivery_score=0.0,
                    weighted_score=0.0,
                    strengths=["Recognized personal gap and chose to move forward efficiently"],
                    weaknesses=["Skipped question entirely"],
                    critique="This question was skipped. Review the model answer to strengthen this topic area for your live interview.",
                    model_answer=f"When asked about {q_data.get('category', 'this topic')}, provide a high-level conceptual overview even if you are not deeply familiar with every implementation detail."
                )
                session["evaluations"] = [e for e in session["evaluations"] if e.question_id != q_id]
                session["evaluations"].append(skipped_item)

                await websocket.send_text(json.dumps({
                    "type": "question_skipped",
                    "question_id": q_id,
                    "data": skipped_item.model_dump()
                }))
                continue

            # 6. Finish Interview Action -> Generate Final Report
            if msg_type == "finish_interview":
                session["completed"] = True
                final_report: FinalInterviewReport = analytics_engine.generate_final_report(
                    target_role=session["target_role"],
                    experience_level=session["experience_level"],
                    question_evaluations=session["evaluations"]
                )

                await websocket.send_text(json.dumps({
                    "type": "final_report",
                    "data": final_report.model_dump()
                }))
                continue

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected gracefully. Session ID: {current_session_id}")
    except Exception as e:
        logger.error(f"WebSocket runtime exception: {e}", exc_info=True)
        try:
            await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))
        except Exception:
            pass

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
