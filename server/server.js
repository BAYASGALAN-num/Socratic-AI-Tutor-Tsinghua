const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Anthropic = require("@anthropic-ai/sdk");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());


// ==================================================
// API KEY
// ==================================================

if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
        "Missing ANTHROPIC_API_KEY in .env file."
    );
    process.exit(1);
}


const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});


// ==================================================
// CONFIG
// ==================================================

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 300;

const MAX_WRONG_ATTEMPTS = 3;


// ==================================================
// SYSTEM PROMPT
// ==================================================

const SYSTEM_PROMPT = `
You are a friendly Socratic AI Tutor.

Your purpose is to help students learn through reasoning instead of
immediately giving them the answer.

The tutoring process follows this exact flow:

START
→ GUIDE
→ STUDENT ANSWERS
→ CORRECT → REVIEW → STOP
→ WRONG → COUNT ATTEMPT
→ if attempts < 3 → GUIDE AGAIN
→ if attempts >= 3 → ENCOURAGE HINT / ANSWER
→ HINT → GUIDE
→ ANSWER → REVEAL → STOP


==================================================
RESPONSE TYPES
==================================================

Every response must begin with exactly ONE of:

GUIDING
EXCELLENT_WORK
ANSWER_REVEALED


==================================================
1. GUIDING
==================================================

Use GUIDING when the student still needs help.

Normally, GUIDING should contain ONE Socratic question.

If the student has made 1 or 2 wrong attempts:

- Do not reveal the final answer.
- Briefly acknowledge the mistake.
- Help the student identify what went wrong.
- Ask ONE useful Socratic question.
- Do not repeat a previous question.


==================================================
2. EXCELLENT_WORK
==================================================

Use EXCELLENT_WORK when the student's latest answer is correct.

When using EXCELLENT_WORK:

- Tell the student their answer is correct.
- State the correct answer.
- Give one short explanation.
- Encourage the student.
- Do NOT ask another question.
- STOP.


==================================================
3. ANSWER_REVEALED
==================================================

Use ANSWER_REVEALED only when:

- The student clicked the Answer button.
- The turn instruction explicitly requests the final answer.

When using ANSWER_REVEALED:

- Give the correct answer.
- Give a short explanation.
- Do not ask another question.
- End with encouragement.
- STOP.


==================================================
IMPORTANT
==================================================

A wrong answer does NOT automatically mean the answer should be revealed.

If the student has fewer than 3 wrong attempts:

→ Use GUIDING.

If the student reaches 3 wrong attempts:

→ Do NOT reveal the answer.

Instead, the server will handle the recommendation to use Hint or Answer.

Do not ask another Socratic question after the third wrong attempt.


==================================================
STYLE
==================================================

Be friendly and encouraging.

Be concise.

Never shame the student.

Build on previous answers.

Do not repeat questions.

Do not use Markdown.

Do not use LaTeX.

Do not use headings.

Do not use bullet points.

Do not use backticks.

Always begin with exactly one response label.
`;


// ==================================================
// SESSION STORE
// ==================================================

const sessions = new Map();


function createSession(sessionId) {

    sessions.set(sessionId, {
        stage: "START",
        attempts: 0,
        completed: false
    });

}


function getSession(sessionId) {

    if (!sessions.has(sessionId)) {
        createSession(sessionId);
    }

    return sessions.get(sessionId);

}


function resetSession(sessionId) {

    createSession(sessionId);

}


// ==================================================
// API
// ==================================================

