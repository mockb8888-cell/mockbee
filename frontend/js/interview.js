/* ============================================
   MockBee - AI Interview Logic
   ============================================ */

/**
 * High-quality interview question bank for all IT roles.
 * Each role has 8 curated technical and behavioral questions.
 */
const QUESTION_BANK = {
    "Python Developer": [
        "What are the main differences between Python 2 and Python 3?",
        "Explain the Global Interpreter Lock (GIL). Why is it controversial?",
        "What are Python decorators? Can you give an example of a practical use case?",
        "How does memory management work in Python? Mention the role of the Garbage Collector.",
        "What are generators and iterators in Python? Why would you use them over a standard list?",
        "Explain the difference between a shallow copy and a deep copy using the 'copy' module.",
        "How does Python's 'multiprocessing' module differ from the 'threading' module?",
        "What is the 'self' keyword and how is it used in object-oriented Python?"
    ],
    "Frontend Developer": [
        "Explain the Virtual DOM and how React uses it to improve performance.",
        "What is the difference between client-side rendering (CSR) and server-side rendering (SSR)?",
        "Describe the CSS Box Model and how 'box-sizing: border-box' works.",
        "How do you optimize a web application to achieve a high score in Core Web Vitals (LCP, FID, CLS)?",
        "What is the difference between 'localStorage', 'sessionStorage', and 'cookies'?",
        "Explain the concept of 'hoisting' in JavaScript and how it affects variable declarations.",
        "How does Flexbox differ from CSS Grid, and when would you use one over the other?",
        "What are Web Components, and how do they help in building reusable UI elements?"
    ],
    "Backend Developer": [
        "What is a RESTful API? Describe the core principles and common HTTP methods.",
        "Explain the difference between SQL and NoSQL databases. When would you prefer NoSQL?",
        "How do you handle authentication and authorization in a backend system? Talk about JWTs.",
        "What is database indexing, and how does it improve query performance?",
        "Describe the concept of 'Dependency Injection' and its benefits in backend development.",
        "How do you handle concurrent requests in a Node.js environment compared to a threaded environment like Java?",
        "Explain the difference between horizontal and vertical scaling for a database server.",
        "What are Microservices? What are the primary challenges in managing distributed systems?"
    ],
    "ML Engineer": [
        "Explain the difference between supervised, unsupervised, and reinforcement learning.",
        "What is the 'bias-variance tradeoff' and how do you achieve the right balance?",
        "Describe the concept of 'Regularization' (L1 and L2) and how it prevents overfitting.",
        "How do you handle imbalanced datasets when training a classification model?",
        "Explain the difference between Bagging and Boosting in ensemble learning.",
        "What is a Convolutional Neural Network (CNN)? Describe its primary layers and functions.",
        "How do Transformers and Attention mechanisms improve on traditional RNNs for NLP tasks?",
        "What metrics would you use to evaluate a recommendation engine's performance?"
    ],
    "Data Scientist": [
        "What is the difference between R-squared and Adjusted R-squared?",
        "Explain the Central Limit Theorem and why it is important for statistical analysis.",
        "How do you handle missing values in a dataset before performing analysis?",
        "What is 'p-value' in the context of hypothesis testing?",
        "Describe the steps involved in performing Exploratory Data Analysis (EDA).",
        "What is Karush-Kuhn-Tucker (KKT) condition? How is it used in optimization?",
        "Explain the difference between a Type I error and a Type II error.",
        "How would you design an A/B test for a new feature on a high-traffic website?"
    ],
    "Cloud Engineer": [
        "What is the difference between IaaS, PaaS, and SaaS?",
        "Explain the concept of 'Serverless' computing. What are its pros and cons?",
        "How do you design for 'High Availability' (HA) and 'Disaster Recovery' (DR) in AWS or Azure?",
        "What is Infrastructure as Code (IaC)? Describe tools like Terraform or CloudFormation.",
        "How do Cloud Availability Zones differ from Regions?",
        "Explain 'Auto-scaling' and 'Load Balancing' in a cloud environment.",
        "What are the best practices for securing data at rest and data in transit in the cloud?",
        "Describe the concept of 'Container Orchestration' with Kubernetes on a cloud provider."
    ],
    "DevOps Engineer": [
        "Describe a standard CI/CD pipeline and the tools you would use at each stage.",
        "What is the difference between 'Continuous Delivery' and 'Continuous Deployment'?",
        "Explain the concept of 'Infrastructure as Code' and why it's critical for DevOps.",
        "How do you manage secrets and configuration in a production Kubernetes environment?",
        "What is 'Blue-Green Deployment' and how does it reduce downtime?",
        "Describe the difference between 'Monitoring' and 'Observability'.",
        "How do you handle rollback strategies when a production deployment fails?",
        "What is 'GitOps' and how does it improve the developer experience?"
    ],
    "Cybersecurity Analyst": [
        "What is the difference between Symmetric and Asymmetric encryption?",
        "Explain the 'OWASP Top 10' and describe one of the vulnerabilities in detail.",
        "What is a 'Zero Trust' security model and why is it becoming standard?",
        "Describe the difference between an IDS and an IPS.",
        "How would you perform an incident response after a suspected data breach?",
        "What is 'Social Engineering'? Give an example of a common attack vector.",
        "Explain the 'CIA Triad' (Confidentiality, Integrity, Availability).",
        "What is a 'Penetration Test' compared to a 'Vulnerability Assessment'?"
    ],
    "Network Engineer": [
        "Explain the OSI Model and the function of each layer.",
        "What is the difference between TCP and UDP? When would you use UDP?",
        "Describe how BGP (Border Gateway Protocol) works for internet routing.",
        "What is a 'Subnet Mask' and how do you calculate a CIDR range?",
        "Explain the difference between a Hub, a Switch, and a Router.",
        "What is 'VLAN' (Virtual Local Area Network) and how does it improve network security?",
        "Describe the process of a DNS lookup from the client perspective.",
        "What is 'SD-WAN' and how does it differ from traditional WAN architectures?"
    ],
    "System Architect": [
        "How would you design a scalable notification system for millions of users?",
        "What are the trade-offs between consistency and availability in a distributed system (CAP Theorem)?",
        "Explain the concept of Load Balancing and different algorithms like Round Robin or Least Connections.",
        "How do you approach Disaster Recovery and High Availability in a cloud-native architecture?",
        "Describe a situation where you had to choose between a SQL and NoSQL database.",
        "How do you handle data partitioning or sharding in a large-scale database?",
        "What are Microservices, and what are the main challenges in managing them?",
        "How would you implement a secure authentication system for a multi-tenant application?"
    ],
    "QA Engineer": [
        "What is the difference between manual testing and automated testing?",
        "Explain the concept of 'Test-Driven Development' (TDD).",
        "What is 'Regression Testing' and when should it be performed?",
        "Describe the difference between 'Black Box', 'White Box', and 'Gray Box' testing.",
        "What are the levels of testing? (Unit, Integration, System, Acceptance).",
        "How do you prioritize test cases when you have limited time before a release?",
        "What is 'Smoke Testing' and how does it differ from 'Sanity Testing'?",
        "Explain 'Equivalence Partitioning' and 'Boundary Value Analysis' with an example."
    ],
    "Mobile Developer": [
        "Explain the difference between 'Native', 'Cross-Platform', and 'Hybrid' mobile apps.",
        "How does the React Native bridge work compared to Flutter's rendering engine?",
        "Describe the mobile app lifecycle (e.g., in Android or iOS).",
        "How do you handle local data persistence in a mobile application?",
        "What are the best practices for optimizing mobile app performance and battery life?",
        "Explain the difference between 'PUSH' and 'PULL' notifications on mobile devices.",
        "How do you ensure a mobile app is accessible to users with visual or motor impairments?",
        "What is 'Dependency Injection' in the context of mobile development (e.g., Dagger, Hilt, Koin)?"
    ],
    "Python Kids Level": [
        "What is a 'Variable'? Can you explain it using a toy box analogy?",
        "If I want my computer to say 'Hello' on the screen, which magic word do I use in Python?",
        "What is a 'Loop'? How would you use a loop to draw 100 circles?",
        "How do we tell Python to make a decision? Talk about the 'if' statement.",
        "What is a 'List'? Imagine you're making a shopping list for a robot.",
        "Why do we need to use 'Spaces' or 'Tabs' when writing Python code?",
        "Can you explain what an 'Input' is? How do we get the user to talk back to our program?",
        "What is a 'Function'? Think of it like a recipe for a cake."
    ],
    "HTML Kids Level": [
        "What does 'HTML' stand for? Think of it as the skeleton of a webpage.",
        "What are 'Tags'? Why do we use brackets like < and >?",
        "How do I make a big, bold title on my website? Talk about the H1 tag.",
        "How do I show a picture of a cute cat on my page? Which tag do I use?",
        "What is a 'Hyperlink'? How does it teleport us to another website?",
        "Why do some tags need an 'Opening' and a 'Closing' slash?",
        "How do I make a list of my favorite foods using code?",
        "What is the 'Body' tag? What kind of things go inside it?"
    ],
    "CSS Kidz Level": [
        "What is 'CSS'? If HTML is the skeleton, is CSS the clothes?",
        "How do I change the color of my text to 'Sparkly Blue'?",
        "What is 'Font-Size'? How do I make my letters giant or tiny?",
        "Explain 'Padding'. How do we give our buttons some room to breathe?",
        "What happens when we use ':hover'? How do we make things change when we touch them?",
        "How do I center my pictures in the middle of the screen?",
        "What are 'Classes' and 'IDs'? How do we give our elements nicknames?",
        "How do I add a 'Border' or a frame around my favorite images?"
    ],
    "Communication Cards": [
        "What is 'Active Listening'? How do you show someone you're truly hearing them?",
        "Why is 'Eye Contact' important during a professional conversation?",
        "How do you handle a situation where someone disagrees with your idea?",
        "What does it mean to be 'Concise' when explaining a complex technical problem?",
        "How do you prepare for an important presentation or meeting?",
        "Describe a time you had to give difficult feedback to a teammate.",
        "Why is 'Empathy' a critical skill for a software developer or team lead?",
        "How do you adapt your communication style when talking to a non-technical manager?"
    ]
};

