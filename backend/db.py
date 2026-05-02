"""
db.py — Shared MongoDB layer for PrepAI (mocker.py) and Resume Builder (resume.py)
All collections live in the 'prepai' database.

Collections
───────────
  users            – keyed by email (the canonical user ID)
  interview_sessions – mock interview sessions & evaluations
  interview_messages – per-turn chat log
  resumes          – resume data + file paths, linked to user email
"""

from __future__ import annotations
import os, datetime
from typing import Optional
from dotenv import load_dotenv
from pymongo import MongoClient, DESCENDING
from pymongo.collection import Collection

# ── Connection ────────────────────────────────────────────────────────────────
load_dotenv()
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
_client: Optional[MongoClient] = None

def get_db():
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    return _client["prepai"]

def _col(name: str) -> Collection:
    return get_db()[name]

# ── Helpers ───────────────────────────────────────────────────────────────────
def _now() -> str:
    return datetime.datetime.utcnow().isoformat()

# ══════════════════════════════════════════════════════════════════════════════
#  USERS
# ══════════════════════════════════════════════════════════════════════════════

def upsert_user(email: str, name: str = "") -> dict:
    """Create or update a user record. Returns the user document."""
    col = _col("users")
    col.update_one(
        {"_id": email},
        {"$setOnInsert": {"_id": email, "name": name, "created_at": _now()},
         "$set": {"last_seen": _now()}},
        upsert=True,
    )
    return col.find_one({"_id": email})

def get_user(email: str) -> Optional[dict]:
    return _col("users").find_one({"_id": email})

# ══════════════════════════════════════════════════════════════════════════════
#  INTERVIEW SESSIONS  (mocker.py)
# ══════════════════════════════════════════════════════════════════════════════

def create_interview_session(email: str, role: str, level: str, mode: str) -> str:
    """Insert a new session document and return its string id."""
    col = _col("interview_sessions")
    doc = {
        "user_email": email,
        "role": role,
        "level": level,
        "mode": mode,
        "started_at": _now(),
        "ended_at": None,
        "duration_seconds": None,
        "score": None,
        "summary": None,
        "evaluation": None,
    }
    result = col.insert_one(doc)
    return str(result.inserted_id)

def save_interview_message(session_id: str, role: str, content: str):
    from bson import ObjectId
    _col("interview_messages").insert_one({
        "session_id": ObjectId(session_id),
        "role": role,          # "user" | "assistant"
        "content": content,
        "ts": _now(),
    })

def close_interview_session(session_id: str, duration: int,
                             score: Optional[int], summary: Optional[str],
                             evaluation: Optional[dict]):
    from bson import ObjectId
    _col("interview_sessions").update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {
            "ended_at": _now(),
            "duration_seconds": duration,
            "score": score,
            "summary": summary,
            "evaluation": evaluation,
        }},
    )

def get_interview_history(email: str, limit: int = 10) -> list[dict]:
    pipeline = [
        {"$match": {"user_email": email}},
        {"$sort": {"started_at": DESCENDING}},
        {"$limit": limit},
        {"$lookup": {
            "from": "interview_messages",
            "localField": "_id",
            "foreignField": "session_id",
            "as": "messages",
        }},
        {"$addFields": {"msg_count": {"$size": "$messages"}}},
        {"$project": {"messages": 0}},
    ]
    docs = list(_col("interview_sessions").aggregate(pipeline))
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs

# ══════════════════════════════════════════════════════════════════════════════
#  RESUMES  (resume.py)
# ══════════════════════════════════════════════════════════════════════════════

def save_resume(email: str, resume_data: dict,
                pdf_path: Optional[str] = None,
                docx_path: Optional[str] = None) -> str:
    """
    Upsert the *latest* resume for this user (one active resume per user).
    Returns the MongoDB _id string.
    """
    col = _col("resumes")
    doc = {
        "user_email": email,
        "data": resume_data,
        "template": resume_data.get("template", "Professional"),
        "pdf_path": pdf_path,
        "docx_path": docx_path,
        "updated_at": _now(),
    }
    result = col.update_one(
        {"user_email": email},
        {"$set": doc, "$setOnInsert": {"created_at": _now()}},
        upsert=True,
    )
    if result.upserted_id:
        return str(result.upserted_id)
    existing = col.find_one({"user_email": email}, {"_id": 1})
    return str(existing["_id"])

def get_resume(email: str) -> Optional[dict]:
    doc = _col("resumes").find_one({"user_email": email})
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

def list_resume_history(email: str, limit: int = 5) -> list[dict]:
    """Returns resume history snapshots (stored in a sub-collection)."""
    docs = list(
        _col("resume_history")
        .find({"user_email": email})
        .sort("saved_at", DESCENDING)
        .limit(limit)
    )
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs

def archive_resume_snapshot(email: str, resume_data: dict,
                             pdf_path: Optional[str], docx_path: Optional[str]):
    """Push a snapshot into resume_history whenever a new resume is generated."""
    _col("resume_history").insert_one({
        "user_email": email,
        "data": resume_data,
        "template": resume_data.get("template", "Professional"),
        "pdf_path": pdf_path,
        "docx_path": docx_path,
        "saved_at": _now(),
    })
