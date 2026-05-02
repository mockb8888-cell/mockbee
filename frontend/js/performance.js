/* ============================================
   MockBee - Performance Report Logic
   ============================================ */

let currentSlide = 0;
let totalSlides = 0;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check for recentInterview
    const savedSession = localStorage.getItem('recentInterview');

    // Default: Just populate with recent (if any)
    if (savedSession) {
        populateReport(JSON.parse(savedSession));
    } else {
        const feedbackEl = document.getElementById('ai-feedback-text');
        if (feedbackEl) feedbackEl.innerText = "No recent interview session found. Please start a new mock interview to see your customized report.";
    }

    // 2. Attach slider listeners (Once)
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => changeSlide(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeSlide(1));
});

/**
 * Populates the Performance Report UI with data from a specific session
 */
window.populateReport = function (sessionData) {
    const { role, transcript, date, totalQuestions } = sessionData;

    // 2. Populate Header
    const roleDisplay = document.getElementById('role-display');
    const dateDisplay = document.getElementById('date-display');
    if (roleDisplay) {
        roleDisplay.innerHTML = `<span style="font-size: 0.95rem; color: #E9E4E2; font-weight: 600; letter-spacing: 1.5px;">ROLE: ${role.toUpperCase()} </span>`;
    }
    if (dateDisplay) {
        dateDisplay.textContent = `DATE: ${date.toUpperCase()}`;
    }

    // 3. Populate Transcript
    const transcriptContainer = document.getElementById('transcript-container');
    if (transcriptContainer) {
        transcriptContainer.innerHTML = ''; // Clear placeholders

        if (transcript && transcript.length > 0) {
            transcript.forEach((item, index) => {
                const qItem = document.createElement('div');
                qItem.className = 'q-item';
                qItem.innerHTML = `
                    <div class="q-row">
                        <span class="q-num">Q${index + 1}</span>
                        <p class="q-txt">${item.question}</p>
                    </div>
                    <div class="a-row">
                        <span class="a-label">ANSWER:</span>
                        <p class="a-txt">${item.answer}</p>
                    </div>
                `;
                transcriptContainer.appendChild(qItem);
            });

            // Initialize Slider State
            currentSlide = 0;
            totalSlides = transcript.length;
            updateSliderUI();

            const list = document.getElementById('transcript-container');
            if (list) list.style.transform = `translateX(0)`;
        } else {
            transcriptContainer.innerHTML = '<p style="text-align:center; padding: 20px; font-style:italic;">No responses were captured during this session.</p>';
            if (document.querySelector('.slider-controls')) {
                document.querySelector('.slider-controls').style.display = 'none';
            }
        }
    }

    // 4. Determine if we should evaluate or load cached analysis
    if (sessionData.analysis) {
        // INSTANT LOAD FOR SAVED SESSIONS
        updateScores(sessionData.analysis, transcript);
        
        let qScores = sessionData.analysis.questionScores;
        let cScores = sessionData.analysis.confidenceScores;
        if (!qScores || qScores.length === 0) {
            const tempLen = (transcript && transcript.length > 0) ? transcript.length : 1;
            qScores = Array(tempLen).fill(sessionData.analysis.technical || sessionData.analysis.overall || 80);
            cScores = Array(tempLen).fill(sessionData.analysis.confidence || 80);
        }
        drawPerformanceChart(qScores, cScores);
    } else {
        // Evaluate dynamically
        // Prefer full conversationHistory from phase-driven interview
        let history = [];
        if (sessionData.conversationHistory && sessionData.conversationHistory.length > 0) {
            history = sessionData.conversationHistory;
        } else if (transcript && transcript.length > 0) {
            transcript.forEach(t => {
                history.push({ role: "assistant", content: t.question });
                if (t.answer) history.push({ role: "user", content: t.answer });
            });
        }
        const feedbackEl = document.getElementById('ai-feedback-text');
        if (feedbackEl) feedbackEl.innerText = "Analyzing performance with AI... please wait.";

        fetch(`${API_BASE}/api/interview/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role: role,
                level: "Mid-level",
                history: history
            })
        })
        .then(res => {
            if (!res.ok) {
                throw new Error("HTTP " + res.status);
            }
            return res.json();
        })
        .then(data => {
            if (data.status === 'success' && data.evaluation) {
                const ev = data.evaluation;
                const phaseScores = [
                    (ev.self_intro || 5) * 10,
                    (ev.projects_skills || 5) * 10,
                    (ev.technical || 5) * 10,
                    (ev.optimization || 5) * 10,
                    (ev.behavioural || 5) * 10,
                    (ev.hr_logistics || 5) * 10,
                ];
                const confBase = (ev.confidence || 5) * 10;
                const confScores = phaseScores.map(s => Math.min(100, Math.max(0, Math.round(s * 0.7 + confBase * 0.3))));

                const analysis = {
                    overall: (ev.overall || 5) * 10,
                    clarity: (ev.clarity || ev.communication || 5) * 10,
                    technical: (ev.technical || 5) * 10,
                    confidence: confBase,
                    selfIntro: phaseScores[0],
                    optimization: phaseScores[3],
                    behavioural: phaseScores[4],
                    projects_skills: phaseScores[1],
                    hr_logistics: phaseScores[5],
                    questionScores: phaseScores,
                    confidenceScores: confScores,
                    feedback: ev.summary || "Good completion of the interview.",
                    strengths: ev.strengths || ["Completed assessment"],
                    improvements: ev.improvements || ["Practice more"],
                    phase_feedback: ev.phase_feedback || {}
                };
                
                // Permanently save the generated scores so Dashboard can read it
                let histories = JSON.parse(localStorage.getItem('mockbee_interviews') || '[]');
                let recentItem = JSON.parse(localStorage.getItem('recentInterview') || '{}');
                
                // Try strictly matching by unique id if available, fallback to date & role
                let idx = sessionData.id ? histories.findIndex(s => s.id === sessionData.id) 
                                         : histories.findIndex(s => s.role === sessionData.role && s.date === sessionData.date);
                if (idx !== -1) {
                    histories[idx].analysis = analysis;
                    localStorage.setItem('mockbee_interviews', JSON.stringify(histories));
                    
                    // SAVE TO DATABASE
                    const userEmail = localStorage.getItem('mockbee_user_email');
                    if (userEmail) {
                        fetch(`${API_BASE}/api/interview/save`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: userEmail,
                                role: histories[idx].role,
                                date: histories[idx].date,
                                score: analysis.overall,
                                analysis: analysis,
                                transcript: transcript,
                                mode: histories[idx].mode || 'standard',
                                session_id: histories[idx].id
                            })
                        }).catch(e => console.error("DB Save Error:", e));
                    }
                }
                if (recentItem && (recentItem.id === sessionData.id || (recentItem.role === sessionData.role && recentItem.date === sessionData.date))) {
                    recentItem.analysis = analysis;
                    localStorage.setItem('recentInterview', JSON.stringify(recentItem));
                }

                updateScores(analysis, transcript);
                drawPerformanceChart(analysis.questionScores, analysis.confidenceScores,
                    ['Intro', 'Projects', 'Technical', 'Optimize', 'Behaviour', 'HR']);
            } else {
                throw new Error(data.detail || "API returned invalid status.");
            }
        })
        .catch(err => {
            console.error("Evaluation error:", err);
            const isOffline = err.message && err.message.toLowerCase().includes('fetch');
            if (feedbackEl) feedbackEl.innerText = isOffline
                ? "⚠️ Backend offline — showing local analysis based on your answers."
                : "Analysis complete (local mode).";
            const analysis = analyzePerformance(transcript, role);
            
            let histories = JSON.parse(localStorage.getItem('mockbee_interviews') || '[]');
            let idx = sessionData.id ? histories.findIndex(s => s.id === sessionData.id) : histories.findIndex(s => s.role === sessionData.role && s.date === sessionData.date);
            if (idx !== -1) {
                histories[idx].analysis = analysis;
                localStorage.setItem('mockbee_interviews', JSON.stringify(histories));
                
                // SAVE TO DATABASE
                const userEmail = localStorage.getItem('mockbee_user_email');
                if (userEmail) {
                    fetch(`${API_BASE}/api/interview/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: userEmail,
                            role: histories[idx].role,
                            date: histories[idx].date,
                            score: analysis.overall,
                            analysis: analysis,
                            transcript: transcript,
                            mode: histories[idx].mode || 'standard',
                            session_id: histories[idx].id
                        })
                    }).catch(e => console.error("DB Save Error:", e));
                }
            }

            updateScores(analysis, transcript);
            drawPerformanceChart(analysis.questionScores, analysis.confidenceScores);
        });
    }
};


