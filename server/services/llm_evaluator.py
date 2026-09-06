import json
import logging
import os
import re
from typing import List, Optional
from dotenv import load_dotenv
from pydantic import BaseModel, Field

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

logger = logging.getLogger(__name__)

# Pydantic Schemas for Structured LLM Outputs
class InterviewQuestion(BaseModel):
    id: str = Field(description="Unique question identifier, e.g., q1, q2")
    question: str = Field(description="The interview question text")
    category: str = Field(description="Category: Technical, Behavioral, System Design, or Problem Solving")
    difficulty: str = Field(description="Difficulty level: Easy, Medium, or Hard")
    expected_focus: str = Field(description="Key concepts or signals the interviewer looks for")

class InterviewPlanResponse(BaseModel):
    target_role: str
    experience_level: str
    questions: List[InterviewQuestion]



class ConversationalTurnResponse(BaseModel):
    interviewer_speech: str = Field(description="The exact spoken words for the AI interviewer to speak out loud to the candidate")
    internal_reasoning: str = Field(description="Self-thinking rationale explaining why the AI interviewer chose this response or follow-up based on candidate signals")
    detected_candidate_intent: str = Field(description="Detected candidate intent: 'answer', 'clarification_question', 'voice_command', 'off_topic'")
    topic_category: str = Field(description="Current technical focus area, e.g. System Design, State Management, Fault Tolerance")
    quick_feedback: Optional[str] = Field(default=None, description="Brief real-time signal on the candidate's response")
    is_interview_complete: bool = Field(default=False, description="True if the interview has reached a natural conclusion (e.g. 5+ deep turns completed)")

class ClarificationResponse(BaseModel):
    answer: str = Field(description="Direct, encouraging, and clear explanation answering the candidate's doubt")
    tips_for_answering: List[str] = Field(description="1-3 concise tips on how to frame or structure an answer based on this clarification")
    suggested_assumptions: List[str] = Field(description="1-3 sensible assumptions or constraints the candidate can vocalize")

class QuestionExplanationResponse(BaseModel):
    plain_english_meaning: str = Field(description="Clear, accessible explanation of what the question is asking without unnecessary jargon")
    key_concepts_tested: List[str] = Field(description="2-4 key technical competencies or architectural trade-offs the interviewer evaluates")
    step_by_step_approach: List[str] = Field(description="3 structured steps on how to approach and structure the answer")
    suggested_opening_sentence: str = Field(description="A strong, concise opening sentence the candidate can use to begin their answer")
    voice_explanation_script: str = Field(description="A natural, conversational 2-3 sentence verbal explanation crafted for speech synthesis to speak aloud")

class AnswerEvaluationResponse(BaseModel):
    technical_score: int = Field(ge=0, le=100, description="Score 0-100 for technical accuracy & depth")
    relevance_score: int = Field(ge=0, le=100, description="Score 0-100 for alignment with the question and job description")
    clarity_score: int = Field(ge=0, le=100, description="Score 0-100 for structure, articulation, and concise delivery")
    confidence_score: int = Field(ge=0, le=100, description="Score 0-100 based on phrasing, tone, and conviction")
    strengths: List[str] = Field(description="1-3 specific strong points of the answer")
    weaknesses: List[str] = Field(description="1-3 specific areas for improvement")
    critique: str = Field(description="Actionable 2-3 sentence coaching feedback")
    model_answer: str = Field(description="A concise exemplary 'better answer' demonstrating senior-level phrasing")
    suggest_follow_up: bool = Field(description="True if the response lacked depth or missed key trade-offs")
    follow_up_question: Optional[str] = Field(default=None, description="Smart follow-up probe if suggest_follow_up is True")

