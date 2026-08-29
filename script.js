const STAGE_LABELS = ["Understand", "Explore", "Reason", "Refine", "Insight"];

/* One icon language for the whole app: 24x24 viewBox, 2px round
   strokes. Sizing is left to CSS so the same markup works at any
   scale. Filled variants exist only where a shape has to read at
   very small sizes. */
const ICONS = {
    question: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
    bulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5 1 .7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`,
    book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>`,
    alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
    student: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,

    /* Filled — these render at 11-24px, where a 2px stroke closes up. */
    ai: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>`,
    sparkle: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>`
};


/* =========================================================
   STATE
========================================================= */

let history = [];

let stage = 0;

let sessionActive = false;

let sessionId = null;

let attempts = 0;

let completed = false;

let userScrolledUp = false;


/* =========================================================
   DOM ELEMENTS
========================================================= */

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


/* =========================================================
   SESSION ID
========================================================= */

function createSessionId() {
    return (
        "session-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substring(2, 10)
    );
}


/* =========================================================
   CHARACTER COUNTERS
========================================================= */

problemInput.addEventListener("input", () => {
    problemCount.innerText =
        `${problemInput.value.length} characters`;
});


responseInput.addEventListener("input", () => {
    responseCount.innerText =
        `${responseInput.value.length} characters`;

    responseInput.style.height = "auto";

    responseInput.style.height =
        Math.min(responseInput.scrollHeight, 160) + "px";
});


responseInput.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        submitAnswer();
    }
});


/* =========================================================
   SCROLL
========================================================= */

chatScroll.addEventListener("scroll", () => {

    const distanceFromBottom =
        chatScroll.scrollHeight -
        chatScroll.scrollTop -
        chatScroll.clientHeight;

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
        chatScroll.scrollTo({
            top: chatScroll.scrollHeight,
            behavior: "smooth"
        });
    });
}


/* =========================================================
   THEME
========================================================= */

function toggleTheme() {

    const root = document.documentElement;

    const stored = root.getAttribute("data-theme");

    const systemPrefersLight =
        window.matchMedia("(prefers-color-scheme: light)").matches;

    const current =
        stored || (systemPrefersLight ? "light" : "dark");

    const next =
        current === "light" ? "dark" : "light";

    root.setAttribute("data-theme", next);

    localStorage.setItem("theme", next);
}


/* =========================================================
   STAGE LOGIC
========================================================= */

function updateStage(newStage) {

    stage = Math.max(
        0,
        Math.min(newStage, STAGE_LABELS.length - 1)
    );

    renderStage();
}


function renderStage() {

    document.querySelectorAll(".stage-item").forEach((el) => {

        const i = Number(el.dataset.stage);

        el.classList.toggle(
            "active",
            i === stage
        );

        el.classList.toggle(
            "done",
            i < stage
        );

        /* Tell screen readers which step of the five we are on. */
        if (i === stage) {
            el.setAttribute("aria-current", "step");
        } else {
            el.removeAttribute("aria-current");
        }
    });
}


/*
    Visual stage mapping:

    0 = Understand
    1 = Explore
    2 = Reason
    3 = Refine
    4 = Insight

    These are UI stages.

    The actual learning state is tracked separately through:

    sessionActive
    attempts
    completed
*/


/* =========================================================
   SECURITY
========================================================= */

function escapeHtml(text) {

    const div = document.createElement("div");

    div.innerText = String(text ?? "");

    return div.innerHTML;
}


/* =========================================================
   MESSAGE HELPERS
========================================================= */

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


/* =========================================================
   USER MESSAGE
========================================================= */

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


/* =========================================================
   PROBLEM
========================================================= */

function renderProblemMessage(text) {

    ensureStarterHidden();

    const el = document.createElement("div");

    el.className = "msg problem";

    el.innerHTML = `
        <div class="msg-avatar">${ICONS.book}</div>

        <div class="msg-body">

            <span class="msg-label">Your problem</span>

            <div class="msg-bubble">${escapeHtml(text)}</div>

        </div>
    `;

    return appendEl(el);
}


/* =========================================================
   NORMAL AI MESSAGE
========================================================= */

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


/* =========================================================
   SOCRATIC QUESTION
========================================================= */

function renderSocraticQuestion(text) {

    ensureStarterHidden();

    const el = document.createElement("div");

    el.className = "msg ai";

    el.innerHTML = `
        <div class="msg-avatar">${ICONS.ai}</div>

        <div class="msg-body">

            <span class="msg-label">Socratic AI</span>

            <div class="socratic-card">

                <div class="socratic-eyebrow">
                    ${ICONS.question}
                    SOCRATIC QUESTION
                </div>

                <div class="socratic-question-text">${escapeHtml(text)}</div>

                <div class="socratic-subtext">Think before you answer.</div>

            </div>

        </div>
    `;

    return appendEl(el);
}