// Default generic questions if a role is not strictly matched
const DEFAULT_QUESTIONS = [
    "Tell me about your experience and why you're a good fit for this role.",
    "What are your greatest professional strengths?",
    "Describe a time you encountered a difficult problem and how you solved it.",
    "What is your preferred development environment and workflow?",
    "How do you stay up-to-date with the latest industry trends and technologies?",
    "Describe a project you worked on as part of a team. What was your role?",
    "What do you consider your biggest professional achievement so far?",
    "Why are you interested in working with MockBee specifically?"
];

/**
 * AI Feedback Keywords & Dynamic Responses (Prototype)
 */
const FEEDBACK_METADATA = {
    "Python": ["decorators", "gil", "memory", "generators", "multiprocessing", "oop"],
    "Frontend": ["virtual dom", "react", "css", "flexbox", "grid", "hooks", "performance", "rendering"],
    "Backend": ["restful", "rest", "sql", "nosql", "database", "indexing", "auth", "security", "microservices"],
    "ML": ["supervised", "unsupervised", "regression", "neural", "transformers", "training", "overfitting"],
    "Data Scientist": ["stats", "eda", "visualization", "pandas", "hypothesis", "analysis"],
    "Cloud": ["aws", "azure", "serverless", "infrastructure", "scaling", "redundancy"],
    "DevOps": ["pipeline", "cicd", "docker", "kubernetes", "monitoring", "automation"],
    "Cybersecurity": ["encryption", "vulnerability", "security", "owasp", "pen testing", " CIA triad"],
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

let currentQuestionIndex = 0;
let questions = [];
let roleName = "General Role";
let isInterviewComplete = false;
let interviewTranscript = [];
let currentMode = "standard";

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get Role and Mode from URL
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || "standard";
    roleName = urlParams.get('role');

    // If it's a Quick Practice mode and no specific role is provided, pick a random one from the question bank
    if (!roleName && (mode === '1-q' || mode === '5-min' || mode === 'rapid' || mode === 'warmup')) {
        const technicalRoles = Object.keys(QUESTION_BANK);
        roleName = technicalRoles[Math.floor(Math.random() * technicalRoles.length)];
    } else {
        roleName = roleName || "System Architect"; // Fallback
    }

    // Apply High Intensity Theme if applicable
    if (mode === '5-min' || mode === 'rapid') {
        // Show and Start Timer
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

    currentMode = mode;

    // Apply specific class for dashboard 1-q mode styling
    if (currentMode === '1-q' && window.self !== window.top) {
        document.body.classList.add('mode-1-q-dashboard');
    }

    // 2. Load Questions for Role
    const foundKey = Object.keys(QUESTION_BANK).find(key => roleName.toLowerCase().includes(key.toLowerCase()));
    let baseQuestions = foundKey ? QUESTION_BANK[foundKey] : DEFAULT_QUESTIONS;

    // 2.1 Handle Quick Practice Modes
    switch (mode) {
        case '1-q':
            questions = baseQuestions.slice(0, 1);
            break;
        case '5-min':
            questions = baseQuestions.slice(0, 5);
            break;
        case 'rapid':
            questions = baseQuestions.slice(0, 5); // Rapid usually means focused/shorter
            break;
        case 'warmup':
            questions = baseQuestions.slice(0, 3);
            break;
        default:
            questions = baseQuestions; // Standard 8 questions
    }

    document.getElementById('total-q').innerText = questions.length;

    // 2.5 Update Role Icon based on Topic
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
        "Python Kids": "fas fa-child",
        "HTML Kids": "fas fa-code",
        "CSS Kidz": "fas fa-palette",
        "Communication": "fas fa-comments"
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

    // 3. Setup UI
    const userInput = document.getElementById('user-input');
    const submitBtn = document.getElementById('submit-btn');

    // 4. Start Interview with a welcoming tone
    sendAIMessage(`Welcome to your **${roleName}** interview. I'm your AI interviewer for today, here to assess your technical depth. Let's begin the session.`);

    setTimeout(() => {
        askNextQuestion();
    }, 2500);

    // 5. Handle Submit & Voice
    submitBtn.addEventListener('click', handleUserSubmit);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUserSubmit();
        }
    });

    setupVoiceRecognition();
});

