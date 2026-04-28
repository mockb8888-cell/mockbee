/* ============================================
   MockBee PRO - Premium AI Interview Logic
   ============================================ */

/**
 * Logic using PRO_QUESTION_BANK (50+ questions per role)
 */

let currentQuestionIndex = 0;
let questions = [];
let roleName = "General Role";
let isInterviewComplete = false;
let interviewTranscript = [];

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
let targetTotalQuestions = 22;

// AI Feedback Data
const FEEDBACK_METADATA = {
    "Python": ["decorators", "gil", "memory", "generators", "multiprocessing", "oop"],
    "Frontend": ["virtual dom", "react", "css", "flexbox", "grid", "hooks", "performance", "rendering"],
    "Backend": ["restful", "rest", "sql", "nosql", "database", "indexing", "auth", "security", "microservices"],
    "ML": ["supervised", "unsupervised", "regression", "neural", "transformers", "training", "overfitting"],
    "Data Scientist": ["stats", "eda", "visualization", "pandas", "hypothesis", "analysis"],
    "Cloud": ["aws", "azure", "serverless", "infrastructure", "scaling", "redundancy"],
    "DevOps": ["pipeline", "cicd", "docker", "kubernetes", "monitoring", "automation"],
    "Cybersecurity": ["encryption", "vulnerability", "security", "owasp", "pen testing"],
    "Network": ["osi", "protocols", "tcp", "udp", "routing", "switching", "dns"],
    "System Architect": ["scalability", "architecture", "distributed", "load balancers", "multi-tenant"],
    "QA": ["manual", "automated", "testing", "regression", "smoke", "qa"],
    "Mobile": ["flutter", "react native", "android", "ios", "native", "cross-platform"],
    "Python Kids": ["variable", "loop", "toy box", "magic word", "if statement", "spaces"],
    "HTML Kids": ["tags", "skeleton", "headings", "images", "links", "teleport"],
    "CSS Kidz": ["colors", "painting", "padding", "hover", "border", "design"],
    "Communication": ["listening", "empathy", "speaking", "feedback", "presentation", "eye contact"]
};

const FEEDBACK_TEMPLATES = [
    "Excellent! Your focus on **{keyword}** shows you have practical experience in this area. ",
    "That's a solid point. Identifying **{keyword}** as a key factor is critical for a high-level **{role}**. ",
    "You've addressed the core of the problem by mentioning **{keyword}**. How do you handle the trade-offs there? ",
    "Impressive. Your understanding of **{keyword}** is exactly what we look for. "
];

const GENERIC_FEEDBACK = [
    "Interesting perspective. You've addressed the core of the problem well. ",
    "Good practical answer. That's a valid way to look at this technical challenge. ",
    "I appreciate how you explained that. It shows a good grasp of the role's requirements. "
];

