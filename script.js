const STAGE_LABELS = ["Understand", "Explore", "Reason", "Refine", "Insight"];

const ICONS = {
    sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /><path d="M20 2v4" /><path d="M22 4h-4" /><circle cx="4" cy="20" r="2" /></svg>`,

    fileText: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>`,

    brain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 18V5" /><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" /><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" /><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" /><path d="M18 18a4 4 0 0 0 2-7.464" /><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" /><path d="M6 18a4 4 0 0 1-2-7.464" /><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" /></svg>`,

    lightbulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>`,

    alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>`
};

let history = [];
let stage = 0;
let stepNumber = 0;

const problemInput = document.getElementById("problem");
const responseInput = document.getElementById("studentResponse");
const problemCount = document.getElementById("problemCount");
const responseCount = document.getElementById("responseCount");
const roadmap = document.getElementById("roadmap");
const responseSection = document.getElementById("responseSection");
const startButton = document.getElementById("startButton");
const newProblemButton = document.getElementById("newProblemButton");

problemInput.addEventListener("input", () => {
    problemCount.innerText = `${problemInput.value.length} characters`;
});

responseInput.addEventListener("input", () => {
    responseCount.innerText = `${responseInput.value.length} characters`;
});

function renderStage() {

    document.querySelectorAll(".stage").forEach((el) => {

        const i = Number(el.dataset.stage);

        el.classList.toggle("active", i === stage);
        el.classList.toggle("done", i < stage);

    });

}

function advanceStage() {

    stage = Math.min(stage + 1, STAGE_LABELS.length - 1);

    renderStage();

}

function escapeHtml(text) {

    const div = document.createElement("div");

    div.innerText = text;

    return div.innerHTML;

}

function addNode(kind, icon, role, bodyHtml, countStep = true) {

    const empty = document.getElementById("roadmapEmpty");

    if (empty) empty.remove();

    const stepBadge = countStep
        ? `<span class="node-step">Step ${++stepNumber}</span>`
        : "";

    const node = document.createElement("div");

    node.className = `roadmap-node node-${kind}`;

    node.innerHTML = `
        <div class="node-rail">
            <div class="node-dot">${icon}</div>
        </div>
        <div class="node-card">
            <div class="node-meta">
                <span class="node-role">${role}</span>
                ${stepBadge}
            </div>
            <div class="node-body">${bodyHtml}</div>
        </div>
    `;

    roadmap.appendChild(node);

    node.scrollIntoView({ behavior: "smooth", block: "end" });

    return node;

}

function addThinking(label) {

    return addNode(
        "thinking",
        ICONS.sparkles,
        "Socratic AI",
        `<div class="thinking-dots"><span></span><span></span><span></span><label>${label}</label></div>`,
        false
    );

}

function addErrorNode(message) {

    return addNode(
        "error",
        ICONS.alert,
        "Socratic AI",
        `<p>${escapeHtml(message)}</p>`
    );

}

async function callTutor(payload) {

    const result = await fetch(
        "http://localhost:3000/api/ask",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                ...payload,
                history
            })
        }
    );

    return result.json();

}

async function startLearning() {

    const problem = problemInput.value.trim();

    if (problem === "") {

        alert("Please enter a problem.");

        return;
    }

    problemInput.readOnly = true;
    startButton.disabled = true;
    newProblemButton.hidden = false;

    addNode("problem", ICONS.fileText, "Your problem", `<p>${escapeHtml(problem)}</p>`);

    const thinkingNode = addThinking("Reading your problem...");

    try {

        const data = await callTutor({ type: "start", problem });

        thinkingNode.remove();

        if (data.error) {

            addErrorNode(`${data.error} Please try again.`);

            problemInput.readOnly = false;
            startButton.disabled = false;

            return;
        }

        history.push({ role: "user", text: `Problem: ${problem}` });
        history.push({ role: "assistant", text: data.answer });

        addNode("ai", ICONS.sparkles, "Socratic AI", `<p>${escapeHtml(data.answer)}</p>`);

        advanceStage();

        responseSection.hidden = false;

        responseInput.focus();

    } catch (error) {

        console.error(error);

        thinkingNode.remove();

        addErrorNode("Could not connect to the AI server. Please try again.");

        problemInput.readOnly = false;
        startButton.disabled = false;

    }

}

async function submitAnswer() {

    const problem = problemInput.value.trim();
    const studentResponse = responseInput.value.trim();

    if (studentResponse === "") {

        alert("Please explain your thinking.");

        return;
    }

    addNode("student", ICONS.brain, "You", `<p>${escapeHtml(studentResponse)}</p>`);

    responseInput.value = "";
    responseCount.innerText = "0 characters";

    const thinkingNode = addThinking("Reviewing your reasoning...");

    try {

        const data = await callTutor({ type: "submit", problem, studentResponse });

        thinkingNode.remove();

        if (data.error) {

            addErrorNode(data.error);

            return;
        }

        history.push({ role: "user", text: `My reasoning: ${studentResponse}` });
        history.push({ role: "assistant", text: data.answer });

        addNode("ai", ICONS.sparkles, "Socratic AI", `<p>${escapeHtml(data.answer)}</p>`);

        advanceStage();

    } catch (error) {

        console.error(error);

        thinkingNode.remove();

        addErrorNode("Could not connect to the AI server.");

    }

}

async function getHint() {

    const problem = problemInput.value.trim();

    if (problem === "") {

        alert("Please enter a problem first.");

        return;
    }

    const thinkingNode = addThinking("Finding a helpful hint...");

    try {

        const data = await callTutor({ type: "hint", problem });

        thinkingNode.remove();

        if (data.error) {

            addErrorNode(data.error);

            return;
        }

        history.push({ role: "user", text: "(asked for a hint)" });
        history.push({ role: "assistant", text: data.answer });

        addNode("hint", ICONS.lightbulb, "Hint", `<p>${escapeHtml(data.answer)}</p>`);

    } catch (error) {

        console.error(error);

        thinkingNode.remove();

        addErrorNode("Could not connect to the AI server.");

    }

}

function resetSession() {

    history = [];
    stage = 0;
    stepNumber = 0;

    problemInput.value = "";
    problemInput.readOnly = false;
    problemCount.innerText = "0 characters";

    responseInput.value = "";
    responseCount.innerText = "0 characters";
    responseSection.hidden = true;

    startButton.disabled = false;
    newProblemButton.hidden = true;

    roadmap.innerHTML = `
        <div class="roadmap-empty" id="roadmapEmpty">
            <span class="welcome-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z" />
                </svg>
            </span>
            <div>
                <strong>Let's learn together.</strong>
                <p>
                    Enter a problem above and I'll guide you
                    step-by-step with questions instead of simply
                    giving you the answer. Your journey builds here
                    as a roadmap, one step at a time.
                </p>
            </div>
        </div>
    `;

    renderStage();

    problemInput.focus();

}

renderStage();