/**
 * Countdown Timer Logic
 */
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

    // Create indicator if not exists
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
        // High-compatibility results mapping
        const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');

        userInput.value = transcript;

        // Ensure input box stays focused and scrolls with text
        userInput.scrollLeft = userInput.scrollWidth;
        userInput.dispatchEvent(new Event('input', { bubbles: true }));
    };

    recognition.onend = () => {
        if (isListening) {
            recognition.start(); // Auto-restart if we're still in listening mode
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

    // Clear input
    userInput.value = "";

    // Add user message to chat
    // Add user message to chat
    addUserMessage(message);

    // Save Q&A to transcript
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
            level: "Mid-level",
            history: history
        })
    })
    .then(response => response.json())
    .then(data => {
        const ind = document.getElementById('typing-indicator');
        if (ind) ind.remove();

        currentQuestionIndex++;

        if (currentQuestionIndex < questions.length) {
            const feedback = data.reply || "Good answer.";
            sendAIMessage(feedback, true);

            setTimeout(() => {
                askNextQuestion();
                updateProgress();
            }, 1800);
        } else {
            if (isInterviewComplete) return;
            isInterviewComplete = true;

            updateProgress();
            sendAIMessage(data.reply || "Excellent work! That concludes the technical portion of your interview.", false, true);
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

function askNextQuestion() {
    if (questions && currentQuestionIndex < questions.length) {
        const qText = `**Q${currentQuestionIndex + 1}:** ${questions[currentQuestionIndex]}`;
        sendAIMessage(qText);
    }
}

/**
 * Sends a message from the AI to the chat box.
 * Supports Markdown for bolding.
 */
function sendAIMessage(text, isFeedback = false) {
    const chatBox = document.getElementById('chat-box');

    const messageDiv = document.createElement('div');
    messageDiv.className = "message message--ai";

    // Parse simple markdown (bold)
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

    if (!questions.length) return;
    const displayIndex = Math.min(currentQuestionIndex + 1, questions.length);
    currentQ.innerText = displayIndex;

    const percent = (displayIndex / questions.length) * 100;
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
        inputArea.style.display = "none"; // Hard hide to prevent any interaction
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

    // Trigger the Demo Over Modal
    if (typeof showDemoModal === 'function' && currentMode !== '1-q' && currentMode !== '5-min' && currentMode !== 'rapid' && currentMode !== 'warmup') {
        setTimeout(showDemoModal, 800);
    }

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
            totalQuestions: questions.length,
            mode: currentMode,
            isQuick: true
        };

        // 1. Save as the single recent interview (for immediate access)
        localStorage.setItem('recentInterview', JSON.stringify(sessionData));

        // 2. Add to History List
        let history = JSON.parse(localStorage.getItem('mockbee_interviews') || '[]');
        history.push(sessionData);
        localStorage.setItem('mockbee_interviews', JSON.stringify(history));

        // Redirect to performance page
        window.location.href = 'performance.html';
    });
}

