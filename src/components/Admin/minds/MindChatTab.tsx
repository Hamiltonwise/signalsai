import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
} from "lucide-react";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  sendChatMessage,
  getConversation,
  listConversations,
  deleteConversation,
  type MindMessage,
  type MindConversation,
  type CompactionMessage,
} from "../../../api/minds";

interface MindChatTabProps {
  mindId: string;
}

function parseCompaction(msg: MindMessage): CompactionMessage | null {
  if (msg.role !== "system") return null;
  try {
    const parsed = JSON.parse(msg.content);
    if (parsed.type === "compaction") return parsed as CompactionMessage;
  } catch {
    // Not a compaction message
  }
  return null;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function CompactionBubble({ data }: { data: CompactionMessage }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex justify-center my-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="group max-w-[90%] text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-purple-200 bg-purple-50/50 px-4 py-1.5 text-xs text-purple-500 hover:bg-purple-50 transition-colors">
          <Layers className="h-3 w-3" />
          <span>Conversation condensed ({data.message_count} messages)</span>
        </div>
        {expanded && (
          <div className="mt-2 rounded-xl border border-purple-100 bg-purple-50/30 p-4 text-left text-sm text-purple-800 whitespace-pre-wrap">
            {data.summary}
          </div>
        )}
      </button>
    </div>
  );
}

export function MindChatTab({ mindId }: MindChatTabProps) {
  const [conversations, setConversations] = useState<MindConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MindMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const shouldAutoScroll = useRef(false);

  // Only auto-scroll when the user just sent a message (not on load/switch)
  useEffect(() => {
    if (shouldAutoScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      shouldAutoScroll.current = false;
    }
  }, [messages.length, isLoading]);

  // Track scroll position to show/hide "scroll to latest" button
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 80;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsAtBottom(atBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!isLoading && !loadingMessages) {
      inputRef.current?.focus();
    }
  }, [isLoading, loadingMessages]);

  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true);
    const data = await listConversations(mindId);
    setConversations(data);
    setLoadingConversations(false);
    return data;
  }, [mindId]);

  useEffect(() => {
    (async () => {
      const convs = await fetchConversations();
      // Auto-select most recent
      if (convs.length > 0) {
        selectConversation(convs[0].id);
      }
    })();
  }, [mindId]);

  const selectConversation = async (convId: string) => {
    setActiveConvId(convId);
    setLoadingMessages(true);
    const msgs = await getConversation(mindId, convId);
    setMessages(msgs);
    setLoadingMessages(false);
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  const handleDeleteConversation = async (convId: string) => {
    const ok = await deleteConversation(mindId, convId);
    if (ok) {
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) {
        setActiveConvId(null);
        setMessages([]);
      }
      toast.success("Conversation deleted");
    } else {
      toast.error("Failed to delete conversation");
    }
  };

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: MindMessage = {
      id: crypto.randomUUID(),
      conversation_id: activeConvId || "",
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    shouldAutoScroll.current = true;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await sendChatMessage(
        mindId,
        trimmed,
        activeConvId || undefined
      );
      if (result) {
        if (!activeConvId) {
          setActiveConvId(result.conversationId);
          // Refresh conversation list to show new conversation
          fetchConversations();
        }
        const assistantMessage: MindMessage = {
          id: crypto.randomUUID(),
          conversation_id: result.conversationId,
          role: "assistant",
          content: result.reply,
          created_at: new Date().toISOString(),
        };
        shouldAutoScroll.current = true;
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch {
      const errorMessage: MindMessage = {
        id: crypto.randomUUID(),
        conversation_id: activeConvId || "",
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-[600px] rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Sidebar */}
      <div
        className={`border-r border-gray-100 bg-gray-50/50 flex flex-col transition-all duration-200 ${
          sidebarOpen ? "w-60" : "w-0"
        } overflow-hidden shrink-0`}
      >
        {/* Sidebar header */}
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Chats
          </span>
          <button
            onClick={handleNewChat}
            className="rounded-lg p-1.5 text-gray-400 hover:text-alloro-orange hover:bg-alloro-orange/10 transition-colors"
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6 px-3">
              No conversations yet
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${
                  activeConvId === conv.id
                    ? "bg-white border-r-2 border-alloro-orange"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => selectConversation(conv.id)}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm truncate ${
                      activeConvId === conv.id
                        ? "text-gray-900 font-medium"
                        : "text-gray-600"
                    }`}
                  >
                    {conv.title || "New conversation"}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {timeAgo(conv.updated_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this conversation?")) {
                      handleDeleteConversation(conv.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 rounded p-1 text-gray-300 hover:text-red-400 transition-all"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toggle sidebar */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="w-5 flex items-center justify-center bg-gray-50 hover:bg-gray-100 border-r border-gray-100 transition-colors shrink-0"
        title={sidebarOpen ? "Collapse" : "Expand"}
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-3 w-3 text-gray-400" />
        ) : (
          <ChevronRight className="h-3 w-3 text-gray-400" />
        )}
      </button>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="relative flex-1 overflow-y-auto p-4 space-y-4"
        >
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <MessageSquare className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">Start a conversation</p>
              <p className="text-xs mt-1">Send a message to begin.</p>
            </div>
          ) : (
            messages.map((msg) => {
              // Check for compaction message
              const compaction = parseCompaction(msg);
              if (compaction) {
                return <CompactionBubble key={msg.id} data={compaction} />;
              }

              // Skip unknown system messages
              if (msg.role === "system") return null;

              return (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm overflow-hidden ${
                      msg.role === "user"
                        ? "bg-alloro-orange text-white rounded-br-md"
                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-gray max-w-none overflow-x-auto prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-hr:my-3 prose-blockquote:my-2 prose-pre:my-2 prose-pre:overflow-x-auto prose-table:w-full prose-th:px-3 prose-th:py-1.5 prose-th:text-left prose-th:text-xs prose-th:font-semibold prose-th:border prose-th:border-gray-300 prose-th:bg-gray-200 prose-td:px-3 prose-td:py-1.5 prose-td:text-xs prose-td:border prose-td:border-gray-200">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to latest floating button */}
        {!isAtBottom && messages.length > 0 && (
          <div className="relative">
            <button
              onClick={scrollToBottom}
              className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-alloro-navy/90 px-4 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-alloro-navy transition-colors backdrop-blur-sm"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Scroll to latest
            </button>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-alloro-orange focus:outline-none focus:ring-1 focus:ring-alloro-orange disabled:opacity-50"
              style={{ minHeight: "40px", maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-alloro-orange text-white transition-all hover:bg-alloro-orange/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