class LLMEvaluator:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.client = None

        if self.api_key and self.api_key != "your_gemini_api_key_here":
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info(f"Initialized Gemini Client using model {self.model_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize google-genai client: {e}. Falling back to simulation mode.")
                self.client = None
        else:
            logger.info("GEMINI_API_KEY not configured or placeholder detected. Operating in intelligent local simulation mode.")

    def generate_interview_plan(self, role: str, experience: str, jd: str) -> InterviewPlanResponse:
        """
        Generates 5 targeted questions based on the candidate's target role, experience, and JD.
        """
        if self.client:
            try:
                from google.genai import types
                prompt = f"""
You are an expert technical hiring manager at a top-tier tech firm.
Create a tailored 5-question mock interview plan for a candidate.

Candidate Information:
- Target Role: {role}
- Experience Level: {experience}
- Target Job Description (JD):
\"\"\"{jd}\"\"\"

Requirements:
1. Generate exactly 5 questions spanning:
   - Question 1: Core Fundamentals / Architectural baseline
   - Question 2: Deep-Dive Technical challenge related directly to the JD
   - Question 3: System Design / Problem Solving scenario
   - Question 4: Production Incident / Troubleshooting or Trade-off analysis
   - Question 5: Behavioral / Collaboration or Leadership scenario
2. Calibrate the questions accurately to the requested experience level ({experience}).
3. Return valid JSON matching the specified schema.
"""
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=InterviewPlanResponse,
                        temperature=0.3,
                    )
                )
                if response.text:
                    data = json.loads(response.text)
                    return InterviewPlanResponse(**data)
            except Exception as e:
                logger.error(f"Gemini API generation error: {e}. Falling back to dynamic simulated plan.")

        return self._generate_fallback_plan(role, experience, jd)

    def evaluate_answer(
        self,
        question: str,
        category: str,
        expected_focus: str,
        role: str,
        experience: str,
        transcript: str,
        wpm: float,
        filler_count: int,
        eye_contact: float,
    ) -> AnswerEvaluationResponse:
        """
        Evaluates the candidate's transcribed spoken answer against rubric dimensions.
        """
        if self.client and transcript.strip():
            try:
                from google.genai import types
                prompt = f"""
You are a Principal Technical Interview Coach evaluating a candidate's spoken response.

Interview Context:
- Target Role: {role} ({experience})
- Question: \"{question}\"
- Category: {category}
- Expected Focus Areas: {expected_focus}

Candidate Delivery Signals:
- Transcript: \"{transcript}\"
- Spoken Words Per Minute (WPM): {wpm:.1f} (Ideal: 120-160 WPM)
- Detected Filler Words Count: {filler_count}
- Visual Eye Contact Stability: {eye_contact:.1f}%

Evaluation Instructions:
1. Technical Depth (0-100): Did they grasp the fundamental concepts, address trade-offs, and demonstrate mastery?
2. Relevance to Question (0-100): Did they answer what was asked without wandering off-topic?
3. Clarity & Articulation (0-100): Was the response structured logically (e.g. STAR or premise->tradeoff->solution)?
4. Confidence & Conviction (0-100): Assessed from their phrasing and delivery metrics.
5. Provide actionable strengths, clear weaknesses, and an exemplary Senior-level model answer.
6. Set suggest_follow_up=true if the answer was surface-level or omitted a vital edge case, along with a probing follow_up_question.
"""
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=AnswerEvaluationResponse,
                        temperature=0.2,
                    )
                )
                if response.text:
                    data = json.loads(response.text)
                    return AnswerEvaluationResponse(**data)
            except Exception as e:
                logger.error(f"Gemini API evaluation error: {e}. Falling back to heuristic evaluation.")

        return self._generate_fallback_evaluation(
            question=question,
            transcript=transcript,
            wpm=wpm,
            filler_count=filler_count,
            eye_contact=eye_contact
        )

    def generate_conversational_turn(
        self,
        dialogue_history: list,
        target_role: str,
        experience_level: str,
        job_description: str,
        candidate_utterance: str,
        current_topic: str = "Technical Architecture"
    ) -> ConversationalTurnResponse:
        """
        Autonomous conversational engine with self-thinking ability:
        1. Listens to candidate's words and detects whether they gave an answer or asked a doubt.
        2. Reasons about the depth, technologies mentioned, and architectural trade-offs.
        3. Formulates a direct verbal response + adaptive follow-up probe or next question.
        """
        if self.client and candidate_utterance.strip():
            try:
                from google.genai import types
                history_text = ""
                for msg in dialogue_history[-6:]:
                    sender = msg.get("sender", "interviewer")
                    text = msg.get("text", "")
                    history_text += f"{sender.upper()}: {text}\n"

                prompt = f"""
You are a Principal AI Technical Interviewer at a top tech company conducting a live, voice-driven mock interview.
You possess strong 'self-thinking' ability: you actively listen, analyze what technologies and trade-offs the candidate mentioned, and dynamically ask adaptive follow-up questions tailored to their exact words.

Interview Setup:
- Target Role: {target_role} ({experience_level})
- Target Job Description: "{job_description[:400]}..."
- Current Focus Topic: {current_topic}

Recent Dialogue History:
{history_text}

Candidate's Latest Spoken Input:
"{candidate_utterance}"

Your Instructions:
1. Self-Thinking Rationale: In `internal_reasoning`, explicitly write your internal thought process. For example: "The candidate proposed Redis Pub/Sub for messaging, but did not mention what happens if a subscriber is slow or offline. I need to probe them on backpressure and delivery guarantees."
2. Candidate Intent: Determine whether the candidate gave a technical answer, asked a clarifying doubt (e.g. "What scale are we designing for?"), or spoke a voice command (e.g. "Can you repeat that?").
3. Conversational Spoken Response: In `interviewer_speech`, write natural, fluent conversational spoken English (1-3 sentences maximum).
   - Use natural contractions ("That's", "Here's", "Let's").
   - If they asked a clarifying doubt or voice command: Answer their doubt directly in a warm, encouraging voice, give them a reasonable assumption to work with, and invite them to proceed.
   - If they answered the technical question: Acknowledge their specific point warmly (e.g., "That's a solid strategy using optimistic locking with Redis."), and then challenge them with a sharp, natural follow-up question digging into edge cases, scalability bottlenecks, or alternative trade-offs.
   - Ensure the sentences flow smoothly when spoken aloud by TTS (avoid dense, run-on sentences).
4. Keep tone professional, encouraging, articulate, and conversational.
5. Return strictly valid JSON adhering to the ConversationalTurnResponse schema.
"""
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=ConversationalTurnResponse,
                        temperature=0.35,
                    )
                )
                if response.text:
                    data = json.loads(response.text)
                    return ConversationalTurnResponse(**data)
            except Exception as e:
                logger.error(f"Gemini conversational turn error: {e}. Falling back to dynamic simulated turn.")

        return self._generate_fallback_conversational_turn(
            target_role=target_role,
            experience_level=experience_level,
            candidate_utterance=candidate_utterance,
            dialogue_history=dialogue_history
        )

    def _generate_fallback_conversational_turn(
        self,
        target_role: str,
        experience_level: str,
        candidate_utterance: str,
        dialogue_history: list
    ) -> ConversationalTurnResponse:
        utterance_lower = candidate_utterance.lower()
        turn_count = len(dialogue_history) // 2

        # 1. Voice Command / Clarification Inquiry
        if any(w in utterance_lower for w in ["repeat", "say that again", "what was the question", "didn't hear"]):
            last_interviewer_msg = "Could you walk me through your high-level architecture?"
            for m in reversed(dialogue_history):
                if m.get("sender") == "interviewer":
                    last_interviewer_msg = m.get("text")
                    break
            return ConversationalTurnResponse(
                interviewer_speech=f"Sure, I\'d be happy to repeat that. {last_interviewer_msg}",
                internal_reasoning="Candidate requested a repeat of the last question; providing clear verbatim repetition.",
                detected_candidate_intent="voice_command",
                topic_category="Clarification",
                quick_feedback="Good practice asking for repetition rather than guessing.",
                is_interview_complete=False
            )

        if any(w in utterance_lower for w in ["scale", "users", "traffic", "qps", "read", "write", "latency"]):
            return ConversationalTurnResponse(
                interviewer_speech="Great question to ask upfront! Let's assume approximately 50,000 active concurrent connections, with an 80-20 read-to-write ratio, and we need p99 latency under 200 milliseconds. How does that shape your design?",
                internal_reasoning="Candidate proactively asked about traffic scale and read/write ratios—a strong Senior engineering signal. Providing concrete constraints and prompting architectural decisions.",
                detected_candidate_intent="clarification_question",
                topic_category="Requirements & Constraints",
                quick_feedback="Proactive scale scoping is a senior-level trait.",
                is_interview_complete=False
            )

        if any(w in utterance_lower for w in ["clarify", "mean by", "what do you mean", "can you explain"]):
            return ConversationalTurnResponse(
                interviewer_speech="By that, I mean how your system guarantees data consistency across distributed nodes without causing cascading bottlenecks. Feel free to focus on the primary happy path first.",
                internal_reasoning="Candidate asked for terminology clarification; demystifying the concept and scoping the response.",
                detected_candidate_intent="clarification_question",
                topic_category="Concept Clarification",
                quick_feedback="Clarifying expectations prevents wasted time.",
                is_interview_complete=False
            )

        # 2. Candidate gave a Technical Answer -> Self-Thinking probing
        if "redis" in utterance_lower or "cache" in utterance_lower:
            return ConversationalTurnResponse(
                interviewer_speech="Using Redis as an in-memory caching layer is solid for low-latency reads. But what cache invalidation strategy would you use when underlying records update frequently, and how do you handle cache stampedes?",
                internal_reasoning="Candidate proposed caching with Redis. Self-thinking probe: Caching introduces invalidation complexity and cache stampede vulnerabilities during TTL expiration. Probing cache eviction and stampede mitigation.",
                detected_candidate_intent="answer",
                topic_category="Caching & Concurrency",
                quick_feedback="Good baseline choice of Redis; delve into cache stampedes.",
                is_interview_complete=turn_count >= 5
            )

        if "websocket" in utterance_lower or "real-time" in utterance_lower or "socket" in utterance_lower:
            return ConversationalTurnResponse(
                interviewer_speech="WebSockets make sense for bi-directional live events. When you scale horizontally behind a load balancer, how do you broadcast messages across multiple backend server instances so users in the same room receive every update?",
                internal_reasoning="Candidate mentioned WebSockets for real-time traffic. Self-thinking probe: WebSockets are stateful; scaling horizontally requires Pub/Sub federation (e.g. Redis Pub/Sub or Kafka). Probing multi-node federation.",
                detected_candidate_intent="answer",
                topic_category="Real-Time Scalability",
                quick_feedback="Identified stateful WebSocket challenge.",
                is_interview_complete=turn_count >= 5
            )

        if "database" in utterance_lower or "postgres" in utterance_lower or "sql" in utterance_lower:
            return ConversationalTurnResponse(
                interviewer_speech="PostgreSQL offers great relational consistency. If query volume spikes 10x during peak traffic, how would you optimize read performance before considering sharding or schema restructuring?",
                internal_reasoning="Candidate suggested a relational database. Self-thinking probe: Before complex sharding, engineers should explore connection pooling, read replicas, and composite indexing. Probing performance optimization hierarchy.",
                detected_candidate_intent="answer",
                topic_category="Data Persistence",
                quick_feedback="Solid data modeling intuition; test operational tuning.",
                is_interview_complete=turn_count >= 5
            )

        # Default self-thinking technical progression
        return ConversationalTurnResponse(
            interviewer_speech=f"That makes sense conceptually. Now, considering your target role as a {experience_level} {target_role}, what is the single biggest point of failure in this design, and how would you automate monitoring to alert the team before users notice?",
            internal_reasoning=f"Candidate provided a general explanation. Self-thinking probe: Pushing them from abstract design into production reliability, failure modes, and automated observability.",
            detected_candidate_intent="answer",
            topic_category="Reliability & Observability",
            quick_feedback="Good conceptual summary; challenge with failure mode analysis.",
            is_interview_complete=turn_count >= 5
        )

    def clarify_doubt(
        self,
        question: str,
        role: str,
        experience: str,
        doubt: str,
        context: Optional[str] = None
    ) -> ClarificationResponse:
        """
        Clarifies candidate doubts, concepts, or constraints using Gemini API or smart fallback.
        """
        if self.client and doubt.strip():
            try:
                from google.genai import types
                prompt = f"""
You are an empathetic, world-class Technical Interview Assistant (InterviewX).
A candidate practicing for a {experience} {role} interview has a doubt or needs clarification.

Interview Question: "{question}"
Additional Context: {context or 'General mock interview stage'}

Candidate Doubt / Question:
"{doubt}"

Instructions:
1. Explain the underlying concept, terminology, or expected scope clearly and concisely.
2. Provide actionable tips on how the candidate can address this in their response.
3. Suggest 1-2 sensible assumptions they can explicitly state to the interviewer (a key senior engineering habit).
4. Return valid JSON matching the specified ClarificationResponse schema.
"""
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=ClarificationResponse,
                        temperature=0.3,
                    )
                )
                if response.text:
                    data = json.loads(response.text)
                    return ClarificationResponse(**data)
            except Exception as e:
                logger.error(f"Gemini clarification error: {e}. Falling back to simulation.")

        return self._generate_fallback_clarification(question, role, experience, doubt)

    def _generate_fallback_clarification(
        self,
        question: str,
        role: str,
        experience: str,
        doubt: str
    ) -> ClarificationResponse:
        doubt_lower = doubt.lower()

        if "scope" in doubt_lower or "constraint" in doubt_lower or "assumption" in doubt_lower:
            answer = (
                f"For a {experience} {role}, the interviewer wants you to define clear system boundaries. "
                "In tech interviews, stating your assumptions out loud is viewed as a strong positive signal. "
                "Focus on the primary happy path and 1-2 critical edge cases."
            )
            tips = [
                "Open with: 'Before diving in, I\'ll assume our primary focus is high availability and low latency rather than strict multi-region consensus.'",
                "State your data volume or expected throughput assumption explicitly."
            ]
            assumptions = [
                "Assume a modern microservice setup with an existing relational database and Redis cache.",
                "Assume HTTPS/WSS communication over standard cloud infrastructure."
            ]
        elif "format" in doubt_lower or "structure" in doubt_lower or "how to start" in doubt_lower:
            answer = (
                "A winning interview answer follows a 3-part structure: "
                "1. Core Premise (one-sentence direct thesis), "
                "2. Architectural Execution & Trade-offs (the 'why' and 'how'), "
                "3. Operational Verification (monitoring, metrics, and failure recovery)."
            )
            tips = [
                "Avoid jumping straight into low-level code; begin with the high-level architecture.",
                "Conclude by stating how you would verify success using telemetry or automated tests."
            ]
            assumptions = [
                "Assume you have standard observability tools (Prometheus, Datadog, or Grafana) configured."
            ]
        else:
            answer = (
                f"Great question regarding '{question}'. In this context, the interviewer is looking to understand "
                f"how you apply foundational {role} engineering patterns to real production scenarios. "
                "You do not need to memorize every syntax detail—demonstrate your reasoning and architectural judgment."
            )
            tips = [
                "Break the problem down into components (Client -> Network/API -> State/Cache -> Storage).",
                "Explain the trade-offs of your chosen approach versus an alternative solution."
            ]
            assumptions = [
                "Assume standard production traffic with potential horizontal scaling needs."
            ]

        return ClarificationResponse(
            answer=answer,
            tips_for_answering=tips,
            suggested_assumptions=assumptions
        )

    def explain_question(
        self,
        question: str,
        role: str,
        experience: str,
        jd: str = ""
    ) -> QuestionExplanationResponse:
        """
        Explains an interview question in plain English, identifies key concepts tested,
        provides a 3-step answering approach, and creates a conversational voice script for TTS.
        """
        if self.client and question.strip():
            try:
                from google.genai import types
                prompt = f"""
You are an expert, encouraging Interview Coach and Senior Engineering Mentor.
A candidate practicing for a {experience} {role} interview wants help understanding the following question:

Interview Question:
"{question}"

Role & Level: {role} ({experience})
Target JD Context: "{jd[:300] if jd else 'Modern software engineering platform'}"

Your Goal:
1. Explain in simple, plain English what the interviewer is actually asking.
2. List 2-4 critical technical concepts or evaluation criteria being tested.
3. Provide a 3-step structured answering framework (Step 1: Clarify/Thesis, Step 2: Architecture/Trade-offs, Step 3: Reliability/Verification).
4. Provide a sample opening sentence the candidate can say out loud.
5. Create a `voice_explanation_script`: An ultra-fluent, warm, conversational script (2-3 sentences, 40-60 words) specifically written for spoken audio delivery.
   FLUENCY INSTRUCTIONS:
   - Use natural conversational English with contractions ("Here's what", "Let's break down", "You'll want to").
   - Write with natural cadence and smooth phrasing suitable for speech synthesis.
   - Speak like a friendly Senior Staff Engineer coaching a colleague one-on-one.
   - Example: "Here's what the interviewer is really getting at: they want to know how you prevent data corruption when traffic spikes. A great way to start is to name your concurrency model, compare it to one alternative, and finish with how you monitor consistency in production."

Return strictly valid JSON adhering to the QuestionExplanationResponse schema.
"""
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=QuestionExplanationResponse,
                        temperature=0.3,
                    )
                )
                if response.text:
                    data = json.loads(response.text)
                    return QuestionExplanationResponse(**data)
            except Exception as e:
                logger.error(f"Gemini explain_question error: {e}. Falling back to smart simulation.")

        return self._generate_fallback_explanation(question, role, experience)

    def _generate_fallback_explanation(
        self,
        question: str,
        role: str,
        experience: str
    ) -> QuestionExplanationResponse:
        q_lower = question.lower()
        
        if "state" in q_lower or "race condition" in q_lower or "sync" in q_lower or "distributed" in q_lower:
            meaning = "The interviewer wants to see how you maintain correct data across multiple concurrent services without data corruption or deadlocks."
            concepts = [
                "Concurrency control and locking mechanisms (optimistic vs pessimistic)",
                "State synchronization across distributed nodes or client-server boundaries",
                "Idempotency and race condition mitigation (atomic transactions, versioning)"
            ]
            approach = [
                "Step 1: State your concurrency model upfront (e.g. optimistic concurrency with version checks).",
                "Step 2: Explain your synchronization mechanism (e.g. Redis locks, database isolation levels, or event streams).",
                "Step 3: Detail how you handle conflict resolution and network failures gracefully."
            ]
            opening = "When tackling state synchronization, I prioritize optimistic concurrency with idempotent event handling to eliminate race conditions."
            script = "Here's what the interviewer is really looking for: they want to see how you protect your data when multiple services write to it at the same time. Open by stating your concurrency model, explain how you handle locking or event streams, and wrap up with how you resolve edge-case conflicts."
        elif "scale" in q_lower or "architecture" in q_lower or "system" in q_lower or "design" in q_lower:
            meaning = "The interviewer is evaluating your high-level architectural thinking, separation of concerns, and how your system scales as traffic grows."
            concepts = [
                "Component modularity and loose coupling",
                "Scalability bottlenecks (caching, load balancing, database read replicas)",
                "Failure domains and high availability"
            ]
            approach = [
                "Step 1: Define the core entities, APIs, and data flow from client to storage.",
                "Step 2: Address scalability bottlenecks using caching (Redis) and load balancers.",
                "Step 3: Discuss observability, telemetry, and automated failover strategies."
            ]
            opening = "I approach system design by breaking the problem down into distinct layers: presentation, application services, caching, and durable persistence."
            script = "Here's how to frame this system design question: The interviewer is looking for your high-level architectural instincts. Start by sketching out your core services and data flow, explain how you'd scale bottlenecks with caching and load balancers, and conclude with your automated failover strategy."
        else:
            meaning = f"The interviewer wants to evaluate your problem-solving maturity and how you communicate technical decisions for a {experience} {role} position."
            concepts = [
                "Core domain knowledge and best practices",
                "Balancing speed of delivery against long-term maintainability",
                "Clear, structured technical communication"
            ]
            approach = [
                "Step 1: Give a 1-sentence thesis answering the core question directly.",
                "Step 2: Walk through a concrete technical example or trade-off from your experience.",
                "Step 3: Conclude with how you measure success and handle edge cases."
            ]
            opening = f"In a production {role} environment, I evaluate this through the lens of reliability, developer ergonomics, and system performance."
            script = f"Here's a great way to approach this question: The interviewer wants to test your practical engineering judgment. Open with a crisp, one-sentence thesis, give a concrete production trade-off, and finish with how you verify reliability in production."

        return QuestionExplanationResponse(
            plain_english_meaning=meaning,
            key_concepts_tested=concepts,
            step_by_step_approach=approach,
            suggested_opening_sentence=opening,
            voice_explanation_script=script
        )

    def _generate_fallback_plan(self, role: str, experience: str, jd: str) -> InterviewPlanResponse:

        """Intelligent context-aware fallback questions based on role keywords."""
        role_lower = role.lower()
        
        if "front" in role_lower or "react" in role_lower or "web" in role_lower:
            questions = [
                InterviewQuestion(
                    id="q1",
                    question="How does React 18/19 handle concurrent rendering and server components under the hood, and what are the trade-offs for hydration?",
                    category="Technical",
                    difficulty="Medium",
                    expected_focus="React Virtual DOM, Fiber architecture, Suspense, Selective Hydration"
                ),
                InterviewQuestion(
                    id="q2",
                    question="Walk me through how you optimize Core Web Vitals (specifically LCP and INP) for an interactive, asset-heavy web application.",
                    category="System Performance",
                    difficulty="Hard",
                    expected_focus="Critical rendering path, resource hints, long tasks decomposition, image optimization"
                ),
                InterviewQuestion(
                    id="q3",
                    question="Describe your approach to state management in large-scale applications. When would you choose Zustand/Redux vs React Context vs URL/Server state?",
                    category="Architecture",
                    difficulty="Medium",
                    expected_focus="State isolation, re-render avoidance, synchronization trade-offs, caching"
                ),
                InterviewQuestion(
                    id="q4",
                    question="A user reports that a critical checkout page freezes intermittently on mobile browsers. How would you systematically diagnose and resolve the issue?",
                    category="Troubleshooting",
                    difficulty="Hard",
                    expected_focus="Chrome DevTools, Memory heaps, CPU throttling, Event listeners, Profiling"
                ),
                InterviewQuestion(
                    id="q5",
                    question="Tell me about a time you had a strong disagreement with a backend engineer regarding API payload contracts. How did you arrive at an optimal consensus?",
                    category="Behavioral",
                    difficulty="Medium",
                    expected_focus="Collaboration, OpenAPI/GraphQL contracts, empathy, business-impact focus"
                ),
            ]
        elif "back" in role_lower or "distribut" in role_lower or "devops" in role_lower:
            questions = [
                InterviewQuestion(
                    id="q1",
                    question="Explain the nuances of database connection pooling in high-concurrency microservices, and how you prevent connection exhaustion and deadlocks.",
                    category="Technical",
                    difficulty="Medium",
                    expected_focus="Connection pools (Hikari/SQLAlchemy), timeouts, transaction isolation, backpressure"
                ),
                InterviewQuestion(
                    id="q2",
                    question="How would you architect an idempotent payment processing endpoint that guarantees exactly-once semantics despite network timeouts and retries?",
                    category="System Design",
                    difficulty="Hard",
                    expected_focus="Idempotency keys, distributed locks/Redis, 2PC or Saga pattern, DB constraints"
                ),
                InterviewQuestion(
                    id="q3",
                    question="Compare Redis and Kafka when building a real-time event streaming and caching layer. Under what constraints would you select one over the other?",
                    category="Architecture",
                    difficulty="Medium",
                    expected_focus="Pub/Sub vs Log-based message broker, persistence, partition ordering, throughput"
                ),
                InterviewQuestion(
                    id="q4",
                    question="Suppose your primary relational database hits 98% CPU utilization during peak traffic. Walk me through your immediate mitigation and long-term scaling strategy.",
                    category="Troubleshooting",
                    difficulty="Hard",
                    expected_focus="Read replicas, query plan optimization, indexing, caching, sharding"
                ),
                InterviewQuestion(
                    id="q5",
                    question="Describe a situation where you had to push back on a tight product deadline due to serious architectural or security debt. What was the outcome?",
                    category="Behavioral",
                    difficulty="Medium",
                    expected_focus="Risk assessment, stakeholder communication, phased rollout compromise"
                ),
            ]
        else: # Default Full-Stack / Generalist
            questions = [
                InterviewQuestion(
                    id="q1",
                    question=f"For a {experience} {role}, how do you establish end-to-end type safety and contract verification between your frontend and backend APIs?",
                    category="Technical",
                    difficulty="Medium",
                    expected_focus="TypeScript, OpenAPI, tRPC/gRPC, schema validation (Zod/Pydantic)"
                ),
                InterviewQuestion(
                    id="q2",
                    question="Walk me through your design for a real-time collaborative feature (like Google Docs or live chat) supporting thousands of concurrent active rooms.",
                    category="System Design",
                    difficulty="Hard",
                    expected_focus="WebSockets, CRDTs / Operational Transformation, Redis Pub/Sub, scaling state"
                ),
                InterviewQuestion(
                    id="q3",
                    question="How do you balance rapid feature delivery with robust automated testing (unit, integration, and E2E) in a continuous deployment pipeline?",
                    category="Engineering Best Practices",
                    difficulty="Medium",
                    expected_focus="Test pyramid, CI/CD gates, mocking external dependencies, test flakiness prevention"
                ),
                InterviewQuestion(
                    id="q4",
                    question="An unexpected memory leak is slowly crashing your production instances every 6 hours. Describe your end-to-end debugging workflow.",
                    category="Troubleshooting",
                    difficulty="Hard",
                    expected_focus="Heap dump analysis, garbage collection logs, memory profiling, memory limits"
                ),
                InterviewQuestion(
                    id="q5",
                    question="Share an experience where a project you led faced ambiguity or shifting requirements mid-sprint. How did you steer the team to successful delivery?",
                    category="Behavioral",
                    difficulty="Medium",
                    expected_focus="Agile prioritization, stakeholder alignment, proactive communication, resilience"
                ),
            ]

        return InterviewPlanResponse(
            target_role=role,
            experience_level=experience,
            questions=questions
        )

    def _generate_fallback_evaluation(
        self,
        question: str,
        transcript: str,
        wpm: float,
        filler_count: int,
        eye_contact: float
    ) -> AnswerEvaluationResponse:
        """Intelligent heuristic-driven feedback when offline or simulating."""
        word_count = len(transcript.split()) if transcript else 0
        
        # Base scores calculated from depth and delivery indicators
        if word_count < 20:
            tech_score = 48
            rel_score = 52
            clarity_score = 55
            conf_score = 50
            critique = "Your response was quite brief and lacked technical specifics. Be sure to outline concrete architectural trade-offs and provide real-world examples."
            strengths = ["Responded promptly without hesitation"]
            weaknesses = ["Answer was excessively brief", "Lacked concrete technical mechanisms"]
            suggest_follow_up = True
            follow_up = "Could you elaborate on the underlying architectural trade-offs you would consider in production?"
        elif word_count < 60:
            tech_score = 72
            rel_score = 78
            clarity_score = 74
            conf_score = 75
            critique = "Solid foundational answer that addressed the core question. To reach senior level, delve deeper into edge cases, scalability constraints, and failure modes."
            strengths = ["Clear conceptual grasp of the core question", "Good natural pacing"]
            weaknesses = ["Could delve deeper into operational edge cases", "Address scaling bottlenecks"]
            suggest_follow_up = True
            follow_up = "How would this architecture behave if traffic suddenly spiked 10x or an upstream dependency failed?"
        else:
            tech_score = 88
            rel_score = 90
            clarity_score = 85
            conf_score = 86
            critique = "Comprehensive and structured response! You articulated the problem, proposed realistic solutions, and demonstrated strong technical maturity."
            strengths = ["Thorough explanation of architectural trade-offs", "High technical depth and structured thinking", "Well-paced delivery"]
            weaknesses = ["Could tighten delivery slightly to leave more room for interactive dialogue"]
            suggest_follow_up = False
            follow_up = None

        # Adjust confidence & clarity based on speech delivery metrics
        if filler_count > 6:
            conf_score = max(40, conf_score - 10)
            clarity_score = max(40, clarity_score - 8)
            weaknesses.append(f"Noticed {filler_count} filler words ('um', 'like', 'uh'). Practice pausing silently instead of vocalizing fillers.")
        
        if wpm > 185:
            clarity_score = max(45, clarity_score - 8)
            weaknesses.append(f"Speaking rate ({wpm:.0f} WPM) was slightly rushed. Aim for 130-160 WPM for maximum clarity.")
        elif wpm < 90 and word_count > 20:
            conf_score = max(45, conf_score - 6)
            weaknesses.append(f"Pacing ({wpm:.0f} WPM) felt hesitant. Building fluency on key terminology will boost presence.")

        if eye_contact < 55:
            conf_score = max(45, conf_score - 7)
            weaknesses.append(f"Eye contact was {eye_contact:.0f}%. Try looking directly at the camera lens when emphasizing key conclusions.")

        model_answer = (
            f"When answering '{question}', a high-impact response starts with the core principle: "
            f"'In high-throughput environments, our primary goal is maintaining low latency while isolating failure domains.' "
            f"Then outline the architecture step-by-step, mention trade-offs explicitly (e.g., consistency vs availability), "
            f"and conclude with how you monitor and verify performance using metrics and automated telemetry."
        )

        return AnswerEvaluationResponse(
            technical_score=tech_score,
            relevance_score=rel_score,
            clarity_score=clarity_score,
            confidence_score=conf_score,
            strengths=strengths[:3],
            weaknesses=weaknesses[:3],
            critique=critique,
            model_answer=model_answer,
            suggest_follow_up=suggest_follow_up,
            follow_up_question=follow_up
        )

    def transcribe_audio(self, audio_bytes: bytes, mime_type: str = "audio/webm", language_hint: str = "en-US") -> str:
        """
        Transcribes spoken candidate audio using Gemini 2.5 Flash multimodal audio understanding.
        Provides a 100% reliable fallback whenever browser Web Speech API fails or is unavailable.
        """
        if not self.client:
            logger.warning("Gemini client not initialized for audio transcription.")
            return ""

        try:
            from google.genai import types
            audio_part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
            prompt = (
                "You are an expert, highly accurate audio speech transcriber for a professional technical interview. "
                "Transcribe the candidate's spoken speech from this audio recording verbatim. "
                "Requirements: "
                "1. Transcribe all spoken words accurately into clean, professional English text. "
                "2. Correctly recognize technical terminology, programming languages, database names, cloud services, and architecture keywords. "
                "3. Preserve the candidate's natural speech flow with proper capitalization and punctuation. "
                "4. CRITICAL: Return ONLY the exact transcribed text. Do NOT add notes, greetings, timestamps, or quotes. "
                "5. If there is only background silence or no speech detected, return an empty string."
            )

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[audio_part, prompt],
                config=types.GenerateContentConfig(
                    temperature=0.1,
                )
            )

            if response and response.text:
                cleaned = response.text.strip()
                # Strip wrapping quotes if LLM enclosed the whole output in quotes
                if cleaned.startswith('"') and cleaned.endswith('"'):
                    cleaned = cleaned[1:-1].strip()
                logger.info(f"Gemini Audio Transcribed {len(audio_bytes)} bytes into: '{cleaned[:60]}...'")
                return cleaned
            return ""
        except Exception as e:
            logger.error(f"Error in Gemini audio transcription: {e}")
            return ""

# Singleton instance
evaluator = LLMEvaluator()

