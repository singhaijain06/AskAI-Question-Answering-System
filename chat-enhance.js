document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       RUN ONLY ON CHAT PAGE
    ===================================================== */

    const chatForm = document.querySelector(".chat-form");

    if (!chatForm) {
        return;
    }


    /* =====================================================
       QUESTION INPUT
    ===================================================== */

    const questionInput = chatForm.querySelector(
        "textarea[name='question'], input[name='question']"
    );

    if (!questionInput) {
        return;
    }


    /* =====================================================
       VOICE BUTTON
    ===================================================== */

    const voiceButton = document.getElementById("voice-btn");


    /* =====================================================
       CHARACTER COUNTER
    ===================================================== */

    const counter = document.createElement("div");

    counter.className = "question-counter";
    counter.textContent = "0 characters";

    if (questionInput.parentElement) {
        questionInput.parentElement.appendChild(counter);
    }


    function updateCounter() {

        const length = questionInput.value.length;

        counter.textContent = length + " characters";
    }


    questionInput.addEventListener(
        "input",
        updateCounter
    );

    updateCounter();


    /* =====================================================
       ENTER TO SEND
       SHIFT + ENTER = NEW LINE
    ===================================================== */

    questionInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                if (questionInput.value.trim()) {

                    chatForm.requestSubmit();

                }
            }
        }
    );


    /* =====================================================
       QUICK QUESTIONS
    ===================================================== */

    const quickBox = document.createElement("div");

    quickBox.className = "quick-question-box";

    quickBox.innerHTML = `

        <div class="quick-title">
            ✨ Quick Questions
        </div>

        <div class="quick-buttons">

            <button type="button"
                data-question="What is Artificial Intelligence?">
                🤖 What is AI?
            </button>

            <button type="button"
                data-question="Explain Machine Learning in simple words.">
                🧠 Explain ML
            </button>

            <button type="button"
                data-question="What is Python and where is it used?">
                🐍 Python
            </button>

            <button type="button"
                data-question="What is the difference between AI and ML?">
                📚 AI vs ML
            </button>

        </div>
    `;


    chatForm.parentElement.insertBefore(
        quickBox,
        chatForm
    );


    /* =====================================================
       QUICK QUESTION CLICK
    ===================================================== */

    const quickButtons =
        quickBox.querySelectorAll(
            "[data-question]"
        );


    quickButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    questionInput.value =
                        button.dataset.question;

                    updateCounter();

                    questionInput.focus();

                }
            );

        }
    );


    /* =====================================================
       VOICE INPUT
    ===================================================== */

    if (
        voiceButton &&
        "webkitSpeechRecognition" in window
    ) {

        const recognition =
            new webkitSpeechRecognition();

        recognition.lang = "en-IN";

        recognition.continuous = false;

        recognition.interimResults = false;


        voiceButton.addEventListener(
            "click",
            function () {

                try {

                    recognition.start();

                    voiceButton.innerHTML = "🔴";

                    voiceButton.classList.add(
                        "recording"
                    );

                } catch (error) {

                    console.log(
                        "Voice already active"
                    );

                }

            }
        );


        recognition.onresult =
            function (event) {

                const text =
                    event.results[0][0].transcript;

                questionInput.value = text;

                questionInput.dispatchEvent(
                    new Event("input")
                );

                questionInput.focus();

            };


        recognition.onend =
            function () {

                voiceButton.innerHTML = "🎤";

                voiceButton.classList.remove(
                    "recording"
                );

            };


        recognition.onerror =
            function (event) {

                console.log(
                    "Voice error:",
                    event.error
                );

                voiceButton.innerHTML = "🎤";

                voiceButton.classList.remove(
                    "recording"
                );

            };

    }


    /* =====================================================
       BROWSER DOES NOT SUPPORT VOICE
    ===================================================== */

    else if (voiceButton) {

        voiceButton.disabled = true;

        voiceButton.title =
            "Voice input is not supported in this browser";

        console.log(
            "Speech Recognition is not supported."
        );

    }


    /* =====================================================
       AUTO SCROLL
    ===================================================== */

    setTimeout(
        function () {

            const answer =
                document.querySelector(
                    ".answer-content, .conversation, .message"
                );

            if (answer) {

                answer.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }

        },
        300
    );


    /* =====================================================
       SUBMIT LOADING
    ===================================================== */

    chatForm.addEventListener(
        "submit",
        function () {

            const sendButton =
                chatForm.querySelector(
                    "button[type='submit']"
                );

            if (sendButton) {

                sendButton.disabled = true;

                sendButton.dataset.originalText =
                    sendButton.innerHTML;

                sendButton.innerHTML =
                    "⏳ Thinking...";

            }

        }
    );


    /* =====================================================
       READ ANSWER
    ===================================================== */

    const answerContent =
        document.querySelector(
            ".answer-content"
        );


    if (answerContent) {

        const text =
            answerContent.innerText.trim();


        if (text) {

            const voiceControls =
                document.createElement("div");

            voiceControls.className =
                "voice-controls";


            voiceControls.innerHTML = `

                <button
                    type="button"
                    id="read-answer-btn">

                    🔊 Read Answer

                </button>

                <button
                    type="button"
                    id="stop-reading-btn">

                    ⏹ Stop

                </button>

            `;


            answerContent.parentElement
                .appendChild(
                    voiceControls
                );


            const readButton =
                document.getElementById(
                    "read-answer-btn"
                );


            const stopButton =
                document.getElementById(
                    "stop-reading-btn"
                );


            readButton.addEventListener(
                "click",
                function () {

                    speechSynthesis.cancel();

                    const speech =
                        new SpeechSynthesisUtterance(
                            text
                        );

                    speech.lang = "en-IN";

                    speech.rate = 0.95;

                    speech.pitch = 1;

                    speechSynthesis.speak(
                        speech
                    );

                }
            );


            stopButton.addEventListener(
                "click",
                function () {

                    speechSynthesis.cancel();

                }
            );

        }

    }

});