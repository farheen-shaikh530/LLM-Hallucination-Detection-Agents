import { useState, useRef, useEffect } from "react";
import ChatMessage from "./components/ChatMessage";
import KpiBar from "./components/KpiBar";

const EXAMPLE_COMMANDS = {
  answers: [
    "What is the latest version of Linux?",
    "GitHub breaking update this month??",
    "Latex Firefox version?",
    "Firefox Configuration Error last month?"
  ],
  abstain: [
    "Firefox Configuration Error this month?",
    "Which is faster, Java or Go?",
    "What should I use instead of jQuery?",
    "Is Kubernetes worth learning?"
  ],
};

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      type: "text",
      content: "Hi, I'm Release Master! Ask me about CVEs, patches, versions, or breaking updates.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSend(text) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", type: "text", content: trimmed },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      setLatestResult(data);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", type: "pipeline-result", content: data },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", type: "text", content: "Couldn't reach the server. Is the backend running?" },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function clearChat() {
    setMessages([
      { id: "welcome", role: "assistant", type: "text", content: "Hi, I'm Release Master! Ask me about CVEs, patches, versions, or breaking updates." },
    ]);
    setLatestResult(null);
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-section">
          <div className="sidebar-section-label sidebar-label-answers">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z"/>
            </svg>
            Example Answer prompts
          </div>
          <ul className="sidebar-list">
            {EXAMPLE_COMMANDS.answers.map((q) => (
              <li key={q}>
                <button className="sidebar-item" onClick={() => handleSend(q)} disabled={isLoading}>
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-divider" />

        <div className="sidebar-section">
          <div className="sidebar-section-label sidebar-label-abstain">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
           Example I Don't Know prompts
          </div>
          <ul className="sidebar-list">
            {EXAMPLE_COMMANDS.abstain.map((q) => (
              <li key={q}>
                <button className="sidebar-item sidebar-item-abstain" onClick={() => handleSend(q)} disabled={isLoading}>
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ── Main chat column ── */}
      <div className="chat-layout">
      {/* ── Header ── */}
      <header className="chat-header">
        <div className="header-title-group">
          <h1><span className="gradient">Release Master</span></h1>
          <p className="header-subtitle">Software Update Q&amp;A System</p>
        </div>

        {latestResult && (
          <KpiBar
            bertscore={latestResult.bertscore}
            compositeScore={latestResult.compositeScore}
            decision={latestResult.decision}
          />
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="header-badge">releasetrain.io</span>
          <button className="clear-btn" onClick={clearChat} title="Clear chat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Messages ── */}
      <main className="chat-messages">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onSend={handleSend} />
        ))}

        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">A</div>
            <div className="message-bubble">
              <div className="typing-indicator"><span/><span/><span/></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* ── Input ── */}
      <footer className="chat-input-area">
        <div className="chat-input-container">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask about CVEs, patches, or versions..."
            rows={1}
            disabled={isLoading}
          />
          <button className="send-button" onClick={() => handleSend()} disabled={!input.trim() || isLoading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p className="chat-disclaimer">
          Answers come only from releasetrain.io — the system says "I don't know" when data isn't available.
        </p>
      </footer>
      </div>
    </div>
  );
}