// Also keep a listener wrapper for manual triggers if needed
window.initializeReport = function (score) {
    // This is a legacy-compat shell for performance.html's call
    console.log("Initialize report with fixed score simulation:", score);
};

/**
 * Simulates intelligent AI analysis based on answer characteristics and role keywords
 */
const ROLE_KEYWORDS = {
    "Python": ["decorators", "gil", "memory", "generators", "multiprocessing", "oop"],
    "Frontend": ["virtual dom", "react", "css", "flexbox", "grid", "hooks", "performance", "rendering", "javascript"],
    "Backend": ["restful", "rest", "sql", "nosql", "database", "indexing", "auth", "security", "microservices"],
    "ML": ["supervised", "unsupervised", "regression", "neural", "transformers", "training", "overfitting"],
    "Data Scientist": ["stats", "eda", "visualization", "pandas", "hypothesis", "analysis"],
    "Cloud": ["aws", "azure", "serverless", "infrastructure", "scaling", "redundancy"],
    "DevOps": ["pipeline", "cicd", "docker", "kubernetes", "monitoring", "automation"],
    "Cybersecurity": ["encryption", "vulnerability", "security", "owasp", "pen testing"],
    "Network": ["osi", "protocols", "tcp", "udp", "routing", "switching", "dns"],
    "System Architect": ["scalability", "architecture", "distributed", "load balancers", "multi-tenant"],
    "QA": ["manual", "automated", "testing", "regression", "smoke", "qa"],
    "Mobile": ["flutter", "react native", "android", "ios", "native", "cross-platform"]
};

