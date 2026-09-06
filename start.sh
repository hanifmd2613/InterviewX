#!/bin/bash
# InterviewX — Production Launch Automation Script
# Autonomous Multimodal Technical Interview Platform

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================================"
echo "   🚀 Starting InterviewX Multimodal AI System"
echo "============================================================"

# 0. Clean up any lingering processes on ports 8000 and 3000
echo "🧹 Checking and freeing ports 8000 and 3000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 1. Update & Build Downloadable Documentation
echo "📚 Verifying documentation bundle..."
if [ -f "$DIR/scripts/build_docs.py" ]; then
    python3 "$DIR/scripts/build_docs.py" > /dev/null 2>&1 || true
fi

# 2. Start Python FastAPI Backend (Port 8000)
echo "⚡ Starting Python FastAPI Backend on http://localhost:8000 ..."
cd "$DIR/server"
if [ -d "venv" ]; then
    source venv/bin/activate
fi

python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# 3. Start Next.js Frontend (Port 3000)
echo "🌐 Starting Next.js Frontend on http://localhost:3000 ..."
cd "$DIR/client"
npm run dev &
FRONTEND_PID=$!

# Graceful termination trap for Ctrl+C
trap "echo ''; echo '🛑 Shutting down InterviewX servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

echo "============================================================"
echo " ✅ InterviewX is running and ready for demonstration!"
echo " 👉 Web Application:       http://localhost:3000"
echo " 👉 Interview Room:        http://localhost:3000/interview"
echo " 👉 Certified Report Card: http://localhost:3000/report"
echo " 👉 Documentation Hub:     http://localhost:3000/docs"
echo " 👉 Backend API (Swagger): http://localhost:8000/docs"
echo "============================================================"
echo "Press Ctrl+C to terminate both servers."

wait
