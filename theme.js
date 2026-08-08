document.addEventListener("DOMContentLoaded", function () {

    /* ================= THEME STYLE ================= */

    const style = document.createElement("style");

    style.textContent = `
        body.dark-theme {
            background: #111827 !important;
            color: #f9fafb !important;
        }

        body.dark-theme .sidebar {
            background: #1f2937 !important;
            border-color: #374151 !important;
        }

        body.dark-theme .brand h1,
        body.dark-theme .top-header h2,
        body.dark-theme .dashboard-title h1,
        body.dark-theme .history-toolbar h1 {
            color: #f9fafb !important;
        }

        body.dark-theme .brand span,
        body.dark-theme .top-header p,
        body.dark-theme .dashboard-title p,
        body.dark-theme .history-toolbar p {
            color: #d1d5db !important;
        }

        body.dark-theme .nav-item {
            color: #d1d5db !important;
        }

        body.dark-theme .nav-item:hover,
        body.dark-theme .nav-item.active {
            background: #374151 !important;
            color: #ffffff !important;
        }

        body.dark-theme .main-content {
            background: #111827 !important;
        }

        body.dark-theme .stat-card,
        body.dark-theme .history-card,
        body.dark-theme .chat-card,
        body.dark-theme .welcome,
        body.dark-theme .input-area,
        body.dark-theme .dashboard-card {
            background: #1f2937 !important;
            border-color: #374151 !important;
            color: #f9fafb !important;
        }

        body.dark-theme .stat-card h3,
        body.dark-theme .history-question h3,
        body.dark-theme .history-answer,
        body.dark-theme .answer-content {
            color: #f9fafb !important;
        }

        body.dark-theme textarea,
        body.dark-theme input {
            background: #1f2937 !important;
            color: #ffffff !important;
            border-color: #4b5563 !important;
        }

        body.dark-theme textarea::placeholder,
        body.dark-theme input::placeholder {
            color: #9ca3af !important;
        }

        .theme-toggle {
            position: fixed;
            right: 25px;
            bottom: 25px;
            width: 48px;
            height: 48px;
            border: none;
            border-radius: 50%;
            background: #ffffff;
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            cursor: pointer;
            font-size: 21px;
            z-index: 9999;
            transition: 0.2s;
        }

        .theme-toggle:hover {
            transform: translateY(-2px);
        }

        body.dark-theme .theme-toggle {
            background: #374151;
            color: #ffffff;
        }
    `;

    document.head.appendChild(style);


    /* ================= THEME BUTTON ================= */

    const button = document.createElement("button");

    button.type = "button";
    button.className = "theme-toggle";
    button.title = "Toggle dark/light mode";


    /* ================= SAVED THEME ================= */

    const savedTheme =
        localStorage.getItem("askai-theme");


    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark-theme"
        );

        button.textContent = "☀️";

    } else {

        button.textContent = "🌙";
    }


    /* ================= BUTTON CLICK ================= */

    button.addEventListener(
        "click",
        function () {

            document.body.classList.toggle(
                "dark-theme"
            );


            const darkMode =
                document.body.classList.contains(
                    "dark-theme"
                );


            if (darkMode) {

                button.textContent = "☀️";

                localStorage.setItem(
                    "askai-theme",
                    "dark"
                );

            } else {

                button.textContent = "🌙";

                localStorage.setItem(
                    "askai-theme",
                    "light"
                );
            }

        }
    );


    document.body.appendChild(button);

});