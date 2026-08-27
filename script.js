const STAGE_LABELS = ["Understand", "Explore", "Reason", "Refine", "Insight"];

const ICONS = {
    question: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
    bulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
    ai: "✦",
    student: "You"
};

/* =========================
   STATE
========================= */

let history = [];
let stage = 0;
let sessionActive = false;
let userScrolledUp = false;

/* =========================
   DOM ELEMENTS
========================= */

const problemInput = document.getElementById("problem");
const responseInput = document.getElementById("studentResponse");
const problemCount = document.getElementById("problemCount");
const responseCount = document.getElementById("responseCount");

const chatScroll = document.getElementById("chatScroll");
const messagesEl = document.getElementById("messages");
const starter = document.getElementById("starter");

const composer = document.getElementById("composer");
const sendButton = document.getElementById("sendButton");
const stuckButton = document.getElementById("stuckButton");
const answerButton = document.getElementById("answerButton");
const startButton = document.getElementById("startButton");
const newProblemButton = document.getElementById("newProblemButton");
const newMessagePill = document.getElementById("newMessagePill");

/* =========================
   CHARACTER COUNTERS + AUTOGROW
========================= */

problemInput.addEventListener("input", () => {
    problemCount.innerText = `${problemInput.value.length} characters`;
});

responseInput.addEventListener("input", () => {
    responseCount.innerText = `${responseInput.value.length} characters`;
    responseInput.style.height = "auto";
    responseInput.style.height = Math.min(responseInput.scrollHeight, 160) + "px";
});

responseInput.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        submitAnswer();
    }
});

/* =========================
   SCROLL HANDLING
========================= */

chatScroll.addEventListener("scroll", () => {
    const distanceFromBottom =
        chatScroll.scrollHeight - chatScroll.scrollTop - chatScroll.clientHeight;

    userScrolledUp = distanceFromBottom > 120;

    if (!userScrolledUp) {
        newMessagePill.hidden = true;
    }
});

function scrollChatToBottom(force = false) {
    if (userScrolledUp && !force) {
        newMessagePill.hidden = false;
        return;
    }

    newMessagePill.hidden = true;
    userScrolledUp = false;

    requestAnimationFrame(() => {
        chatScroll.scrollTo({ top: chatScroll.scrollHeight, behavior: "smooth" });
    });
}

/* =========================
   THEME
========================= */

function toggleTheme() {
    const root = document.documentElement;
    const stored = root.getAttribute("data-theme");
    const systemPrefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const current = stored || (systemPrefersLight ? "light" : "dark");
    const next = current === "light" ? "dark" : "light";

    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
}

/* =========================
   STAGE LOGIC
========================= */

function updateStage(newStage) {
    stage = Math.max(0, Math.min(newStage, STAGE_LABELS.length - 1));
    renderStage();
}

function advanceStage() {
    updateStage(stage + 1);
}

function renderStage() {
    document.querySelectorAll(".stage-item").forEach((el) => {
        const i = Number(el.dataset.stage);
        el.classList.toggle("active", i === stage);
        el.classList.toggle("done", i < stage);
    });
}

/* =========================
   SECURITY
========================= */

function escapeHtml(text) {
    const div = document.createElement("div");
    div.innerText = String(text ?? "");
    return div.innerHTML;
}

/* =========================
   MESSAGE RENDERERS
========================= */

function ensureStarterHidden() {
    if (!starter.hidden) {
        starter.hidden = true;
    }
}

function appendEl(el) {
    messagesEl.appendChild(el);
    scrollChatToBottom();
    return el;
}

function renderUserMessage(text) {
    ensureStarterHidden();

    const el = document.createElement("div");
    el.className = "msg student";
    el.innerHTML = `
        <div class="msg-avatar">${ICONS.student}</div>
        <div class="msg-body">
            <span class="msg-label">You</span>
            <div class="msg-bubble">${escapeHtml(text)}</div>
        </div>
    `;
    return appendEl(el);
}