function analyzePerformance(transcript, role) {
    let totalClarity = 0;
    let totalTechnical = 0;
    let totalConfidence = 0;
    const questionScores = [];
    const confidenceScores = [];

    if (!transcript || transcript.length === 0) {
        return {
            overall: 0,
            clarity: 0,
            technical: 0,
            confidence: 0,
            questionScores: [0],
            confidenceScores: [0],
            feedback: "Please complete an interview session to receive customized AI feedback.",
            strengths: ["Completing sessions"],
            improvements: ["Start an interview"]
        };
    }

    // Role-specific keywords
    let roleKeywords = [];
    for (const key in ROLE_KEYWORDS) {
        if (role.toLowerCase().includes(key.toLowerCase())) {
            roleKeywords = ROLE_KEYWORDS[key];
            break;
        }
    }

    transcript.forEach(item => {
        const text = item.answer.toLowerCase();
        const wordCount = item.answer.trim().split(/\s+/).length;

        // --- High-Performance Logic ---

        // 1. Technical Score: keyword-boosted from a realistic baseline
        const matchedKeywords = roleKeywords.filter(kw => text.includes(kw.toLowerCase()));

        // Base technical score starts at 50 (average). Grows with keywords and depth.
        let techScore = 50 + (matchedKeywords.length * 8);
        if (wordCount > 15) techScore += 8;
        if (wordCount > 40) techScore += 10;
        if (wordCount > 80) techScore += 7;

        // Cap it at 98
        techScore = Math.min(techScore, 98);

        // 2. Clarity Score: starts at 55, penalized for very short answers
        let clarityScore = 55;
        if (wordCount < 3) clarityScore = 10;
        else if (wordCount < 8) clarityScore = 30;
        else if (wordCount < 15) clarityScore = 45;
        else clarityScore = Math.min(55 + (wordCount * 0.3), 92);

        // 3. Confidence Score: baseline 55, grows with answer length
        let confScore = 55 + (wordCount * 0.8);
        if (matchedKeywords.length > 0) confScore += 10;
        confScore = Math.min(confScore, 95);

        // Realism: If it's absolute gibberish (one word, no keywords), crater everything
        if (wordCount <= 2 && matchedKeywords.length === 0) {
            techScore = 10;
            clarityScore = 10;
            confScore = 15;
        }

        questionScores.push(Math.round(techScore));
        confidenceScores.push(Math.round(confScore));

        totalClarity += clarityScore;
        totalTechnical += techScore;
        totalConfidence += confScore;
    });

    const avgClarity = Math.round(totalClarity / transcript.length);
    const avgTechnical = Math.round(totalTechnical / transcript.length);
    const avgConfidence = Math.round(totalConfidence / transcript.length);
    const overall = Math.round((avgClarity + avgTechnical + avgConfidence) / 3);

    // Dynamic Lists
    const strengths = [];
    if (overall > 70) {
        if (avgTechnical > 75) strengths.push("Strong Subject Matter Expertise");
        if (avgClarity > 80) strengths.push("Articulate & Clear Communication");
        if (avgConfidence > 80) strengths.push("Exceptional Professional Confidence");
    } else if (overall > 40) {
        strengths.push("Willingness to Engage");
        strengths.push("Basic Role Familiarity");
    } else {
        strengths.push("Initial Attempt Made");
        strengths.push("Potential for Growth");
    }
    if (strengths.length < 3) strengths.push("Consistent Discussion Flow");

    const improvements = [];
    if (overall < 40) {
        improvements.push("Provide detailed, structured technical answers");
        improvements.push("Ensure answers directly address the interview question");
        improvements.push("Focus on learning core role concepts: " + (roleKeywords.slice(0, 3).join(", ")));
    } else {
        if (avgTechnical < 70) improvements.push("Deepen technical explanations with specific examples");
        if (avgClarity < 75) improvements.push("Structure responses more linearly for better clarity");
        if (avgConfidence < 75) improvements.push("Maintain a more assertive tone during challenges");
    }
    improvements.push("Incorporate quantifiable metrics in STAR responses");

    // Context-Aware Feedback
    let feedback = "";
    if (overall > 85) feedback = "Outstanding! You handled technical questions with precision and maintained a leadership-level presence.";
    else if (overall > 70) feedback = "Very good. You possess a strong grasp of the fundamentals. Focus on adding more quantitative data to your answers.";
    else if (overall > 40) feedback = "A fair start, but your answers lack the technical depth and clarity required for this seniority level.";
    else feedback = "Critical Improvement Needed. Your responses were either too brief or irrelevant to the technical requirements of the role.";

    return {
        overall,
        clarity: Math.min(avgClarity, 100),
        technical: Math.min(avgTechnical, 100),
        confidence: Math.min(avgConfidence, 100),
        selfIntro: Math.min(avgClarity, 100),
        optimization: Math.min(avgTechnical, 100),
        behavioural: Math.min(avgConfidence, 100),
        questionScores,
        confidenceScores,
        feedback,
        strengths,
        improvements
    };
}

