import { AgentPanel } from "./components/AgentPanel";
import { ChatView } from "./components/ChatView";
import { useAgentStore } from "./state/store";

export function App() {
  const {
    agents,
    butlerId,
    setButlerId,
    messages,
    isProcessing,
    runtimeStatus,
    toggleAgent,
    addOpenAICompatibleModel,
    resetSession,
    sendMessage,
  } = useAgentStore();

  return (
    <div className="app">
      <AgentPanel
        agents={agents}
        butlerId={butlerId}
        onSelectButler={setButlerId}
        onToggle={toggleAgent}
        onAddModel={addOpenAICompatibleModel}
      />
      <ChatView
        messages={messages}
        agents={agents}
        isProcessing={isProcessing}
        runtimeStatus={runtimeStatus}
        onReset={resetSession}
        onSend={sendMessage}
      />
    </div>
  );
}