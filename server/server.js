const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


app.post("/api/ask", async (req, res) => {

    try {

        const { type, problem, studentResponse } = req.body;

        let userMessage = "";


        // Student starts a new problem
        if (type === "start") {

            userMessage = `
The student has entered this problem:

${problem}

Start a Socratic tutoring session.

Do NOT give the final answer.

Ask one useful guiding question that helps
the student identify the important information
in the problem.
`;

        }


        // Student submits reasoning
        else if (type === "submit") {

            userMessage = `
Problem:

${problem}

Student's reasoning:

${studentResponse}

Act as a Socratic tutor.

Do not give the final answer immediately.

Evaluate the student's reasoning and ask
one guiding question that helps the student
take the next step.
`;

        }


        // Student asks for a hint
        else if (type === "hint") {

            userMessage = `
Problem:

${problem}

The student is stuck.

Give a small hint that helps the student
think about the next step.

Do NOT give the final answer.
`;

        }


        const response = await ai.models.generateContent({

            model: "gemini-3.7-flash",

            contents: `
You are a Socratic AI Tutor.

Your job is to help students learn by thinking.

Rules:

1. Never immediately give the final answer.
2. Ask guiding questions.
3. Give small hints.
4. Encourage the student to explain their reasoning.
5. If the student's reasoning is wrong,
   gently guide them.
6. Never shame or criticize the student.
7. Keep responses clear and concise.

Student request:

${userMessage}
`

        });


        res.json({
            answer: response.text
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
        "Gemini Socratic AI Tutor running on http://localhost:3000"
    );

});