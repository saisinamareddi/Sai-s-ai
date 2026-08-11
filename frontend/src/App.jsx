import { useState, useEffect, useRef } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);

  // 📞 Call states
  const [incomingCall, setIncomingCall] = useState("");
  const [callStatus, setCallStatus] = useState("");
  const [urgentAlert, setUrgentAlert] = useState("");
  const [callHistory, setCallHistory] = useState([]);

  const recognitionRef = useRef(null);

  // 🔄 Load data
  useEffect(() => {
    window.speechSynthesis.getVoices();

    const loadHistory = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/history"
        );

        const formatted = response.data
          .map((item) => [
            {
              sender: "user",
              text: item.user,
              time: item.time,
            },
            {
              sender: "ai",
              text: item.ai,
              time: item.time,
            },
          ])
          .flat();

        setMessages(formatted);
      } catch (error) {
        console.log("History load failed", error);
      }
    };

    loadHistory();

    const savedCalls = localStorage.getItem("sai_call_history");
    if (savedCalls) {
      setCallHistory(JSON.parse(savedCalls));
    }
  }, []);

  // 💾 Save calls
  useEffect(() => {
    localStorage.setItem(
      "sai_call_history",
      JSON.stringify(callHistory)
    );
  }, [callHistory]);

  // 🔊 Telugu Female Voice
  const speakText = (text) => {
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "te-IN";
    speech.rate = 0.95;
    speech.pitch = 1.1;

    const voices = window.speechSynthesis.getVoices();

    const femaleVoice =
      voices.find((v) => v.lang.includes("te")) ||
      voices.find((v) => v.name.includes("Heera")) ||
      voices.find((v) => v.name.includes("Female")) ||
      voices.find((v) => v.name.includes("Zira"));

    if (femaleVoice) {
      speech.voice = femaleVoice;
    }

    setSpeaking(true);

    speech.onend = () => setSpeaking(false);

    window.speechSynthesis.speak(speech);
  };

  // 🎤 Single Voice Input
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.start();
    setListening(true);

    recognition.onresult = (e) => {
      setMessage(e.results[0][0].transcript);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => setListening(false);
  };

  // 🎙️ Continuous Voice Mode
  const startVoiceMode = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = true;

    recognitionRef.current = recognition;

    setVoiceMode(true);
    setListening(true);

    recognition.onresult = async (e) => {
      const spoken =
        e.results[e.results.length - 1][0].transcript;

      setMessages((prev) => [
        ...prev,
        {
          sender: "user",
          text: spoken,
          time: new Date().toLocaleTimeString(),
        },
      ]);

      try {
        const response = await axios.post(
          "http://127.0.0.1:8000/chat",
          { message: spoken }
        );

        const aiReply =
          response.data.ai || "No response received";

        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: aiReply,
            time: new Date().toLocaleTimeString(),
          },
        ]);

        speakText(aiReply);
      } catch (error) {
        console.error(error);
        speakText("Backend connection failed");
      }
    };

    recognition.start();
  };

  // ⛔ Stop Voice Mode
  const stopVoiceMode = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setVoiceMode(false);
    setListening(false);
  };

  // 📤 Send Message
  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userMessage,
        time: new Date().toLocaleTimeString(),
      },
    ]);

    setMessage("");

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/chat",
        { message: userMessage }
      );

      const aiReply =
        response.data.ai ||
        "⚠️ Backend connected, but no response received.";

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: aiReply,
          time: new Date().toLocaleTimeString(),
        },
      ]);

      speakText(aiReply);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "❌ Backend connection failed",
          time: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  // 🗑️ Clear Chat
  const clearChat = async () => {
    setMessage("");
    setMessages([]);

    try {
      await axios.delete(
        "http://127.0.0.1:8000/history"
      );
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #020617, #0f172a, #111827)",
        color: "white",
        fontFamily: "Arial",
        padding: "20px",
      }}
    >
      <h1 style={{ textAlign: "center" }}>
        🤖 Sai AI
      </h1>

      <div
        style={{
          maxWidth: "900px",
          margin: "20px auto",
          background: "#111827",
          padding: "20px",
          borderRadius: "20px",
        }}
      >
        <div
          style={{
            height: "400px",
            overflowY: "auto",
            background: "#0f172a",
            borderRadius: "12px",
            padding: "15px",
            marginBottom: "15px",
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                marginTop: "150px",
                color: "#94a3b8",
              }}
            >
              🤖 Start chatting with Tara AI...
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  textAlign:
                    msg.sender === "user"
                      ? "right"
                      : "left",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    background:
                      msg.sender === "user"
                        ? "#2563eb"
                        : "#1e293b",
                    padding: "10px 14px",
                    borderRadius: "14px",
                    maxWidth: "70%",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Ask Tara anything..."
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "12px",
              border: "1px solid #334155",
              background: "#0f172a",
              color: "white",
            }}
          />

          <button onClick={startListening}>
            🎤
          </button>

          {!voiceMode ? (
            <button
              onClick={startVoiceMode}
              style={{
                background: "#16a34a",
                color: "white",
              }}
            >
              🎙️ Voice Mode
            </button>
          ) : (
            <button
              onClick={stopVoiceMode}
              style={{
                background: "#dc2626",
                color: "white",
              }}
            >
              ⛔ Stop
            </button>
          )}

          <button
            onClick={sendMessage}
            style={{
              background: "#2563eb",
              color: "white",
            }}
          >
            Send 🚀
          </button>

          <button
            onClick={clearChat}
            style={{
              background: "#7f1d1d",
              color: "white",
            }}
          >
            🗑
          </button>
        </div>

        {listening && (
          <p
            style={{
              marginTop: "10px",
              color: "#38bdf8",
            }}
          >
            🎤 Tara is listening...
          </p>
        )}

        {speaking && (
          <p
            style={{
              marginTop: "5px",
              color: "#facc15",
            }}
          >
            🔊 Tara is speaking...
          </p>
        )}
      </div>
    </div>
  );
}

export default App;