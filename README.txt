# Professional AI Question Answering System

## Features
- Flask web application
- Signup and Login
- Password hashing
- Ollama local AI
- Fast `llama3.2:1b` model
- Streaming AI answers
- Chat history
- Search history
- Delete one conversation
- Clear all history
- Export history to PDF
- Dark / Light mode
- Responsive design
- Suggested questions
- SQLite database
- Automatic database migration for `created_at`

## 1. Install packages

Activate your PyCharm virtual environment and run:

pip install -r requirements.txt

## 2. Check Ollama

Run:

ollama list

You should see:

llama3.2:1b

If not, run:

ollama pull llama3.2:1b

## 3. Start Ollama

Normally the Ollama Windows application can stay running in the background.

You can test:

ollama run llama3.2:1b

Then type:

What is AI?

If it answers, Ollama is ready.

## 4. Run Flask

In PyCharm run:

app.py

Open:

http://127.0.0.1:5000

## Important

If you want the larger but slower model, change:

MODEL_NAME = "llama3.2:1b"

to:

MODEL_NAME = "llama3.2"

Do not delete your existing database unless you intentionally want to remove old users and chat history.