function renderProblemMessage(text) {
    ensureStarterHidden();

    const el = document.createElement("div");
    el.className = "msg problem";
    el.innerHTML = `
        <div class="msg-avatar">📘</div>
        <div class="msg-body">
            <span class="msg-label">Your problem</span>
            <div class="msg-bubble">${escapeHtml(text)}</div>
        </div>
    `;
    return appendEl(el);
}

function renderAIMessage(text) {
    ensureStarterHidden();

    const el = document.createElement("div");
    el.className = "msg ai";
    el.innerHTML = `
        <div class="msg-avatar">${ICONS.ai}</div>
        <div class="msg-body">
            <span class="msg-label">Socratic AI</span>
            <div class="msg-bubble">${escapeHtml(text)}</div>
        </div>
    `;
    return appendEl(el);
}

function renderSocraticQuestion(text) {
    ensureStarterHidden();

    const el = document.createElement("div");
    el.className = "msg ai";
    el.innerHTML = `
        <div class="msg-avatar">${ICONS.ai}</div>
        <div class="msg-body">
            <span class="msg-label">Socratic AI</span>
            <div class="socratic-card">
                <div class="socratic-eyebrow">${ICONS.question} SOCRATIC QUESTION</div>
                <div class="socratic-question-text">${escapeHtml(text)}</div>
                <div class="socratic-subtext">Think before you answer.</div>
            </div>
        </div>
    `;
    return appendEl(el);
}

function renderHintCard(text) {
    ensureStarterHidden();

    const el = document.createElement("div");
    el.className = "msg ai";
    el.innerHTML = `
        <div class="msg-avatar">${ICONS.ai}</div>
        <div class="msg-body">
            <span class="msg-label">Socratic AI</span>
            <div class="hint-card">
                <div class="hint-eyebrow">${ICONS.bulb} HINT</div>
                <div class="hint-text">${escapeHtml(text)}</div>
            </div>
        </div>
    `;
    return appendEl(el);
}

function renderAnswerCard(text) {
    ensureStarterHidden();

    const el = document.createElement("div");
    el.className = "msg ai";
    el.innerHTML = `
        <div class="msg-avatar">${ICONS.ai}</div>
        <div class="msg-body" style="max-width: 100%;">
            <span class="msg-label">Socratic AI</span>
            <div class="answer-card">
                <div class="answer-header">
                    <span class="answer-icon">${ICONS.check}</span>
                    <span class="answer-title">ANSWER REVEALED</span>
                </div>
                <div class="answer-text">${escapeHtml(text)}</div>
            </div>
        </div>
    `;
    return appendEl(el);
}

function renderSuccessCard(text) {
    ensureStarterHidden();

    const el = document.createElement("div");
    el.className = "success-card";
    el.innerHTML = `
        <div class="success-icon">✓</div>
        <div class="success-title">EXCELLENT WORK!</div>
        <div class="success-message">${escapeHtml(text)}</div>
        <div class="success-subtitle">🎉 You solved this through your own reasoning.</div>
    `;
    messagesEl.appendChild(el);
    celebrate();
    scrollChatToBottom(true);
    return el;
}

function renderNewProblemCTA() {
    const el = document.createElement("div");
    el.className = "next-problem-cta";
    el.innerHTML = `
        <p>Ready for another challenge?</p>
        <button class="primary-button" onclick="resetSession()">
            <span>Start a New Problem</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
            </svg>
        </button>
    `;
    return appendEl(el);
}

function renderErrorMessage(text) {
    ensureStarterHidden();

    const el = document.createElement("div");
    el.className = "msg error";
    el.innerHTML = `
        <div class="msg-avatar">!</div>
        <div class="msg-body">
            <span class="msg-label">Socratic AI</span>
            <div class="msg-bubble">${escapeHtml(text)}</div>
        </div>
    `;
    return appendEl(el);
}

