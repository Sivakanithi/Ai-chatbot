import React, { useEffect, useRef, useState } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    // Send to Flask backend (keep the question in the input)
    try {
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      const botMessage = { sender: "bot", text: data.reply };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error: Could not connect to server." },
      ]);
    }
    setLoading(false);
    setInput(""); // Clear input after sending
  };

  return (
    <div className="chat-shell">
      <header className="chat-header">
        <h1 className="chat-header-title">Chat with AI</h1>
        <p className="chat-header-subtitle">Powered by AI</p>
      </header>
      <main className="chat-window" ref={listRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`row ${msg.sender === "user" ? "right" : "left"}`}>
            <div className={`bubble ${msg.sender}`}>
              <div className="sender">{msg.sender === "user" ? "You" : "Bot"}</div>
              <div className="text">{msg.text}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="row left">
            <div className="bubble bot loading-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="composer">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message... (Shift+Enter for newline)"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()} className="send-btn">
          {loading ? (
            <>
              <span className="spinner"></span> Thinking...
            </>
          ) : (
            <>
              <span className="send-icon">➤</span> Send
            </>
          )}
        </button>
      </footer>
    </div>
  );
}

export default App;
