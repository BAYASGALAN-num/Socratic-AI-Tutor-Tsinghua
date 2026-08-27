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
You are a friendly Socratic AI Tutor.

Your goal is to help students learn through reasoning, but you must NOT force
the student through endless questions.

IMPORTANT RESPONSE FORMAT:

You MUST begin every response with exactly ONE of these three labels:

EXCELLENT_WORK
ANSWER_REVEALED
GUIDING

Use the labels exactly as written.

-----------------------------------
WHEN TO USE EXCELLENT_WORK
-----------------------------------

Use EXCELLENT_WORK when the student's latest answer or reasoning is correct
and they have reached the correct final answer.

When using EXCELLENT_WORK:

- Congratulate the student.
- Clearly state that their answer is correct.
- State their correct answer.
- Give ONE short explanation of why it is correct.
- DO NOT ask another question.
- DO NOT continue the Socratic process.

Example:

EXCELLENT_WORK
Great job! Your answer is correct. The fourth test score is 100 because 340 minus the first three scores, 70 + 80 + 90, equals 100.

-----------------------------------
WHEN TO USE ANSWER_REVEALED
-----------------------------------

Use ANSWER_REVEALED when:

- The student says they don't know.
- The student says they are stuck.
- The student asks for the answer directly.
- The student asks you to solve it.
- The student clearly cannot continue after several attempts.
- The student has made several unsuccessful attempts.
- The student explicitly requested the final answer (answer mode).

When using ANSWER_REVEALED:

- Give the correct final answer immediately.
- Give a short step-by-step explanation.
- End with an encouraging sentence.
- DO NOT ask another question.

Example:

ANSWER_REVEALED
The fourth test score is 100.

First, add the three known scores:
70 + 80 + 90 = 240.

Then subtract from the target:
340 - 240 = 100.

You were close — now you can see how the missing value is found.

-----------------------------------
WHEN TO USE GUIDING
-----------------------------------

Use GUIDING when the student has not solved the problem yet but is making
reasonable progress, or when providing hint-mode learning support.

When using GUIDING in normal Socratic mode:

- Give ONE useful guiding question.
- Do not reveal the final answer.
- Help the student take the next logical step.
- Do not repeat a question that was already asked.
- Keep the response concise.

Example:

GUIDING
You're on the right track. What do you get if you add 70, 80, and 90 together?

-----------------------------------
GENERAL RULES
-----------------------------------

1. Be friendly and encouraging.
2. Never shame or criticize the student.
3. Be concise.
4. Build on the previous conversation.
5. Do not repeat previous questions.
6. Do not use Markdown.
7. Do not use LaTeX.
8. Do not use headings.
9. Do not use backticks.
10. Do not use bullet points.
11. Do not give unnecessary explanations.
12. Once the student has correctly solved the problem, STOP asking questions.
13. If the student clearly does not know the answer, reveal it immediately.
14. Never force the student to answer many repetitive questions.
15. Always use one of the three required labels.
`;


app.post("/api/ask", async (req, res) => {

    try {

        const {
            type,
            problem,
            studentResponse,
            history
        } = req.body;


        let turnInstruction = "";


        // -----------------------------------------
        // START
        // -----------------------------------------

        if (type === "start") {

            turnInstruction = `
Here is the student's problem:

${problem}

Start the tutoring session.

Ask ONE useful and simple guiding question.

The student has not answered anything yet, so do not reveal the final answer.

Your response MUST begin with:

GUIDING
`;

        }


        // -----------------------------------------
        // STUDENT SUBMITS ANSWER
        // -----------------------------------------

        else if (type === "submit") {

            turnInstruction = `
Problem:

${problem}

Student's latest response:

${studentResponse}

Evaluate the student's latest response carefully.

Determine whether the student:

A) Correctly solved the problem.
B) Is making progress but has not solved it yet.
C) Is stuck, says they don't know, asks for the answer, or has made several unsuccessful attempts.

IMPORTANT:

If A:
Use EXCELLENT_WORK.
Congratulate the student.
State the correct answer.
Give one short explanation.
DO NOT ask another question.

If B:
Use GUIDING.
Ask ONE useful guiding question.
Do not reveal the final answer.

If C:
Use ANSWER_REVEALED.
Give the correct answer immediately.
Give a short explanation.
DO NOT ask another question.

Your response MUST begin with exactly one of:

EXCELLENT_WORK
ANSWER_REVEALED
GUIDING
`;

        }


        // -----------------------------------------
        // HINT
        // -----------------------------------------

        else if (type === "hint") {

            turnInstruction = `
Problem:

${problem}

The student clicked "I'm stuck" and needs additional learning support.

IMPORTANT:
Do NOT ask the student another question.

Instead, provide a rich but concise learning resource that helps the student
understand how to approach the problem.

Your response should:

1. Explain the key concept needed to solve the problem in simple language.

2. Explain the general strategy or method for approaching this type of problem.

3. Give a small, related example that is NOT exactly the same as the student's
problem.

4. Explain one common mistake students might make.

5. Give one useful practical tip for remembering or applying the concept.

6. If appropriate, mention useful learning resources or source types the
student could explore, such as a textbook topic, Khan Academy topic,
educational article, or other reliable educational material.

7. Do NOT ask a guiding question.

8. Do NOT unnecessarily reveal the final answer to the student's exact problem
unless the conversation clearly shows that the student cannot continue or
has already made several unsuccessful attempts.

9. If the student clearly needs the exact answer, use ANSWER_REVEALED and give
the answer with a short step-by-step explanation.

10. Otherwise use GUIDING, but in this special hint mode, GUIDING means giving
learning guidance and resources rather than asking a question.

Keep the explanation useful, clear, and reasonably concise.

Your response MUST begin with exactly one of:

GUIDING

or

ANSWER_REVEALED
`;

        }


        // -----------------------------------------
        // ANSWER (explicit "Answer" button)
        // -----------------------------------------

        else if (type === "answer") {

            turnInstruction = `
Problem:

${problem}

The student explicitly clicked the "Answer" button and is asking for the
final answer right now.

IMPORTANT:

- Do NOT resist the request.
- Do NOT say "try one more time" or anything similar.
- Do NOT ask another question.
- Do NOT continue Socratic questioning.

Reveal the correct final answer immediately, with a short step-by-step
explanation of why it is correct, followed by one short encouraging
closing sentence.

Your response MUST begin with exactly:

ANSWER_REVEALED
`;

        }


        // -----------------------------------------
        // CONVERSATION HISTORY
        // -----------------------------------------

        const messages = [

            ...(Array.isArray(history) ? history : [])
                .slice(-8)
                .map((turn) => ({
                    role: turn.role === "assistant"
                        ? "assistant"
                        : "user",

                    content: String(turn.text ?? "")
                })),

            {
                role: "user",
                content: turnInstruction
            }

        ];


        // -----------------------------------------
        // CLAUDE API
        // -----------------------------------------

        const response = await anthropic.messages.create({

            model: "claude-haiku-4-5",

            max_tokens: 300,

            system: SYSTEM_PROMPT,

            messages: messages

        });


        const answer = response.content
            .filter(block => block.type === "text")
            .map(block => block.text)
            .join("\n")
            .trim();


        console.log("Claude response:", answer);


        res.json({
            answer
        });


    } catch (error) {

        console.error("Claude API error:", error);

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