import { useState, useEffect, useRef } from "react";
import axios from "axios";
import API_BASE from "./config";

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
          "${API_BASE}/history"
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
          "${API_BASE}/chat",
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
        "${API_BASE}/chat",
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
        "${API_BASE}/history"
      );
    } catch (error) {
      console.log(error);
    }
  };
  // 📞 Call Simulation
// 📞 Call Simulation
const simulateCall = (caller) => {
  setIncomingCall(caller);
  setCallStatus("");
};

const acceptCall = async () => {
  try {
    const response = await axios.post(
      "${API_BASE}/call-assistant",
      {
        caller: incomingCall,
        reason: "family call",
      }
    );

    const aiReply = response.data.reply;

    // 📞 Show status
    setCallStatus(aiReply);

    // 💬 Add to chat
    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text: `📞 Call handled from ${incomingCall}\n${aiReply}`,
        time: new Date().toLocaleTimeString(),
      },
    ]);

    // 🔊 Speak response
    speakText(aiReply);

    // 💾 Save call history
    setCallHistory((prev) => [
      {
        caller: incomingCall,
        status: response.data.urgent ? "🚨 Urgent" : "✅ Handled",
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);

    // 🚨 Emergency alert
    if (response.data.urgent) {
      setUrgentAlert(
        "🚨 URGENT CALL DETECTED - CHECK IMMEDIATELY!"
      );
    }

    // 📵 Close incoming call
    setIncomingCall("");

  } catch (error) {
    console.error(error);
    setCallStatus("❌ Call assistant backend error");
  }
};
 return (
  
  <div
    style={{
      minHeight: "100vh",
      background:
        "radial-gradient(circle at top left, #1e3a8a 0%, #0f172a 35%, #020617 100%)",
      color: "white",
      fontFamily: "Inter, Arial, sans-serif",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* ✨ Floating background circles */}
    <div
      style={{
        position: "absolute",
        top: "-120px",
        right: "-120px",
        width: "260px",
        height: "260px",
        borderRadius: "50%",
        background: "rgba(59,130,246,0.18)",
        filter: "blur(50px)",
      }}
    />

    <div
      style={{
        position: "absolute",
        bottom: "-140px",
        left: "-140px",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "rgba(16,185,129,0.12)",
        filter: "blur(60px)",
      }}
    />

    {/* 🚀 Header */}
    <div style={{ textAlign: "center", marginBottom: "25px" }}>
  <h1
    style={{
      fontSize: "48px",
      marginBottom: "8px",
      background: "linear-gradient(90deg,#38bdf8,#8b5cf6,#ec4899)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      fontWeight: "bold",
    }}
  >
    🤖 Sai AI
  </h1>

  <p style={{ color: "#94a3b8", fontSize: "18px" }}>
    Smart Telugu Voice & Call Assistant
  </p>

  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      marginTop: "10px",
      padding: "8px 14px",
      borderRadius: "20px",
      background: "rgba(17,24,39,0.85)",
      backdropFilter: "blur(10px)",
      border: "1px solid #1e293b",
      boxShadow: "0 0 25px rgba(37,99,235,0.15)",
    }}
  >
    <div
      style={{
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        background: "#22c55e",
        boxShadow: "0 0 10px #22c55e",
      }}
    ></div>

    <span style={{ color: "#22c55e", fontWeight: "bold" }}>
      Tara AI Online
    </span>
  </div>
