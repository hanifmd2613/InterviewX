import re
from typing import Dict, List, Any
from pydantic import BaseModel, Field

COMMON_FILLER_WORDS = [
    "um", "uh", "like", "basically", "literally", "actually", 
    "you know", "sort of", "kind of", "i mean", "right"
]

class QuestionEvaluationItem(BaseModel):
    question_id: str
    question_text: str
    category: str
    transcript: str
    duration_seconds: float
    wpm: float
    filler_count: int
    eye_contact_score: float
    technical_score: int
    relevance_score: int
    clarity_score: int
    confidence_score: int
    delivery_score: float
    weighted_score: float
    strengths: List[str]
    weaknesses: List[str]
    critique: str
    model_answer: str

class FinalInterviewReport(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    rating_tier: str # "Exceptional Hire", "Strong Hire", "Solid / Promising", "Needs Practice"
    breakdown: Dict[str, float] # technical, delivery, relevance, eye_contact
    radar_competencies: Dict[str, int] # Technical, Delivery, Relevance, Clarity, Confidence, Eye Contact
    summary_stats: Dict[str, Any] # total_words, avg_wpm, total_fillers, avg_eye_contact, total_duration_seconds
    key_strengths: List[str]
    priority_improvements: List[str]
    executive_summary: str
    questions: List[QuestionEvaluationItem]

class AnalyticsEngine:
    @staticmethod
    def count_filler_words(text: str) -> Dict[str, int]:
        """Calculates occurrences of common filler words in transcribed speech."""
        text_lower = text.lower()
        results = {}
        for filler in COMMON_FILLER_WORDS:
            pattern = rf"\b{re.escape(filler)}\b"
            matches = len(re.findall(pattern, text_lower))
            if matches > 0:
                results[filler] = matches
        return results

    @staticmethod
    def calculate_delivery_score(wpm: float, filler_count: int, duration_seconds: float) -> float:
        """
        Computes delivery score (0-100) based on optimal pacing and minimal filler density.
        Ideal pacing: 125-165 WPM.
        """
        score = 100.0

        # WPM evaluation
        if wpm < 90:
            score -= min(35.0, (90 - wpm) * 0.7)
        elif wpm > 185:
            score -= min(35.0, (wpm - 185) * 0.7)
        elif 125 <= wpm <= 165:
            score += 0 # optimal bonus maintained

        # Filler words penalty scaled by duration minutes
        duration_minutes = max(0.2, duration_seconds / 60.0)
        fillers_per_minute = filler_count / duration_minutes
        if fillers_per_minute > 2.0:
            score -= min(30.0, (fillers_per_minute - 2.0) * 6.0)

        return max(30.0, min(100.0, round(score, 1)))

    @staticmethod
    def calculate_question_weighted_score(
        technical: float,
        relevance: float,
        delivery: float,
        eye_contact: float
    ) -> float:
        """
        System Rubric:
        40% Technical Depth
        30% Delivery / WPM & Fluency
        20% Relevance to JD
        10% Eye Contact & Posture
        """
        score = (
            (technical * 0.40) +
            (delivery * 0.30) +
            (relevance * 0.20) +
            (eye_contact * 0.10)
        )
        return round(max(0.0, min(100.0, score)), 1)

    @classmethod
    def generate_final_report(
        cls,
        target_role: str,
        experience_level: str,
        question_evaluations: List[QuestionEvaluationItem]
    ) -> FinalInterviewReport:
        if not question_evaluations:
            return FinalInterviewReport(
                overall_score=0,
                rating_tier="Incomplete",
                breakdown={"technical": 0, "delivery": 0, "relevance": 0, "eye_contact": 0},
                radar_competencies={
                    "Technical": 0,
                    "Delivery": 0,
                    "Relevance": 0,
                    "Clarity": 0,
                    "Confidence": 0,
                    "Eye Contact": 0
                },
                summary_stats={},
                key_strengths=[],
                priority_improvements=[],
                executive_summary="Interview session contained no completed answers.",
                questions=[]
            )

        n = len(question_evaluations)
        avg_tech = sum(q.technical_score for q in question_evaluations) / n
        avg_rel = sum(q.relevance_score for q in question_evaluations) / n
        avg_delivery = sum(q.delivery_score for q in question_evaluations) / n
        avg_eye = sum(q.eye_contact_score for q in question_evaluations) / n
        avg_clarity = sum(q.clarity_score for q in question_evaluations) / n
        avg_confidence = sum(q.confidence_score for q in question_evaluations) / n

        overall = (
            (avg_tech * 0.40) +
            (avg_delivery * 0.30) +
            (avg_rel * 0.20) +
            (avg_eye * 0.10)
        )
        overall_score = int(round(overall))

        if overall_score >= 88:
            rating_tier = "Exceptional Hire"
        elif overall_score >= 76:
            rating_tier = "Strong Hire"
        elif overall_score >= 63:
            rating_tier = "Solid / Promising"
        else:
            rating_tier = "Needs Practice"

        # Aggregated stats
        total_duration = sum(q.duration_seconds for q in question_evaluations)
        total_fillers = sum(q.filler_count for q in question_evaluations)
        total_words = sum(len(q.transcript.split()) for q in question_evaluations)
        avg_wpm = sum(q.wpm for q in question_evaluations) / n

        # Extract top strengths and unique improvements
        all_strengths = []
        all_weaknesses = []
        for q in question_evaluations:
            all_strengths.extend(q.strengths)
            all_weaknesses.extend(q.weaknesses)

        unique_strengths = list(dict.fromkeys(all_strengths))[:4]
        unique_improvements = list(dict.fromkeys(all_weaknesses))[:4]

        executive_summary = (
            f"Candidate demonstrated {rating_tier.lower()} readiness for the {experience_level} {target_role} role. "
            f"Technical proficiency scored {avg_tech:.0f}/100 with a {avg_rel:.0f}% relevance match. "
            f"Spoken delivery averaged {avg_wpm:.0f} WPM with {avg_eye:.0f}% camera eye contact consistency."
        )

        return FinalInterviewReport(
            overall_score=overall_score,
            rating_tier=rating_tier,
            breakdown={
                "technical": round(avg_tech, 1),
                "delivery": round(avg_delivery, 1),
                "relevance": round(avg_rel, 1),
                "eye_contact": round(avg_eye, 1)
            },
            radar_competencies={
                "Technical": int(round(avg_tech)),
                "Delivery": int(round(avg_delivery)),
                "Relevance": int(round(avg_rel)),
                "Clarity": int(round(avg_clarity)),
                "Confidence": int(round(avg_confidence)),
                "Eye Contact": int(round(avg_eye)),
            },
            summary_stats={
                "total_words": total_words,
                "avg_wpm": round(avg_wpm, 1),
                "total_fillers": total_fillers,
                "avg_eye_contact": round(avg_eye, 1),
                "total_duration_seconds": round(total_duration, 1)
            },
            key_strengths=unique_strengths,
            priority_improvements=unique_improvements,
            executive_summary=executive_summary,
            questions=question_evaluations
        )

analytics_engine = AnalyticsEngine()