function updateScores(analysis, transcript) {
    // Overall Score
    const scoreEl = document.getElementById('overall-score');
    const badgeEl = document.getElementById('score-badge');
    const gaugeFill = document.getElementById('score-gauge-fill');

    if (scoreEl) scoreEl.innerText = analysis.overall;

    if (gaugeFill) {
        // Circumference is ~276 for r=44
        const offset = 276 - (276 * analysis.overall / 100);
        gaugeFill.style.strokeDasharray = "276";
        gaugeFill.style.strokeDashoffset = offset;
    }

    if (badgeEl) {
        if (analysis.overall > 80) {
            badgeEl.innerHTML = '<i class="fas fa-certificate"></i> EXCELLENT';
            badgeEl.classList.add('premium');
        } else if (analysis.overall > 60) {
            badgeEl.innerHTML = '<i class="fas fa-certificate"></i> COMPETENT';
        } else {
            badgeEl.innerHTML = '<i class="fas fa-certificate"></i> NEEDS WORK';
        }
    }

    // Generate dynamic scores for new bars if they don't exist
    if (analysis.selfIntro === undefined) {
        let tIntro = 0, tOpt = 0, tBeh = 0;
        if (transcript && transcript.length > 0) {
            transcript.forEach(item => {
                const text = item.answer ? item.answer.toLowerCase() : "";
                const wordCount = text.trim().split(/\s+/).length;
                
                let introScore = 40 + (wordCount * 0.5);
                if (text.includes("i am") || text.includes("experience") || text.includes("worked") || text.includes("years") || text.includes("my name")) introScore += 30;
                
                let optScore = 30 + (wordCount * 0.5);
                if (text.includes("time") || text.includes("space") || text.includes("efficient") || text.includes("complexity") || text.includes("optimize") || text.includes("o(")) optScore += 40;
                
                let behScore = 45 + (wordCount * 0.5);
                if (text.includes("team") || text.includes("challenge") || text.includes("collaborate") || text.includes("situation") || text.includes("task") || text.includes("conflict")) behScore += 30;
                
                tIntro += Math.min(introScore, 98);
                tOpt += Math.min(optScore, 98);
                tBeh += Math.min(behScore, 98);
            });
            analysis.selfIntro = Math.round(tIntro / transcript.length);
            analysis.optimization = Math.round(tOpt / transcript.length);
            analysis.behavioural = Math.round(tBeh / transcript.length);
        } else {
            analysis.selfIntro = 0;
            analysis.optimization = 0;
            analysis.behavioural = 0;
        }
    }

    // Skill Bars
    updateSkill('clarity', analysis.clarity);
    updateSkill('technical', analysis.technical);
    updateSkill('confidence', analysis.confidence);
    updateSkill('self-intro', analysis.selfIntro);
    updateSkill('optimization', analysis.optimization);
    updateSkill('behavioural', analysis.behavioural);

    // AI Feedback Text
    const feedbackText = document.getElementById('ai-feedback-text');
    if (feedbackText) feedbackText.innerText = `"${analysis.feedback}"`;

    // Secondary Metrics (Confidence, Key Word Match, etc.)
    const confLevel = document.getElementById('confidence-level');
    const keywordMatch = document.getElementById('keyword-match-val');
    const emotionStatus = document.getElementById('emotion-status');
    const fillerWords = document.getElementById('filler-words');

    // Simulate keyword match percentage based on technical score
    const kwMatchPercent = Math.min(Math.round(analysis.technical * 0.85 + 5), 100);

    if (confLevel) confLevel.innerText = analysis.confidence > 80 ? "HIGH" : (analysis.confidence > 60 ? "MODERATE" : "LOW");
    if (keywordMatch) keywordMatch.innerText = kwMatchPercent + "%";
    if (emotionStatus) emotionStatus.innerText = analysis.confidence > 70 ? "CALM" : "FOCUSED";
    if (fillerWords) fillerWords.innerText = analysis.confidence > 80 ? "MINIMAL" : "LOW";

    // Strengths & Improvements Lists
    populateList('strengths-list', analysis.strengths);
    populateList('improvements-list', analysis.improvements);

    // Phase Breakdown (only for structured interviews with phase_feedback)
    if (analysis.phase_feedback && Object.keys(analysis.phase_feedback).length > 0) {
        showPhaseFeedback(analysis);
    }
}

