/* ============================================
   MockBee - AI Interview Logic (Phased)
   ============================================ */

let roleName = "General Role";
let isInterviewComplete = false;
let interviewTranscript = [];
let currentMode = "standard";

const PHASES = [
    "self_intro",
    "projects_skills",
    "technical",
    "optimization",
    "behavioural",
    "hr_logistics"
];
let currentPhaseIndex = 0;
let questionCount = 0;
let targetTotalQuestions = 22; // rough estimate

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get Role and Mode from URL
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || "standard";
    roleName = urlParams.get('role') || "System Architect";
    currentMode = mode;

    // Apply High Intensity Theme if applicable
    if (mode === '5-min' || mode === 'rapid') {
        const timerBox = document.getElementById('timer-box');
        if (timerBox) {
            timerBox.classList.remove('hidden');
            startCountdown(5 * 60); // 5 minutes in seconds
        }
    }

    // Update Heading based on Mode
    const roleTitleElem = document.getElementById('role-title');
    const modeBadgeElem = document.querySelector('.role-info span');

    if (mode === '5-min') {
        roleTitleElem.innerText = "5-Minute Drill";
        if (modeBadgeElem) modeBadgeElem.innerText = `${roleName} Session`;
    } else if (mode === '1-q') {
        roleTitleElem.innerText = "1-Question Deep Dive";
        if (modeBadgeElem) modeBadgeElem.innerText = `${roleName} Expert Task`;
    } else if (mode === 'rapid') {
        roleTitleElem.innerText = "Rapid Revision";
        if (modeBadgeElem) modeBadgeElem.innerText = `${roleName} Prep`;
    } else if (mode === 'warmup') {
        roleTitleElem.innerText = "Interview Warm-up";
        if (modeBadgeElem) modeBadgeElem.innerText = `${roleName} Mode`;
    } else {
        roleTitleElem.innerText = roleName;
        if (modeBadgeElem) modeBadgeElem.innerText = "AI Mock Interview";
    }

    if (currentMode === '1-q' && window.self !== window.top) {
        document.body.classList.add('mode-1-q-dashboard');
    }

    document.getElementById('total-q').innerText = "~" + targetTotalQuestions;

    const ROLE_ICON_MAPPING = {
        "Python": "fab fa-python",
        "Frontend": "fas fa-code",
        "Backend": "fas fa-server",
        "ML": "fas fa-brain",
        "Data Scientist": "fas fa-chart-pie",
        "Cloud": "fas fa-cloud",
        "DevOps": "fas fa-infinity",
        "Cybersecurity": "fas fa-user-shield",
        "Network": "fas fa-network-wired",
        "System Architect": "fas fa-sitemap",
        "QA": "fas fa-vial",
        "Mobile": "fas fa-mobile-screen-button",
    };

    const headerIcon = document.getElementById('header-role-icon');
    if (headerIcon) {
        let iconClass = "fas fa-globe"; // Default
        for (const [key, icon] of Object.entries(ROLE_ICON_MAPPING)) {
            if (roleName.toLowerCase().includes(key.toLowerCase())) {
                iconClass = icon;
                break;
            }
        }
        headerIcon.className = iconClass;
    }

    const userInput = document.getElementById('user-input');
    const submitBtn = document.getElementById('submit-btn');

    // Start Interview with an initial API trigger
    sendAIMessage(`Welcome to your **${roleName}** interview. I'm your AI interviewer for today. Let's begin.`);
    
    setTimeout(() => {
        triggerAI("Please begin the interview.");
    }, 1500);

    submitBtn.addEventListener('click', handleUserSubmit);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUserSubmit();
        }
    });

    setupVoiceRecognition();
});

function startCountdown(seconds) {
    const display = document.getElementById('timer-display');
    const timerBox = document.getElementById('timer-box');
    let timeLeft = seconds;

    const timerInterval = setInterval(() => {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        if (display) display.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        if (timeLeft <= 60) {
            if (timerBox) timerBox.classList.add('warning');
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeUp();
        }
        timeLeft--;
    }, 1000);
}

