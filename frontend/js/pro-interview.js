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

    // 2. Load Questions for Role from PRO_QUESTION_BANK
    // Find matching key
    const foundKey = Object.keys(PRO_QUESTION_BANK).find(key => roleName.toLowerCase().includes(key.toLowerCase()));
    let baseQuestions = foundKey ? PRO_QUESTION_BANK[foundKey] : PRO_QUESTION_BANK["Python Developer"];

    // USER OVERRIDE: Kids and Communication cards only get 8 questions in dashboard
    const limitedRoles = ["Python Kids Level", "HTML Kids Level", "CSS Kids Level", "Communication Cards"];
    if (limitedRoles.includes(roleName)) {
        questions = baseQuestions.slice(0, 8);
    } else {
        questions = baseQuestions;
    }

    // Update UI Total
    const totalElem = document.getElementById('total-q');
    if (totalElem) totalElem.innerText = questions.length;

    // 3. Setup UI
    const userInput = document.getElementById('user-input');
    const submitBtn = document.getElementById('submit-btn');

    // 4. Start Interview
    sendAIMessage(`Welcome to your **${roleName}** Pro Session. This is an in-depth assessment with over 50 scenarios. Let's begin.`);

    setTimeout(() => {
        askNextQuestion();
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

    if (questions[currentQuestionIndex]) {
        interviewTranscript.push({
            question: questions[currentQuestionIndex],
            answer: message
        });
    }

    // Provide typing indicator
    const chatBox = document.getElementById('chat-box');
    const tempDiv = document.createElement('div');
    tempDiv.className = "message message--ai";
    tempDiv.id = "typing-indicator";
    tempDiv.innerHTML = `<div class="ai-bubble"><i class="fas fa-spinner fa-spin"></i> AI is thinking...</div>`;
    chatBox.appendChild(tempDiv);
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });

    // Build history for backend API
    const history = [];
    interviewTranscript.forEach(t => {
        history.push({ role: "assistant", content: t.question });
        if (t.answer) history.push({ role: "user", content: t.answer });
    });

    fetch('http://127.0.0.1:8000/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            role: roleName,
            level: "Senior", // Pro level
            history: history
        })
    })
    .then(response => response.json())
    .then(data => {
        const ind = document.getElementById('typing-indicator');
        if (ind) ind.remove();

        currentQuestionIndex++;
        
        // Show Quit & Complete button after 10 questions
        if (currentQuestionIndex >= 10) {
            const quitBtn = document.getElementById('quit-complete-btn');
            if (quitBtn) quitBtn.style.display = 'block';
        }

        if (currentQuestionIndex < questions.length) {
            const feedback = data.reply || "Good point. Let's move on.";
            sendAIMessage(feedback, true);

            setTimeout(() => {
                updateProgress();
                askNextQuestion();
            }, 1800);
        } else {
            if (isInterviewComplete) return;
            isInterviewComplete = true;
            updateProgress();
            sendAIMessage(data.reply || "Masterful performance. You have completed the full assessment. Your report is now ready.", false);
            setTimeout(showResultsButton, 1000);
        }
    })
    .catch(err => {
        const ind = document.getElementById('typing-indicator');
        if (ind) ind.remove();
        console.error(err);
        sendAIMessage("Network error. Could not connect to AI backend.");
    });
}

function generateDynamicFeedback(answer, question) {
    const userAns = answer.toLowerCase();
    const currentRole = roleName || "Developer";
    const wordCount = answer.trim().split(/\s+/).length;

    let roleKeywords = [];
    for (const key in FEEDBACK_METADATA) {
        if (currentRole.toLowerCase().includes(key.toLowerCase())) {
            roleKeywords = FEEDBACK_METADATA[key];
            break;
        }
    }

    const matchedKeywords = roleKeywords.filter(kw => userAns.includes(kw.toLowerCase()));

    if (wordCount < 6 || (matchedKeywords.length === 0 && wordCount < 15)) {
        return TOUGH_FEEDBACK[Math.floor(Math.random() * TOUGH_FEEDBACK.length)];
    }

    if (matchedKeywords.length > 0) {
        const randomTemplate = FEEDBACK_TEMPLATES[Math.floor(Math.random() * FEEDBACK_TEMPLATES.length)];
        const featuredKeyword = matchedKeywords[0];
        return randomTemplate.replace("{keyword}", featuredKeyword).replace("{role}", currentRole);
    }

    return GENERIC_FEEDBACK[Math.floor(Math.random() * GENERIC_FEEDBACK.length)];
}

function askNextQuestion() {
    if (questions && currentQuestionIndex < questions.length) {
        const qText = `**Q${currentQuestionIndex + 1}:** ${questions[currentQuestionIndex]}`;
        sendAIMessage(qText);
    }
}

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
    if (!questions.length) return;
    const displayIndex = Math.min(currentQuestionIndex + 1, questions.length);
    currentQ.innerText = displayIndex;
    const percent = (displayIndex / questions.length) * 100;
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
            role: roleName,
            transcript: interviewTranscript,
            date: new Date().toLocaleDateString(),
            totalQuestions: questions.length,
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
