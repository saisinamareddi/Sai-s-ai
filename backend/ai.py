from dotenv import load_dotenv
from google import genai
import os

# Load .env file
load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")

# Gemini client
client = genai.Client(api_key=API_KEY)

print("✅ Gemini connected")


def ask_ai(prompt: str) -> str:
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        return response.text

    except Exception as e:
        return f"❌ Gemini Error: {str(e)}"