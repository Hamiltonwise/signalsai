import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ActionButton } from "../../../ui/DesignSystem";
import {
  sendParentingChatStream,
  triggerParentingReading,
  type ParentingMessage,
} from "../../../../api/minds";
import { toast } from "react-hot-toast";

interface ParentingChatProps {
  mindId: string;
  sessionId: string;
  messages: ParentingMessage[];
  onNewMessage: (msg: ParentingMessage) => void;
  readOnly: boolean;
  onTriggerReading: (proposalCount: number) => void;
}

const THINKING_WORDS = [
  "Thinking",
  "Pondering",
  "Absorbing",
  "Processing",
  "Reflecting",
  "Considering",
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

const PROSE_CLASSES =
  "prose prose-sm prose-invert max-w-none overflow-x-auto prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-hr:my-3 prose-blockquote:my-2 prose-pre:my-2 prose-pre:overflow-x-auto prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/4 prose-code:text-alloro-orange prose-table:w-full prose-th:px-3 prose-th:py-1.5 prose-th:text-left prose-th:text-xs prose-th:font-semibold prose-th:border prose-th:border-white/8 prose-th:bg-white/[0.035] prose-td:px-3 prose-td:py-1.5 prose-td:text-xs prose-td:border prose-td:border-white/6";

export function ParentingChat({
  mindId,
  sessionId,
  messages,
  onNewMessage,
  readOnly,
  onTriggerReading,
}: ParentingChatProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [triggeringReading, setTriggeringReading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const shouldAutoScroll = useRef(false);

  useEffect(() => {
    if (shouldAutoScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      shouldAutoScroll.current = false;
    }
  }, [messages.length, isLoading, streamingText]);

  // Scroll to bottom on initial load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, []);

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
    if (!isLoading && !readOnly) {
      inputRef.current?.focus();
    }
  }, [isLoading, readOnly]);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || isStreaming || readOnly) return;

    const userMessage: ParentingMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    shouldAutoScroll.current = true;
    onNewMessage(userMessage);
    setInput("");
    setIsLoading(true);
    setStreamingText("");

    try {
      const response = await sendParentingChatStream(mindId, sessionId, trimmed);

      if (!response.ok) {
        throw new Error("Stream request failed");
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
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

            if (parsed.text) {
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
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      if (accumulated) {
        const assistantMessage: ParentingMessage = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          role: "assistant",
          content: accumulated,
          created_at: new Date().toISOString(),
        };
        onNewMessage(assistantMessage);
      }
    } catch {
      const errorMessage: ParentingMessage = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        created_at: new Date().toISOString(),
      };
      onNewMessage(errorMessage);
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

  const handleTriggerReading = async () => {
    setTriggeringReading(true);
    try {
      const result = await triggerParentingReading(mindId, sessionId);
      if (result) {
        onTriggerReading(result.proposalCount);
      } else {
        toast.error("Failed to trigger reading");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger reading");
    } finally {
      setTriggeringReading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] rounded-xl liquid-glass overflow-hidden">
      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto p-4 space-y-4 minds-chat-scrollbar"
      >
        {messages
          .filter((m) => m.role !== "system")
          .map((msg) => (
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
                  <div className={PROSE_CLASSES}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

        {isLoading && <ThinkingIndicator />}

        {isStreaming && streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm bg-white/[0.06] text-[#eaeaea] border border-white/4">
              <div className={PROSE_CLASSES}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {streamingText}
                </ReactMarkdown>
                <span className="inline-block w-2 h-4 bg-alloro-orange/70 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to latest */}
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

      {/* Input area */}
      <div className="border-t border-white/4 p-3 bg-[#0e0e14]/50">
        {readOnly ? (
          <div className="text-center py-2">
            <p className="text-xs text-[#6a6a75]">
              This session has ended. Start a new one to teach more.
            </p>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Teach something..."
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
            <ActionButton
              label="Ready to Learn"
              icon={<BookOpen className="h-4 w-4" />}
              onClick={handleTriggerReading}
              variant="secondary"
              size="sm"
              loading={triggeringReading}
              disabled={isLoading || isStreaming || messages.length < 2}
            />
          </div>
        )}
      </div>
    </div>
  );
}
