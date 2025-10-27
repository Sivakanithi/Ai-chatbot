import React, { useEffect, useRef, useState } from "react";

// API Configuration - Detect production vs development
const API_BASE_URL = 
  process.env.REACT_APP_API_URL || 
  (window.location.hostname.includes('onrender.com') 
    ? 'https://ai-chatbot-v9re.onrender.com' 
    : 'http://127.0.0.1:5000');

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [documentInfo, setDocumentInfo] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    // Fetch document information on mount
    console.log("🔧 API_BASE_URL:", API_BASE_URL);
    fetch(`${API_BASE_URL}/documents`)
      .then((res) => {
        console.log("📡 Documents response status:", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("✅ Documents data:", data);
        setDocumentInfo(data);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch documents:", err);
        console.error("❌ Error details:", err.message);
      });
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
      console.log("📤 Sending message to:", `${API_BASE_URL}/chat`);
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, use_kb: true }),
      });

      console.log("📡 Chat response status:", response.status);
      const data = await response.json();
      console.log("✅ Chat data:", data);
      const botMessage = { sender: "bot", text: data.reply };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("❌ Chat error:", error);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
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
              <div className="entry-icon">📚</div>
              <h2 className="entry-title">
                {documentInfo.topics.length === 1 
                  ? `Want to know about ${documentInfo.topics[0]}?`
                  : `Want to know about ${documentInfo.topics.slice(0, -1).join(", ")} and ${documentInfo.topics.slice(-1)}?`
                }
              </h2>
              <p className="entry-subtitle">I can help you with information from our knowledge base</p>
            </div>
            {documentInfo.sample_questions && documentInfo.sample_questions.length > 0 && (
              <div className="sample-questions">
                <p className="sample-label">Try asking:</p>
                <div className="question-chips">
                  {documentInfo.sample_questions.map((question, idx) => (
                    <button
                      key={idx}
                      className="question-chip"
                      onClick={() => sendMessage(question)}
                    >
                      {question}
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
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="send-btn">
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
