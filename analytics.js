document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       ONLY RUN ON DASHBOARD
       ===================================================== */

    const dashboardPage =
        document.querySelector(".dashboard-page");

    if (!dashboardPage) {
        return;
    }


    /* =====================================================
       CREATE ANALYTICS SECTION
       ===================================================== */

    const analyticsSection =
        document.createElement("section");

    analyticsSection.className =
        "askai-analytics-section";


    analyticsSection.innerHTML = `

        <div class="analytics-heading">

            <div>
                <h2>📊 AI Activity Analytics</h2>

                <p>
                    Track your AskAI usage and recent activity.
                </p>
            </div>

        </div>


        <div class="analytics-cards">

            <div class="analytics-card">

                <div class="analytics-icon">
                    💬
                </div>

                <div>
                    <span>Total Questions</span>
                    <strong id="analyticsTotal">
                        0
                    </strong>
                </div>

            </div>


            <div class="analytics-card">

                <div class="analytics-icon">
                    📅
                </div>

                <div>
                    <span>Today's Questions</span>
                    <strong id="analyticsToday">
                        0
                    </strong>
                </div>

            </div>


            <div class="analytics-card">

                <div class="analytics-icon">
                    👥
                </div>

                <div>
                    <span>Registered Users</span>
                    <strong id="analyticsUsers">
                        0
                    </strong>
                </div>

            </div>

        </div>


        <div class="analytics-grid">


            <div class="analytics-panel">

                <div class="panel-header">

                    <div>
                        <h3>📈 7-Day Activity</h3>

                        <p>
                            Your questions over the last 7 days.
                        </p>
                    </div>

                </div>


                <div
                    id="activityChart"
                    class="activity-chart">
                </div>

            </div>


            <div class="analytics-panel">

                <div class="panel-header">

                    <div>
                        <h3>💬 Recent Questions</h3>

                        <p>
                            Your latest conversations.
                        </p>
                    </div>

                </div>


                <div
                    id="recentQuestions"
                    class="recent-questions">
                </div>

            </div>


        </div>

    `;


    dashboardPage.appendChild(
        analyticsSection
    );


    /* =====================================================
       LOAD ANALYTICS
       ===================================================== */

    fetch("/api/analytics")

        .then(function (response) {

            if (!response.ok) {
                throw new Error(
                    "Analytics request failed"
                );
            }

            return response.json();
        })


        .then(function (data) {

            if (data.error) {
                throw new Error(data.error);
            }


            /* ---------------------------------------------
               STATISTICS
               --------------------------------------------- */

            document.getElementById(
                "analyticsTotal"
            ).textContent =
                data.total_questions;


            document.getElementById(
                "analyticsToday"
            ).textContent =
                data.today_questions;


            document.getElementById(
                "analyticsUsers"
            ).textContent =
                data.total_users;


            /* ---------------------------------------------
               CHART
               --------------------------------------------- */

            const chart =
                document.getElementById(
                    "activityChart"
                );


            if (
                !data.activity ||
                data.activity.length === 0
            ) {

                chart.innerHTML = `
                    <div class="no-activity">
                        No activity yet.
                    </div>
                `;

            } else {

                const max =
                    Math.max(
                        ...data.activity.map(
                            item => item.count
                        ),
                        1
                    );


                data.activity.forEach(
                    function (item) {

                        const wrapper =
                            document.createElement(
                                "div"
                            );

                        wrapper.className =
                            "activity-item";


                        const bar =
                            document.createElement(
                                "div"
                            );

                        bar.className =
                            "activity-bar";


                        const height =
                            Math.max(
                                8,
                                (item.count / max) * 150
                            );


                        bar.style.height =
                            height + "px";


                        bar.title =
                            item.count +
                            " question(s)";


                        const label =
                            document.createElement(
                                "span"
                            );

                        label.className =
                            "activity-label";


                        label.textContent =
                            item.date.slice(5);


                        wrapper.appendChild(bar);

                        wrapper.appendChild(label);

                        chart.appendChild(wrapper);
                    }
                );
            }


            /* ---------------------------------------------
               RECENT QUESTIONS
               --------------------------------------------- */

            const recent =
                document.getElementById(
                    "recentQuestions"
                );


            if (
                !data.recent_questions ||
                data.recent_questions.length === 0
            ) {

                recent.innerHTML = `
                    <div class="no-activity">
                        No questions yet.
                    </div>
                `;

            } else {

                data.recent_questions.forEach(
                    function (item) {

                        const question =
                            document.createElement(
                                "div"
                            );

                        question.className =
                            "recent-question";


                        question.innerHTML = `

                            <div class="recent-icon">
                                💬
                            </div>

                            <div class="recent-content">

                                <strong>
                                    ${escapeHTML(
                                        item.question
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        item.date || ""
                                    )}
                                </small>

                            </div>

                        `;


                        recent.appendChild(
                            question
                        );
                    }
                );
            }

        })


        .catch(function (error) {

            console.error(
                "Analytics Error:",
                error
            );

            document.getElementById(
                "activityChart"
            ).innerHTML = `
                <div class="no-activity">
                    Analytics unavailable.
                </div>
            `;
        });


    /* =====================================================
       SECURITY HELPER
       ===================================================== */

    function escapeHTML(text) {

        const div =
            document.createElement("div");

        div.textContent =
            text;

        return div.innerHTML;
    }

});