function showTypingIndicator(label) {
    ensureStarterHidden();

    const el = document.createElement("div");
    el.className = "msg ai typing";
    el.innerHTML = `
        <div class="msg-avatar">${ICONS.ai}</div>
        <div class="msg-body">
            <span class="msg-label">Socratic AI</span>
            <div class="thinking-row">
                <span class="thinking-dots"><span></span><span></span><span></span></span>
                <span class="thinking-label">${escapeHtml(label)}</span>
            </div>
        </div>
    `;
    return appendEl(el);
}

function hideTypingIndicator(node) {
    if (node) node.remove();
}

/* =========================
   CELEBRATION: confetti + sparkles + chime
========================= */

function celebrate() {
    launchConfetti();
    launchSparkles();
    playChime();
}

function launchConfetti() {
    const container = document.createElement("div");
    container.className = "confetti-container";

    const colors = ["#34d399", "#22d3ee", "#8b5cf6", "#facc15", "#6366f1", "#f472b6"];
    const pieces = 90;

    for (let i = 0; i < pieces; i++) {
        const piece = document.createElement("div");
        piece.className = "confetti";

        const fromLeft = i % 2 === 0;
        piece.style.left = fromLeft
            ? `${Math.random() * 25}%`
            : `${75 + Math.random() * 25}%`;

        piece.style.animationDelay = `${Math.random() * 0.7}s`;
        piece.style.transform = `rotate(${Math.random() * 360}deg)`;

        const size = 6 + Math.random() * 8;
        piece.style.width = `${size}px`;
        piece.style.height = `${size * 1.6}px`;
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];

        container.appendChild(piece);
    }

    document.body.appendChild(container);
    setTimeout(() => container.remove(), 4200);
}

function launchSparkles() {
    const container = document.createElement("div");
    container.className = "sparkle-container";

    const count = 22;

    for (let i = 0; i < count; i++) {
        const spark = document.createElement("span");
        spark.className = "sparkle";
        spark.textContent = "✦";

        const angle = (360 / count) * i + (Math.random() * 20 - 10);
        const distance = 90 + Math.random() * 140;
        const dx = Math.cos((angle * Math.PI) / 180) * distance;
        const dy = Math.sin((angle * Math.PI) / 180) * distance;

        spark.style.setProperty("--dx", `${dx}px`);
        spark.style.setProperty("--dy", `${dy}px`);
        spark.style.left = "50%";
        spark.style.top = "38%";
        spark.style.fontSize = `${10 + Math.random() * 14}px`;
        spark.style.animationDelay = `${Math.random() * 0.25}s`;

        const hues = ["#facc15", "#34d399", "#22d3ee", "#a78bfa"];
        spark.style.color = hues[Math.floor(Math.random() * hues.length)];

        container.appendChild(spark);
    }

    document.body.appendChild(container);
    setTimeout(() => container.remove(), 1600);
}

let audioCtx = null;

function playChime() {
    try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();

        // A gentle ascending three-note chime, synthesized — no audio file needed.
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        const startTime = audioCtx.currentTime;

        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = "sine";
            osc.frequency.value = freq;

            const noteStart = startTime + i * 0.13;
            const noteEnd = noteStart + 0.5;

            gain.gain.setValueAtTime(0, noteStart);
            gain.gain.linearRampToValueAtTime(0.14, noteStart + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(noteStart);
            osc.stop(noteEnd + 0.05);
        });
    } catch (error) {
        // Audio isn't critical to the learning flow — fail silently.
        console.warn("Could not play celebration sound:", error);
    }
}

/* =========================
   BACKEND CALL
========================= */

