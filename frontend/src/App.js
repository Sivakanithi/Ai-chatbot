import React, { useEffect, useRef, useState } from "react";

// API base URL strategy (works across devices without rebuild):
// - Start with REACT_APP_API_URL (from build env) or localhost default
// - Then, if /config.json is present in public, override at runtime
// - If apiBase is empty string, use same-origin relative paths
const localhostDefault =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5000"
    : "";

function App() {
  const [apiBase, setApiBase] = useState(
    () => process.env.REACT_APP_API_URL || localhostDefault
  );
  const apiUrl = (path) => (apiBase ? `${apiBase}${path}` : path);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const listRef = useRef(null);

    // Optional runtime config override (public/config.json)
    useEffect(() => {
      fetch("/config.json", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((cfg) => {
          if (cfg && typeof cfg.apiBase === "string" && cfg.apiBase !== apiBase) {
            setApiBase(cfg.apiBase);
          }
        })
        .catch(() => {});
    }, []);

    useEffect(() => {
      fetch(apiUrl("/documents"))
        .then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          return res.json();
        })
        .then((data) => {
          setDocumentInfo(data);
          setBackendError(null);
        })
        .catch((err) => {
          console.error("Failed to fetch documents:", err);
          setBackendError(`Backend not reachable at ${apiBase || "same-origin"}.`);
        });
    }, [apiBase]);

    useEffect(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, [messages, loading]);

    const sendMessage = async (messageText) => {
      const textToSend = messageText || input;
      if (!textToSend.trim()) return;
      setMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
      setInput("");
      setLoading(true);
      try {
        const response = await fetch(apiUrl("/chat"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: textToSend, use_kb: true }),
        });
        const data = await response.json();
        setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
      } catch (e) {
        setMessages((prev) => [...prev, { sender: "bot", text: "Error: Could not connect to server." }]);
        console.error("Chat request failed:", e);
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
          {backendError && messages.length === 0 && (
            <div className="entry-ui">
              <div className="entry-welcome">
                <p className="entry-subtitle" style={{ color: "#fca5a5" }}>
                  {backendError} Set REACT_APP_API_URL or add public/config.json with {{"apiBase":"https://your-backend"}} and deploy.
                </p>
              </div>
            </div>
          )}
          {messages.length === 0 && !loading && documentInfo && documentInfo.topics && documentInfo.topics.length > 0 && (
            <div className="entry-ui">
              <div className="entry-welcome">
                <div className="company-logo-container">
                  <img src="/company-logo.png" alt="House of Companies" className="company-logo" />
                </div>
                <h2 className="entry-title">Your Global Business Setup Partner</h2>
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
              <span><span className="spinner"></span> Thinking...</span>
            ) : (
              <span><span className="send-icon">➤</span> Send</span>
            )}
          </button>
        </footer>
      </div>
    );
}

export default App;