/* =========================================================
   HINT CARD
========================================================= */

function renderHintCard(text) {

    ensureStarterHidden();

    const el = document.createElement("div");

    el.className = "msg ai";

    el.innerHTML = `
        <div class="msg-avatar">${ICONS.ai}</div>

        <div class="msg-body">

            <span class="msg-label">Socratic AI</span>

            <div class="hint-card">

                <div class="hint-eyebrow">
                    ${ICONS.bulb}
                    HINT
                </div>

                <div class="hint-text">${escapeHtml(text)}</div>

            </div>

        </div>
    `;

    return appendEl(el);
}


/* =========================================================
   ANSWER CARD
========================================================= */

function renderAnswerCard(text) {

    ensureStarterHidden();

    const el = document.createElement("div");

    el.className = "msg ai";

    el.innerHTML = `
        <div class="msg-avatar">${ICONS.ai}</div>

        <div class="msg-body msg-body-wide">

            <span class="msg-label">Socratic AI</span>

            <div class="answer-card">

                <div class="answer-header">

                    <span class="answer-icon">${ICONS.check}</span>

                    <span class="answer-title">
                        ANSWER REVEALED
                    </span>

                </div>

                <div class="answer-text">${escapeHtml(text)}</div>

            </div>

        </div>
    `;

    return appendEl(el);
}


/* =========================================================
   SUCCESS / REVIEW
========================================================= */

function renderSuccessCard(text) {

    ensureStarterHidden();

    const el = document.createElement("div");

    el.className = "success-card";

    el.innerHTML = `
        <div class="success-icon">${ICONS.check}</div>

        <div class="success-title">
            EXCELLENT WORK!
        </div>

        <div class="success-message">${escapeHtml(text)}</div>

        <div class="success-subtitle">
            ${ICONS.sparkle}
            <span>You solved this through your own reasoning.</span>
        </div>
    `;

    messagesEl.appendChild(el);

    celebrate();

    scrollChatToBottom(true);

    return el;
}


/* =========================================================
   SUPPORT CARD
   Appears after 3 wrong attempts
========================================================= */

function renderSupportCard() {

    ensureStarterHidden();

    const el = document.createElement("div");

    el.className = "msg ai";

    el.innerHTML = `
        <div class="msg-avatar">${ICONS.ai}</div>

        <div class="msg-body">

            <span class="msg-label">Socratic AI</span>

            <div class="hint-card">

                <div class="hint-eyebrow">
                    ${ICONS.bulb}
                    NEED SOME HELP?
                </div>

                <div class="hint-text">
                    That's okay! You've made several attempts.
                    If you still cannot find the answer, you can use
                    Hint for additional guidance or Answer to see the
                    complete solution.
                </div>

            </div>

        </div>
    `;

    return appendEl(el);
}


/* =========================================================
   NEW PROBLEM CTA
========================================================= */

function renderNewProblemCTA() {

    const el = document.createElement("div");

    el.className = "next-problem-cta";

    el.innerHTML = `
        <p>Ready for another challenge?</p>

        <button
            type="button"
            class="primary-button"
            onclick="resetSession()"
        >

            <span>Start a New Problem</span>

            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
            </svg>

        </button>
    `;

    return appendEl(el);
}


/* =========================================================
   ERROR
========================================================= */

function renderErrorMessage(text) {

    ensureStarterHidden();

    const el = document.createElement("div");

    el.className = "msg error";

    el.innerHTML = `
        <div class="msg-avatar">${ICONS.alert}</div>

        <div class="msg-body">

            <span class="msg-label">
                Socratic AI
            </span>

            <div class="msg-bubble">${escapeHtml(text)}</div>

        </div>
    `;

    return appendEl(el);
}


/* =========================================================
   TYPING
========================================================= */

function showTypingIndicator(label) {

    ensureStarterHidden();

    const el = document.createElement("div");

    el.className = "msg ai typing";

    el.innerHTML = `
        <div class="msg-avatar">${ICONS.ai}</div>

        <div class="msg-body">

            <span class="msg-label">
                Socratic AI
            </span>

            <div class="thinking-row">

                <span class="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>

                <span class="thinking-label">${escapeHtml(label)}</span>

            </div>

        </div>
    `;

    return appendEl(el);
}


function hideTypingIndicator(node) {

    if (node) {
        node.remove();
    }
}


/* =========================================================
   CELEBRATION
========================================================= */