function populateList(id, items) {
    const list = document.getElementById(id);
    if (!list) return;
    list.innerHTML = '';
    items.forEach(txt => {
        const li = document.createElement('li');
        li.innerText = txt;
        list.appendChild(li);
    });
}

function updateSkill(id, val) {
    const tag = document.getElementById(`${id}-tag`);
    const valEl = document.getElementById(`${id}-val`);
    const bar = document.getElementById(`${id}-bar`);

    if (valEl) valEl.innerText = val;
    if (bar) bar.style.width = `${val}%`;

    if (tag) {
        if (val > 80) tag.innerText = "Excellent";
        else if (val > 60) tag.innerText = "Good";
        else tag.innerText = "Needs Work";
    }
}

function showPhaseFeedback(analysis) {
    const container = document.getElementById('phase-breakdown-container');
    const grid = document.getElementById('phase-grid');
    if (!container || !grid) return;

    const phases = [
        { key: 'self_intro',      label: 'Self Introduction', icon: 'fas fa-user-circle', scoreKey: 'selfIntro' },
        { key: 'projects_skills', label: 'Projects & Skills',  icon: 'fas fa-code',        scoreKey: 'projects_skills' },
        { key: 'technical',       label: 'Technical',          icon: 'fas fa-microchip',   scoreKey: 'technical' },
        { key: 'optimization',    label: 'Optimization',       icon: 'fas fa-bolt',        scoreKey: 'optimization' },
        { key: 'behavioural',     label: 'Behavioural',        icon: 'fas fa-users',       scoreKey: 'behavioural' },
        { key: 'hr_logistics',    label: 'HR & Logistics',     icon: 'fas fa-briefcase',   scoreKey: 'hr_logistics' }
    ];

    grid.innerHTML = '';
    let hasContent = false;

    phases.forEach(phase => {
        const feedback = (analysis.phase_feedback || {})[phase.key];
        const score = analysis[phase.scoreKey] || 0;
        const color = score >= 80 ? '#27AE60' : score >= 60 ? '#D4A017' : '#E53935';
        const card = document.createElement('div');
        card.style.cssText = `background:#faf9f8; border-radius:12px; padding:16px; border-left:4px solid ${color};`;
        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <i class="${phase.icon}" style="color:${color};"></i>
                <span style="font-size:0.72rem;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:#1A1A1A;">${phase.label}</span>
            </div>
            <div style="font-size:1.8rem;font-weight:900;color:${color};margin-bottom:6px;">${score}%</div>
            <p style="font-size:0.78rem;color:#4A4A4A;line-height:1.5;margin:0;">${feedback || 'Phase completed.'}</p>
        `;
        grid.appendChild(card);
        hasContent = true;
    });

    if (hasContent) container.style.display = 'block';
}

function drawPerformanceChart(qScores, cScores, labels) {
    const scorePath = document.getElementById('score-path');
    const scoreNodes = document.getElementById('score-nodes');
    const confidencePath = document.getElementById('confidence-path');
    const confidenceNodes = document.getElementById('confidence-nodes');
    const labelsGroup = document.getElementById('chart-labels');

    if (!scorePath) return;

    const chartLabels = labels || qScores.map((_, i) => `Q${i + 1}`);
    const width = 460;
    const startX = 60;
    const stepX = qScores.length > 1 ? width / (qScores.length - 1) : 0;

    let pathD = "";
    let confPoints = "";

    scoreNodes.innerHTML = '';
    confidenceNodes.innerHTML = '';
    labelsGroup.innerHTML = '';

    qScores.forEach((score, i) => {
        const x = startX + (i * stepX);
        const yScore = 180 - (score * 1.5);
        const yConf = 180 - ((cScores[i] || 50) * 1.5);

        if (i === 0) pathD += `M ${x},${yScore}`;
        else pathD += ` L ${x},${yScore}`;

        confPoints += `${x},${yConf} `;

        scoreNodes.innerHTML += `<circle cx="${x}" cy="${yScore}" r="4" fill="var(--parchment)" stroke="var(--gold-dark)"><title>${chartLabels[i]}: ${score}%</title></circle>`;
        confidenceNodes.innerHTML += `<circle cx="${x}" cy="${yConf}" r="5" fill="var(--navy-dark)"><title>Confidence: ${Math.round(cScores[i] || 50)}%</title></circle>`;

        labelsGroup.innerHTML += `<text x="${x}" y="215" font-size="9" font-weight="900" fill="var(--navy)" text-anchor="middle">${chartLabels[i]}</text>`;
    });

    scorePath.setAttribute('d', pathD);
    confidencePath.setAttribute('points', confPoints);
}

/**
 * Slider Navigation Logic
 */
function changeSlide(direction) {
    const newSlide = currentSlide + direction;
    if (newSlide >= 0 && newSlide < totalSlides) {
        currentSlide = newSlide;
        updateSliderUI();
    }
}

function updateSliderUI() {
    const list = document.getElementById('transcript-container');
    const indicator = document.getElementById('slide-indicator');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (list) {
        list.style.transform = `translateX(-${currentSlide * 100}%)`;
    }

    if (indicator) {
        indicator.innerText = `${currentSlide + 1} / ${totalSlides}`;
    }

    if (prevBtn) prevBtn.disabled = (currentSlide === 0);
    if (nextBtn) nextBtn.disabled = (currentSlide === totalSlides - 1);
}
