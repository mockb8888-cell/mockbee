"""
╔══════════════════════════════════════════════════════════════╗
║           PrepAI — Mock Interview Practice Tool              ║
║     Supports both TEXT and VOICE input/output modes          ║
║     Powered by Google Gemini (FREE API)                      ║
║     Backed by MongoDB  (shared DB with resume.py)            ║
╚══════════════════════════════════════════════════════════════╝
""" 

import os, sys, json, time, datetime
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

from fastapi import FastAPI
from pydantic import BaseModel

import groq
client = groq.Groq(api_key=GROQ_API_KEY)
MODEL = "llama-3.3-70b-versatile"

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
    "Python Developer",
    "Frontend Developer",
    "Backend Developer",
    "ML Engineer",
    "Data Scientist",
    "Cloud Engineer",
    "DevOps Engineer",
    "Cybersecurity Analyst",
    "Network Engineer",
    "System Architect",
    "QA Engineer",
    "Mobile Developer",
    "Testing Engineer",
    "AWS Specialist",
]
LEVELS = ["Junior", "Mid-level", "Senior", "Lead / Staff"]

# ── Interview Phases ──────────────────────────────────────────────────────────
PHASES = [
    "self_intro",
    "projects_skills",
    "technical",
    "optimization",
    "behavioural",
    "hr_logistics",
]

PHASE_LABELS = {
    "self_intro":      "📋  Phase 1 — Self Introduction",
    "projects_skills": "🛠   Phase 2 — Projects & Skills",
    "technical":       "💻  Phase 3 — Technical Questions",
    "optimization":    "⚡  Phase 4 — Optimization & Problem Solving",
    "behavioural":     "🧠  Phase 5 — Behavioural Questions",
    "hr_logistics":    "📝  Phase 6 — HR & Logistics",
}

# Questions per phase (approximate targets)
PHASE_Q_TARGETS = {
    "self_intro":      2,
    "projects_skills": 3,
    "technical":       4,
    "optimization":    3,
    "behavioural":     5,
    "hr_logistics":    5,
}

# ── System Prompts per Phase ──────────────────────────────────────────────────

