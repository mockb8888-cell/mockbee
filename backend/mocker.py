"""
╔══════════════════════════════════════════════════════════════╗
║           PrepAI — Mock Interview Practice Tool              ║
║     Supports both TEXT and VOICE input/output modes          ║
║     Powered by Google Gemini (FREE API)                      ║
║     Backed by MongoDB  (shared DB with resume.py)            ║
╚══════════════════════════════════════════════════════════════╝
""" 

import os, sys, json, time, datetime

# ── Paste your FREE Gemini API key here ──────────────────────────────────────
GEMINI_API_KEY = "AIzaSyB33aX8_QSVxSNCKLTpEdtFXqaxCXEfIA4"
# ─────────────────────────────────────────────────────────────────────────────
from fastapi import FastAPI
from pydantic import BaseModel

import google.generativeai as genai
genai.configure(api_key=GEMINI_API_KEY)
MODEL = "gemini-2.5-flash"

try:
    import pyttsx3
    TTS_AVAILABLE = True
except ImportError:
    TTS_AVAILABLE = False

try:
    import speech_recognition as sr
    STT_AVAILABLE = True
except ImportError:
    STT_AVAILABLE = False

# ── MongoDB shared layer ──────────────────────────────────────────────────────
try:
    import db as _db
    MONGO_OK = True
except Exception as _me:
    MONGO_OK = False
    print(f"\033[93m  ⚠  MongoDB unavailable ({_me}). Sessions will not be saved.\033[0m")

# ── Roles / Levels ────────────────────────────────────────────────────────────
ROLES = [
    "Software Engineer", "Frontend Developer", "Backend Developer",
    "Full Stack Developer", "Data Scientist", "ML Engineer",
    "DevOps Engineer", "Product Manager", "UX Designer", "Business Analyst",
]
LEVELS = ["Junior", "Mid-level", "Senior", "Lead / Staff"]

SYSTEM_PROMPT = """You are an expert technical interviewer conducting a mock interview.
Role: {role} | Level: {level}

Rules:
- Ask ONE question at a time
- After each answer, give a brief 1-line acknowledgment, then ask the next question
- Mix behavioral (STAR method) and technical questions for the role/level
- Be professional but encouraging
- Keep responses concise (2-3 sentences max)
- After 6-8 exchanges, offer to wrap up

Start by greeting the candidate warmly and asking the first interview question."""

EVAL_PROMPT = """Evaluate this mock interview for a {role} ({level}) position.

Transcript:
{transcript}

Reply ONLY with valid JSON (no markdown, no extra text):
{{
  "overall": <1-10>,
  "clarity": <1-10>,
  "technical": <1-10>,
  "communication": <1-10>,
  "confidence": <1-10>,
  "strengths": ["...", "...", "..."],
  "improvements": ["...", "...", "..."],
  "summary": "2-3 sentence overall assessment"
}}"""


# ── ANSI colours ─────────────────────────────────────────────────────────────
class C:
    RESET = "\033[0m";  BOLD  = "\033[1m";  DIM   = "\033[2m"
    CYAN  = "\033[96m"; GREEN = "\033[92m"; YELLOW= "\033[93m"
    RED   = "\033[91m"; WHITE = "\033[97m"

def clr(text, *codes):
    return "".join(codes) + str(text) + C.RESET

def banner():
    print(clr("""
╔══════════════════════════════════════════════════════════╗
║        PrepAI — Mock Interview Practice Tool             ║
║        Powered by Google Gemini (Free API)               ║
╚══════════════════════════════════════════════════════════╝""", C.CYAN, C.BOLD))

def divider(char="─", width=60, color=C.DIM):
    print(clr(char * width, color))


# ── TTS ───────────────────────────────────────────────────────────────────────
_tts_engine = None
def get_tts():
    global _tts_engine
    if _tts_engine is None and TTS_AVAILABLE:
        try:
            _tts_engine = pyttsx3.init()
            _tts_engine.setProperty("rate", 165)
            _tts_engine.setProperty("volume", 0.9)
            voices = _tts_engine.getProperty("voices")
            for v in voices:
                if "english" in v.name.lower() or "en_" in v.id.lower():
                    _tts_engine.setProperty("voice", v.id); break
        except Exception:
            _tts_engine = None
    return _tts_engine

def speak(text):
    engine = get_tts()
    if engine:
        try: engine.say(text); engine.runAndWait()
        except Exception as e: print(clr(f"[TTS: {e}]", C.DIM))


