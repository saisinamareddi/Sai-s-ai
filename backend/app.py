from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ai import ask_ai

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
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
        print("APP ERROR:", repr(e))
        return {"error": str(e)}