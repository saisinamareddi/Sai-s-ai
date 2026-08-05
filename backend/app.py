from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ai import ask_ai, clear_memory

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat")
async def chat(data: dict):
    try:
        user_message = data.get("message")
        response = ask_ai(user_message)

        return {"ai": response}

    except Exception as e:
        print("ERROR:", e)
        return {"error": str(e)}


@app.post("/new-chat")
async def new_chat():
    clear_memory()

    return {"message": "Memory cleared"}