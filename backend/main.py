from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import db
import mocker
import json
import os
import random

# Load custom questions
try:
    with open(os.path.join(os.path.dirname(__file__), "prep_questions", "interview_question_bank.json"), "r") as f:
        CUSTOM_QUESTIONS = json.load(f)
except Exception:
    CUSTOM_QUESTIONS = {}

COMPANY_PREP_COMPANIES = {"google", "amazon", "meta"}
COMPANY_QA_FILES = {
    "amazon": "from_amazon.json",
    "google": "from_google.json",
    "meta": "from_meta.json",
}

def _normalise_prep_item(item: Any) -> dict:
    if isinstance(item, dict):
        return {
            "id": item.get("id"),
            "year": item.get("year"),
            "company": str(item.get("company") or "").strip(),
            "category": str(item.get("category") or item.get("topic") or "General").strip() or "General",
            "question": str(item.get("question") or item.get("q") or "").strip(),
            "answer": str(item.get("answer") or item.get("a") or "").strip(),
            "difficulty": str(item.get("difficulty") or "").strip(),
            "tags": item.get("tags") if isinstance(item.get("tags"), list) else [],
        }
    return {
        "id": None,
        "year": None,
        "company": "",
        "category": "General",
        "question": str(item).strip(),
        "answer": "",
        "difficulty": "",
        "tags": [],
    }

def _load_company_prep_bank(company: str) -> dict:
    qa_dir = os.path.join(os.path.dirname(__file__), "QA")
    filename = COMPANY_QA_FILES.get(company.lower())
    topics = {}

    if not filename:
        return topics

    path = os.path.join(qa_dir, filename)
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return topics

    if not isinstance(data, list):
        return topics

    for item in data:
        normalised = _normalise_prep_item(item)
        if not normalised["question"]:
            continue
        category = normalised["category"]
        topics.setdefault(category, []).append(normalised)

    return topics

app = FastAPI(title="MockBee API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/signup")
def signup(req: SignupRequest):
    users = db._col("users")
    user = users.find_one({"_id": req.email})
    if user:
        raise HTTPException(status_code=400, detail="Account already exists. Try logging in.")
    db.upsert_user(req.email, req.name, role="PUBLIC")
    users.update_one({"_id": req.email}, {"$set": {"password": req.password}})
    return {"status": "success", "message": "Account created"}

# ── Admin credentials (hardcoded) ─────────────────────────────────────────────
ADMIN_EMAIL = "admin"
ADMIN_PASSWORD = "mockb@urban"

@app.post("/api/login")
def login(req: LoginRequest):
    # Admin login check
    if req.email == ADMIN_EMAIL and req.password == ADMIN_PASSWORD:
        return {"status": "success", "name": "Admin", "email": ADMIN_EMAIL, "is_admin": True, "role": "ADMIN"}

    users = db._col("users")
    user = users.find_one({
        "$or": [
            {"_id": req.email},
            {"name": {"$regex": f"^{req.email}$", "$options": "i"}}
        ]
    })
    if not user:
        raise HTTPException(status_code=400, detail="No account found with this email or username.")
    if user.get("password") != req.password:
        raise HTTPException(status_code=400, detail="Incorrect password.")
    return {"status": "success", "name": user.get("name"), "email": user.get("_id"), "is_admin": False, "role": user.get("role", "PUBLIC")}

class ChatRequest(BaseModel):
    role: str
    level: str
    history: List[Dict[str, str]]
    phase: Optional[str] = "self_intro"
    questions_in_phase: Optional[int] = 0