const TOUGH_FEEDBACK = [
    "That answer is a bit too brief. In a real interview, you'd want to elaborate more on the technical side of things. ",
    "I'm not sensing much technical depth there. Could you try to include more specific details or examples? ",
    "That response seems a bit off-topic for this specific role. Let's try to focus on the technical requirements. ",
    "I need a bit more detail to assess your skills accurately. Focus on explaining the 'how' and 'why' in your next answer. "
];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get Role from URL
    const urlParams = new URLSearchParams(window.location.search);
    roleName = urlParams.get('role') || "System Architect";

    // Update Heading
    const roleTitleElem = document.getElementById('role-title');
    if (roleTitleElem) roleTitleElem.innerText = roleName;

    // Update UI Total
    const totalElem = document.getElementById('total-q');
    if (totalElem) totalElem.innerText = "~" + targetTotalQuestions;

    // 3. Setup UI
    const userInput = document.getElementById('user-input');
    const submitBtn = document.getElementById('submit-btn');

    // 4. Start Interview
    sendAIMessage(`Welcome to your **${roleName}** Pro Session. This is an in-depth structured mock interview. Let's begin.`);

    setTimeout(() => {
        triggerAI("Please begin the interview.");
    }, 2000);

    // 5. Handle Submit
    submitBtn.addEventListener('click', handleUserSubmit);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUserSubmit();
        }
    });

    const quitBtn = document.getElementById('quit-complete-btn');
    if (quitBtn) {
        quitBtn.addEventListener('click', completeInterviewEarly);
    }

    setupVoiceRecognition();
});

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

    if (userMessage === "Please begin the interview." && interviewTranscript.length === 0) {
        interviewTranscript.push({ role: "user", content: userMessage });
    }

    const currentPhase = PHASES[currentPhaseIndex] || "hr_logistics";

    fetch('https://mockbee.onrender.com/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            role: roleName,
            level: "Senior", // Pro level
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
        
        // Show Quit & Complete button after 5 questions
        if (questionCount >= 5) {
            const quitBtn = document.getElementById('quit-complete-btn');
            if (quitBtn) quitBtn.style.display = 'block';
        }

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

// (Removed static question tracking and dynamic feedback overrides to match phased model)

function sendAIMessage(text, isFeedback = false) {
    const chatBox = document.getElementById('chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.className = "message message--ai";
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    let contentHtml = `<div class="ai-bubble">`;
    if (isFeedback) {
        contentHtml += `<div class="feedback-box" style="padding: 15px; background: rgba(216, 196, 182, 0.1); border-left: 3px solid #D8C4B6; border-radius: 8px; margin-top: 5px;">
                            <i class="fas fa-certificate" style="color: #D8C4B6; margin-right: 8px;"></i>
                            <strong style="color: #1A1A1A; font-size: 0.85rem;">AI Feedback:</strong><br>
                            <span style="font-size: 0.9rem; line-height: 1.5; display: inline-block; margin-top: 5px;">${formattedText}</span>
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
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
}

function completeInterviewEarly() {
    if (isInterviewComplete) return;
    isInterviewComplete = true;
    updateProgress();
    
    // Hide the input area
    const inputArea = document.querySelector('.input-area');
    if (inputArea) {
        inputArea.style.opacity = "0";
        inputArea.style.pointerEvents = "none";
    }

    sendAIMessage("Interview concluded early by candidate. Your report is being generated based on the completed questions.", false);
    setTimeout(showResultsButton, 1000);
}

function showResultsButton() {
    const chatBox = document.getElementById('chat-box');
    const inputArea = document.querySelector('.input-area');

    if (inputArea) {
        inputArea.style.opacity = "0";
        inputArea.style.pointerEvents = "none";
    }

    const btnContainer = document.createElement('div');
    btnContainer.className = "results-btn-container";
    btnContainer.innerHTML = `
        <button class="btn-view-results" id="generate-report-btn">
            Generate Final Report &rarr;
        </button>
    `;
    chatBox.appendChild(btnContainer);
    scrollToBottom();

    // Attach click event to the button
    const generateBtn = document.getElementById('generate-report-btn');
    generateBtn.addEventListener('click', (e) => {
        e.preventDefault();

        // Save session data to localStorage
        const sessionData = {
            id: Date.now(),
            role: roleName,
            transcript: interviewTranscript,
            date: new Date().toLocaleDateString(),
            totalQuestions: questionCount,
            isPro: true
        };

        // 1. Save as the single recent interview (for immediate access)
        localStorage.setItem('recentInterview', JSON.stringify(sessionData));

        // 2. Add to History List
        let history = JSON.parse(localStorage.getItem('mockbee_interviews') || '[]');
        history.push(sessionData);
        localStorage.setItem('mockbee_interviews', JSON.stringify(history));

        // Redirect to performance page with direct view flag
        window.location.href = 'performance.html?view=report';
    });
}

function setupVoiceRecognition() {
    // Basic implementation for Pro users
    const micBtn = document.querySelector('.mic-btn');
    if (micBtn) {
        micBtn.addEventListener('click', () => alert("Voice transcription is active for this Pro Session. Speak clearly."));
    }
}
