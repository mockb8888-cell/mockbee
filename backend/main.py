from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import db
import mocker

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
    db.upsert_user(req.email, req.name)
    users.update_one({"_id": req.email}, {"$set": {"password": req.password}})
    return {"status": "success", "message": "Account created"}

@app.post("/api/login")
def login(req: LoginRequest):
    users = db._col("users")
    user = users.find_one({"_id": req.email})
    if not user:
        raise HTTPException(status_code=400, detail="No account found with this email.")
    if user.get("password") != req.password:
        raise HTTPException(status_code=400, detail="Incorrect password.")
    return {"status": "success", "name": user.get("name"), "email": user.get("_id")}

class ChatRequest(BaseModel):
    role: str
    level: str
    history: List[Dict[str, str]]

@app.post("/api/interview/chat")
def interview_chat(req: ChatRequest):
    system_prompt = mocker.SYSTEM_PROMPT.format(role=req.role, level=req.level)
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000)
