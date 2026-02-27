import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { useConfirm } from "../../ui/ConfirmModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  sendChatMessageStream,
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

const THINKING_WORDS = [
  "Thinking",
  "Pondering",
  "Analyzing",
  "Reflecting",
  "Processing",
  "Contemplating",
];

function ThinkingIndicator() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % THINKING_WORDS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start">
      <div className="bg-white/[0.06] rounded-2xl rounded-bl-md px-5 py-3.5 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-alloro-orange minds-thinking-dot" />
            <span className="h-1.5 w-1.5 rounded-full bg-alloro-orange minds-thinking-dot" />
            <span className="h-1.5 w-1.5 rounded-full bg-alloro-orange minds-thinking-dot" />
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={wordIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-[#a0a0a8] italic tracking-wide"
            >
              {THINKING_WORDS[wordIndex]}...
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
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
        <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-purple-400/20 bg-purple-500/8 px-4 py-1.5 text-xs text-purple-300 hover:bg-purple-500/12 transition-colors">
          <Layers className="h-3 w-3" />
          <span>Conversation condensed ({data.message_count} messages)</span>
        </div>
        {expanded && (
          <div className="mt-2 rounded-xl border border-purple-400/15 bg-purple-500/5 p-4 text-left text-sm text-purple-200 whitespace-pre-wrap">
            {data.summary}
          </div>
        )}
      </button>
    </div>
  );
}

export function MindChatTab({ mindId }: MindChatTabProps) {
  const confirm = useConfirm();
  const [conversations, setConversations] = useState<MindConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MindMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
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
  }, [messages.length, isLoading, streamingText]);

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
    if (!trimmed || isLoading || isStreaming) return;

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
    setStreamingText("");

    try {
      const response = await sendChatMessageStream(
        mindId,
        trimmed,
        activeConvId || undefined
      );

      if (!response.ok) {
        throw new Error("Stream request failed");
      }

      // Keep isLoading=true (ThinkingIndicator visible) until first text token
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let streamConvId = activeConvId;
      let hasReceivedText = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.conversationId && !streamConvId) {
              streamConvId = parsed.conversationId;
              setActiveConvId(streamConvId);
              fetchConversations();
            }

            if (parsed.text) {
              // Transition from thinking → streaming on first text token
              if (!hasReceivedText) {
                hasReceivedText = true;
                setIsLoading(false);
                setIsStreaming(true);
              }
              accumulated += parsed.text;
              shouldAutoScroll.current = true;
              setStreamingText(accumulated);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue; // Partial JSON, skip
            throw e;
          }
        }
      }

      // Stream complete — finalize the assistant message
      if (accumulated) {
        const assistantMessage: MindMessage = {
          id: crypto.randomUUID(),
          conversation_id: streamConvId || "",
          role: "assistant",
          content: accumulated,
          created_at: new Date().toISOString(),
        };
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
      setIsStreaming(false);
      setStreamingText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming) handleSubmit();
    }
  };

  return (
    <div className="flex h-[600px] rounded-xl liquid-glass overflow-hidden">
      {/* Sidebar */}
      <div
        className={`border-r border-white/4 bg-[#0e0e14] flex flex-col transition-all duration-200 ${
          sidebarOpen ? "w-60" : "w-0"
        } overflow-hidden shrink-0`}
      >
        {/* Sidebar header */}
        <div className="p-3 border-b border-white/4 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#6a6a75] uppercase tracking-wider">
            Chats
          </span>
          <button
            onClick={handleNewChat}
            className="rounded-lg p-1.5 text-[#6a6a75] hover:text-alloro-orange hover:bg-alloro-orange/10 transition-colors"
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto minds-chat-scrollbar">
          {loadingConversations ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-[#6a6a75]" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-[#6a6a75] text-center py-6 px-3">
              No conversations yet
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${
                  activeConvId === conv.id
                    ? "bg-white/[0.04] border-r-2 border-alloro-orange"
                    : "hover:bg-white/[0.03]"
                }`}
                onClick={() => selectConversation(conv.id)}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm truncate ${
                      activeConvId === conv.id
                        ? "text-[#eaeaea] font-medium"
                        : "text-[#a0a0a8]"
                    }`}
                  >
                    {conv.title || "New conversation"}
                  </p>
                  <p className="text-[10px] text-[#6a6a75]">
                    {timeAgo(conv.updated_at)}
                  </p>
                </div>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const ok = await confirm({ title: "Delete this conversation?", confirmLabel: "Delete", variant: "danger" });
                    if (ok) {
                      handleDeleteConversation(conv.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 rounded p-1 text-[#6a6a75] hover:text-red-400 transition-all"
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
        className="w-5 flex items-center justify-center bg-[#0e0e14] hover:bg-white/[0.03] border-r border-white/4 transition-colors shrink-0"
        title={sidebarOpen ? "Collapse" : "Expand"}
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-3 w-3 text-[#6a6a75]" />
        ) : (
          <ChevronRight className="h-3 w-3 text-[#6a6a75]" />
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
              <Loader2 className="h-5 w-5 animate-spin text-[#6a6a75]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="h-10 w-10 mb-3 text-[#2a2a2a]" />
              <p className="text-sm font-medium text-[#6a6a75]">Start a conversation</p>
              <p className="text-xs mt-1 text-[#6a6a75]">Send a message to begin.</p>
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
                        : "bg-white/[0.06] text-[#eaeaea] rounded-bl-md border border-white/4"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none overflow-x-auto prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-hr:my-3 prose-blockquote:my-2 prose-pre:my-2 prose-pre:overflow-x-auto prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/4 prose-code:text-alloro-orange prose-table:w-full prose-th:px-3 prose-th:py-1.5 prose-th:text-left prose-th:text-xs prose-th:font-semibold prose-th:border prose-th:border-white/8 prose-th:bg-white/[0.035] prose-td:px-3 prose-td:py-1.5 prose-td:text-xs prose-td:border prose-td:border-white/6">
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

          {isLoading && <ThinkingIndicator />}

          {isStreaming && streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm bg-white/[0.06] text-[#eaeaea] border border-white/4">
                <div className="prose prose-sm prose-invert max-w-none overflow-x-auto prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-hr:my-3 prose-blockquote:my-2 prose-pre:my-2 prose-pre:overflow-x-auto prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/4 prose-code:text-alloro-orange prose-table:w-full prose-th:px-3 prose-th:py-1.5 prose-th:text-left prose-th:text-xs prose-th:font-semibold prose-th:border prose-th:border-white/8 prose-th:bg-white/[0.035] prose-td:px-3 prose-td:py-1.5 prose-td:text-xs prose-td:border prose-td:border-white/6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown>
                  <span className="inline-block w-2 h-4 bg-alloro-orange/70 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
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
              className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-white/[0.06] px-4 py-1.5 text-xs font-medium text-[#eaeaea] shadow-lg hover:bg-white/[0.1] transition-colors backdrop-blur-sm border border-white/6"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Scroll to latest
            </button>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-white/4 p-3 bg-[#0e0e14]/50">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              disabled={isLoading || isStreaming}
              className="flex-1 resize-none rounded-xl border border-white/8 bg-[#121218] px-4 py-2.5 text-sm text-[#eaeaea] placeholder-[#6a6a75] focus:border-alloro-orange focus:outline-none focus:ring-1 focus:ring-alloro-orange/50 disabled:opacity-50"
              style={{ minHeight: "40px", maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading || isStreaming}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-alloro-orange text-white transition-all hover:bg-alloro-orange/90 hover:shadow-[0_0_20px_rgba(214,104,83,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading || isStreaming ? (
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
