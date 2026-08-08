document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       COPY + READ + DOWNLOAD
    ===================================================== */

    document.querySelectorAll(".answer-content").forEach(function (answer) {

        if (answer.dataset.featuresAdded === "true") {
            return;
        }

        answer.dataset.featuresAdded = "true";

        const toolbar = document.createElement("div");
        toolbar.className = "askai-answer-toolbar";


        /* ================= COPY ================= */

        const copyButton = document.createElement("button");

        copyButton.type = "button";
        copyButton.className = "askai-feature-button";
        copyButton.textContent = "📋 Copy";

        copyButton.addEventListener("click", async function () {

            const text = answer.innerText.trim();

            if (!text) {
                return;
            }

            try {

                await navigator.clipboard.writeText(text);

                copyButton.textContent = "✓ Copied";

                setTimeout(function () {
                    copyButton.textContent = "📋 Copy";
                }, 1500);

            } catch (error) {

                const textarea =
                    document.createElement("textarea");

                textarea.value = text;

                document.body.appendChild(textarea);

                textarea.select();

                document.execCommand("copy");

                textarea.remove();

                copyButton.textContent = "✓ Copied";

                setTimeout(function () {
                    copyButton.textContent = "📋 Copy";
                }, 1500);
            }

        });

        toolbar.appendChild(copyButton);


        /* ================= READ / STOP ================= */

        if ("speechSynthesis" in window) {

            const speakButton =
                document.createElement("button");

            speakButton.type = "button";
            speakButton.className =
                "askai-feature-button";

            speakButton.textContent = "🔊 Read";

            let speaking = false;

            speakButton.addEventListener(
                "click",
                function () {

                    /* STOP */

                    if (speaking) {

                        window.speechSynthesis.cancel();

                        speaking = false;

                        speakButton.textContent =
                            "🔊 Read";

                        return;
                    }


                    /* START */

                    const text =
                        answer.innerText.trim();

                    if (!text) {
                        return;
                    }

                    window.speechSynthesis.cancel();

                    const speech =
                        new SpeechSynthesisUtterance(text);

                    speech.rate = 0.95;
                    speech.pitch = 1;


                    speech.onstart =
                        function () {

                            speaking = true;

                            speakButton.textContent =
                                "⏹ Stop";
                        };


                    speech.onend =
                        function () {

                            speaking = false;

                            speakButton.textContent =
                                "🔊 Read";
                        };


                    speech.onerror =
                        function () {

                            speaking = false;

                            speakButton.textContent =
                                "🔊 Read";
                        };


                    window.speechSynthesis.speak(
                        speech
                    );
                }
            );

            toolbar.appendChild(speakButton);
        }


        /* ================= DOWNLOAD ================= */

        const downloadButton =
            document.createElement("button");

        downloadButton.type = "button";

        downloadButton.className =
            "askai-feature-button";

        downloadButton.textContent =
            "⬇ Download";


        downloadButton.addEventListener(
            "click",
            function () {

                const text =
                    answer.innerText.trim();

                if (!text) {
                    return;
                }

                const blob =
                    new Blob(
                        [text],
                        {
                            type:
                                "text/plain;charset=utf-8"
                        }
                    );


                const url =
                    URL.createObjectURL(blob);


                const link =
                    document.createElement("a");

                link.href = url;

                link.download =
                    "AskAI-Answer.txt";


                document.body.appendChild(link);

                link.click();

                link.remove();

                URL.revokeObjectURL(url);
            }
        );


        toolbar.appendChild(downloadButton);


        answer.parentElement.insertBefore(
            toolbar,
            answer
        );

    });


    /* =====================================================
       VOICE INPUT
    ===================================================== */

    const questionInput =
        document.querySelector(
            'textarea[name="question"], input[name="question"], #question'
        );


    if (
        questionInput &&
        (
            "webkitSpeechRecognition" in window ||
            "SpeechRecognition" in window
        )
    ) {

        const parent =
            questionInput.parentElement;


        if (
            parent &&
            !parent.querySelector(
                ".askai-voice-button"
            )
        ) {

            const voiceButton =
                document.createElement("button");

            voiceButton.type = "button";

            voiceButton.className =
                "askai-voice-button";

            voiceButton.textContent =
                "🎙️";

            voiceButton.title =
                "Ask using your voice";


            parent.appendChild(
                voiceButton
            );


            const SpeechRecognition =
                window.SpeechRecognition ||
                window.webkitSpeechRecognition;


            const recognition =
                new SpeechRecognition();


            recognition.continuous = false;

            recognition.interimResults = false;

            recognition.lang = "en-IN";


            let listening = false;


            voiceButton.addEventListener(
                "click",
                function () {

                    if (listening) {

                        recognition.stop();

                        return;
                    }


                    try {

                        recognition.start();

                    } catch (error) {

                        console.log(
                            "Voice error:",
                            error
                        );
                    }
                }
            );


            recognition.onstart =
                function () {

                    listening = true;

                    voiceButton.textContent =
                        "⏹️";
                };


            recognition.onresult =
                function (event) {

                    const transcript =
                        event.results[0][0]
                        .transcript;


                    if (
                        questionInput.value.trim()
                    ) {

                        questionInput.value +=
                            " " + transcript;

                    } else {

                        questionInput.value =
                            transcript;
                    }


                    questionInput.dispatchEvent(
                        new Event(
                            "input",
                            {
                                bubbles: true
                            }
                        )
                    );
                };


            recognition.onerror =
                function () {

                    listening = false;

                    voiceButton.textContent =
                        "🎙️";
                };


            recognition.onend =
                function () {

                    listening = false;

                    voiceButton.textContent =
                        "🎙️";
                };
        }
    }


    /* ================= STOP ON PAGE CLOSE ================= */

    window.addEventListener(
        "beforeunload",
        function () {

            if (
                "speechSynthesis" in window
            ) {

                window.speechSynthesis.cancel();
            }
        }
    );

});
