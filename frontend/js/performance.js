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
    let { role, transcript, date, totalQuestions } = sessionData;

    // Normalize transcript if it uses the newer {role, content} format
    if (transcript && transcript.length > 0 && transcript[0].role !== undefined) {
        const normalized = [];
        let currentQ = "";
        transcript.forEach(t => {
            if (t.role === "assistant" || t.role === "model") {
                if (currentQ) normalized.push({ question: currentQ, answer: "No answer provided" });
                currentQ = t.content;
            } else if (t.role === "user") {
                if (currentQ) {
                    normalized.push({ question: currentQ, answer: t.content });
                    currentQ = "";
                } else {
                    normalized.push({ question: "User input", answer: t.content });
                }
            }
        });
        if (currentQ) normalized.push({ question: currentQ, answer: "No answer provided" });
        transcript = normalized;
        sessionData.transcript = transcript; // Update reference for saves
    }

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
        updateScores(sessionData.analysis);
        
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
        const history = [];
        if (transcript && transcript.length > 0) {
            transcript.forEach(t => {
                history.push({ role: "assistant", content: t.question });
                if (t.answer) history.push({ role: "user", content: t.answer });
            });

        const feedbackEl = document.getElementById('ai-feedback-text');
        if (feedbackEl) feedbackEl.innerText = "Analyzing performance with AI... please wait.";

        fetch('https://mockbee.onrender.com/api/interview/evaluate', {
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
                const qLen = transcript && transcript.length > 0 ? transcript.length : 1;
                const qScores = Array(qLen).fill((ev.technical || 5) * 10);
                const cScores = Array(qLen).fill((ev.confidence || 5) * 10);

                const analysis = {
                    overall: (ev.overall || 5) * 10,
                    communication: (ev.communication || 5) * 10,
                    technical: (ev.technical || 5) * 10,
                    optimization: (ev.optimization || 5) * 10,
                    behavioural: (ev.behavioural || 5) * 10,
                    confidence: (ev.confidence || 5) * 10,
                    questionScores: qScores,
                    confidenceScores: cScores,
                    feedback: ev.summary || "Good completion of the interview.",
                    strengths: ev.strengths || ["Completed assessment"],
                    improvements: ev.improvements || ["Practice more"]
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
                        fetch('https://mockbee.onrender.com/api/interview/save', {
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

                updateScores(analysis);
                drawPerformanceChart(analysis.questionScores, analysis.confidenceScores);
            } else {
                throw new Error(data.detail || "API returned invalid status.");
            }
        })
        .catch(err => {
            console.error("Evaluation error:", err);
            if (feedbackEl) feedbackEl.innerText = "Error analyzing performance. Using local logic fallback.";
            const analysis = analyzePerformance(transcript, role);
            
            let histories = JSON.parse(localStorage.getItem('mockbee_interviews') || '[]');
            let idx = sessionData.id ? histories.findIndex(s => s.id === sessionData.id) : histories.findIndex(s => s.role === sessionData.role && s.date === sessionData.date);
            if (idx !== -1) {
                histories[idx].analysis = analysis;
                localStorage.setItem('mockbee_interviews', JSON.stringify(histories));
                
                // SAVE TO DATABASE
                const userEmail = localStorage.getItem('mockbee_user_email');
                if (userEmail) {
                    fetch('https://mockbee.onrender.com/api/interview/save', {
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

            updateScores(analysis);
            drawPerformanceChart(analysis.questionScores, analysis.confidenceScores);
        });
    } else {
        const analysis = analyzePerformance([], role);
        updateScores(analysis);
        drawPerformanceChart(analysis.questionScores, analysis.confidenceScores);
    }
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
            communication: 0,
            technical: 0,
            optimization: 0,
            behavioural: 0,
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

        // 1. Technical Score: Depends heavily on keywords
        const matchedKeywords = roleKeywords.filter(kw => text.includes(kw.toLowerCase()));

        // Base technical score is low (10). It grows with keywords and depth.
        let techScore = 10 + (matchedKeywords.length * 15);
        if (wordCount > 20) techScore += 10;
        if (wordCount > 50) techScore += 10;

        // Cap it at 98
        techScore = Math.min(techScore, 98);

        // 2. Clarity Score: Penalize if nonsense or too short
        let clarityScore = 0;
        if (wordCount < 3) clarityScore = 5; // Gibberish like "vvvbbb"
        else if (wordCount < 10) clarityScore = 20;
        else if (matchedKeywords.length === 0 && wordCount < 20) clarityScore = 30; // Irrelevant
        else clarityScore = Math.min(40 + (wordCount * 0.5), 90);

        // 3. Confidence Score: If they say very little, confidence is low
        let confScore = 15 + (wordCount * 2);
        if (matchedKeywords.length > 0) confScore += 20;
        confScore = Math.min(confScore, 95);

        // Realism: If it's absolute gibberish (one word, no keywords), crater everything
        if (wordCount === 1 && matchedKeywords.length === 0) {
            techScore = 5;
            clarityScore = 5;
            confScore = 10;
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
        communication: Math.min(avgClarity, 100),
        technical: Math.min(avgTechnical, 100),
        optimization: Math.min(avgTechnical, 100),
        behavioural: Math.min(avgClarity, 100),
        confidence: Math.min(avgConfidence, 100),
        questionScores,
        confidenceScores,
        feedback,
        strengths,
        improvements
    };
}

function updateScores(analysis) {
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

    // Skill Bars
    updateSkill('communication', analysis.communication || 50);
    updateSkill('technical', analysis.technical || 50);
    updateSkill('optimization', analysis.optimization || 50);
    updateSkill('behavioural', analysis.behavioural || 50);

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

function drawPerformanceChart(qScores, cScores) {
    const scorePath = document.getElementById('score-path');
    const scoreNodes = document.getElementById('score-nodes');
    const confidencePath = document.getElementById('confidence-path');
    const confidenceNodes = document.getElementById('confidence-nodes');
    const labelsGroup = document.getElementById('chart-labels');

    if (!scorePath) return;

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
        const yConf = 180 - (cScores[i] * 1.5);

        if (i === 0) pathD += `M ${x},${yScore}`;
        else pathD += ` L ${x},${yScore}`;

        confPoints += `${x},${yConf} `;

        scoreNodes.innerHTML += `<circle cx="${x}" cy="${yScore}" r="4" fill="var(--parchment)" stroke="var(--gold-dark)"></circle>`;
        confidenceNodes.innerHTML += `<circle cx="${x}" cy="${yConf}" r="5" fill="var(--navy-dark)"></circle>`;

        labelsGroup.innerHTML += `<text x="${x}" y="210" font-size="12" font-weight="900" fill="var(--navy)" text-anchor="middle">Q${i + 1}</text>`;
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
