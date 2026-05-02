import { useState } from "react";
import type { FormEvent } from "react";
import type { Agent } from "../types";
import { AgentToggle } from "./AgentToggle";

interface Props {
  agents: Agent[];
  butlerId: string;
  onSelectButler: (id: string) => void;
  onToggle: (agentId: string, field: "enabled" | "mentionable" | "callable" | "speaker") => void;
  onAddModel: (draft: {
    name: string;
    baseUrl: string;
    apiKey: string;
    model: string;
  }) => void;
}

export function AgentPanel({ agents, butlerId, onSelectButler, onToggle, onAddModel }: Props) {
  const [draft, setDraft] = useState({
    name: "",
    baseUrl: "",
    apiKey: "",
    model: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      onAddModel(draft);
      setDraft({ name: "", baseUrl: "", apiKey: "", model: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add model.");
    }
  };

  const enabledAgents = agents.filter((agent) => agent.enabled);

  return (
    <aside className="agent-panel">
      <div className="panel-header">
        <div>
          <h2>Agents</h2>
          <p>Built-ins plus any OpenAI-compatible models you add.</p>
        </div>
        <span className="panel-count">{agents.length}</span>
      </div>

      <form className="model-form" onSubmit={handleSubmit}>
        <h3>Add Model</h3>
        <div className="model-grid">
          <label>
            Name
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Gemini Pro"
            />
          </label>
          <label>
            Model
            <input
              type="text"
              value={draft.model}
              onChange={(e) => setDraft((prev) => ({ ...prev, model: e.target.value }))}
              placeholder="gemini-2.5-pro"
            />
          </label>
          <label className="span-two">
            Base URL
            <input
              type="url"
              value={draft.baseUrl}
              onChange={(e) => setDraft((prev) => ({ ...prev, baseUrl: e.target.value }))}
              placeholder="https://api.openai.com"
            />
          </label>
          <label className="span-two">
            API Key
            <input
              type="password"
              value={draft.apiKey}
              onChange={(e) => setDraft((prev) => ({ ...prev, apiKey: e.target.value }))}
              placeholder="sk-..."
            />
          </label>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="add-model-button">
          Add model
        </button>
      </form>

      <div className="butler-select">
        <label>
          Butler:
          <select value={butlerId} onChange={(e) => onSelectButler(e.target.value)}>
            {enabledAgents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="agent-list">
        {agents.map((agent) => (
          <li key={agent.id} className={`agent-card ${!agent.enabled ? "disabled" : ""} ${agent.source === "custom" ? "custom-agent" : ""}`}>
            <div className="agent-header">
              <strong>{agent.name}</strong>
              <span className="transport-badge">{agent.transport}</span>
              {agent.source === "custom" && <span className="badge badge-soft">custom</span>}
              {agent.id === butlerId && <span className="badge">butler</span>}
            </div>
            <p className="agent-desc">{agent.description}</p>
            <div className="agent-toggles">
              <AgentToggle
                agent={agent}
                field="enabled"
                label="Enabled"
                disabled={agent.id === butlerId}
                onToggle={onToggle}
              />
              {agent.id === butlerId && <span className="butler-note">always replies</span>}
              <AgentToggle agent={agent} field="mentionable" label="Mention" onToggle={onToggle} />
              <AgentToggle agent={agent} field="callable" label="Callable" onToggle={onToggle} />
              <AgentToggle agent={agent} field="speaker" label="Speaker" onToggle={onToggle} />
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}