PHASE_PROMPTS = {

    "self_intro": """You are a professional interviewer conducting a structured mock interview.
Role being interviewed for: {role} | Level: {level}

CURRENT PHASE: Self Introduction (Phase 1 of 6)

Your job in this phase:
- Ask the candidate to introduce themselves (name, background, current role)
- Ask about their total years of experience
- Keep it warm and welcoming — this is an ice-breaker

Rules:
- Ask ONE question at a time
- Give a brief 1-sentence acknowledgment after each answer before asking next
- Ask exactly {q_target} questions in this phase, then say:
  "Thank you! Let's now move on to discuss your projects and experience. [PHASE_COMPLETE]"
- Do NOT ask technical questions in this phase
- Be friendly and encouraging

Start with a warm welcome and ask the candidate to introduce themselves.""",

    "projects_skills": """You are a professional interviewer conducting a structured mock interview.
Role: {role} | Level: {level}

CURRENT PHASE: Projects & Skills (Phase 2 of 6)

Your job in this phase:
- Ask about 1-2 significant projects the candidate has worked on
- Probe: what technologies/skills were used, what was their specific contribution
- Ask what they learned or challenges they overcame
- Ask about team size and their role in the project

Rules:
- Ask ONE question at a time
- Acknowledge briefly before next question
- Ask exactly {q_target} questions, then say:
  "Great insights! Now let's dive into some technical questions. [PHASE_COMPLETE]"
- Tailor project questions to the {role} domain
- Do NOT ask HR or pure behavioural questions here""",

    "technical": """You are an expert technical interviewer.
Role: {role} | Level: {level}

CURRENT PHASE: Technical Questions (Phase 3 of 6)

Your job in this phase:
- Ask role-specific technical questions appropriate for {level} level
- Cover core concepts, tools, frameworks, and best practices for a {role}
- May include code/design questions or scenario-based technical problems

Role-specific focus areas:
- Python Developer: Python internals, OOP, async, frameworks (Django/FastAPI), data structures
- Frontend Developer: HTML/CSS/JS, React/Vue/Angular, performance, accessibility
- Backend Developer: APIs, databases, caching, microservices, security
- ML Engineer: ML algorithms, model training/evaluation, MLOps, feature engineering
- Data Scientist: Statistics, EDA, model building, SQL, Python (pandas/sklearn)
- Cloud Engineer: Cloud services (AWS/GCP/Azure), IaC, networking, cost optimization
- DevOps Engineer: CI/CD, Docker, Kubernetes, monitoring, scripting
- Cybersecurity Analyst: Threat analysis, OWASP, penetration testing, incident response
- Network Engineer: TCP/IP, routing/switching, firewalls, VPN, network monitoring
- System Architect: System design, scalability, distributed systems, trade-offs
- QA Engineer: Test strategies, automation (Selenium/Pytest), bug lifecycle, test plans
- Mobile Developer: iOS/Android, React Native/Flutter, lifecycle, performance
- Testing Engineer: Manual testing, automation frameworks, API testing, test reporting
- AWS Specialist: AWS services (EC2, S3, Lambda, RDS, etc.), AWS architecture, IAM, cost

Rules:
- Ask ONE question at a time
- Acknowledge answer briefly; point out a key strength or gentle correction
- Ask exactly {q_target} questions, then say:
  "Good work on the technical round! Let's now look at optimization scenarios. [PHASE_COMPLETE]"
- Progressively increase difficulty""",

    "optimization": """You are a senior technical interviewer focusing on optimization.
Role: {role} | Level: {level}

CURRENT PHASE: Optimization & Problem Solving (Phase 4 of 6)

Your job in this phase:
- Present real-world optimization challenges relevant to {role}
- Ask how the candidate would improve performance, scalability, or efficiency
- Examples: slow query optimization, reducing API latency, improving build times,
  model inference speed, network bottlenecks, cost reduction on cloud, etc.
- Ask about trade-offs they would consider

Rules:
- Ask ONE question at a time
- After their answer, ask a quick follow-up on trade-offs or alternatives once
- Ask exactly {q_target} questions, then say:
  "Excellent thinking! Now let's move to some behavioural questions. [PHASE_COMPLETE]"
- Keep scenarios realistic and role-relevant""",

    "behavioural": """You are a professional interviewer assessing behavioural competencies.
Role: {role} | Level: {level}

CURRENT PHASE: Behavioural Questions (Phase 5 of 6)

Your job in this phase — ask ALL of the following (one at a time, in order):
1. Strengths — "What are your top 2-3 professional strengths? Give an example."
2. Weaknesses — "What is one area you're actively working to improve?"
3. Motivation — "Why are you looking to change roles / why are you interested in this position?"
4. Career vision — "Where do you see yourself in 5 years from now?"
5. Achievements — "Tell me about a time you handled a conflict or tough situation at work." (STAR method)

Rules:
- Ask ONE question at a time, in the order above
- After each answer give a brief, encouraging acknowledgment
- After question 5, say:
  "Thank you for sharing that! Finally, let's discuss some logistical details. [PHASE_COMPLETE]"
- Use STAR method prompts if answers are too vague ("Can you walk me through the Situation, Task, Action, and Result?")""",

    "hr_logistics": """You are an HR interviewer wrapping up the interview.
Role: {role} | Level: {level}

CURRENT PHASE: HR & Logistics (Phase 6 of 6 — Final Phase)

Your job in this phase — ask ALL of the following (one at a time, in order):
1. Notice period — "What is your current notice period / how soon can you join?"
2. Shift timings — "Are you comfortable with shift timings? (mention if role has shifts, e.g. night/rotational)"
3. Salary — "What is your current CTC and expected CTC?"
4. Relocation — "Are you open to relocating if required for this role?"
5. Flexibility — "How flexible are you in terms of work hours, overtime, or travel?"

Rules:
- Ask ONE question at a time, in the order above
- Be professional and non-judgmental about their answers
- After question 5, say:
  "That's all from my side! Thank you so much for your time today. 
   We'll review your interview and get back to you. It was great speaking with you! [INTERVIEW_COMPLETE]"
- Do NOT ask any more questions after the closing statement""",
}