function celebrate() {

    launchConfetti();

    launchSparkles();

    playChime();
}


function launchConfetti() {

    const container = document.createElement("div");

    container.className = "confetti-container";

    const colors = [
        "#34d399",
        "#22d3ee",
        "#8b5cf6",
        "#facc15",
        "#6366f1",
        "#f472b6"
    ];

    const pieces = 90;

    for (let i = 0; i < pieces; i++) {

        const piece = document.createElement("div");

        piece.className = "confetti";

        const fromLeft = i % 2 === 0;

        piece.style.left = fromLeft
            ? `${Math.random() * 25}%`
            : `${75 + Math.random() * 25}%`;

        piece.style.animationDelay =
            `${Math.random() * 0.7}s`;

        piece.style.transform =
            `rotate(${Math.random() * 360}deg)`;

        const size = 6 + Math.random() * 8;

        piece.style.width = `${size}px`;

        piece.style.height = `${size * 1.6}px`;

        piece.style.background =
            colors[Math.floor(Math.random() * colors.length)];

        container.appendChild(piece);
    }

    document.body.appendChild(container);

    setTimeout(() => {
        container.remove();
    }, 4200);
}


function launchSparkles() {

    const container = document.createElement("div");

    container.className = "sparkle-container";

    const count = 22;

    for (let i = 0; i < count; i++) {

        const spark = document.createElement("span");

        spark.className = "sparkle";

        spark.innerHTML = ICONS.sparkle;

        const angle =
            (360 / count) * i +
            (Math.random() * 20 - 10);

        const distance =
            90 + Math.random() * 140;

        const dx =
            Math.cos((angle * Math.PI) / 180) *
            distance;

        const dy =
            Math.sin((angle * Math.PI) / 180) *
            distance;

        spark.style.setProperty(
            "--dx",
            `${dx}px`
        );

        spark.style.setProperty(
            "--dy",
            `${dy}px`
        );

        spark.style.left = "50%";

        spark.style.top = "38%";

        spark.style.fontSize =
            `${10 + Math.random() * 14}px`;

        spark.style.animationDelay =
            `${Math.random() * 0.25}s`;

        const hues = [
            "#facc15",
            "#34d399",
            "#22d3ee",
            "#a78bfa"
        ];

        spark.style.color =
            hues[Math.floor(Math.random() * hues.length)];

        container.appendChild(spark);
    }

    document.body.appendChild(container);

    setTimeout(() => {
        container.remove();
    }, 1600);
}


let audioCtx = null;


function playChime() {

    try {

        audioCtx =
            audioCtx ||
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

        const notes = [
            523.25,
            659.25,
            783.99
        ];

        const startTime =
            audioCtx.currentTime;

        notes.forEach((freq, i) => {

            const osc =
                audioCtx.createOscillator();

            const gain =
                audioCtx.createGain();

            osc.type = "sine";

            osc.frequency.value = freq;

            const noteStart =
                startTime + i * 0.13;

            const noteEnd =
                noteStart + 0.5;

            gain.gain.setValueAtTime(
                0,
                noteStart
            );

            gain.gain.linearRampToValueAtTime(
                0.14,
                noteStart + 0.02
            );

            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                noteEnd
            );

            osc.connect(gain);

            gain.connect(
                audioCtx.destination
            );

            osc.start(noteStart);

            osc.stop(noteEnd + 0.05);
        });

    } catch (error) {

        console.warn(
            "Could not play celebration sound:",
            error
        );
    }
}


/* =========================================================
   BACKEND CALL
========================================================= */

async function callTutor(payload) {

    if (!sessionId) {
        throw new Error(
            "SESSION: No active learning session."
        );
    }

    let result;

    try {

        result = await fetch(
            "http://localhost:3000/api/ask",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    ...payload,

                    history,

                    sessionId

                })
            }
        );

    } catch (networkError) {

        throw new Error(
            "NETWORK: Could not reach the AI server at localhost:3000. Is it running?"
        );
    }

    let data = null;

    try {

        data = await result.json();

    } catch (parseError) {

        throw new Error(
            `SERVER: Got an unreadable response (status ${result.status}).`
        );
    }

    if (!result.ok) {

        const reason =
            data && data.error
                ? data.error
                : `HTTP ${result.status}`;

        throw new Error(
            `SERVER: ${reason}`
        );
    }

    return data;
}


