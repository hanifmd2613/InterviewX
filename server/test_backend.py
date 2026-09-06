import asyncio
import json
from fastapi.testclient import TestClient
from main import app
from services.analytics import analytics_engine, QuestionEvaluationItem
from services.llm_evaluator import evaluator

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    print("✓ Health check passed")

def test_init_session():
    payload = {
        "target_role": "Full-Stack Engineer",
        "experience_level": "Mid-Level (3-5 yrs)",
        "job_description": "We need a full-stack engineer experienced in Next.js, FastAPI, and WebSockets."
    }
    res = client.post("/api/init-session", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "session_id" in data
    assert len(data["questions"]) == 5
    for q in data["questions"]:
        assert "id" in q
        assert "question" in q
        assert "category" in q
    print(f"✓ Session init passed with session_id: {data['session_id']}")
    return data["session_id"]

def test_analytics():
    # Test filler word counting
    text = "Um, so basically we like decided to use WebSockets, uh, for real-time sync."
    fillers = analytics_engine.count_filler_words(text)
    assert fillers.get("um") == 1
    assert fillers.get("basically") == 1
    assert fillers.get("like") == 1
    assert fillers.get("uh") == 1
    print("✓ Filler words analysis passed")

    # Test delivery score
    score = analytics_engine.calculate_delivery_score(wpm=140, filler_count=2, duration_seconds=30)
    assert 80 <= score <= 100
    print(f"✓ Delivery score calculation passed: {score}")

    # Test weighted rubric (40% Tech, 30% Delivery, 20% Relevance, 10% Eye Contact)
    # e.g., 90*0.4 + 80*0.3 + 90*0.2 + 80*0.1 = 36 + 24 + 18 + 8 = 86.0
    weighted = analytics_engine.calculate_question_weighted_score(
        technical=90, delivery=80, relevance=90, eye_contact=80
    )
    assert weighted == 86.0
    print(f"✓ Weighted scoring formula verified: {weighted}")

def test_websocket_flow(session_id):
    with client.websocket_connect(f"/ws/interview?session_id={session_id}") as ws:
        # Ping / Pong
        ws.send_json({"type": "ping"})
        msg = ws.receive_json()
        assert msg["type"] == "pong"
        print("✓ WS Ping/Pong passed")

        # Bind session
        ws.send_json({"type": "bind_session", "session_id": session_id})
        msg = ws.receive_json()
        assert msg["type"] == "session_bound"
        print("✓ WS Bind session passed")

        # Start question
        ws.send_json({"type": "start_question", "question_id": "q1"})
        msg = ws.receive_json()
        assert msg["type"] == "question_started"
        print("✓ WS Start question passed")

        # Submit answer
        ws.send_json({
            "type": "submit_answer",
            "question_id": "q1",
            "transcript": "We implement WebSockets backed by Redis PubSub to distribute message broadcasting across nodes with low latency.",
            "duration_seconds": 25.0,
            "filler_count": 1,
            "eye_contact_score": 88.0,
            "wpm": 140.0
        })
        msg = ws.receive_json()
        assert msg["type"] == "answer_evaluated"
        assert "data" in msg
        assert msg["data"]["weighted_score"] > 0
        print(f"✓ WS Answer evaluation received with score: {msg['data']['weighted_score']}%")

        # Finish interview
        ws.send_json({"type": "finish_interview"})
        msg = ws.receive_json()
        assert msg["type"] == "final_report"
        report = msg["data"]
        assert "overall_score" in report
        assert "radar_competencies" in report
        print(f"✓ WS Final report generated! Overall Score: {report['overall_score']}% ({report['rating_tier']})")



def test_clarify_doubt():
    payload = {
        "question_text": "How do you handle database connection pooling in high-concurrency services?",
        "target_role": "Backend Engineer",
        "experience_level": "Mid-Level",
        "doubt": "What assumptions can I make regarding traffic volume or connection limits?"
    }
    res = client.post("/api/clarify", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert "tips_for_answering" in data
    assert len(data["tips_for_answering"]) > 0
    print(f"✓ POST /api/clarify passed! Answer preview: {data['answer'][:60]}...")

def test_conversational_turn():
    # Test 1: Technical Answer with self-thinking probe
    payload1 = {
        "target_role": "Full-Stack Engineer",
        "experience_level": "Mid-Level",
        "job_description": "We build scalable WebSockets and Redis platforms.",
        "candidate_utterance": "For state management, I would use Redis to cache user sessions and WebSockets to push live updates.",
        "dialogue_history": [
            {"sender": "interviewer", "text": "How do you architect real-time collaborative state across multiple nodes?"}
        ],
        "current_topic": "Real-Time Scalability"
    }
    res1 = client.post("/api/conversational-turn", json=payload1)
    assert res1.status_code == 200
    data1 = res1.json()
    assert "interviewer_speech" in data1
    assert "internal_reasoning" in data1
    assert len(data1["internal_reasoning"]) > 10
    print(f"✓ Conversational Tech Probe: {data1['interviewer_speech'][:70]}...")
    print(f"✓ AI Self-Thinking Rationale: {data1['internal_reasoning'][:70]}...")

    # Test 2: Voice Command / Clarifying doubt
    payload2 = {
        "target_role": "Full-Stack Engineer",
        "experience_level": "Mid-Level",
        "candidate_utterance": "What scale or latency constraints are we assuming for this system?",
        "dialogue_history": [],
        "current_topic": "Architecture"
    }
    res2 = client.post("/api/conversational-turn", json=payload2)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["detected_candidate_intent"] in ["clarification_question", "voice_command"]
    print(f"✓ Conversational Voice Clarification: {data2['interviewer_speech'][:70]}...")

def test_explain_question():
    payload = {
        "question_text": "How do you ensure state synchronization and avoid race conditions in asynchronous distributed architectures?",
        "target_role": "Full-Stack Engineer",
        "experience_level": "Mid-Level",
        "job_description": "Building high-scale distributed apps with WebSockets and Redis."
    }
    res = client.post("/api/explain-question", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "plain_english_meaning" in data
    assert "key_concepts_tested" in data
    assert len(data["key_concepts_tested"]) > 0
    assert "step_by_step_approach" in data
    assert len(data["step_by_step_approach"]) >= 3
    assert "voice_explanation_script" in data
    assert len(data["voice_explanation_script"]) > 20
    print(f"✓ POST /api/explain-question passed! Voice script: {data['voice_explanation_script'][:80]}...")

def test_google_auth():
    # Test 1: Google Login Verification
    res = client.post("/api/auth/google", json={"credential": "dev-token-alex-chen"})
    assert res.status_code == 200
    data = res.json()
    assert "user" in data
    assert "session_token" in data
    user = data["user"]
    assert user["email"] == "alex.chen@googlemail.com"
    assert user["name"] == "Alex Chen"
    assert user["email_verified"] is True
    session_token = data["session_token"]
    print(f"✓ Google Auth Verification passed for: {user['name']} ({user['email']})")

    # Test 2: Get Current User with Bearer token
    headers = {"Authorization": f"Bearer {session_token}"}
    res_me = client.get("/api/auth/me", headers=headers)
    assert res_me.status_code == 200
    me = res_me.json()
    assert me["id"] == user["id"]
    print(f"✓ GET /api/auth/me verified user: {me['email']}")

if __name__ == "__main__":
    print("=== RUNNING INTERVIEWX COMPLETE BACKEND SUITE ===")
    test_health()
    s_id = test_init_session()
    test_analytics()
    test_websocket_flow(s_id)
    test_clarify_doubt()
    test_explain_question()
    test_conversational_turn()
    test_google_auth()
    print("=== ALL BACKEND TESTS COMPLETED SUCCESSFULLY ===")

