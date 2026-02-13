import { useState } from "react";
import type { SelectedInfo } from "../../hooks/useIframeSelector";
import type { EditDebugInfo } from "../../api/websites";
import ChatPanel from "./ChatPanel";
import DebugPanel from "./DebugPanel";
import type { ChatMessage } from "./ChatPanel";

interface EditorSidebarProps {
  selectedInfo: SelectedInfo | null;
  chatMessages: ChatMessage[];
  onSendEdit: (instruction: string) => void;
  isEditing: boolean;
  debugInfo: EditDebugInfo | null;
  systemPrompt: string | null;
}

export default function EditorSidebar({
  selectedInfo,
  chatMessages,
  onSendEdit,
  isEditing,
  debugInfo,
  systemPrompt,
}: EditorSidebarProps) {
  const [tab, setTab] = useState<"chat" | "debug">("chat");

  return (
    <div className="w-[380px] shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Header with tabs */}
      <div className="px-4 pt-3 pb-0 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTab("chat")}
            className={`pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              tab === "chat"
                ? "text-alloro-orange border-alloro-orange"
                : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setTab("debug")}
            className={`pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              tab === "debug"
                ? "text-alloro-orange border-alloro-orange"
                : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            Debug
          </button>
        </div>
      </div>

      {tab === "chat" ? (
        selectedInfo ? (
          <ChatPanel
            messages={chatMessages}
            onSend={onSendEdit}
            isLoading={isEditing}
            disabled={false}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">
                Click on a section or component to start editing.
              </p>
              <p className="text-xs text-gray-300">
                Hover to preview selectable elements.
              </p>
            </div>
          </div>
        )
      ) : (
        <DebugPanel debugInfo={debugInfo} selectedInfo={selectedInfo} systemPrompt={systemPrompt} />
      )}
    </div>
  );
}
