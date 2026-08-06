import os
import sqlite3
import re

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    session,
    flash
)

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

from werkzeug.utils import secure_filename

import markdown
import ollama

from PyPDF2 import PdfReader

import pytesseract
from pdf2image import convert_from_path


# =========================================================
# FLASK CONFIGURATION
# =========================================================

app = Flask(__name__)

app.secret_key = "askai_super_secret_key_change_this"

UPLOAD_FOLDER = "uploads"

ALLOWED_EXTENSIONS = {"pdf"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Maximum PDF size = 20 MB
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# =========================================================
# DATABASE
# =========================================================

DATABASE = "database.db"


def get_db():

    conn = sqlite3.connect(DATABASE)

    conn.row_factory = sqlite3.Row

    return conn


def create_database():

    conn = get_db()

    cursor = conn.cursor()

    # -----------------------------------------------------
    # USERS
    # -----------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)

    # -----------------------------------------------------
    # CHAT HISTORY
    # -----------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_history(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # -----------------------------------------------------
    # PDF DOCUMENTS
    # -----------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pdf_documents(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            pdf_name TEXT NOT NULL,
            text_file TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()

    conn.close()


create_database()


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def allowed_file(filename):

    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


def clean_text(text):

    if not text:
        return ""

    text = re.sub(r"\s+", " ", text)

    return text.strip()


def get_user_pdf():

    if "user" not in session:
        return None

    conn = get_db()

    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM pdf_documents
        WHERE username=?
        ORDER BY id DESC
        LIMIT 1
    """, (session["user"],))

    pdf = cursor.fetchone()

    conn.close()

    return pdf


# =========================================================
# PDF TEXT EXTRACTION
# =========================================================

def extract_pdf_text(pdf_path):

    extracted_text = ""

    # -----------------------------------------------------
    # NORMAL PDF TEXT EXTRACTION
    # -----------------------------------------------------

    try:

        reader = PdfReader(pdf_path)

        for page in reader.pages:

            try:

                page_text = page.extract_text()

                if page_text:

                    extracted_text += "\n" + page_text

            except Exception as e:

                print("PAGE TEXT ERROR:", e)

    except Exception as e:

        print("PDF READER ERROR:", e)

    extracted_text = clean_text(extracted_text)

    # -----------------------------------------------------
    # OCR FALLBACK
    # -----------------------------------------------------

    if len(extracted_text) < 50:

        print("No readable PDF text found.")
        print("Starting OCR...")

        try:

            images = convert_from_path(
                pdf_path,
                dpi=150
            )

            ocr_text = ""

            for index, image in enumerate(images):

                print(
                    f"OCR page {index + 1}"
                )

                text = pytesseract.image_to_string(
                    image
                )

                ocr_text += "\n" + text

            extracted_text = clean_text(
                ocr_text
            )

        except Exception as e:

            print("OCR ERROR:", e)

    return extracted_text


# =========================================================
# FIND RELEVANT PDF TEXT
# =========================================================

def find_relevant_text(
    full_text,
    question,
    max_chars=10000
):

    if not full_text:

        return ""

    # -----------------------------------------------------
    # Split PDF into sentences
    # -----------------------------------------------------

    chunks = re.split(
        r"(?<=[.!?])\s+",
        full_text
    )

    # -----------------------------------------------------
    # Extract question words
    # -----------------------------------------------------

    words = re.findall(
        r"\b[a-zA-Z]{3,}\b",
        question.lower()
    )

    stop_words = {
        "what",
        "when",
        "where",
        "which",
        "who",
        "whom",
        "this",
        "that",
        "from",
        "with",
        "about",
        "explain",
        "tell",
        "give",
        "does",
        "the",
        "and",
        "are",
        "was",
        "were",
        "how",
        "why",
        "can",
        "could",
        "would",
        "should",
        "please"
    }

    keywords = [
        word
        for word in words
        if word not in stop_words
    ]

    scored_chunks = []

    # -----------------------------------------------------
    # Score chunks
    # -----------------------------------------------------

    for chunk in chunks:

        lower_chunk = chunk.lower()

        score = 0

        for keyword in keywords:

            if keyword in lower_chunk:

                score += 1

        if score > 0:

            scored_chunks.append(
                (
                    score,
                    chunk
                )
            )

    scored_chunks.sort(
        key=lambda x: x[0],
        reverse=True
    )

    selected = []

    current_length = 0

    # -----------------------------------------------------
    # Select relevant chunks
    # -----------------------------------------------------

    for score, chunk in scored_chunks:

        if current_length + len(chunk) > max_chars:

            break

        selected.append(chunk)

        current_length += len(chunk)

    # -----------------------------------------------------
    # If no keyword match
    # -----------------------------------------------------

    if not selected:

        return full_text[:max_chars]

    return " ".join(selected)


# =========================================================
# NORMAL AI
# =========================================================

def ask_ai(question):

    try:

        response = ollama.chat(

            model="llama3.2:1b",

            messages=[
                {
                    "role": "user",
                    "content": question
                }
            ]

        )

        answer = response["message"]["content"]

        return answer

    except Exception as e:

        print("OLLAMA ERROR:", e)

        return (
            "AI Error: "
            + str(e)
        )


# =========================================================
# PDF AI
# =========================================================

def ask_pdf_ai(
    question,
    pdf_context
):

    prompt = f"""
You are AskAI, a professional PDF Question Answering Assistant.

Answer the user's question using ONLY the PDF context.

Rules:

1. Use the provided PDF context.
2. Do not invent information.
3. If the answer is not available, say:
"The answer was not found in the uploaded PDF."
4. Explain the answer clearly.
5. Keep the answer easy to understand.

PDF CONTEXT:
-------------------------
{pdf_context}
-------------------------

USER QUESTION:
{question}

ANSWER:
"""

    try:

        response = ollama.chat(

            model="llama3.2:1b",

            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]

        )

        answer = response["message"]["content"]

        return answer

    except Exception as e:

        print("PDF AI ERROR:", e)

        return (
            "AI Error: "
            + str(e)
        )


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():

    if "user" not in session:

        return redirect("/login")

    return redirect("/chat")


# =========================================================
# LOGIN
# =========================================================

@app.route(
    "/login",
    methods=["GET", "POST"]
)
def login():

    if request.method == "POST":

        email = request.form.get(
            "email",
            ""
        ).strip()

        password = request.form.get(
            "password",
            ""
        )

        conn = get_db()

        cursor = conn.cursor()

        cursor.execute("""
            SELECT *
            FROM users
            WHERE email=?
        """, (email,))

        user = cursor.fetchone()

        conn.close()

        if user and check_password_hash(
            user["password"],
            password
        ):

            session["user"] = user["username"]

            flash(
                "Login successful!",
                "success"
            )

            return redirect("/dashboard")

        flash(
            "Invalid email or password.",
            "error"
        )

    return render_template(
        "login.html"
    )


# =========================================================
# SIGNUP
# =========================================================

@app.route(
    "/signup",
    methods=["GET", "POST"]
)
def signup():

    if request.method == "POST":

        username = request.form.get(
            "username",
            ""
        ).strip()

        email = request.form.get(
            "email",
            ""
        ).strip()

        password = request.form.get(
            "password",
            ""
        )

        # -------------------------------------------------
        # Validation
        # -------------------------------------------------

        if not username or not email or not password:

            flash(
                "Please fill all fields.",
                "error"
            )

            return redirect("/signup")

        if len(password) < 6:

            flash(
                "Password must contain at least 6 characters.",
                "error"
            )

            return redirect("/signup")

        hashed_password = generate_password_hash(
            password
        )

        conn = get_db()

        cursor = conn.cursor()

        try:

            cursor.execute(
                """
                INSERT INTO users(
                    username,
                    email,
                    password
                )
                VALUES(?,?,?)
                """,
                (
                    username,
                    email,
                    hashed_password
                )
            )

            conn.commit()

            flash(
                "Account created successfully!",
                "success"
            )

            return redirect("/login")

        except sqlite3.IntegrityError:

            flash(
                "Email already exists.",
                "error"
            )

        finally:

            conn.close()

    return render_template(
        "signup.html"
    )


# =========================================================
# LOGOUT
# =========================================================

@app.route("/logout")
def logout():

    session.clear()

    flash(
        "You have been logged out.",
        "success"
    )

    return redirect("/login")


# =========================================================
# DASHBOARD
# =========================================================

@app.route("/dashboard")
def dashboard():

    if "user" not in session:

        return redirect("/login")

    username = session["user"]

    conn = get_db()

    cursor = conn.cursor()

    # -----------------------------------------------------
    # Total Questions
    # -----------------------------------------------------

    cursor.execute("""
        SELECT COUNT(*)
        FROM chat_history
        WHERE username=?
    """, (username,))

    total_questions = cursor.fetchone()[0]

    # -----------------------------------------------------
    # Total PDFs
    # -----------------------------------------------------

    cursor.execute("""
        SELECT COUNT(*)
        FROM pdf_documents
        WHERE username=?
    """, (username,))

    total_pdfs = cursor.fetchone()[0]

    # -----------------------------------------------------
    # Total Users
    # -----------------------------------------------------

    cursor.execute("""
        SELECT COUNT(*)
        FROM users
    """)

    total_users = cursor.fetchone()[0]

    # -----------------------------------------------------
    # Recent Chats
    # -----------------------------------------------------

    cursor.execute("""
        SELECT *
        FROM chat_history
        WHERE username=?
        ORDER BY id DESC
        LIMIT 5
    """, (username,))

    recent_chats = cursor.fetchall()

    # -----------------------------------------------------
    # Latest PDF
    # -----------------------------------------------------

    cursor.execute("""
        SELECT *
        FROM pdf_documents
        WHERE username=?
        ORDER BY id DESC
        LIMIT 1
    """, (username,))

    latest_pdf = cursor.fetchone()

    conn.close()

    return render_template(
        "dashboard.html",
        username=username,
        total_questions=total_questions,
        total_pdfs=total_pdfs,
        total_users=total_users,
        recent_chats=recent_chats,
        latest_pdf=latest_pdf
    )


# =========================================================
# CHAT
# =========================================================

@app.route(
    "/chat",
    methods=["GET", "POST"]
)
def chat():

    if "user" not in session:

        return redirect("/login")

    answer = ""

    question = ""

    pdf = get_user_pdf()

    if request.method == "POST":

        question = request.form.get(
            "question",
            ""
        ).strip()

        if not question:

            flash(
                "Please enter a question.",
                "error"
            )

            return redirect("/chat")

        try:

            # ------------------------------------------------
            # PDF AVAILABLE
            # ------------------------------------------------

            if pdf:

                text_file = pdf["text_file"]

                text_path = os.path.join(
                    app.config["UPLOAD_FOLDER"],
                    text_file
                )

                if os.path.exists(text_path):

                    with open(
                        text_path,
                        "r",
                        encoding="utf-8"
                    ) as file:

                        full_text = file.read()

                    relevant_text = find_relevant_text(
                        full_text,
                        question
                    )

                    answer = ask_pdf_ai(
                        question,
                        relevant_text
                    )

                else:

                    answer = ask_ai(
                        question
                    )

            # ------------------------------------------------
            # NORMAL AI
            # ------------------------------------------------

            else:

                answer = ask_ai(
                    question
                )

            # ------------------------------------------------
            # SAVE HISTORY
            # ------------------------------------------------

            answer_html = markdown.markdown(
                answer
            )

            conn = get_db()

            cursor = conn.cursor()

            cursor.execute(
                """
                INSERT INTO chat_history(
                    username,
                    question,
                    answer
                )
                VALUES(?,?,?)
                """,
                (
                    session["user"],
                    question,
                    answer_html
                )
            )

            conn.commit()

            conn.close()

        except Exception as e:

            print(
                "CHAT ERROR:",
                e
            )

            answer = (
                "Something went wrong: "
                + str(e)
            )

    return render_template(
        "index.html",
        username=session["user"],
        answer=(
            markdown.markdown(answer)
            if answer
            else ""
        ),
        question=question,
        pdf=pdf
    )


# =========================================================
# PDF UPLOAD
# =========================================================

@app.route(
    "/upload_pdf",
    methods=["POST"]
)
def upload_pdf():

    if "user" not in session:

        return redirect("/login")

    if "pdf" not in request.files:

        flash(
            "No PDF selected.",
            "error"
        )

        return redirect("/chat")

    file = request.files["pdf"]

    if file.filename == "":

        flash(
            "Please select a PDF.",
            "error"
        )

        return redirect("/chat")

    if not allowed_file(
        file.filename
    ):

        flash(
            "Only PDF files are allowed.",
            "error"
        )

        return redirect("/chat")

    username = secure_filename(
        session["user"]
    )

    original_name = secure_filename(
        file.filename
    )

    # -----------------------------------------------------
    # Remove previous PDF
    # -----------------------------------------------------

    old_pdf = get_user_pdf()

    if old_pdf:

        try:

            old_pdf_path = os.path.join(
                app.config["UPLOAD_FOLDER"],
                username + "_" + old_pdf["pdf_name"]
            )

            if os.path.exists(old_pdf_path):

                os.remove(old_pdf_path)

            if old_pdf["text_file"]:

                old_text_path = os.path.join(
                    app.config["UPLOAD_FOLDER"],
                    old_pdf["text_file"]
                )

                if os.path.exists(old_text_path):

                    os.remove(old_text_path)

        except Exception as e:

            print(
                "OLD PDF DELETE ERROR:",
                e
            )

    # -----------------------------------------------------
    # Save PDF
    # -----------------------------------------------------

    pdf_filename = (
        username
        + "_"
        + original_name
    )

    pdf_path = os.path.join(
        app.config["UPLOAD_FOLDER"],
        pdf_filename
    )

    try:

        file.save(pdf_path)

    except Exception as e:

        flash(
            "PDF could not be saved.",
            "error"
        )

        print(
            "PDF SAVE ERROR:",
            e
        )

        return redirect("/chat")

    # -----------------------------------------------------
    # Extract text
    # -----------------------------------------------------

    extracted_text = extract_pdf_text(
        pdf_path
    )

    if not extracted_text:

        try:

            if os.path.exists(pdf_path):

                os.remove(pdf_path)

        except Exception:
            pass

        flash(
            "PDF uploaded, but no readable text was found.",
            "error"
        )

        return redirect("/chat")

    # -----------------------------------------------------
    # Save extracted text
    # -----------------------------------------------------

    base_name = os.path.splitext(
        original_name
    )[0]

    text_filename = secure_filename(
        username
        + "_"
        + base_name
        + ".txt"
    )

    text_path = os.path.join(
        app.config["UPLOAD_FOLDER"],
        text_filename
    )

    try:

        with open(
            text_path,
            "w",
            encoding="utf-8"
        ) as text_file:

            text_file.write(
                extracted_text
            )

    except Exception as e:

        print(
            "TEXT SAVE ERROR:",
            e
        )

        flash(
            "PDF text could not be saved.",
            "error"
        )

        return redirect("/chat")

    # -----------------------------------------------------
    # Save PDF in database
    # -----------------------------------------------------

    conn = get_db()

    cursor = conn.cursor()

    cursor.execute(
        """
        DELETE FROM pdf_documents
        WHERE username=?
        """,
        (session["user"],)
    )

    cursor.execute(
        """
        INSERT INTO pdf_documents(
            username,
            pdf_name,
            text_file
        )
        VALUES(?,?,?)
        """,
        (
            session["user"],
            original_name,
            text_filename
        )
    )

    conn.commit()

    conn.close()

    # -----------------------------------------------------
    # Session
    # -----------------------------------------------------

    session["pdf_name"] = original_name

    session["pdf_text_file"] = text_filename

    flash(
        "PDF uploaded successfully! "
        "You can now ask questions about it.",
        "success"
    )

    return redirect("/chat")


# =========================================================
# REMOVE PDF
# =========================================================

@app.route(
    "/remove_pdf",
    methods=["POST"]
)
def remove_pdf():

    if "user" not in session:

        return redirect("/login")

    username = secure_filename(
        session["user"]
    )

    pdf = get_user_pdf()

    if pdf:

        pdf_path = os.path.join(
            app.config["UPLOAD_FOLDER"],
            username + "_" + pdf["pdf_name"]
        )

        text_file = pdf["text_file"]

        text_path = (
            os.path.join(
                app.config["UPLOAD_FOLDER"],
                text_file
            )
            if text_file
            else None
        )

        try:

            if os.path.exists(pdf_path):

                os.remove(pdf_path)

            if (
                text_path
                and os.path.exists(text_path)
            ):

                os.remove(text_path)

        except Exception as e:

            print(
                "PDF DELETE ERROR:",
                e
            )

    # -----------------------------------------------------
    # Delete database record
    # -----------------------------------------------------

    conn = get_db()

    cursor = conn.cursor()

    cursor.execute(
        """
        DELETE FROM pdf_documents
        WHERE username=?
        """,
        (session["user"],)
    )

    conn.commit()

    conn.close()

    session.pop(
        "pdf_name",
        None
    )

    session.pop(
        "pdf_text_file",
        None
    )

    flash(
        "PDF removed successfully.",
        "success"
    )

    return redirect("/chat")


# =========================================================
# HISTORY
# =========================================================

@app.route("/history")
def history():

    if "user" not in session:

        return redirect("/login")

    search = request.args.get(
        "search",
        ""
    ).strip()

    conn = get_db()

    cursor = conn.cursor()

    if search:

        search_value = "%" + search + "%"

        cursor.execute(
            """
            SELECT *
            FROM chat_history
            WHERE username=?
            AND (
                question LIKE ?
                OR answer LIKE ?
            )
            ORDER BY id DESC
            """,
            (
                session["user"],
                search_value,
                search_value
            )
        )

    else:

        cursor.execute(
            """
            SELECT *
            FROM chat_history
            WHERE username=?
            ORDER BY id DESC
            """,
            (session["user"],)
        )

    history_data = cursor.fetchall()

    conn.close()

    return render_template(
        "history.html",
        username=session["user"],
        history=history_data,
        search=search
    )


# =========================================================
# DELETE ONE HISTORY ITEM
# =========================================================

@app.route(
    "/delete_history/<int:history_id>",
    methods=["POST"]
)
def delete_history(history_id):

    if "user" not in session:

        return redirect("/login")

    conn = get_db()

    cursor = conn.cursor()

    cursor.execute(
        """
        DELETE FROM chat_history
        WHERE id=?
        AND username=?
        """,
        (
            history_id,
            session["user"]
        )
    )

    conn.commit()

    conn.close()

    flash(
        "Chat deleted successfully.",
        "success"
    )

    return redirect("/history")


# =========================================================
# CLEAR HISTORY
# =========================================================

@app.route(
    "/clear_history",
    methods=["GET", "POST"]
)
def clear_history():

    if "user" not in session:

        return redirect("/login")

    conn = get_db()

    cursor = conn.cursor()

    cursor.execute(
        """
        DELETE FROM chat_history
        WHERE username=?
        """,
        (session["user"],)
    )

    conn.commit()

    conn.close()

    flash(
        "Chat history cleared successfully.",
        "success"
    )

    return redirect("/history")


# =========================================================
# ERROR: FILE TOO LARGE
# =========================================================

@app.errorhandler(413)
def file_too_large(error):

    flash(
        "PDF is too large. Maximum allowed size is 20 MB.",
        "error"
    )

    return redirect("/chat")


# =========================================================
# RUN APPLICATION
# =========================================================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=True
    )