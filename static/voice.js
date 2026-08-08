document.addEventListener("DOMContentLoaded", function () {

    const voiceButton =
        document.getElementById("voice-btn");

    const questionInput =
        document.querySelector(
            "textarea[name='question'], input[name='question']"
        );


    if (!voiceButton || !questionInput) {
        console.log("Voice button or question input not found.");
        return;
    }


    /* =====================================================
       CHECK BROWSER SUPPORT
    ===================================================== */

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        voiceButton.disabled = true;

        voiceButton.textContent =
            "🎤 Not Supported";

        console.log(
            "Speech Recognition is not supported."
        );

        return;
    }


    /* =====================================================
       CREATE RECOGNITION
    ===================================================== */

    const recognition =
        new SpeechRecognition();


    recognition.lang = "en-IN";

    recognition.continuous = false;

    recognition.interimResults = false;


    /* =====================================================
       VOICE BUTTON
    ===================================================== */

    voiceButton.addEventListener(
        "click",
        function () {

            try {

                recognition.start();

                voiceButton.textContent =
                    "🔴 Listening...";

                voiceButton.classList.add(
                    "recording"
                );

            } catch (error) {

                console.log(
                    "Recognition error:",
                    error
                );

            }

        }
    );


    /* =====================================================
       RESULT
    ===================================================== */

    recognition.onresult =
        function (event) {

            const text =
                event.results[0][0].transcript;


            questionInput.value =
                text;


            questionInput.dispatchEvent(
                new Event("input")
            );


            questionInput.focus();


            voiceButton.textContent =
                "🎤 Voice";

        };


    /* =====================================================
       STOP
    ===================================================== */

    recognition.onend =
        function () {

            voiceButton.textContent =
                "🎤 Voice";

            voiceButton.classList.remove(
                "recording"
            );

        };


    /* =====================================================
       ERROR
    ===================================================== */

    recognition.onerror =
        function (event) {

            console.log(
                "VOICE ERROR:",
                event.error
            );


            voiceButton.textContent =
                "🎤 Voice";


            voiceButton.classList.remove(
                "recording"
            );

        };

});