export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  expected_focus: string;
}

export interface QuestionEvaluationItem {
  question_id: string;
  question_text: string;
  category: string;
  transcript: string;
  duration_seconds: number;
  wpm: number;
  filler_count: number;
  eye_contact_score: number;
  technical_score: number;
  relevance_score: number;
  clarity_score: number;
  confidence_score: number;
  delivery_score: number;
  weighted_score: number;
  strengths: string[];
  weaknesses: string[];
  critique: string;
  model_answer: string;
}

export interface FinalInterviewReport {
  overall_score: number;
  rating_tier: string;
  breakdown: {
    technical: number;
    delivery: number;
    relevance: number;
    eye_contact: number;
  };
  radar_competencies: {
    Technical: number;
    Delivery: number;
    Relevance: number;
    Clarity: number;
    Confidence: number;
    "Eye Contact": number;
  };
  summary_stats: {
    total_words: number;
    avg_wpm: number;
    total_fillers: number;
    avg_eye_contact: number;
    total_duration_seconds: number;
  };
  key_strengths: string[];
  priority_improvements: string[];
  executive_summary: string;
  questions: QuestionEvaluationItem[];
}

export interface SessionConfig {
  session_id: string;
  target_role: string;
  experience_level: string;
  job_description: string;
  questions: InterviewQuestion[];
}

export type WSIncomingMessage =
  | { type: "pong" }
  | { type: "session_bound"; session_id: string; questions: InterviewQuestion[] }
  | { type: "question_started"; question_id: string }
  | {
      type: "answer_evaluated";
      data: QuestionEvaluationItem;
      suggest_follow_up: boolean;
      follow_up_question?: string | null;
    }
  | { type: "question_skipped"; question_id: string; data: QuestionEvaluationItem }
  | { type: "doubt_clarified"; question_id: string; data: ClarificationResponse }
  | { type: "interviewer_voice_turn"; data: ConversationalTurnResponse }
  | { type: "question_explained"; question_id: string; data: QuestionExplanationResponse }
  | { type: "final_report"; data: FinalInterviewReport }
  | { type: "error"; message: string };

export interface ClarificationResponse {
  answer: string;
  tips_for_answering: string[];
  suggested_assumptions: string[];
}

export interface QuestionExplanationResponse {
  plain_english_meaning: string;
  key_concepts_tested: string[];
  step_by_step_approach: string[];
  suggested_opening_sentence: string;
  voice_explanation_script: string;
}

export interface AssistantChatMessage {
  id: string;
  sender: "user" | "gemini";
  text: string;
  timestamp: string;
  clarification?: ClarificationResponse;
}

export interface ConversationalTurnResponse {
  interviewer_speech: string;
  internal_reasoning: string;
  detected_candidate_intent: string;
  topic_category: string;
  quick_feedback?: string | null;
  is_interview_complete: boolean;
}

export interface DialogueMessage {
  id: string;
  sender: "interviewer" | "candidate";
  text: string;
  timestamp: string;
  intent?: string;
  reasoning?: string;
  quick_feedback?: string;
}
