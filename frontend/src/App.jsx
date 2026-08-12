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
  const chatEndRef = useRef(null);

  // 🔄 Load history
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

        if (formatted.length === 0) {
          setMessages([
            {
              sender: "ai",
              text: "👋 Hello Sai! Nenu Tara, nee smart Telugu AI assistant. Nenu voice assistant, call assistant, GATE helper, college helper, coding helper ga help chesthanu 🚀",
              time: new Date().toLocaleTimeString(),
            },
          ]);
        } else {
          setMessages(formatted);
        }
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

  // 🔽 Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // 💾 Save calls
  useEffect(() => {
    localStorage.setItem(
      "sai_call_history",
      JSON.stringify(callHistory)
    );
  }, [callHistory]);

  // 🔊 Female Telugu Voice
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

  // 🎙️ Voice Mode
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
  // 📞 Call Simulation
const simulateCall = (caller) => {
  setIncomingCall(caller);
  setCallStatus("");
};

const acceptCall = () => {
  let response = "";

  if (incomingCall === "Amma") {
    response =
      "📢 Amma call important ga mark chesanu. Sai ki immediate notification pampisthunnanu.";

  } else if (incomingCall === "Annayya") {
    response =
      "📢 Annayya call urgent family call ga mark chesanu.";

  } else if (incomingCall === "Unknown Number") {
    response =
      "⚠️ Unknown number detected. Spam ayye avakasam undi.";

  } else if (incomingCall === "Emergency") {
    response =
      "🚨 Emergency call detected! Immediate notification pampisthunnanu.";

    setUrgentAlert(
      "🚨 EMERGENCY CALL DETECTED - CHECK IMMEDIATELY!"
    );
  }

  setCallStatus(response);

  setCallHistory((prev) => [
    {
      caller: incomingCall,
      status: "Accepted",
      time: new Date().toLocaleTimeString(),
    },
    ...prev,
  ]);

  speakText(response);

  setIncomingCall("");
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
        {/* 💬 Chat Area */}
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
          {messages.map((msg, index) => (
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
          ))}

          <div ref={chatEndRef}></div>
        </div>

        {/* ⌨️ Input */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {/* ⚡ Quick Actions */}
<div
  style={{
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "15px",
  }}
>
  <button onClick={() => setMessage("weather")}>🌤 Weather</button>
  <button onClick={() => setMessage("time")}>🕒 Time</button>
  <button onClick={() => setMessage("date")}>📅 Date</button>
  <button onClick={() => setMessage("sai ai project")}>🤖 Project</button>
  <button onClick={() => setMessage("motivate me")}>💪 Motivate</button>
</div>
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
        {/* 📞 Call Simulation */}
<div
  style={{
    marginTop: "24px",
    background: "#111827",
    borderRadius: "16px",
    padding: "20px",
  }}
>
  <h3>📞 Call Simulation</h3>

  <div
    style={{
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    }}
  >
    <button onClick={() => simulateCall("Amma")}>
      👩 Amma
    </button>

    <button onClick={() => simulateCall("Annayya")}>
      👨 Annayya
    </button>

    <button onClick={() => simulateCall("Unknown Number")}>
      ❓ Unknown
    </button>

    <button onClick={() => simulateCall("Emergency")}>
      🚨 Emergency
    </button>
  </div>

  {incomingCall && (
    <div style={{ marginTop: "15px" }}>
      <p>
        📲 Incoming Call: <strong>{incomingCall}</strong>
      </p>

      <button onClick={acceptCall}>
        ✅ Accept
      </button>
    </div>
  )}

  {callStatus && (
    <div
      style={{
        marginTop: "15px",
        background: "#0f172a",
        padding: "12px",
        borderRadius: "12px",
      }}
    >
      {callStatus}
    </div>
  )}

  {urgentAlert && (
    <div
      style={{
        marginTop: "15px",
        background: "#7f1d1d",
        color: "#fecaca",
        padding: "12px",
        borderRadius: "12px",
        fontWeight: "bold",
      }}
    >
      {urgentAlert}
    </div>
  )}
</div>
      </div>
    </div>
  );
}

export default App;