/**
 * Generates dynamic feedback based on user answers and role keywords.
 */
function generateDynamicFeedback(answer, question) {
    const userAns = answer.toLowerCase();
    const currentRole = roleName || "Developer";
    const wordCount = answer.trim().split(/\s+/).length;

    // Find matching keywords for the current role
    let roleKeywords = [];
    for (const key in FEEDBACK_METADATA) {
        if (currentRole.toLowerCase().includes(key.toLowerCase())) {
            roleKeywords = FEEDBACK_METADATA[key];
            break;
        }
    }

    // Check if any role keywords are in the user's answer
    const matchedKeywords = roleKeywords.filter(kw => userAns.includes(kw.toLowerCase()));

    // 1. Tough Feedback: Very Short or No Keywords
    if (wordCount < 6 || (matchedKeywords.length === 0 && wordCount < 15)) {
        return TOUGH_FEEDBACK[Math.floor(Math.random() * TOUGH_FEEDBACK.length)];
    }

    // 2. Good Feedback: Specific Keywords
    if (matchedKeywords.length > 0) {
        const randomTemplate = FEEDBACK_TEMPLATES[Math.floor(Math.random() * FEEDBACK_TEMPLATES.length)];
        const featuredKeyword = matchedKeywords[0];

        return randomTemplate
            .replace("{keyword}", featuredKeyword)
            .replace("{role}", currentRole);
    }

    // 3. Fallback: Generic but slightly randomized
    return GENERIC_FEEDBACK[Math.floor(Math.random() * GENERIC_FEEDBACK.length)];
}