async function callTutor(payload) {
    let result;

    try {
        result = await fetch("http://localhost:3000/api/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, history })
        });
    } catch (networkError) {
        // The fetch itself failed — the server likely isn't running at all.
        throw new Error(
            "NETWORK: Could not reach the AI server at localhost:3000. Is it running?"
        );
    }

    let data = null;

    try {
        data = await result.json();
    } catch (parseError) {
        // Response wasn't valid JSON.
        throw new Error(`SERVER: Got an unreadable response (status ${result.status}).`);
    }

    if (!result.ok) {
        // The server responded, but with an error — surface its real message
        // instead of pretending it was a connection problem.
        const reason = data && data.error ? data.error : `HTTP ${result.status}`;
        throw new Error(`SERVER: ${reason}`);
    }

    return data;
}

function friendlyErrorText(error) {
    const message = error && error.message ? error.message : String(error);

    if (message.startsWith("NETWORK:")) {
        return message.replace("NETWORK:", "").trim();
    }

    if (message.startsWith("SERVER:")) {
        return `The AI server responded with an error: ${message.replace("SERVER:", "").trim()}`;
    }

    return "Something went wrong talking to the AI server.";
}

function setComposerDisabled(disabled) {
    responseInput.disabled = disabled;
    sendButton.disabled = disabled;
    stuckButton.disabled = disabled;
    answerButton.disabled = disabled;
}

/* =========================
   PARSE + RENDER A GUIDING/LABELED RESPONSE
   mode: "normal" | "hint"
========================= */

function renderLabeledResponse(rawAnswer, mode) {
    const answer = String(rawAnswer ?? "").trim();

    if (answer.startsWith("EXCELLENT_WORK")) {
        const clean = answer.replace("EXCELLENT_WORK", "").trim();
        renderSuccessCard(clean);
        updateStage(STAGE_LABELS.length - 1);
        composer.hidden = true;
        renderNewProblemCTA();
        return "excellent";
    }

    if (answer.startsWith("ANSWER_REVEALED")) {
        const clean = answer.replace("ANSWER_REVEALED", "").trim();
        renderAnswerCard(clean);
        updateStage(STAGE_LABELS.length - 1);
        composer.hidden = true;
        renderNewProblemCTA();
        return "answer";
    }

    if (answer.startsWith("GUIDING")) {
        const clean = answer.replace("GUIDING", "").trim();

        if (mode === "hint") {
            renderHintCard(clean);
        } else {
            renderSocraticQuestion(clean);
            advanceStage();
        }

        return "guiding";
    }

    // Fallback: no recognized label, just show as plain AI text
    renderAIMessage(answer);
    return "unknown";
}

/* =========================
   START LEARNING
========================= */

async function startLearning() {
    const problem = problemInput.value.trim();

    if (problem === "") {
        problemInput.focus();
        return;
    }

    startButton.disabled = true;
    problemInput.readOnly = true;

    renderProblemMessage(problem);

    const typingNode = showTypingIndicator("Reading your problem...");

    try {
        const data = await callTutor({ type: "start", problem });

        hideTypingIndicator(typingNode);

        if (data.error) {
            renderErrorMessage(`${data.error} Please try again.`);
            startButton.disabled = false;
            problemInput.readOnly = false;
            return;
        }

        history.push({ role: "user", text: `Problem: ${problem}` });
        history.push({ role: "assistant", text: data.answer });

        sessionActive = true;
        composer.hidden = false;
        newProblemButton.hidden = false;

        renderLabeledResponse(data.answer, "normal");

        responseInput.focus();
    } catch (error) {
        console.error(error);
        hideTypingIndicator(typingNode);
        renderErrorMessage(friendlyErrorText(error));
        startButton.disabled = false;
        problemInput.readOnly = false;
    }
}

/* =========================
   SUBMIT STUDENT REASONING
========================= */

