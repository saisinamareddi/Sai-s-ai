from datetime import datetime
import requests
import os
from dotenv import load_dotenv
import google.generativeai as genai

# 🔐 Load .env variables
load_dotenv()

# 🤖 Gemini Setup
api_key = os.getenv("GEMINI_API_KEY")

model = None

if api_key:
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        print("✅ Gemini connected")
    except Exception as e:
        print("❌ Gemini error:", e)
        model = None


# 🧠 Memory
memory = {}
chat_history = []


# 🌤️ Weather Function
def get_weather(city="Visakhapatnam"):
    weather_key = os.getenv("WEATHER_API_KEY")

    if not weather_key:
        return (
            "🌤️ Visakhapatnam weather (demo mode)\n\n"
            "🌡️ Temperature: 29°C\n"
            "🤗 Feels like: 33°C\n"
            "☁️ Condition: scattered clouds\n"
            "💧 Humidity: 78%"
        )

    url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?q={city}&appid={weather_key}&units=metric"
    )

    try:
        response = requests.get(url, timeout=5)
        data = response.json()

        if response.status_code != 200:
            return "⚠️ Weather service unavailable."

        temp = data["main"]["temp"]
        feels = data["main"]["feels_like"]
        desc = data["weather"][0]["description"]
        humidity = data["main"]["humidity"]

        return (
            f"🌤️ {city} Weather Report\n\n"
            f"🌡️ Temperature: {temp}°C\n"
            f"🤗 Feels like: {feels}°C\n"
            f"☁️ Condition: {desc}\n"
            f"💧 Humidity: {humidity}%"
        )

    except Exception:
        return "⚠️ Weather service offline mode lo undi."


# 🤖 Main AI Function
def ask_ai(prompt):
    text = prompt.lower().strip()

    # Save user message
    chat_history.append({"role": "user", "message": prompt})

    # 👋 Greetings
    if text in ["hi", "hello", "hey", "hii", "helo"]:
        name = memory.get("name", "Sai")
        reply = (
            f"👋 Hello {name}! Nenu Tara, nee smart Telugu AI assistant.\n\n"
            "Nenu voice assistant, call assistant, GATE helper, "
            "college helper, coding helper ga help chesthanu 🚀"
        )

    # 🕒 Time
    elif text == "time":
        current_time = datetime.now().strftime("%I:%M %p")
        reply = f"🕒 Ippudu time {current_time}."

    # 📅 Date
    elif text in ["date", "today"]:
        current_date = datetime.now().strftime("%d %B %Y")
        reply = f"📅 Eeroju date {current_date}."

    # 🌤️ Weather
    elif "weather" in text or "temperature" in text:
        reply = get_weather("Visakhapatnam")

    # 🤖 Sai AI Project
    elif "sai ai" in text or "project" in text:
        reply = (
            "🤖 Sai AI current features:\n\n"
            "✅ Voice input\n"
            "✅ Smart Telugu replies\n"
            "✅ Conversation memory\n"
            "✅ Chat history\n"
            "✅ Time & Date assistant\n"
            "✅ Weather assistant\n"
            "✅ Hybrid AI (Gemini + Local Fallback)\n\n"
            "Project chala professional ga develop avutundi 🚀🔥"
        )

    # 💻 Coding
    elif any(word in text for word in ["python", "react", "javascript", "fastapi"]):
        reply = (
            "💻 Coding help ready Sai!\n\n"
            "• Python debugging\n"
            "• FastAPI backend\n"
            "• React + Vite frontend\n"
            "• JavaScript logic\n"
            "• API integration\n"
            "• Deployment help 🚀"
        )

    # 🤖 Smart AI Section
    else:
        if model:
            try:
                response = model.generate_content(
                    f"""
                    You are Tara, a smart Telugu AI assistant created by Sai.
                    Reply in friendly Telugu + English mixed style.
                    Keep answers clear and useful.

                    User message: {prompt}
                    """
                )

                reply = response.text

            except Exception as e:
                print("Gemini error:", e)

                reply = (
                    "🤖 Tara Local AI Mode\n\n"
                    f"Nuvvu adigindi: '{prompt}'\n\n"
                    "Gemini service ippudu available ledu, "
                    "kani nenu local smart assistant ga help chesthunna 🚀"
                )

        else:
            reply = (
                "🤖 Tara Local AI Mode\n\n"
                f"Nuvvu adigindi: '{prompt}'\n\n"
                "Gemini service available ledu, "
                "kani nenu local smart assistant ga help chesthunna 🚀"
            )

    # Save assistant reply
    chat_history.append({"role": "assistant", "message": reply})

    return reply