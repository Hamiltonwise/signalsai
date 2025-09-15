import React from "react";
import { MessageSquare, Clock, CheckCircle, Archive } from "lucide-react";
import type { MondayTask } from "../../api/monday";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
  tasks: MondayTask[];
  isLoading: boolean;
  onViewComments: (task: MondayTask) => void;
}

// Status mapping utility function
export const getStatusDisplay = (status: MondayTask["status"]) => {
  switch (status) {
    case "in_progress":
    case "on_hold":
      return {
        label: "Open",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        icon: Clock,
      };
    case "completed":
      return {
        label: "Closed",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        icon: CheckCircle,
      };
    case "archived_by_client":
      return {
        label: "Archived",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        icon: Archive,
      };
    default:
      return {
        label: "Open",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        icon: Clock,
      };
  }
};

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  isLoading,
  onViewComments,
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="animate-pulse bg-gray-50 rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-gray-400" />
        </div>
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          No tasks found
        </h4>
        <p className="text-gray-600 mb-4">
          You haven't submitted any support tickets yet.
        </p>
        <p className="text-sm text-gray-500">
          Click "Submit a Ticket" to create your first support request.
        </p>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date";

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return "Today";
      } else if (diffDays === 1) {
        return "Yesterday";
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
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
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onViewComments={onViewComments}
          formatDate={formatDate}
        />
      ))}

      {/* Task count summary */}
      <div className="pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500 text-center">
          Showing {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};