function handleTimeUp() {
    if (isInterviewComplete) return;
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Time is up!',
            text: "Let's wrap up this drill session.",
            icon: 'info',
            confirmButtonColor: '#1a1a1a',
            confirmButtonText: 'Got it',
            background: '#ffffff',
            color: '#1a1a1a',
            backdrop: `rgba(0,0,0,0.4)`
        });
    } else {
        alert("Time is up! Let's wrap up this drill.");
    }
    isInterviewComplete = true;
    showResultsButton();
}

function setupVoiceRecognition() {
    const micBtn = document.querySelector('.mic-btn');
    const userInput = document.getElementById('user-input');
    const inputContainer = document.querySelector('.input-container');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        if (micBtn) micBtn.style.display = 'none';
        return;
    }

    let indicator = document.querySelector('.recording-indicator');
    if (!indicator && inputContainer) {
        indicator = document.createElement('div');
        indicator.className = 'recording-indicator';
        indicator.innerHTML = '<i class="fas fa-circle"></i> Live Recording...';
        inputContainer.style.position = 'relative';
        inputContainer.appendChild(indicator);
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let isListening = false;
    let finalTranscript = '';

    micBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (isListening) {
            isListening = false;
            recognition.stop();
        } else {
            isListening = true;
            finalTranscript = userInput.value ? userInput.value + ' ' : '';
            recognition.start();
        }
    });

    recognition.onstart = () => {
        micBtn.classList.add('active');
        if (indicator) indicator.classList.add('active');
        userInput.placeholder = "Listening... Speak naturally.";
    };

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');

        userInput.value = transcript;
        userInput.scrollLeft = userInput.scrollWidth;
        userInput.dispatchEvent(new Event('input', { bubbles: true }));
    };

    recognition.onend = () => {
        if (isListening) {
            recognition.start();
        } else {
            micBtn.classList.remove('active');
            if (indicator) indicator.classList.remove('active');
            userInput.placeholder = "Type your answer here...";
        }
    };

    recognition.onerror = (event) => {
        if (event.error === 'no-speech') return;
        console.error("Speech Recognition Error:", event.error);
        isListening = false;
        recognition.stop();
    };
}

function handleUserSubmit() {
    if (isInterviewComplete) return;

    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();

    if (message === "") return;

    userInput.value = "";
    addUserMessage(message);

    interviewTranscript.push({
        role: "user",
        content: message
    });

    triggerAI(message);
}

function triggerAI(userMessage) {
    const chatBox = document.getElementById('chat-box');
    const tempDiv = document.createElement('div');
    tempDiv.className = "message message--ai";
    tempDiv.id = "typing-indicator";
    tempDiv.innerHTML = `<div class="ai-bubble"><i class="fas fa-spinner fa-spin"></i> AI is thinking...</div>`;
    chatBox.appendChild(tempDiv);
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });

    // Ensure first message for API isn't shown to user unless they typed it
    if (userMessage === "Please begin the interview." && interviewTranscript.length === 0) {
        interviewTranscript.push({ role: "user", content: userMessage });
    }

    const currentPhase = PHASES[currentPhaseIndex] || "hr_logistics";

    fetch('https://mockbee.onrender.com/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            role: roleName,
            level: "Mid-level",
            history: interviewTranscript,
            phase: currentPhase
        })
    })
    .then(response => response.json())
    .then(data => {
        const ind = document.getElementById('typing-indicator');
        if (ind) ind.remove();

        let aiReply = data.reply || "Could you elaborate on that?";
        
        let phaseAdvance = false;
        if (aiReply.includes("[PHASE_COMPLETE]")) {
            aiReply = aiReply.replace("[PHASE_COMPLETE]", "").trim();
            phaseAdvance = true;
        }

        let isDone = false;
        if (aiReply.includes("[INTERVIEW_COMPLETE]")) {
            aiReply = aiReply.replace("[INTERVIEW_COMPLETE]", "").trim();
            isDone = true;
        }

        interviewTranscript.push({ role: "assistant", content: aiReply });
        sendAIMessage(aiReply);
        
        questionCount++;
        updateProgress();

        if (phaseAdvance) {
            currentPhaseIndex++;
        }

        if (isDone || currentPhaseIndex >= PHASES.length) {
            isInterviewComplete = true;
            setTimeout(showResultsButton, 1500);
        }
    })
    .catch(err => {
        const ind = document.getElementById('typing-indicator');
        if (ind) ind.remove();
        console.error(err);
        sendAIMessage("Network error. Could not connect to AI backend.");
    });
}