app.post("/api/ask", async (req, res) => {

    try {

        const {
            type,
            problem,
            studentResponse,
            history,
            sessionId
        } = req.body;


        // ==================================================
        // VALIDATION
        // ==================================================

        if (!type) {

            return res.status(400).json({
                error: "Missing type."
            });

        }


        if (!problem) {

            return res.status(400).json({
                error: "Missing problem."
            });

        }


        if (!sessionId) {

            return res.status(400).json({
                error: "Missing sessionId."
            });

        }


        const session = getSession(sessionId);

        let turnInstruction = "";


        // ==================================================
        // STAGE 1: START
        // ==================================================

        if (type === "start") {

            resetSession(sessionId);

            const newSession = getSession(sessionId);

            newSession.stage = "GUIDE";
            newSession.attempts = 0;
            newSession.completed = false;


            turnInstruction = `
The student is starting a new problem.

Problem:

${problem}

This is the START stage.

Begin the tutoring process.

Ask ONE simple Socratic question that helps the student
begin thinking about the problem.

Do NOT reveal the answer.

Your response MUST begin with:

GUIDING
`;

        }


        // ==================================================
        // STAGE 3: STUDENT ANSWERS
        // ==================================================

        else if (type === "submit") {

            if (
                studentResponse === undefined ||
                studentResponse === null ||
                String(studentResponse).trim() === ""
            ) {

                return res.status(400).json({
                    error: "Missing studentResponse."
                });

            }


            const currentAttempt = session.attempts + 1;


            /*
            ----------------------------------------------
            STUDENT ANSWER EVALUATION
            ----------------------------------------------
            */

            turnInstruction = `
The student is currently in the STUDENT ANSWERS stage.

Problem:

${problem}

Student's latest answer:

${studentResponse}

Previous conversation:

${JSON.stringify(history || [])}

This is wrong-answer attempt number:

${currentAttempt}

The maximum number of wrong attempts is:

${MAX_WRONG_ATTEMPTS}


Evaluate the student's latest answer carefully.


IMPORTANT:

FIRST determine whether the student's answer is correct.


IF THE ANSWER IS CORRECT:

Use EXCELLENT_WORK.

The student has successfully solved the problem.

State the correct answer.

Give one short explanation.

Do NOT ask another question.

STOP.


IF THE ANSWER IS WRONG AND THE ATTEMPT COUNT IS LESS THAN 3:

Use GUIDING.

Do NOT reveal the final answer.

Briefly explain what part of the student's reasoning needs
correction.

Ask ONE useful Socratic question.

Help the student try again.

Do not repeat a previous question.


IF THE ANSWER IS WRONG AND THE ATTEMPT COUNT IS 3 OR MORE:

Use GUIDING.

Do NOT reveal the final answer.

Do NOT ask another Socratic question.

The student should be encouraged to use either:

Hint

or

Answer

The application will display these options separately.

Your response should communicate that it is okay to use Hint
for additional guidance or Answer to see the complete solution.


Your response MUST begin with exactly one of:

GUIDING
EXCELLENT_WORK
ANSWER_REVEALED
`;

        }


        // ==================================================
        // HINT
        // ==================================================

        else if (type === "hint") {

            session.stage = "GUIDE";


            turnInstruction = `
The student clicked the Hint button.

Problem:

${problem}

The student needs additional guidance.

Give useful conceptual help that allows the student to continue
solving the problem.

Do NOT immediately reveal the exact final answer.

Explain the key concept or strategy.

Give ONE useful hint.

Do not ask multiple questions.

The purpose of this response is to move the student back
into the GUIDE stage.

Your response MUST begin with:

GUIDING
`;

        }


        // ==================================================
        // ANSWER
        // ==================================================

        else if (type === "answer") {

            session.stage = "REVEAL";
            session.completed = true;


            turnInstruction = `
The student clicked the Answer button.

Problem:

${problem}

The student explicitly requested the final answer.

Reveal the correct answer immediately.

Give a short explanation of the reasoning.

Do NOT ask another question.

End with a short encouraging sentence.

Your response MUST begin with:

ANSWER_REVEALED
`;

        }


        // ==================================================
        // UNKNOWN TYPE
        // ==================================================

        else {

            return res.status(400).json({
                error: `Unknown type: ${type}`
            });

        }


        // ==================================================
        // HISTORY
        // ==================================================

        const messages = [

            ...(Array.isArray(history) ? history : [])
                .slice(-10)
                .map((turn) => ({

                    role:
                        turn.role === "assistant"
                            ? "assistant"
                            : "user",

                    content:
                        String(turn.text ?? "")

                })),

            {
                role: "user",
                content: turnInstruction
            }

        ];


        // ==================================================
        // CLAUDE API
        // ==================================================

        const response = await anthropic.messages.create({

            model: MODEL,

            max_tokens: MAX_TOKENS,

            system: SYSTEM_PROMPT,

            messages

        });


        // ==================================================
        // GET TEXT
        // ==================================================

        const answer = response.content
            .filter(block => block.type === "text")
            .map(block => block.text)
            .join("\n")
            .trim();


        // ==================================================
        // UPDATE STATE
        // ==================================================

        if (type === "submit") {

            /*
            ----------------------------------------------
            CORRECT
            ----------------------------------------------
            */

            if (answer.startsWith("EXCELLENT_WORK")) {

                session.stage = "REVIEW";

                session.completed = true;

                session.attempts = 0;

            }


            /*
            ----------------------------------------------
            WRONG
            ----------------------------------------------
            */

            else if (answer.startsWith("GUIDING")) {

                session.attempts += 1;


                if (
                    session.attempts >= MAX_WRONG_ATTEMPTS
                ) {

                    session.stage = "SUPPORT";

                }

                else {

                    session.stage = "GUIDE";

                }

            }


            /*
            ----------------------------------------------
            ANSWER REVEALED
            ----------------------------------------------
            */

            else if (
                answer.startsWith("ANSWER_REVEALED")
            ) {

                session.stage = "REVEAL";

                session.completed = true;

                session.attempts = 0;

            }

        }


        // ==================================================
        // LOG
        // ==================================================

        console.log(
            `[${sessionId}]`,
            `stage=${session.stage}`,
            `attempts=${session.attempts}`,
            `type=${type}`
        );

        console.log(
            "Claude:",
            answer
        );


        // ==================================================
        // RESPONSE
        // ==================================================

        res.json({

            answer,

            stage: session.stage,

            attempts: session.attempts,

            completed: session.completed,

            showHintButton:
                session.stage === "SUPPORT",

            showAnswerButton:
                session.stage === "SUPPORT"

        });


    }

    catch (error) {

        console.error(
            "Claude API error:",
            error
        );

        res.status(500).json({

            error: "AI request failed."

        });

    }

});


// ==================================================
// HEALTH CHECK
// ==================================================

app.get("/health", (req, res) => {

    res.json({

        ok: true,

        model: MODEL

    });

});


// ==================================================
// SERVER
// ==================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `Claude Socratic AI Tutor running on http://localhost:${PORT}`
    );

});