# ── STT ───────────────────────────────────────────────────────────────────────
def listen_microphone(timeout=10, phrase_limit=30):
    if not STT_AVAILABLE:
        print(clr("  ⚠  SpeechRecognition not installed.", C.YELLOW)); return None
    recognizer = sr.Recognizer()
    recognizer.pause_threshold = 1.5
    recognizer.dynamic_energy_threshold = True
    try:
        with sr.Microphone() as source:
            print(clr("  🎙  Adjusting for noise...", C.DIM))
            recognizer.adjust_for_ambient_noise(source, duration=0.8)
            print(clr("  🔴  Listening... speak now!", C.GREEN, C.BOLD))
            audio = recognizer.listen(source, timeout=timeout,
                                      phrase_time_limit=phrase_limit)
    except sr.WaitTimeoutError:
        print(clr("  ⏱  Timed out.", C.YELLOW)); return None
    except OSError:
        print(clr("  ⚠  Microphone not found.", C.RED)); return None
    print(clr("  ⚙  Transcribing...", C.DIM))
    try:
        return recognizer.recognize_google(audio).strip()
    except sr.UnknownValueError:
        print(clr("  ⚠  Could not understand. Try again.", C.YELLOW)); return None
    except sr.RequestError as e:
        print(clr(f"  ⚠  Service error: {e}", C.RED)); return None


# ── Gemini AI ─────────────────────────────────────────────────────────────────
def ai_chat(system, history):
    model = genai.GenerativeModel(model_name=MODEL, system_instruction=system)
    chat_history = []
    for m in history[:-1]:
        chat_history.append({
            "role": "user" if m["role"] == "user" else "model",
            "parts": [m["content"]],
        })
    chat = model.start_chat(history=chat_history)
    response = chat.send_message(history[-1]["content"])
    return response.text.strip()

def ai_evaluate(role, level, history):
    transcript = "\n".join(
        f"{'INTERVIEWER' if m['role']=='assistant' else 'CANDIDATE'}: {m['content']}"
        for m in history)
    prompt = EVAL_PROMPT.format(role=role, level=level, transcript=transcript)
    model = genai.GenerativeModel(MODEL)
    raw = model.generate_content(prompt).text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"): raw = raw[4:].strip()
    return json.loads(raw)


# ── Display ───────────────────────────────────────────────────────────────────
def print_ai_message(text):
    print(); print(clr("  🤖  Interviewer:", C.CYAN, C.BOLD))
    words = text.split(); line = "      "
    for word in words:
        if len(line) + len(word) + 1 > 76:
            print(line); line = "      " + word
        else:
            line += (" " if line.strip() else "") + word
    if line.strip(): print(line)
    print()

def print_user_message(text):
    print(clr(f"\n  👤  You: ", C.GREEN, C.BOLD) + clr(text, C.WHITE))

def print_score_bar(label, value, width=20):
    filled = int((value / 10) * width)
    bar = "█" * filled + "░" * (width - filled)
    color = C.GREEN if value >= 8 else (C.YELLOW if value >= 6 else C.RED)
    print(f"  {label:<18}  {clr(bar, color)}  {clr(str(value)+'/10', C.BOLD)}")

def show_results(data, role, level, duration):
    print(); divider("═")
    print(clr("  📊  INTERVIEW EVALUATION", C.CYAN, C.BOLD)); divider("═")
    print(f"  Role: {clr(role, C.WHITE, C.BOLD)}  |  Level: {clr(level, C.WHITE, C.BOLD)}"
          f"  |  Time: {clr(fmt_time(duration), C.DIM)}")
    divider(); print()
    print(clr("  SCORES", C.YELLOW, C.BOLD)); print()
    for label, key in [("Overall","overall"),("Clarity","clarity"),
                       ("Technical","technical"),("Communication","communication"),
                       ("Confidence","confidence")]:
        print_score_bar(label, data[key])
    print()
    print(clr("  💪  STRENGTHS", C.GREEN, C.BOLD))
    for s in data.get("strengths", []): print(f"  {clr('✓', C.GREEN)}  {s}")
    print()
    print(clr("  🚀  AREAS TO IMPROVE", C.YELLOW, C.BOLD))
    for s in data.get("improvements", []): print(f"  {clr('→', C.YELLOW)}  {s}")
    print()
    print(clr("  📝  SUMMARY", C.CYAN, C.BOLD))
    words = data.get("summary","").split(); line = "  "
    for word in words:
        if len(line) + len(word) + 1 > 76:
            print(clr(line, C.DIM)); line = "  " + word
        else:
            line += (" " if line.strip() else "") + word
    if line.strip(): print(clr(line, C.DIM))
    print(); divider("═")

