import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MessageSquare, User, Calendar } from "lucide-react";
import { useMonday } from "../../hooks/useMonday";
import type { MondayTask } from "../../api/monday";
import { AddComment } from "./AddComment";
import { getStatusDisplay } from "./TaskList";

interface CommentsViewProps {
  isOpen: boolean;
  task: MondayTask;
  onClose: () => void;
}

export const CommentsView: React.FC<CommentsViewProps> = ({
  isOpen,
  task,
  onClose,
}) => {
  const {
    currentTaskComments,
    commentsLoading,
    commentsError,
    getTaskComments,
    clearComments,
  } = useMonday();

  // Animation variants for full-screen slide-left
  const slideVariants = {
    hidden: {
      x: "100%",
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
    },
    exit: {
      x: "100%",
      opacity: 0,
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  // Disable parent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "var(--scrollbar-width, 0px)";
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  // Load comments when component opens - Fix infinite loop by adding proper dependencies
  useEffect(() => {
    if (isOpen && task.id) {
      getTaskComments(task.id);
    }
  }, [isOpen, task.id]); // Removed getTaskComments from dependencies to prevent infinite loop

  // Clear comments when component closes
  useEffect(() => {
    if (!isOpen) {
      clearComments();
    }
  }, [isOpen, clearComments]);

  // Get status display info
  const statusInfo = getStatusDisplay(task.status);
  const StatusIcon = statusInfo.icon;

  // Format comment date
  const formatCommentDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) {
        return "Just now";
      } else if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year:
            date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
      }
    } catch {
      return "Unknown date";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Full-Screen Modal Content */}
          <motion.div
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              type: "tween",
              duration: 0.3,
              ease: [0.4, 0.0, 0.2, 1],
            }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Task Comments
                  </h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color} border ${statusInfo.borderColor}`}
                    >
                      <StatusIcon className="w-4 h-4 mr-1" />
                      {statusInfo.label}
                    </div>
                    <span className="text-sm text-gray-500">
                      #{task.id.slice(-8)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Task Content Summary */}
              <div className="bg-gray-50 rounded-lg p-4 max-w-4xl">
                <p className="text-base text-gray-700 leading-relaxed">
                  {task.content}
                </p>
              </div>
            </div>

            {/* Comments Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                  {commentsLoading ? (
                    // Loading State
                    <div className="space-y-6">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="animate-pulse">
                          <div className="flex space-x-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-3">
                              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                              <div className="h-4 bg-gray-200 rounded w-full"></div>
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : commentsError ? (
                    // Error State
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-10 h-10 text-red-500" />
                      </div>
                      <h4 className="text-xl font-medium text-gray-900 mb-3">
                        Error Loading Comments
                      </h4>
                      <p className="text-red-600 mb-6 text-base">
                        {commentsError}
                      </p>
                      <button
                        onClick={() => getTaskComments(task.id)}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : currentTaskComments.length === 0 ? (
                    // Empty State
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-10 h-10 text-gray-400" />
                      </div>
                      <h4 className="text-xl font-medium text-gray-900 mb-3">
                        No Comments Yet
                      </h4>
                      <p className="text-gray-600 text-base">
                        Be the first to add a comment or update to this task.
                      </p>
                    </div>
                  ) : (
                    // Comments List
                    <div className="space-y-6">
                      {currentTaskComments.map((comment) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex space-x-4"
                        >
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                          </div>

                          {/* Comment Content */}
                          <div className="flex-1 min-w-0">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-base font-medium text-gray-900">
                                  {comment.creator.name}
                                </h5>
                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {formatCommentDate(comment.created_at)}
                                  </span>
                                </div>
                              </div>
                              <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {comment.body}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Add Comment Component */}
              <div className="flex-shrink-0 border-t border-gray-200 bg-white">
                <div className="max-w-4xl mx-auto">
                  <AddComment taskId={task.id} />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
