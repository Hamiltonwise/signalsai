import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ReadingAnimation } from "./ReadingAnimation";
import { triggerParentingReadingStream } from "../../../../api/minds";

interface ParentingReadingViewProps {
  mindId: string;
  mindName: string;
  sessionId: string;
  onComplete: (proposalCount: number) => void;
  onError: (error: string) => void;
}

export function ParentingReadingView({
  mindId,
  mindName,
  sessionId,
  onComplete,
  onError,
}: ParentingReadingViewProps) {
  const [narrationText, setNarrationText] = useState("");
  const [phase, setPhase] = useState<string>("starting");
  const [narrationKey, setNarrationKey] = useState(0);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    let cancelled = false;

    async function runStream() {
      try {
        const response = await triggerParentingReadingStream(mindId, sessionId);

        if (!response.ok) {
          const errText = await response.text();
          onError(errText || "Stream request failed");
          return;
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let currentNarration = "";

        while (true) {
          if (cancelled) break;
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

              if (parsed.type === "error") {
                onError(parsed.error || "Reading failed");
                return;
              }

              if (parsed.type === "narration") {
                currentNarration += parsed.text;
                setNarrationText(currentNarration);
              }

              if (parsed.type === "phase") {
                currentNarration = "";
                setNarrationText("");
                setNarrationKey((k) => k + 1);
                setPhase(parsed.phase);
              }

              if (parsed.type === "complete") {
                await new Promise((r) => setTimeout(r, 1500));
                onComplete(parsed.proposalCount);
                return;
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          onError(err.message || "Reading failed");
        }
      }
    }

    runStream();

    return () => {
      cancelled = true;
    };
  }, [mindId, sessionId, onComplete, onError]);

  return (
    <div className="liquid-glass rounded-xl p-8">
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ReadingAnimation />

        <h3 className="text-base font-semibold text-[#eaeaea] mt-6 mb-2">
          {mindName} is reading...
        </h3>

        {/* Narration text — typewriter style */}
        <div className="max-w-md min-h-[3rem] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={narrationKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {narrationText ? (
                <p
                  className="text-sm text-[#6a6a75] italic"
                  style={{ fontFamily: "'Literata', serif" }}
                >
                  "{narrationText}"
                  <span className="inline-block w-1.5 h-3.5 bg-alloro-orange/70 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
                </p>
              ) : (
                <p className="text-sm text-[#6a6a75]">
                  {phase === "extracting"
                    ? "Extracting knowledge..."
                    : phase === "comparing"
                      ? "Comparing against existing brain..."
                      : "Getting ready..."}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