def show_history(email):
    if not MONGO_OK:
        print(clr("  ⚠  MongoDB not connected — no history available.", C.YELLOW))
        return
    rows = _db.get_interview_history(email)
    print(); divider("═")
    print(clr("  🗂   PAST SESSIONS", C.CYAN, C.BOLD)); divider("═")
    if not rows:
        print(clr("  No sessions yet. Start your first interview!", C.DIM))
    else:
        print(f"  {'#':<4} {'Role':<22} {'Level':<14} {'Mode':<8} {'Score':<8} {'Date'}")
        divider()
        for r in rows:
            score = str(r["score"])+"/10" if r.get("score") else "  —  "
            sc = C.GREEN if (r.get("score") or 0) >= 8 else \
                 (C.YELLOW if (r.get("score") or 0) >= 6 else C.RED)
            date = (r.get("started_at") or "")[:10] or "—"
            print(f"  {clr(r['id'][:6]+'…', C.DIM):<8} {r['role']:<22} {r['level']:<14} "
                  f"{r['mode']:^8}  {clr(score, sc):<14} {clr(date, C.DIM)}")
    print(); divider("═"); print()

def fmt_time(s):
    m, s2 = divmod(s, 60); return f"{m}m {s2}s"


# ── Setup prompts ─────────────────────────────────────────────────────────────
def ask_email() -> str:
    while True:
        val = input(clr("\n  Enter your email address: ", C.YELLOW)).strip()
        if "@" in val and "." in val:
            return val.lower()
        print(clr("  Invalid email. Try again.", C.RED))

def choose_role():
    print(clr("\n  Choose your target role:", C.BOLD))
    for i, r in enumerate(ROLES, 1):
        print(f"  {clr(str(i)+'.', C.CYAN)}  {r}")
    while True:
        try:
            n = int(input(clr("\n  Enter number [1-10]: ", C.YELLOW)))
            if 1 <= n <= len(ROLES): return ROLES[n-1]
        except (ValueError, EOFError): pass
        print(clr("  Invalid. Try again.", C.RED))

def choose_level():
    print(clr("\n  Choose experience level:", C.BOLD))
    for i, l in enumerate(LEVELS, 1):
        print(f"  {clr(str(i)+'.', C.CYAN)}  {l}")
    while True:
        try:
            n = int(input(clr("\n  Enter number [1-4]: ", C.YELLOW)))
            if 1 <= n <= len(LEVELS): return LEVELS[n-1]
        except (ValueError, EOFError): pass
        print(clr("  Invalid. Try again.", C.RED))

def choose_mode():
    print(clr("\n  Choose input mode:", C.BOLD))
    print(f"  {clr('1.', C.CYAN)}  💬  Text  — type your answers")
    if STT_AVAILABLE:
        print(f"  {clr('2.', C.CYAN)}  🎙  Voice — speak your answers")
    else:
        print(f"  {clr('2.', C.DIM)}  🎙  Voice — (install pyaudio to enable)")
    print(f"  {clr('3.', C.CYAN)}  🔀  Both  — type or use /voice to speak once")
    while True:
        c = input(clr("\n  Enter number [1-3]: ", C.YELLOW)).strip()
        if c == "1": return "text"
        if c == "2":
            if not STT_AVAILABLE:
                print(clr("  Install pyaudio first.", C.RED)); continue
            return "voice"
        if c == "3": return "both"
        print(clr("  Invalid.", C.RED))