</div>

    
    <div
      style={{
        maxWidth: "980px",
        margin: "0 auto",
        background: "rgba(15,23,42,0.72)",
        backdropFilter: "blur(16px)",
        borderRadius: "28px",
        padding: "24px",
        border: "1px solid rgba(148,163,184,0.15)",
        boxShadow: "0 20px 45px rgba(2,6,23,0.55)",
        position: "relative",
      }}
    >
      {/* 💬 Chat Area */}
      <div
        style={{
          height: "460px",
          overflowY: "auto",
          background: "rgba(2,6,23,0.9)",
          borderRadius: "22px",
          padding: "18px",
          marginBottom: "18px",
          border: "1px solid rgba(148,163,184,0.08)",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent:
                msg.sender === "user" ? "flex-end" : "flex-start",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                maxWidth: "78%",
                padding: "14px 16px",
                borderRadius:
                  msg.sender === "user"
                    ? "20px 20px 6px 20px"
                    : "20px 20px 20px 6px",
                background:
                  msg.sender === "user"
                    ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                    : "linear-gradient(135deg, #1e293b, #0f172a)",
                border:
                  msg.sender === "user"
                    ? "1px solid rgba(96,165,250,0.4)"
                    : "1px solid rgba(148,163,184,0.12)",
                boxShadow:
                  msg.sender === "user"
                    ? "0 10px 25px rgba(37,99,235,0.25)"
                    : "0 8px 20px rgba(2,6,23,0.35)",
              }}
            >
              <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                {msg.text}
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "#cbd5e1",
                  marginTop: "8px",
                  textAlign: "right",
                }}
              >
                {msg.time}
              </div>
            </div>
          </div>
        ))}

        <div ref={chatEndRef}></div>
      </div>

      {/* ⚡ Quick Actions */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "14px",
        }}
      >
        {[
          ["weather", "🌤 Weather"],
          ["time", "🕒 Time"],
          ["date", "📅 Date"],
          ["sai ai project", "🤖 Project"],
          ["motivate me", "💪 Motivate"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setMessage(value)}
            style={{
              padding: "10px 14px",
              borderRadius: "14px",
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(30,41,59,0.7)",
              color: "white",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ⌨️ Input */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Ask Tara anything..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          style={{
            flex: 1,
            minWidth: "220px",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid rgba(148,163,184,0.2)",
            background: "rgba(2,6,23,0.85)",
            color: "white",
            fontSize: "15px",
            outline: "none",
            boxShadow: "0 0 12px rgba(59,130,246,0.2)",
          }}
        />

        <button
          onClick={startListening}
          style={{
            padding: "14px 16px",
            borderRadius: "16px",
            border: "none",
            background: listening ? "#0ea5e9" : "#1e293b",
            color: "white",
            cursor: "pointer",
            boxShadow: listening
              ? "0 0 18px rgba(14,165,233,0.5)"
              : "0 8px 18px rgba(2,6,23,0.35)",
          }}
        >
          🎤
        </button>

        {!voiceMode ? (
          <button
            onClick={startVoiceMode}
            style={{
              padding: "14px 18px",
              borderRadius: "16px",
              border: "none",
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 10px 24px rgba(34,197,94,0.28)",
            }}
          >
            🎙️ Voice Mode
          </button>
        ) : (
          <button
            onClick={stopVoiceMode}
            style={{
              padding: "14px 18px",
              borderRadius: "16px",
              border: "none",
              background: "linear-gradient(135deg, #dc2626, #ef4444)",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 10px 24px rgba(239,68,68,0.28)",
            }}
          >
            ⛔ Stop
          </button>
        )}

        <button
          onClick={sendMessage}
          style={{
            padding: "14px 18px",
            borderRadius: "16px",
            border: "none",
            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 10px 24px rgba(59,130,246,0.28)",
          }}
        >
          Send 🚀
        </button>

        <button
          onClick={clearChat}
          style={{
            padding: "14px 16px",
            borderRadius: "16px",
            border: "none",
            background: "linear-gradient(135deg, #7f1d1d, #b91c1c)",
            color: "white",
            cursor: "pointer",
            boxShadow: "0 10px 24px rgba(185,28,28,0.24)",
          }}
        >
          🗑
        </button>
      </div>

      {/* 🎤 Status Effects */}
      {listening && (
        <div
          style={{
            marginTop: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#38bdf8",
            fontWeight: "bold",
          }}
        >
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#38bdf8",
              boxShadow: "0 0 16px #38bdf8",
            }}
          />
          🎤 Tara is listening...
        </div>
      )}

      {speaking && (
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#facc15",
            fontWeight: "bold",
          }}
        >
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#facc15",
              boxShadow: "0 0 16px #facc15",
            }}
          />
          🔊 Tara is speaking...
        </div>
      )}

      {/* 📞 Call Simulation */}
      <div
        style={{
          marginTop: "26px",
          background: "rgba(2,6,23,0.85)",
          borderRadius: "22px",
          padding: "22px",
          border: "1px solid rgba(148,163,184,0.12)",
        }}
      >
        <h3 style={{ marginBottom: "16px" }}>📞 Smart Call Simulation</h3>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {[
            ["Amma", "👩 Amma"],
            ["Annayya", "👨 Annayya"],
            ["Unknown Number", "❓ Unknown"],
            ["Emergency", "🚨 Emergency"],
          ].map(([caller, label]) => (
            <button
              key={caller}
              onClick={() => simulateCall(caller)}
              style={{
                padding: "12px 16px",
                borderRadius: "16px",
                border: "1px solid rgba(148,163,184,0.18)",
                background: "rgba(30,41,59,0.75)",
                color: "white",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {incomingCall && (
          <div
            style={{
              marginTop: "18px",
              padding: "16px",
              borderRadius: "16px",
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(59,130,246,0.22)",
            }}
          >
            <p style={{ marginBottom: "12px" }}>
              📲 Incoming Call: <strong>{incomingCall}</strong>
            </p>

            <button
              onClick={acceptCall}
              style={{
                padding: "12px 18px",
                borderRadius: "14px",
                border: "none",
                background: "linear-gradient(135deg, #16a34a, #22c55e)",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ✅ Accept
            </button>
          </div>
        )}

        {callStatus && (
          <div
            style={{
              marginTop: "16px",
              padding: "14px",
              borderRadius: "16px",
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(148,163,184,0.12)",
            }}
          >
            {callStatus}
          </div>
        )}

                       {urgentAlert && (
          <div
            style={{
              marginTop: "16px",
              padding: "14px",
              borderRadius: "16px",
              background: "rgba(127,29,29,0.9)",
              border: "1px solid rgba(248,113,113,0.35)",
              color: "#fecaca",
              fontWeight: "bold",
              boxShadow: "0 0 22px rgba(248,113,113,0.22)",
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