function sendAIMessage(text, isFeedback = false) {
    const chatBox = document.getElementById('chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.className = "message message--ai";

    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    let contentHtml = `<div class="ai-bubble">`;

    if (isFeedback) {
        contentHtml += `<div class="feedback-box">
                            <i class="fas fa-certificate icon"></i>
                            <strong>AI Feedback:</strong><br>
                            ${formattedText}
                        </div>`;
    } else {
        contentHtml += formattedText;
    }

    contentHtml += `</div>`;
    messageDiv.innerHTML = contentHtml;

    chatBox.appendChild(messageDiv);
    scrollToBottom();
}

function addUserMessage(text) {
    const chatBox = document.getElementById('chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.className = "message message--user";
    messageDiv.innerHTML = `
        <div class="user-icon-wrap"><i class="fas fa-user"></i></div>
        <div class="user-bubble">${text}</div>
    `;
    chatBox.appendChild(messageDiv);
    scrollToBottom();
}

function updateProgress() {
    const currentQ = document.getElementById('current-q');
    const fill = document.querySelector('.progress-bar-fill');

    currentQ.innerText = questionCount;
    const percent = Math.min((questionCount / targetTotalQuestions) * 100, 100);
    fill.style.width = percent + "%";
}

function scrollToBottom() {
    const chatBox = document.getElementById('chat-box');
    chatBox.scrollTo({
        top: chatBox.scrollHeight,
        behavior: 'smooth'
    });
}

function showResultsButton() {
    const chatBox = document.getElementById('chat-box');
    const inputArea = document.querySelector('.input-area');

    if (inputArea) {
        inputArea.style.opacity = "0";
        inputArea.style.pointerEvents = "none";
        inputArea.style.display = "none";
    }

    const btnContainer = document.createElement('div');
    btnContainer.className = "results-btn-container";
    btnContainer.innerHTML = `
        <button class="btn-view-results" id="generate-report-btn">
            Generate Performance Report &rarr;
        </button>
        <div class="session-complete-msg">
            <i class="fas fa-check-circle"></i> Interview Assessment Complete
        </div>
    `;

    chatBox.appendChild(btnContainer);
    scrollToBottom();

    if (typeof showDemoModal === 'function' && currentMode !== '1-q' && currentMode !== '5-min' && currentMode !== 'rapid' && currentMode !== 'warmup') {
        setTimeout(showDemoModal, 800);
    }

    const generateBtn = document.getElementById('generate-report-btn');
    generateBtn.addEventListener('click', (e) => {
        e.preventDefault();

        const sessionData = {
            id: Date.now(),
            role: roleName,
            transcript: interviewTranscript,
            date: new Date().toLocaleDateString(),
            totalQuestions: questionCount,
            mode: currentMode,
            isQuick: true
        };

        localStorage.setItem('recentInterview', JSON.stringify(sessionData));

        let history = JSON.parse(localStorage.getItem('mockbee_interviews') || '[]');
        history.push(sessionData);
        localStorage.setItem('mockbee_interviews', JSON.stringify(history));

        window.location.href = 'performance.html';
    });
}