# ── Evaluation Prompt ─────────────────────────────────────────────────────────
EVAL_PROMPT = """Evaluate this structured mock interview for a {role} ({level}) position.

The interview was conducted in 6 phases:
1. Self Introduction
2. Projects & Skills
3. Technical Questions
4. Optimization & Problem Solving
5. Behavioural Questions
6. HR & Logistics

Transcript:
{transcript}

Reply ONLY with valid JSON (no markdown, no extra text):
{{
  "overall": <1-10>,
  "self_intro": <1-10>,
  "projects_skills": <1-10>,
  "technical": <1-10>,
  "optimization": <1-10>,
  "behavioural": <1-10>,
  "hr_logistics": <1-10>,
  "communication": <1-10>,
  "confidence": <1-10>,
  "strengths": ["...", "...", "..."],
  "improvements": ["...", "...", "..."],
  "phase_feedback": {{
    "self_intro": "one sentence feedback",
    "projects_skills": "one sentence feedback",
    "technical": "one sentence feedback",
    "optimization": "one sentence feedback",
    "behavioural": "one sentence feedback",
    "hr_logistics": "one sentence feedback"
  }},
  "summary": "3-4 sentence overall assessment"
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


# ── Groq AI ─────────────────────────────────────────────────────────────────
def ai_chat(system, history):
    messages = [{"role": "system", "content": system}]
    for m in history:
        role = "user" if m["role"] == "user" else "assistant"
        messages.append({"role": role, "content": m["content"]})
    
    completion = client.chat.completions.create(
        model=MODEL,
        messages=messages,
    )
    return completion.choices[0].message.content.strip()

def ai_evaluate(role, level, history):
    transcript = "\n".join(
        f"{'INTERVIEWER' if m['role']=='assistant' else 'CANDIDATE'}: {m['content']}"
        for m in history)
    prompt = EVAL_PROMPT.format(role=role, level=level, transcript=transcript)
    
    completion = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = completion.choices[0].message.content.strip()
    
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
    for label, key in [("Overall","overall"), ("Self Intro","self_intro"),
                       ("Projects","projects_skills"), ("Technical","technical"),
                       ("Optimization","optimization"), ("Behavioural","behavioural"),
                       ("HR & Logistics","hr_logistics"),
                       ("Communication","communication"),
                       ("Confidence","confidence")]:
        print_score_bar(label, data.get(key, 0))
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

    if not GROQ_API_KEY:
        print(clr("\n  ⚠  Set your GROQ_API_KEY environment variable!", C.RED, C.BOLD))
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

    phase_idx = 0
    phase_name = PHASES[phase_idx]
    q_target = PHASE_Q_TARGETS[phase_name]
    system = PHASE_PROMPTS[phase_name].format(role=role, level=level, q_target=q_target)
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
        print(clr(f"\n  ✗  Could not connect to Groq: {e}", C.RED))
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

        if "[PHASE_COMPLETE]" in ai_reply:
            phase_idx += 1
            if phase_idx < len(PHASES):
                phase_name = PHASES[phase_idx]
                q_target = PHASE_Q_TARGETS[phase_name]
                system = PHASE_PROMPTS[phase_name].format(role=role, level=level, q_target=q_target)
                print(clr(f"\n  [Moving to {PHASE_LABELS[phase_name]}]", C.CYAN))
        if "[INTERVIEW_COMPLETE]" in ai_reply:
            break

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