@app.post("/api/interview/chat")
def interview_chat(req: ChatRequest):
    phase = req.phase
    if phase == "pro_feedback":
        system_prompt = f"""You are an expert technical interviewer providing concise feedback.
Role: {req.role} | Level: {req.level}

The candidate has just answered a technical or behavioural question.
Your job:
- Provide a brief 1-2 sentence feedback on their last answer.
- Praise strong points or highlight what is missing.
- CRITICAL: DO NOT ask any new questions. ONLY provide feedback on their answer.
"""
    else:
        if phase not in mocker.PHASES:
            phase = "self_intro"
        
        q_target = mocker.PHASE_Q_TARGETS[phase]
        system_prompt = mocker.PHASE_PROMPTS[phase].format(role=req.role, level=req.level, q_target=q_target)
        
        # Ensure we always enforce analyzing previous answers if it's not the very first question of the interview
        if len(req.history) > 1:
            system_prompt += "\n\nCRITICAL INSTRUCTION: First, carefully analyze the candidate's last answer and provide brief, constructive feedback before moving to the next point."

        # Enforce question count constraint
        if req.questions_in_phase >= q_target:
            system_prompt += "\n\nCRITICAL INSTRUCTION: You have reached the required number of questions for this phase. DO NOT ask any more questions. ONLY provide your feedback on their last answer (if applicable), state your transition sentence, and end with [PHASE_COMPLETE]."
        else:
            system_prompt += f"\n\nPROGRESS: You have asked {req.questions_in_phase} questions out of {q_target} in this phase. You MUST ask exactly ONE new question now."

        # Inject specific questions from JSON if available
        if phase == "technical" and req.questions_in_phase < q_target:
            role_key = next((k for k in CUSTOM_QUESTIONS.keys() if k.lower() in req.role.lower() or req.role.lower() in k.lower()), None)
            if role_key:
                q_list = CUSTOM_QUESTIONS[role_key]
                if isinstance(q_list, list) and len(q_list) > 0:
                    # Pick a question using the index (modulo to prevent out of bounds)
                    q_idx = req.questions_in_phase % len(q_list)
                    specific_q = q_list[q_idx]
                    system_prompt += f"\n\nCRITICAL INSTRUCTION: For this turn, you MUST ask the following technical question:\n\"{specific_q}\""

        if phase != "self_intro":
            system_prompt += "\n\nCRITICAL RULE: DO NOT ask the candidate to introduce themselves or ask for their background. That was already done. Focus ONLY on your current phase."

    try:
        reply = mocker.ai_chat(system_prompt, req.history)
        return {"status": "success", "reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@app.post("/api/interview/evaluate")
def interview_evaluate(req: ChatRequest):
    try:
        evaluation = mocker.ai_evaluate(req.role, req.level, req.history)
        return {"status": "success", "evaluation": evaluation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SaveSessionRequest(BaseModel):
    email: str
    role: str
    date: str
    score: int
    analysis: dict
    transcript: list 
    mode: Optional[str] = "standard"
    session_id: Optional[str] = None

@app.post("/api/interview/save")
def save_interview(req: SaveSessionRequest):
    col = db._col("interview_sessions")
    doc = {
        "user_email": req.email,
        "role": req.role,
        "mode": req.mode,
        "date": req.date,
        "score": req.score,
        "analysis": req.analysis,
        "transcript": req.transcript,
        "saved_at": db._now(),
        # Use frontend session ID if provided, otherwise it gets mongo _id
        "id": req.session_id if req.session_id else str(db._now())
    }
    
    # Simple upsert based on the frontend's unique session id
    col.update_one(
        {"user_email": req.email, "id": doc["id"]},
        {"$set": doc},
        upsert=True
    )
    return {"status": "success", "message": "Performance saved to DB"}

@app.get("/api/interview/history")
def get_user_history(email: str):
    docs = list(db._col("interview_sessions").find({"user_email": email}, {"_id": 0}).sort("saved_at", -1))
    return {"status": "success", "history": docs}

@app.get("/api/company-prep/questions")
def get_company_prep_questions(company: str = "Google", topic: Optional[str] = None):
    if company.lower() not in COMPANY_PREP_COMPANIES:
        raise HTTPException(status_code=404, detail="Company prep is available for Google, Amazon, and Meta.")

    topics = _load_company_prep_bank(company)
    if topic:
        matched_key = next((key for key in topics if key.lower() == topic.lower()), None)
        if not matched_key:
            raise HTTPException(status_code=404, detail="No questions found for this topic.")
        topics = {matched_key: topics[matched_key]}

    total_questions = sum(len(items) for items in topics.values())
    return {
        "status": "success",
        "company": company,
        "topics": topics,
        "topic_count": len(topics),
        "question_count": total_questions,
    }

# ══════════════════════════════════════════════════════════════════════════════
#  ADMIN ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/admin/users")
def admin_get_all_users(key: str):
    """Returns all registered users. Requires admin key for access."""
    if key != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Unauthorized")
    users = list(db._col("users").find({}, {"password": 0}))
    for u in users:
        u["email"] = u.pop("_id")
    return {"status": "success", "users": users}

class AdminCreateUserRequest(BaseModel):
    name: str
    email: str
    password: str
    key: str

@app.post("/api/admin/users")
def admin_create_user(req: AdminCreateUserRequest):
    """Creates a new admin-managed user (Student) that has free access."""
    if req.key != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Unauthorized")
    users = db._col("users")
    if users.find_one({"_id": req.email}):
        raise HTTPException(status_code=400, detail="User already exists")
    db.upsert_user(req.email, req.name, role="PREMIUM", created_by="admin")
    users.update_one({"_id": req.email}, {"$set": {"password": req.password}})
    return {"status": "success", "message": "Student created successfully"}

@app.get("/api/admin/sessions")
def admin_get_all_sessions(key: str):
    """Returns all interview sessions across all users. Requires admin key."""
    if key != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Unauthorized")
    docs = list(db._col("interview_sessions").find({}, {"_id": 0}).sort("saved_at", -1))

    users_dict = {u["_id"]: u for u in db._col("users").find({})}
    for d in docs:
        user_email = d.get("user_email")
        if user_email in users_dict:
            d["user_role"] = users_dict[user_email].get("role", "PUBLIC")
        else:
            d["user_role"] = "PUBLIC"

    return {"status": "success", "sessions": docs}

@app.delete("/api/admin/users/{email}")
def admin_delete_user(email: str, key: str):
    """Deletes a user and all their sessions. Requires admin key."""
    if key != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Unauthorized")
    db._col("users").delete_one({"_id": email})
    db._col("interview_sessions").delete_many({"user_email": email})
    return {"status": "success", "message": "User and their sessions deleted"}

@app.delete("/api/admin/sessions/{session_id}")
def admin_delete_session(session_id: str, key: str):
    """Deletes a specific interview session. Requires admin key."""
    if key != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Unauthorized")
    db._col("interview_sessions").delete_one({"id": session_id})
    return {"status": "success", "message": "Session deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001)