function friendlyErrorText(error) {

    const message =
        error && error.message
            ? error.message
            : String(error);

    if (message.startsWith("NETWORK:")) {

        return message
            .replace("NETWORK:", "")
            .trim();
    }

    if (message.startsWith("SERVER:")) {

        return (
            "The AI server responded with an error: " +
            message.replace("SERVER:", "").trim()
        );
    }

    if (message.startsWith("SESSION:")) {

        return message
            .replace("SESSION:", "")
            .trim();
    }

    return "Something went wrong talking to the AI server.";
}


/* =========================================================
   COMPOSER
========================================================= */

function setComposerDisabled(disabled) {

    responseInput.disabled = disabled;

    sendButton.disabled = disabled;

    stuckButton.disabled = disabled;

    answerButton.disabled = disabled;
}


/* =========================================================
   RESPONSE PROCESSING
========================================================= */

function renderLabeledResponse(rawAnswer, mode) {

    const answer =
        String(rawAnswer ?? "").trim();


    /* -----------------------------------------
       CORRECT
    ----------------------------------------- */

    if (answer.startsWith("EXCELLENT_WORK")) {

        const clean =
            answer
                .replace("EXCELLENT_WORK", "")
                .trim();

        completed = true;

        sessionActive = false;

        updateStage(4);

        renderSuccessCard(clean);

        composer.hidden = true;

        renderNewProblemCTA();

        return "excellent";
    }


    /* -----------------------------------------
       FINAL ANSWER
    ----------------------------------------- */

    if (answer.startsWith("ANSWER_REVEALED")) {

        const clean =
            answer
                .replace("ANSWER_REVEALED", "")
                .trim();

        completed = true;

        sessionActive = false;

        updateStage(4);

        renderAnswerCard(clean);

        composer.hidden = true;

        renderNewProblemCTA();

        return "answer";
    }


    /* -----------------------------------------
       GUIDING
    ----------------------------------------- */

    if (answer.startsWith("GUIDING")) {

        const clean =
            answer
                .replace("GUIDING", "")
                .trim();

        if (mode === "hint") {

            renderHintCard(clean);

        } else {

            renderSocraticQuestion(clean);

            /*
                Move visual progress forward,
                but never beyond Refine until
                the student actually succeeds.
            */

            if (stage < 3) {
                updateStage(stage + 1);
            }
        }

        return "guiding";
    }


    /* -----------------------------------------
       FALLBACK
    ----------------------------------------- */

    renderAIMessage(answer);

    return "unknown";
}


/* =========================================================
   START
========================================================= */

async function startLearning() {

    const problem =
        problemInput.value.trim();

    if (problem === "") {

        problemInput.focus();

        return;
    }


    /*
        Create a completely NEW session.

        This is the missing piece that caused:

        "Missing sessionId"
    */

    sessionId = createSessionId();

    attempts = 0;

    completed = false;

    history = [];

    stage = 0;

    sessionActive = false;


    startButton.disabled = true;

    problemInput.readOnly = true;


    renderProblemMessage(problem);


    const typingNode =
        showTypingIndicator(
            "Reading your problem..."
        );


    try {

        const data =
            await callTutor({
                type: "start",
                problem
            });


        hideTypingIndicator(
            typingNode
        );


        if (data.error) {

            renderErrorMessage(
                `${data.error} Please try again.`
            );

            startButton.disabled = false;

            problemInput.readOnly = false;

            return;
        }


        history.push({
            role: "user",
            text: `Problem: ${problem}`
        });


        history.push({
            role: "assistant",
            text: data.answer
        });


        sessionActive = true;


        composer.hidden = false;

        newProblemButton.hidden = false;


        updateStage(0);


        renderLabeledResponse(
            data.answer,
            "normal"
        );


        responseInput.focus();

    } catch (error) {

        console.error(error);

        hideTypingIndicator(
            typingNode
        );

        renderErrorMessage(
            friendlyErrorText(error)
        );

        startButton.disabled = false;

        problemInput.readOnly = false;
    }
}


/* =========================================================
   SUBMIT STUDENT ANSWER
========================================================= */