async function submitAnswer() {
    if (!sessionActive) return;

    const problem = problemInput.value.trim();
    const studentResponse = responseInput.value.trim();

    if (studentResponse === "") {
        responseInput.focus();
        return;
    }

    renderUserMessage(studentResponse);

    responseInput.value = "";
    responseInput.style.height = "auto";
    responseCount.innerText = "0 characters";

    setComposerDisabled(true);
    const typingNode = showTypingIndicator("Reviewing your reasoning...");

    try {
        const data = await callTutor({ type: "submit", problem, studentResponse });

        hideTypingIndicator(typingNode);
        setComposerDisabled(false);

        if (data.error) {
            renderErrorMessage(data.error);
            return;
        }

        history.push({ role: "user", text: `My reasoning: ${studentResponse}` });
        history.push({ role: "assistant", text: data.answer });

        renderLabeledResponse(data.answer, "normal");

        if (!composer.hidden) {
            responseInput.focus();
        }
    } catch (error) {
        console.error(error);
        hideTypingIndicator(typingNode);
        setComposerDisabled(false);
        renderErrorMessage(friendlyErrorText(error));
    }
}

/* =========================
   GET HINT ("I'm Stuck")
========================= */

async function getHint() {
    if (!sessionActive) return;

    const problem = problemInput.value.trim();

    setComposerDisabled(true);
    const typingNode = showTypingIndicator("Finding a helpful hint...");

    try {
        const data = await callTutor({ type: "hint", problem });

        hideTypingIndicator(typingNode);
        setComposerDisabled(false);

        if (data.error) {
            renderErrorMessage(data.error);
            return;
        }

        history.push({ role: "user", text: "(asked for a hint)" });
        history.push({ role: "assistant", text: data.answer });

        renderLabeledResponse(data.answer, "hint");

        if (!composer.hidden) {
            responseInput.focus();
        }
    } catch (error) {
        console.error(error);
        hideTypingIndicator(typingNode);
        setComposerDisabled(false);
        renderErrorMessage(friendlyErrorText(error));
    }
}

/* =========================
   REVEAL ANSWER ("Answer" button)
========================= */

async function revealAnswer() {
    if (!sessionActive) return;

    const problem = problemInput.value.trim();

    setComposerDisabled(true);
    const typingNode = showTypingIndicator("Preparing the answer...");

    try {
        const data = await callTutor({ type: "answer", problem });

        hideTypingIndicator(typingNode);
        setComposerDisabled(false);

        if (data.error) {
            renderErrorMessage(data.error);
            return;
        }

        history.push({ role: "user", text: "(requested the final answer)" });
        history.push({ role: "assistant", text: data.answer });

        const answer = String(data.answer ?? "").trim();

        if (answer.startsWith("ANSWER_REVEALED")) {
            renderAnswerCard(answer.replace("ANSWER_REVEALED", "").trim());
        } else {
            // Safety net in case the backend ever returns a different label
            renderLabeledResponse(answer, "hint");
        }

        updateStage(STAGE_LABELS.length - 1);
        composer.hidden = true;
        renderNewProblemCTA();
    } catch (error) {
        console.error(error);
        hideTypingIndicator(typingNode);
        setComposerDisabled(false);
        renderErrorMessage(friendlyErrorText(error));
    }
}

/* =========================
   RESET SESSION
========================= */

function confirmNewProblem() {
    if (sessionActive && composer.hidden === false) {
        const sure = window.confirm(
            "Start a new problem? Your current conversation will be cleared."
        );
        if (!sure) return;
    }
    resetSession();
}

function resetSession() {
    history = [];
    stage = 0;
    sessionActive = false;
    userScrolledUp = false;

    problemInput.value = "";
    problemInput.readOnly = false;
    problemCount.innerText = "0 characters";

    responseInput.value = "";
    responseInput.style.height = "auto";
    responseCount.innerText = "0 characters";

    setComposerDisabled(false);
    composer.hidden = true;
    newProblemButton.hidden = true;
    newMessagePill.hidden = true;

    startButton.disabled = false;

    messagesEl.innerHTML = "";
    starter.hidden = false;

    renderStage();
    problemInput.focus();
}

/* =========================
   INITIALIZE
========================= */

composer.hidden = true;
newProblemButton.hidden = true;
renderStage();