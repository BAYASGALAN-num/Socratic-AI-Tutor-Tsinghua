async function startLearning() {

    const problem =
        document.getElementById("problem").value.trim();

    if (problem === "") {

        alert("Please enter a problem.");

        return;
    }


    const aiMessage =
        document.getElementById("aiMessage");


    aiMessage.innerText =
        "🤔 Thinking...";


    try {

        const result = await fetch(
            "http://localhost:3000/api/ask",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    type: "start",

                    problem: problem

                })
            }
        );


        const data = await result.json();


        if (data.error) {

            aiMessage.innerText =
                data.error;

            return;
        }


        aiMessage.innerText =
            data.answer;


    } catch (error) {

        console.error(error);

        aiMessage.innerText =
            "❌ Could not connect to the AI server.";

    }

}



async function submitAnswer() {

    const problem =
        document.getElementById("problem").value.trim();

    const studentResponse =
        document.getElementById("studentResponse").value.trim();


    if (studentResponse === "") {

        alert("Please explain your thinking.");

        return;
    }


    const aiMessage =
        document.getElementById("aiMessage");


    aiMessage.innerText =
        "🤔 Thinking...";


    try {

        const result = await fetch(
            "http://localhost:3000/api/ask",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    type: "submit",

                    problem: problem,

                    studentResponse: studentResponse

                })
            }
        );


        const data = await result.json();


        if (data.error) {

            aiMessage.innerText =
                data.error;

            return;
        }


        aiMessage.innerText =
            data.answer;


    } catch (error) {

        console.error(error);

        aiMessage.innerText =
            "❌ Could not connect to the AI server.";

    }

}



async function getHint() {

    const problem =
        document.getElementById("problem").value.trim();


    if (problem === "") {

        alert("Please enter a problem first.");

        return;
    }


    const aiMessage =
        document.getElementById("aiMessage");


    aiMessage.innerText =
        "💡 Thinking...";


    try {

        const result = await fetch(
            "http://localhost:3000/api/ask",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    type: "hint",

                    problem: problem

                })
            }
        );


        const data = await result.json();


        if (data.error) {

            aiMessage.innerText =
                data.error;

            return;
        }


        aiMessage.innerText =
            data.answer;


    } catch (error) {

        console.error(error);

        aiMessage.innerText =
            "❌ Could not connect to the AI server.";

    }

}