async function submitAnswer() {

    if (!sessionActive || completed) {
        return;
    }


    const problem =
        problemInput.value.trim();

    const studentResponse =
        responseInput.value.trim();


    if (studentResponse === "") {

        responseInput.focus();

        return;
    }


    renderUserMessage(
        studentResponse
    );


    responseInput.value = "";

    responseInput.style.height = "auto";

    responseCount.innerText =
        "0 characters";


    setComposerDisabled(true);


    const typingNode =
        showTypingIndicator(
            "Reviewing your reasoning..."
        );


    try {

        const data =
            await callTutor({

                type: "submit",

                problem,

                studentResponse
            });


        hideTypingIndicator(
            typingNode
        );


        setComposerDisabled(false);


        if (data.error) {

            renderErrorMessage(
                data.error
            );

            return;
        }


        history.push({
            role: "user",
            text: `My answer: ${studentResponse}`
        });


        history.push({
            role: "assistant",
            text: data.answer
        });


        const result =
            renderLabeledResponse(
                data.answer,
                "normal"
            );


        /*
            If Claude says GUIDING, this was not
            a successful answer.

            Count the wrong attempt locally.

            The server also tracks this using
            the same sessionId.
        */

        if (result === "guiding") {

            attempts++;

            console.log(
                `[${sessionId}] Wrong attempt: ${attempts}`
            );


            /*
                After 3 wrong attempts, don't
                automatically reveal the answer.

                Instead show the support message.
            */

            if (attempts >= 3) {

                renderSupportCard();

                /*
                    Keep the student inside the session.

                    They can choose:

                    Hint
                    OR
                    Answer
                */

                updateStage(3);

            }
        }


        if (!composer.hidden) {

            responseInput.focus();
        }

    } catch (error) {

        console.error(error);

        hideTypingIndicator(
            typingNode
        );

        setComposerDisabled(false);

        renderErrorMessage(
            friendlyErrorText(error)
        );
    }
}


/* =========================================================
   HINT
========================================================= */

async function getHint() {

    if (!sessionActive || completed) {
        return;
    }


    const problem =
        problemInput.value.trim();


    setComposerDisabled(true);


    const typingNode =
        showTypingIndicator(
            "Finding a helpful hint..."
        );


    try {

        const data =
            await callTutor({

                type: "hint",

                problem
            });


        hideTypingIndicator(
            typingNode
        );


        setComposerDisabled(false);


        if (data.error) {

            renderErrorMessage(
                data.error
            );

            return;
        }


        history.push({
            role: "user",
            text: "(asked for a hint)"
        });


        history.push({
            role: "assistant",
            text: data.answer
        });


        renderLabeledResponse(
            data.answer,
            "hint"
        );


        /*
            Hint does NOT finish the problem.

            Student can continue answering.
        */

        sessionActive = true;

        composer.hidden = false;

        updateStage(3);


        responseInput.focus();

    } catch (error) {

        console.error(error);

        hideTypingIndicator(
            typingNode
        );

        setComposerDisabled(false);

        renderErrorMessage(
            friendlyErrorText(error)
        );
    }
}


/* =========================================================
   ANSWER BUTTON
========================================================= */

async function revealAnswer() {

    if (!sessionActive || completed) {
        return;
    }


    const problem =
        problemInput.value.trim();


    setComposerDisabled(true);


    const typingNode =
        showTypingIndicator(
            "Preparing the answer..."
        );


    try {

        const data =
            await callTutor({

                type: "answer",

                problem
            });


        hideTypingIndicator(
            typingNode
        );


        if (data.error) {

            setComposerDisabled(false);

            renderErrorMessage(
                data.error
            );

            return;
        }


        history.push({
            role: "user",
            text: "(requested the final answer)"
        });


        history.push({
            role: "assistant",
            text: data.answer
        });


        const answer =
            String(data.answer ?? "").trim();


        if (
            answer.startsWith(
                "ANSWER_REVEALED"
            )
        ) {

            renderAnswerCard(
                answer
                    .replace(
                        "ANSWER_REVEALED",
                        ""
                    )
                    .trim()
            );

        } else {

            renderLabeledResponse(
                answer,
                "hint"
            );
        }


        completed = true;

        sessionActive = false;

        updateStage(4);

        composer.hidden = true;

        renderNewProblemCTA();

    } catch (error) {

        console.error(error);

        hideTypingIndicator(
            typingNode
        );

        setComposerDisabled(false);

        renderErrorMessage(
            friendlyErrorText(error)
        );
    }
}


/* =========================================================
   NEW PROBLEM
========================================================= */

function confirmNewProblem() {

    if (
        sessionActive &&
        composer.hidden === false
    ) {

        const sure =
            window.confirm(
                "Start a new problem? Your current conversation will be cleared."
            );

        if (!sure) {
            return;
        }
    }

    resetSession();
}


function resetSession() {

    history = [];

    stage = 0;

    sessionActive = false;

    sessionId = null;

    attempts = 0;

    completed = false;

    userScrolledUp = false;


    problemInput.value = "";

    problemInput.readOnly = false;

    problemCount.innerText =
        "0 characters";


    responseInput.value = "";

    responseInput.style.height =
        "auto";

    responseCount.innerText =
        "0 characters";


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


/* =========================================================
   INITIALIZE
========================================================= */

composer.hidden = true;

newProblemButton.hidden = true;

renderStage();