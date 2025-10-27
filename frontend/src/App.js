import React, { useEffect, useRef, useState } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [documentInfo, setDocumentInfo] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    // Fetch document information on mount
    fetch("http://127.0.0.1:5000/documents")
      .then((res) => res.json())
      .then((data) => setDocumentInfo(data))
      .catch((err) => console.error("Failed to fetch documents:", err));
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    // Add user message
    const userMessage = { sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    
    // Clear input immediately before loading starts
    setInput("");
    setLoading(true);

    // Send to Flask backend
    try {
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, use_kb: true }),
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
  };

  return (
    <div className="chat-shell">
      <header className="chat-header">
        <h1 className="chat-header-title">Chat with AI</h1>
        <p className="chat-header-subtitle">Enterprise Knowledge Assistant</p>
      </header>
      <main className="chat-window" ref={listRef}>
        {messages.length === 0 && !loading && documentInfo && documentInfo.topics.length > 0 && (
          <div className="entry-ui">
            <div className="entry-welcome">
              <div className="company-logo-container">
                <img src="/company-logo.png" alt="House of Companies" className="company-logo" />
              </div>
              <h2 className="entry-title">
                Your Global Business Setup Partner
              </h2>
              <p className="entry-subtitle">Ask me anything about our services, pricing, or how we can help your business expand</p>
            </div>
            {documentInfo.sample_questions && documentInfo.sample_questions.length > 0 && (
              <div className="sample-questions">
                <p className="sample-label">Popular Questions:</p>
                <div className="question-chips">
                  {documentInfo.sample_questions.slice(0, 3).map((q, i) => (
                    <button key={i} className="question-chip" onClick={() => sendMessage(q)}>
                      💡 {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
