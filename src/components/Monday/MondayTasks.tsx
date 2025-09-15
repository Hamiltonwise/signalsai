import React, { useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { useMonday } from "../../hooks/useMonday";
import { useAuth } from "../../hooks/useAuth";
import { TaskList } from "./TaskList";
import { SubmitTicket } from "./SubmitTicket";
import { CommentsView } from "./CommentsView";
import type { MondayTask } from "../../api/monday";

interface MondayTasksProps {
  className?: string;
}

export const MondayTasks: React.FC<MondayTasksProps> = ({ className = "" }) => {
  const { tasks, isLoading, error } = useMonday();
  const { selectedDomain } = useAuth();

  // View states
  const [showSubmitTicket, setShowSubmitTicket] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MondayTask | null>(null);

  // Handle task actions
  const handleViewComments = (task: MondayTask) => {
    setSelectedTask(task);
    setShowComments(true);
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setSelectedTask(null);
  };

  const handleTicketSubmitted = () => {
    setShowSubmitTicket(false);
    // Tasks will auto-refresh due to context
  };

  const handleCloseSubmitTicket = () => {
    setShowSubmitTicket(false);
  };

  if (!selectedDomain) {
    return (
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <div className="text-center text-gray-500">
          <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Please select a domain to view support tasks</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Support Tasks
              </h3>
              <p className="text-sm text-gray-600">
                {selectedDomain.displayName} • {tasks.length} total tasks
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSubmitTicket(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Submit a Ticket</span>
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Task List - Linear with Status Pills */}
        <TaskList
          tasks={tasks}
          isLoading={isLoading}
          onViewComments={handleViewComments}
        />
      </div>

      {/* Full-Screen Submit Ticket Panel */}
      {showSubmitTicket && (
        <SubmitTicket
          isOpen={showSubmitTicket}
          onClose={handleCloseSubmitTicket}
          onSubmit={handleTicketSubmitted}
        />
      )}

      {/* Full-Screen Comments Panel */}
      {showComments && selectedTask && (
        <CommentsView
          isOpen={showComments}
          task={selectedTask}
          onClose={handleCloseComments}
        />
      )}
    </>
  );
};