# ── Main Interview ────────────────────────────────────────────────────────────
def run_interview():
    banner()

    if GEMINI_API_KEY.strip() in ("paste-your-key-here", ""):
        print(clr("\n  ⚠  Set your Gemini API key in the script!", C.RED, C.BOLD))
        sys.exit(1)

    # ── Identify user ─────────────────────────────────────────────────────────
    email = ask_email()
    if MONGO_OK:
        _db.upsert_user(email)

    print()
    print(clr("  Main Menu:", C.BOLD))
    print(f"  {clr('1.', C.CYAN)}  Start new interview")
    print(f"  {clr('2.', C.CYAN)}  View past sessions")
    print(f"  {clr('3.', C.CYAN)}  Exit")
    choice = input(clr("\n  → ", C.YELLOW)).strip()

    if choice == "2": show_history(email); return run_interview()
    if choice == "3": print(clr("\n  Goodbye! Keep practicing. 💪\n", C.CYAN)); sys.exit(0)
    if choice != "1": return run_interview()

    divider()
    role   = choose_role()
    level  = choose_level()
    mode   = choose_mode()

    use_tts = False
    if TTS_AVAILABLE:
        ans = input(clr("\n  🔊  Read AI questions aloud? [y/N]: ", C.YELLOW)).strip().lower()
        use_tts = ans in ("y", "yes")

    session_id = None
    if MONGO_OK:
        session_id = _db.create_interview_session(email, role, level, mode)

    system     = SYSTEM_PROMPT.format(role=role, level=level)
    history    = []
    start_time = time.time()

    print(); divider("═")
    print(clr(f"  🚀  Interview started — {role} ({level})", C.GREEN, C.BOLD))
    sid_display = session_id[:8] + "…" if session_id else "offline"
    print(clr(f"  Mode: {mode}  |  User: {email}  |  Session: {sid_display}", C.DIM))
    print(clr("  Type /quit or /end to finish  |  /voice to speak once", C.DIM))
    divider("═")

    print(clr("\n  ⏳  Starting interview...", C.DIM))
    try:
        ai_reply = ai_chat(system, [{"role": "user", "content": "Please begin the interview."}])
    except Exception as e:
        print(clr(f"\n  ✗  Could not connect to Gemini: {e}", C.RED))
        sys.exit(1)

    history.append({"role": "assistant", "content": ai_reply})
    if MONGO_OK and session_id:
        _db.save_interview_message(session_id, "assistant", ai_reply)
    print_ai_message(ai_reply)
    if use_tts: speak(ai_reply)

    while True:
        user_text = None

        if mode == "voice":
            print(clr("  Press Enter to speak, or type directly: ", C.GREEN), end="")
            trigger = input().strip()
            if trigger.lower() in ("/quit", "/end", "quit", "exit"): break
            if trigger:
                user_text = trigger
            else:
                user_text = listen_microphone()
                if user_text is None:
                    print(clr("  Could not capture voice. Type instead.", C.YELLOW))
                    continue
                print_user_message(user_text)

        elif mode == "both":
            raw = input(clr("  You (or /voice): ", C.GREEN)).strip()
            if raw.lower() in ("/quit", "/end", "quit", "exit"): break
            if raw.lower() == "/voice":
                user_text = listen_microphone()
                if user_text is None: continue
                print_user_message(user_text)
            else:
                user_text = raw

        else:
            raw = input(clr("  You: ", C.GREEN)).strip()
            if raw.lower() in ("/quit", "/end", "quit", "exit"): break
            if raw.lower() == "/voice" and STT_AVAILABLE:
                user_text = listen_microphone()
                if user_text is None: continue
                print_user_message(user_text)
            else:
                user_text = raw

        if not user_text: continue

        if MONGO_OK and session_id:
            _db.save_interview_message(session_id, "user", user_text)
        history.append({"role": "user", "content": user_text})

        print(clr("  ⏳  Thinking...", C.DIM))
        try:
            ai_reply = ai_chat(system, history)
        except Exception as e:
            print(clr(f"  ✗  AI error: {e}", C.RED)); continue

        history.append({"role": "assistant", "content": ai_reply})
        if MONGO_OK and session_id:
            _db.save_interview_message(session_id, "assistant", ai_reply)
        print_ai_message(ai_reply)
        if use_tts: speak(ai_reply)

    # ── Wrap-up ───────────────────────────────────────────────────────────────
    duration = int(time.time() - start_time)
    print(); divider("═")
    print(clr("  Interview ended. Evaluating your performance...", C.DIM))
    divider("═")

    if len(history) < 4:
        print(clr("  Not enough conversation to evaluate (need 2+ exchanges).", C.YELLOW))
        if MONGO_OK and session_id:
            _db.close_interview_session(session_id, duration, None, None, None)
    else:
        try:
            scores = ai_evaluate(role, level, history)
            if MONGO_OK and session_id:
                _db.close_interview_session(
                    session_id, duration,
                    scores["overall"], scores["summary"], scores)
            show_results(scores, role, level, duration)
            if use_tts:
                speak(f"Your overall score is {scores['overall']} out of 10. {scores['summary']}")
        except Exception as e:
            print(clr(f"  ⚠  Evaluation failed: {e}", C.RED))
            if MONGO_OK and session_id:
                _db.close_interview_session(session_id, duration, None, None, None)

    again = input(clr("\n  Practice again? [y/N]: ", C.YELLOW)).strip().lower()
    if again in ("y", "yes"):
        run_interview()
    else:
        print(clr("\n  Thanks for practicing with PrepAI. Good luck! 🎯\n", C.CYAN))


if __name__ == "__main__":
    try:
        run_interview()
    except KeyboardInterrupt:
        print(clr("\n\n  Interrupted. Goodbye!\n", C.DIM))
        sys.exit(0)
