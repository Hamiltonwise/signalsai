import React, { useState } from "react";
import {
  MessageSquare,
  Edit2,
  Archive,
  Save,
  X,
  MoreHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";
import type { MondayTask } from "../../api/monday";
import { useMonday } from "../../hooks/useMonday";
import { useAuth } from "../../hooks/useAuth";
import { getStatusDisplay } from "./TaskList";

interface TaskItemProps {
  task: MondayTask;
  onViewComments: (task: MondayTask) => void;
  formatDate: (dateString?: string) => string;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onViewComments,
  formatDate,
}) => {
  const { updateTask, archiveTask } = useMonday();
  const { selectedDomain } = useAuth();

  // Component state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(task.content);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Get status display info
  const statusInfo = getStatusDisplay(task.status);
  const StatusIcon = statusInfo.icon;

  // Handle edit mode
  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(task.content);
    setUpdateError(null);
    setShowActions(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(task.content);
    setUpdateError(null);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      setUpdateError("Task content cannot be empty");
      return;
    }

    try {
      setIsUpdating(true);
      setUpdateError(null);

      await updateTask({
        taskId: task.id,
        updates: { content: editContent.trim() },
      });

      setIsEditing(false);
    } catch (error) {
      setUpdateError("Failed to update task");
      console.error("Update task error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle archive
  const handleArchive = async () => {
    if (!selectedDomain?.domain) return;

    try {
      setIsArchiving(true);
      setUpdateError(null);

      await archiveTask({
        taskId: task.id,
        domain: selectedDomain.domain,
      });

      setShowActions(false);
    } catch (error) {
      setUpdateError("Failed to archive task");
      console.error("Archive task error:", error);
    } finally {
      setIsArchiving(false);
    }
  };

  // Handle key press in edit mode
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-lg border transition-all duration-200 hover:shadow-md ${
        task.status === "archived_by_client"
          ? "opacity-75 border-gray-200"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="p-4">
        {/* Task Content */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-4">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  disabled={isUpdating}
                  placeholder="Enter task details..."
                />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Press Cmd+Enter to save, Esc to cancel</span>
                  <span>{editContent.length}/1000</span>
                </div>
              </div>
            ) : (
              <p
                className={`text-gray-900 leading-relaxed ${
                  task.status === "archived_by_client"
                    ? "line-through opacity-75"
                    : ""
                }`}
              >
                {task.content}
              </p>
            )}
          </div>

          {/* Actions Menu */}
          <div className="relative flex-shrink-0">
            {!isEditing && (
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            )}

            {/* Actions Dropdown */}
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[140px]"
              >
                <button
                  onClick={handleEdit}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                {task.status !== "archived_by_client" && (
                  <button
                    onClick={handleArchive}
                    disabled={isArchiving}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Archive className="w-3 h-3" />
                    <span>{isArchiving ? "Archiving..." : "Archive"}</span>
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Task Meta Information */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Status Badge */}
            <div
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color} border ${statusInfo.borderColor}`}
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </div>

            {/* Task Type */}
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                task.type === "ai"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {task.type === "ai" ? "AI Task" : "Custom"}
            </span>

            {/* Created Date */}
            <span className="text-xs text-gray-500">
              {formatDate(task.created_at)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isUpdating || !editContent.trim()}
                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 flex items-center space-x-1"
                >
                  {isUpdating ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => onViewComments(task)}
                className="flex items-center space-x-1 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs font-medium">Comments</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {updateError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600"
          >
            {updateError}
          </motion.div>
        )}
      </div>

      {/* Click outside to close actions */}
      {showActions && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowActions(false)}
        />
      )}
    </motion.div>
  );
};
