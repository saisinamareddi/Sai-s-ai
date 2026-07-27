import os
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()

# Create Gemini client
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

def ask_ai(prompt):
    response = client.models.generate_content(
        model="models/gemini-3.5-flash",
        contents=prompt,
    )
    return response.text