import { useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");

  const sendMessage = async () => {
    const res = await axios.post(
      "http://127.0.0.1:8000/chat",
      { message }
    );

    setReply(res.data.ai);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Sai AI</h1>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask something..."
      />

      <button onClick={sendMessage}>Send</button>

      <p><b>AI:</b> {reply}</p>
    </div>
  );
}

export default App;