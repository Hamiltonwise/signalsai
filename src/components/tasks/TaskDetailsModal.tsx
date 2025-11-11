import { X } from "lucide-react";
import type { ReactElement } from "react";
import type { ActionItem } from "../../types/tasks";
import { AgentTypePill } from "./AgentTypePill";

interface TaskDetailsModalProps {
  task: ActionItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetailsModal({
  task,
  isOpen,
  onClose,
}: TaskDetailsModalProps) {
  if (!isOpen || !task) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "border-yellow-200 bg-yellow-50 text-yellow-700",
      in_progress: "border-blue-200 bg-blue-50 text-blue-700",
      complete: "border-green-200 bg-green-50 text-green-700",
      archived: "border-gray-200 bg-gray-50 text-gray-600",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getCategoryBadge = (category: string) => {
    return category === "ALLORO"
      ? "border-purple-200 bg-purple-50 text-purple-700"
      : "border-blue-200 bg-blue-50 text-blue-700";
  };

  // Enhanced markdown rendering for description
  const renderMarkdownText = (text: string): React.ReactNode => {
    const parts: ReactElement[] = [];
    let lastIndex = 0;
    let keyCounter = 0;

    // Match **bold**, *italic*, `code`, and [links](url)
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[([^\]]+)\]\(([^)]+)\))/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${keyCounter++}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }

      const fullMatch = match[0];
      if (fullMatch.startsWith("**") && fullMatch.endsWith("**")) {
        // Bold text
        parts.push(
          <strong key={`bold-${keyCounter++}`} className="font-semibold">
            {fullMatch.slice(2, -2)}
          </strong>
        );
      } else if (fullMatch.startsWith("*") && fullMatch.endsWith("*")) {
        // Italic text
        parts.push(
          <em key={`italic-${keyCounter++}`} className="italic">
            {fullMatch.slice(1, -1)}
          </em>
        );
      } else if (fullMatch.startsWith("`") && fullMatch.endsWith("`")) {
        // Code text
        parts.push(
          <code
            key={`code-${keyCounter++}`}
            className="rounded bg-gray-200 px-1 py-0.5 text-sm font-mono text-gray-800"
          >
            {fullMatch.slice(1, -1)}
          </code>
        );
      } else if (match[2] && match[3]) {
        // Link
        parts.push(
          <a
            key={`link-${keyCounter++}`}
            href={match[3]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            {match[2]}
          </a>
        );
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${keyCounter++}`}>{text.substring(lastIndex)}</span>
      );
    }

    return <>{parts}</>;
  };

  // Simple markdown-like rendering for description
  const renderDescription = (text: string): ReactElement[] => {
    // Filter out confidence lines
    const filteredText = text
      .split("\n")
      .filter((line) => !line.toLowerCase().includes("confidence:"))
      .join("\n");

    // Split by newlines and render paragraphs
    const paragraphs = filteredText.split("\n\n");
    return paragraphs.map((para, idx) => {
      // Check for bullet points
      if (para.trim().startsWith("- ") || para.trim().startsWith("* ")) {
        const items = para.split("\n").filter((line) => line.trim());
        return (
          <ul key={idx} className="list-disc pl-5 space-y-1 mb-4">
            {items.map((item, itemIdx) => {
              const cleanedItem = item.replace(/^[-*]\s+/, "");
              return (
                <li key={itemIdx} className="text-gray-700">
                  {renderMarkdownText(cleanedItem)}
                </li>
              );
            })}
          </ul>
        );
      }
      // Check for numbered lists
      if (/^\d+\.\s/.test(para.trim())) {
        const items = para.split("\n").filter((line) => line.trim());
        return (
          <ol key={idx} className="list-decimal pl-5 space-y-1 mb-4">
            {items.map((item, itemIdx) => {
              const cleanedItem = item.replace(/^\d+\.\s+/, "");
              return (
                <li key={itemIdx} className="text-gray-700">
                  {renderMarkdownText(cleanedItem)}
                </li>
              );
            })}
          </ol>
        );
      }
      // Check for headings
      if (para.trim().startsWith("### ")) {
        return (
          <h3
            key={idx}
            className="text-lg font-semibold text-gray-900 mb-3 mt-4"
          >
            {para.trim().substring(4)}
          </h3>
        );
      }
      if (para.trim().startsWith("## ")) {
        return (
          <h2
            key={idx}
            className="text-xl font-semibold text-gray-900 mb-3 mt-4"
          >
            {para.trim().substring(3)}
          </h2>
        );
      }
      if (para.trim().startsWith("# ")) {
        return (
          <h1 key={idx} className="text-2xl font-bold text-gray-900 mb-4 mt-4">
            {para.trim().substring(2)}
          </h1>
        );
      }
      // Regular paragraph with inline markdown
      return (
        <p key={idx} className="text-gray-700 mb-4">
          {renderMarkdownText(para)}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{task.domain_name}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 px-6 py-6">
          {/* Badges Section */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status:
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadge(
                  task.status
                )}`}
              >
                {task.status.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Category:
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getCategoryBadge(
                  task.category
                )}`}
              >
                {task.category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Agent Type:
              </span>
              <AgentTypePill agentType={task.agent_type ?? null} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Approval:
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                  task.is_approved
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-yellow-200 bg-yellow-50 text-yellow-700"
                }`}
              >
                {task.is_approved ? "Approved" : "Pending"}
              </span>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Description
              </h3>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                {renderDescription(task.description)}
              </div>
            </div>
          )}

          {/* Metadata - Only show completed and due dates if they exist */}
          {(task.completed_at || task.due_date) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {task.completed_at && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Completed
                  </h3>
                  <p className="text-sm text-gray-700">
                    {formatDate(task.completed_at)}
                  </p>
                </div>
              )}
              {task.due_date && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Due Date
                  </h3>
                  <p className="text-sm text-gray-700">
                    {formatDate(task.due_date)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
