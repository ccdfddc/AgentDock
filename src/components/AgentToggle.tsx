import type { Agent } from "../types";

interface Props {
  agent: Agent;
  field: "enabled" | "mentionable" | "callable" | "speaker";
  label: string;
  disabled?: boolean;
  onToggle: (agentId: string, field: Props["field"]) => void;
}

export function AgentToggle({ agent, field, label, disabled = false, onToggle }: Props) {
  return (
    <label className={`toggle ${disabled ? "toggle-disabled" : ""}`}>
      <input
        type="checkbox"
        checked={agent[field]}
        disabled={disabled}
        onChange={() => onToggle(agent.id, field)}
      />
      <span className="toggle-label">{label}</span>
    </label>
  );
}