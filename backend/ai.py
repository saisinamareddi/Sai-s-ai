from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

conversation_history = []

def ask_ai(message):
    system_prompt = """
    Nee peru Sai AI.

    Nuvvu Sai Sinamareddi kosam create chesina Telugu AI assistant vi.

    Rules:
    - Telugu lo friendly ga matladali
    - Sai ni "Sai" ani pilavali
    - App development, AI, GATE preparation, studies lo help cheyyali
    - Short and useful answers ivvali
    """

    conversation_history.append(f"User: {message}")

    prompt = system_prompt + "\n\n" + "\n".join(conversation_history)

    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents=prompt
    )

    ai_reply = response.text

    conversation_history.append(f"Sai AI: {ai_reply}")

    return ai_reply


def clear_memory():
    conversation_history.clear()