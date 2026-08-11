from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai import ask_ai
from datetime import datetime
import json
import os

app = FastAPI()

# 📁 Chat history file
CHAT_FILE = "chat_history.json"

# 🌐 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📩 Request model
class ChatRequest(BaseModel):
    message: str

# 📁 Save chat history
def save_chat(user_message, ai_reply):
    history = []

    if os.path.exists(CHAT_FILE):
        try:
            with open(CHAT_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)
        except:
            history = []

    history.append({
        "time": datetime.now().strftime("%d-%m-%Y %I:%M %p"),
        "user": user_message,
        "ai": ai_reply
    })

    with open(CHAT_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

# 🏠 Home route
@app.get("/")
def home():
    return {
        "status": "Sai AI backend running 🚀",
        "chat_history_file": CHAT_FILE
    }

# 💬 Main chat route
@app.post("/chat")
async def chat(data: ChatRequest):
    try:
        ai_reply = ask_ai(data.message)

        # Save conversation
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

# 📜 Get all chat history
@app.get("/history")
def get_history():
    if os.path.exists(CHAT_FILE):
        try:
            with open(CHAT_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return []

    return []

# 🗑️ Clear history
@app.delete("/history")
def clear_history():
    if os.path.exists(CHAT_FILE):
        os.remove(CHAT_FILE)

    return {"message": "🗑️ Chat history cleared successfully"}