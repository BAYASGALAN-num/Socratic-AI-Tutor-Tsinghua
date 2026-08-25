const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Anthropic = require("@anthropic-ai/sdk");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});


const SYSTEM_PROMPT = `
    You are a Socratic AI Tutor guiding a student through a problem
    over multiple turns, building on everything said so far.

    Rules:

    1. Never immediately give the final answer.
    2. Ask guiding questions.
    3. Give small hints.
    4. Encourage the student to explain their reasoning.
    5. If the student's reasoning is wrong,
    gently guide them.
    6. Never shame or criticize the student.
    7. Keep responses clear and concise.
    8. Build on the conversation so far instead of repeating
    earlier questions or restarting the explanation.
    9. Write like you're speaking to the student, not formatting
    a document. Never use LaTeX or Markdown syntax of any kind:
    no $...$ or $$...$$ math delimiters, no \\(...\\) or \\[...\\],
    no **bold**, no backticks, no # headings. Say numbers and
    equations the way you'd say them out loud, e.g. "20 divided
    by 5 gives you 4" instead of "$20 \\div 5 = 4$".
`;

app.post("/api/ask", async (req, res) => {

    try {

        const { type, problem, studentResponse, history } = req.body;

        let turnInstruction = "";


        // Student starts a new problem
        if (type === "start") {

            turnInstruction = `
                The student wants to work through this problem:

                ${problem}

                Start the Socratic session. Ask one useful guiding
                question that helps the student identify the
                important information in the problem.

                Do NOT give the final answer.
            `;

        }

        // Student submits reasoning
        else if (type === "submit") {

            turnInstruction = `
                The student's latest reasoning:

                ${studentResponse}

                Evaluate it and ask one guiding question that helps
                the student take the next step.

                Do not give the final answer yet.
                `;

        }


        // Student asks for a hint
        else if (type === "hint") {

            turnInstruction = `
                The student is stuck and asks for a hint.

                Give a small hint that helps the student
                think about the next step.

                Do NOT give the final answer.
                `;

        }


        const messages = [

            ...(Array.isArray(history) ? history : []).map((turn) => ({
                role: turn.role === "assistant" ? "assistant" : "user",
                content: String(turn.text ?? "")
            })),

            {
                role: "user",
                content: turnInstruction
            }

        ];


        const response = await anthropic.messages.create({

            model: "claude-opus-5",

            max_tokens: 4096,

            system: SYSTEM_PROMPT,

            thinking: { type: "adaptive" },

            messages

        });


        const answer = response.content
            .filter((block) => block.type === "text")
            .map((block) => block.text)
            .join("\n")
            .trim();


        res.json({
            answer
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "AI request failed."
        });

    }

});


app.listen(3000, () => {

    console.log(
        "Claude Socratic AI Tutor running on http://localhost:3000"
    );

});