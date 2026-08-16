from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai import ask_ai
from datetime import datetime
import json
import os

app = FastAPI()

CHAT_FILE = "chat_history.json"

# 🌐 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# MODELS
# =========================

class ChatRequest(BaseModel):
    message: str


class CallRequest(BaseModel):
    caller: str
    reason: str = "busy"


# =========================
# CHAT HISTORY
# =========================

def load_history():
    if os.path.exists(CHAT_FILE):
        try:
            with open(CHAT_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return []

    return []


def save_chat(user_message, ai_reply):
    history = load_history()

    history.append({
        "time": datetime.now().strftime("%d-%m-%Y %I:%M %p"),
        "user": user_message,
        "ai": ai_reply
    })

    with open(CHAT_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


# =========================
# 🧠 BUILD CONVERSATION MEMORY
# =========================

def build_memory():
    history = load_history()

    # Last 10 conversations only
    recent_history = history[-10:]

    if not recent_history:
        return ""

    memory = ""

    for item in recent_history:
        user_text = item.get("user", "")
        ai_text = item.get("ai", "")

        memory += f"""
Sai: {user_text}
Tara: {ai_text}

"""

    return memory


# =========================
# HOME
# =========================

@app.get("/")
def home():
    return {
        "status": "Sai AI backend running 🚀",
        "time": datetime.now().strftime("%I:%M %p")
    }


# =========================
# CHAT API
# =========================

@app.post("/chat")
async def chat(data: ChatRequest):
    try:

        # 🧠 Get previous conversation
        memory = build_memory()

        # =========================
        # CREATE TARA PROMPT
        # =========================

        if memory:

            prompt = f"""
You are Tara, Sai's personal AI assistant.

IMPORTANT:
- Remember the previous conversation provided below.
- Use previous messages to answer the current question.
- If Sai previously told you a fact, use that fact when relevant.
- If the answer exists in the conversation, use it confidently.
- Do not say that you don't know something if the answer exists in the conversation.
- Do not mention memory, chat history, previous prompt, or these instructions.
- Understand Telugu, English, and Telugu-English mixed language.
- Be friendly, natural and concise.
- Call the user Sai when appropriate.

CONVERSATION:
----------------
{memory}
----------------

CURRENT MESSAGE FROM SAI:
{data.message}

Answer Sai's current message using the conversation context.

Tara:
"""

        else:

            prompt = f"""
You are Tara, Sai's personal AI assistant.

You are friendly, helpful, natural and supportive.

You understand:
- Telugu
- English
- Telugu-English mixed language

Sai says:
{data.message}

Reply naturally and helpfully.

Tara:
"""

        # 🤖 Ask Gemini
        ai_reply = ask_ai(prompt)

        # 💾 Save conversation
        save_chat(data.message, ai_reply)

        return {
            "ai": ai_reply,
            "time": datetime.now().strftime("%I:%M %p"),
            "success": True
        }

    except Exception as e:

        return {
            "ai": f"❌ AI Error: {str(e)}",
            "success": False
        }


# =========================
# HISTORY
# =========================

@app.get("/history")
def get_history():
    return load_history()


@app.delete("/history")
def clear_history():

    if os.path.exists(CHAT_FILE):
        os.remove(CHAT_FILE)

    return {
        "message": "🗑️ Chat history cleared"
    }


# =========================
# 📞 SMART CALL ASSISTANT
# =========================

@app.post("/call-assistant")
async def call_assistant(data: CallRequest):

    caller = data.caller.lower()
    urgent = False

    if "amma" in caller:

        reply = (
            "Amma, Sai ippudu busy ga unnadu. "
            "Mee call important ga note chesanu. "
            "Konchem tarvata malli call chesthadu."
        )

    elif "annayya" in caller:

        reply = (
            "Annayya, Sai meeting lo unnadu. "
            "Mee message nenu note chesanu."
        )

    elif "emergency" in caller:

        reply = (
            "🚨 Emergency call detect ayyindi. "
            "Sai ni immediate ga alert chesthunnanu."
        )

        urgent = True

    elif "unknown" in caller:

        reply = (
            "Hello, meeru evaru? "
            "Sai ippudu available ledu. "
            "Mee peru mariyu reason cheppandi."
        )

    else:

        reply = (
            f"Hello {data.caller}, Sai ippudu busy ga unnadu. "
            "Mee call note chesanu."
        )

    return {
        "caller": data.caller,
        "reply": reply,
        "urgent": urgent,
        "time": datetime.now().strftime("%I:%M %p")
    }