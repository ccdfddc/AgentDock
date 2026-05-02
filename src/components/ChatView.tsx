import { useState, useRef, useEffect } from "react";
import type { ChatMessage, Agent, RuntimeStatus } from "../types";

interface Props {
  messages: ChatMessage[];
  agents: Agent[];
  isProcessing: boolean;
  runtimeStatus: RuntimeStatus;
  onReset: () => void;
  onSend: (input: string) => void;
}

export function ChatView({
  messages,
  agents,
  isProcessing,
  runtimeStatus,
  onReset,
  onSend,
}: Props) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  const agentName = (id: string) => agents.find((a) => a.id === id)?.name ?? id;

  return (
    <main className="chat-view">
      <section className="runtime-status">
        <span>Loaded {new Date(runtimeStatus.loadedAt).toLocaleTimeString()}</span>
        <span>Sends: {runtimeStatus.sendCount}</span>
        <span>{runtimeStatus.lastRoute}</span>
        {runtimeStatus.lastError && <span className="runtime-error">{runtimeStatus.lastError}</span>}
        <button type="button" className="status-button" onClick={onReset}>
          Reset session
        </button>
      </section>
      <div className="messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>Type a normal message and the selected butler replies.</p>
            <p>Use @Claude or @all to override routing.</p>
            <p>Use @all or @&#x5168;&#x90E8; to broadcast to all enabled agents.</p>
            <p>Add an OpenAI-compatible model on the left and it appears as a new agent automatically.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-meta">
              {msg.role === "user" ? "You" : "Agents"}
              <time>{new Date(msg.timestamp).toLocaleTimeString()}</time>
            </div>
            {msg.agentMessages ? (
              <div className="agent-responses">
                {msg.agentMessages.map((am) => (
                  <div key={am.id} className={`agent-msg ${am.type}`}>
                    <span className="agent-tag">{agentName(am.agentId)}</span>
                    {am.type === "activity" && <span className="activity-badge">activity</span>}
                    {am.type === "summary" && <span className="summary-badge">summary</span>}
                    <p>{am.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>{msg.content}</p>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="message agents processing">
            <div className="message-meta">Agents</div>
            <p>Thinking...</p>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form className="input-bar" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message... (@agent or @all)"
          disabled={isProcessing}
        />
        <button type="submit" disabled={isProcessing || !input.trim()}>
          Send
        </button>
      </form>
    </main>
  );
}