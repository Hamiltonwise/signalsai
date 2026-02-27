import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox,
  Mail,
  MailOpen,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  fetchFormSubmissions,
  toggleFormSubmissionRead,
  deleteFormSubmission,
} from "../../api/websites";
import type { FormSubmission } from "../../api/websites";

interface Props {
  projectId: string;
  isAdmin?: boolean;
  fetchSubmissionsFn?: (projectId: string, page: number, limit: number) => Promise<any>;
  toggleReadFn?: (projectId: string, submissionId: string, is_read: boolean) => Promise<any>;
  deleteSubmissionFn?: (projectId: string, submissionId: string) => Promise<any>;
}

export default function FormSubmissionsTab({ projectId, isAdmin, fetchSubmissionsFn, toggleReadFn, deleteSubmissionFn }: Props) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const fetchFn = fetchSubmissionsFn || fetchFormSubmissions;
      const res = await fetchFn(projectId, page, 20);
      setSubmissions(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotal(res.pagination?.total || 0);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [projectId, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleRead = async (sub: FormSubmission) => {
    try {
      const toggleFn = toggleReadFn || toggleFormSubmissionRead;
      await toggleFn(projectId, sub.id, !sub.is_read);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, is_read: !s.is_read } : s)),
      );
      setUnreadCount((c) => (sub.is_read ? c + 1 : Math.max(0, c - 1)));
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const deleteFn = deleteSubmissionFn || deleteFormSubmission;
      await deleteFn(projectId, id);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setTotal((t) => t - 1);
      if (selectedId === id) setSelectedId(null);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const selectedSubmission = submissions.find((s) => s.id === selectedId);

  const relativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const previewFields = (contents: Record<string, string>) => {
    const entries = Object.entries(contents);
    return entries.slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(" · ");
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Form Submissions</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
            {total}
          </span>
          {unreadCount > 0 && (
            <span className="text-xs text-white bg-alloro-orange px-2.5 py-1 rounded-full font-medium">
              {unreadCount} new
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
      ) : submissions.length === 0 ? (
        <div className="p-8 text-center">
          <Inbox className="mx-auto mb-3 text-gray-300" size={32} />
          <p className="text-gray-400 text-sm">No form submissions yet</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="divide-y divide-gray-100">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className={`px-5 py-3 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition ${
                  !sub.is_read ? "bg-alloro-orange/5" : ""
                }`}
                onClick={() => {
                  setSelectedId(selectedId === sub.id ? null : sub.id);
                  if (!sub.is_read) handleToggleRead(sub);
                }}
              >
                {/* Read indicator */}
                <div className="flex-shrink-0">
                  {sub.is_read ? (
                    <MailOpen size={16} className="text-gray-300" />
                  ) : (
                    <Mail size={16} className="text-alloro-orange" />
                  )}
                </div>

                {/* Form name */}
                <div className="w-36 flex-shrink-0">
                  <span className={`text-sm ${!sub.is_read ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                    {sub.form_name}
                  </span>
                </div>

                {/* Preview */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-400 truncate">
                    {previewFields(sub.contents)}
                  </p>
                </div>

                {/* Time */}
                <div className="flex-shrink-0 text-xs text-gray-400">
                  {relativeTime(sub.submitted_at)}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleRead(sub);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                    title={sub.is_read ? "Mark unread" : "Mark read"}
                  >
                    <Eye size={14} />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(sub.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <AnimatePresence>
            {selectedSubmission && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-200 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{selectedSubmission.form_name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(selectedSubmission.submitted_at).toLocaleString()}
                        {" · Sent to: "}
                        {selectedSubmission.recipients_sent_to.join(", ")}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedId(null)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(selectedSubmission.contents).map(([key, value]) => (
                      <div key={key} className="flex gap-3">
                        <span className="text-sm text-gray-400 w-40 flex-shrink-0">{key}</span>
                        <span className="text-sm text-gray-900 font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-500"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-500"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
