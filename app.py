from flask import Flask, render_template, request, redirect, session, jsonify, Response, send_file
import sqlite3
import json
import io
from datetime import datetime

import markdown
import ollama
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = "change-this-secret-key"

DB_NAME = "database.db"
MODEL_NAME = "llama3.2:1b"   # Faster model. Change to llama3.2 if you want the larger model.


# =========================================================
# DATABASE
# =========================================================

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def create_database():
    conn = get_db()
    cur = conn.cursor()

    # Users table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)

    # Chat history table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS chat_history(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL
        )
    """)

    # Migration for old databases which do not have created_at.
    columns = [row["name"] for row in cur.execute("PRAGMA table_info(chat_history)").fetchall()]
    if "created_at" not in columns:
        cur.execute(
            "ALTER TABLE chat_history ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        )

    conn.commit()
    conn.close()


create_database()


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():
    if "user" in session:
        return redirect("/chat")
    return redirect("/login")


# =========================================================
# SIGNUP
# =========================================================

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        if not username or not email or not password:
            return render_template(
                "signup.html",
                error="Please fill all fields."
            )

        if len(password) < 6:
            return render_template(
                "signup.html",
                error="Password must be at least 6 characters."
            )

        hashed_password = generate_password_hash(password)

        conn = get_db()
        try:
            conn.execute(
                "INSERT INTO users(username, email, password) VALUES(?,?,?)",
                (username, email, hashed_password)
            )
            conn.commit()
        except sqlite3.IntegrityError:
            conn.close()
            return render_template(
                "signup.html",
                error="Email already exists. Please login."
            )

        conn.close()
        return redirect("/login")

    return render_template("signup.html")


# =========================================================
# LOGIN
# =========================================================

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        conn = get_db()
        user = conn.execute(
            "SELECT * FROM users WHERE email=?",
            (email,)
        ).fetchone()
        conn.close()

        if user and check_password_hash(user["password"], password):
            session["user"] = user["username"]
            session["email"] = user["email"]
            return redirect("/chat")

        return render_template(
            "login.html",
            error="Invalid email or password."
        )

    return render_template("login.html")


# =========================================================
# CHAT PAGE
# =========================================================

@app.route("/chat")
def chat():
    if "user" not in session:
        return redirect("/login")

    return render_template(
        "index.html",
        username=session["user"],
        email=session.get("email", ""),
        model=MODEL_NAME
    )


# =========================================================
# STREAMING AI RESPONSE
# =========================================================

@app.route("/stream", methods=["POST"])
def stream():
    if "user" not in session:
        return jsonify({"error": "Please login first."}), 401

    data = request.get_json(silent=True) or {}
    question = data.get("question", "").strip()

    if not question:
        return jsonify({"error": "Question cannot be empty."}), 400

    username = session["user"]

    def generate():
        full_answer = ""

        try:
            stream_response = ollama.chat(
                model=MODEL_NAME,
                messages=[
                    {
                        "role": "user",
                        "content": question
                    }
                ],
                stream=True
            )

            for chunk in stream_response:
                content = chunk["message"]["content"]
                full_answer += content

                yield json.dumps({
                    "type": "chunk",
                    "content": content
                }) + "\n"

            # Save only after the model finishes successfully.
            conn = get_db()
            conn.execute(
                """
                INSERT INTO chat_history(username, question, answer)
                VALUES(?,?,?)
                """,
                (username, question, full_answer)
            )
            conn.commit()
            conn.close()

            yield json.dumps({
                "type": "done"
            }) + "\n"

        except Exception as e:
            yield json.dumps({
                "type": "error",
                "content": str(e)
            }) + "\n"

    return Response(
        generate(),
        mimetype="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


# =========================================================
# HISTORY
# =========================================================

@app.route("/history")
def history():
    if "user" not in session:
        return redirect("/login")

    conn = get_db()
    chats = conn.execute(
        """
        SELECT id, question, answer, created_at
        FROM chat_history
        WHERE username=?
        ORDER BY id DESC
        """,
        (session["user"],)
    ).fetchall()
    conn.close()

    return render_template(
        "history.html",
        chats=chats,
        username=session["user"]
    )


# =========================================================
# DELETE ONE CHAT
# =========================================================

@app.post("/delete/<int:chat_id>")
def delete_chat(chat_id):
    if "user" not in session:
        return redirect("/login")

    conn = get_db()
    conn.execute(
        "DELETE FROM chat_history WHERE id=? AND username=?",
        (chat_id, session["user"])
    )
    conn.commit()
    conn.close()

    return redirect("/history")


# =========================================================
# CLEAR ALL HISTORY
# =========================================================

@app.post("/clear-history")
def clear_history():
    if "user" not in session:
        return redirect("/login")

    conn = get_db()
    conn.execute(
        "DELETE FROM chat_history WHERE username=?",
        (session["user"],)
    )
    conn.commit()
    conn.close()

    return redirect("/history")


# =========================================================
# PDF EXPORT
# =========================================================

@app.get("/export-pdf")
def export_pdf():
    if "user" not in session:
        return redirect("/login")

    conn = get_db()
    chats = conn.execute(
        """
        SELECT question, answer, created_at
        FROM chat_history
        WHERE username=?
        ORDER BY id ASC
        """,
        (session["user"],)
    ).fetchall()
    conn.close()

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    left = 45
    y = height - 50

    pdf.setTitle("AI Chat History")
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(left, y, "AI Question Answering System")
    y -= 25

    pdf.setFont("Helvetica", 10)
    pdf.drawString(left, y, f"User: {session['user']}")
    y -= 30

    def draw_wrapped(text, font="Helvetica", size=10, line_height=14):
        nonlocal y
        pdf.setFont(font, size)

        words = str(text).replace("\r", "").split()
        line = ""

        for word in words:
            test = (line + " " + word).strip()
            if pdf.stringWidth(test, font, size) <= width - 90:
                line = test
            else:
                if y < 55:
                    pdf.showPage()
                    y = height - 50
                    pdf.setFont(font, size)
                pdf.drawString(left, y, line)
                y -= line_height
                line = word

        if line:
            if y < 55:
                pdf.showPage()
                y = height - 50
                pdf.setFont(font, size)
            pdf.drawString(left, y, line)
            y -= line_height

    if not chats:
        pdf.drawString(left, y, "No chat history found.")
    else:
        for i, chat in enumerate(chats, start=1):
            if y < 100:
                pdf.showPage()
                y = height - 50

            pdf.setFont("Helvetica-Bold", 11)
            pdf.drawString(left, y, f"{i}. Question")
            y -= 18

            draw_wrapped(chat["question"])
            y -= 5

            pdf.setFont("Helvetica-Bold", 11)
            pdf.drawString(left, y, "Answer")
            y -= 18

            draw_wrapped(chat["answer"])
            y -= 18

            pdf.setFont("Helvetica", 8)
            pdf.drawString(left, y, f"Date: {chat['created_at'] or ''}")
            y -= 25

    pdf.save()
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name="AI_Chat_History.pdf",
        mimetype="application/pdf"
    )


# =========================================================
# LOGOUT
# =========================================================

@app.get("/logout")
def logout():
    session.clear()
    return redirect("/login")


# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":
    app.run(debug=True)
