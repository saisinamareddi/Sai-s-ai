import { useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");

  const sendMessage = async () => {
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/chat",
        {
          message: message,
        }
      );

      setReply(res.data.ai);
    } catch (err) {
      console.error(err);
      setReply("❌ Error connecting to Sai AI");
    }
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>🤖 Sai AI</h1>

      <input
        type="text"
        placeholder="Ask something..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{
          width: "300px",
          padding: "10px",
          marginRight: "10px",
        }}
      />

      <button onClick={sendMessage}>Send</button>

      <div style={{ marginTop: "20px" }}>
        <h3>AI Reply:</h3>
        <p>{reply}</p>
      </div>
    </div>
  );
}

export default App;