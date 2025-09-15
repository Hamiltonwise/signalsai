import React, { useState, useEffect, type ReactNode } from "react";
import monday from "../api/monday";
import type { MondayContextType } from "../hooks/useMonday";
import type {
  MondayTask,
  MondayComment,
  CreateTaskRequest,
  FetchTasksRequest,
  UpdateTaskRequest,
  ArchiveTaskRequest,
  AddCommentRequest,
} from "../api/monday";
import { MondayContext } from "./MondayContext";
import { useAuth } from "../hooks/useAuth";

interface MondayProviderProps {
  children: ReactNode;
}

export const MondayProvider: React.FC<MondayProviderProps> = ({ children }) => {
  // Main tasks state
  const [tasks, setTasks] = useState<MondayTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comments state
  const [currentTaskComments, setCurrentTaskComments] = useState<
    MondayComment[]
  >([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  // Get domain state from AuthContext
  const { selectedDomain } = useAuth();

  // Create Task
  const createTask = async (data: CreateTaskRequest) => {
    try {
      setError(null);
      const result = await monday.createTask(data);

      if (result.successful !== false) {
        // Add the new task to the current list
        setTasks((prevTasks) => [result.task, ...prevTasks]);
        console.log("Task created:", result);
      } else {
        setError(result.errorMessage || "Failed to create task");
        throw new Error(result.errorMessage || "Failed to create task");
      }
    } catch (error) {
      const errorMessage = "Failed to create task";
      setError(errorMessage);
      console.error("Create task error:", error);
      throw error;
    }
  };

  // Fetch Tasks
  const fetchTasks = async (data?: FetchTasksRequest) => {
    if (!selectedDomain?.domain) return;

    const requestData: FetchTasksRequest = {
      domain: selectedDomain.domain,
      ...data,
    };

    try {
      setIsLoading(true);
      setError(null);
      const result = await monday.fetchTasks(requestData);

      if (result.successful !== false) {
        setTasks(result.tasks || []);
        console.log("Tasks fetched:", result);
      } else {
        setError(result.errorMessage || "Failed to fetch tasks");
      }
    } catch (error) {
      setError("Failed to fetch tasks");
      console.error("Fetch tasks error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update Task
  const updateTask = async (data: UpdateTaskRequest) => {
    try {
      setError(null);

      // Optimistic update
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === data.taskId ? { ...task, ...data.updates } : task
        )
      );

      const result = await monday.updateTask(data);

      if (result.successful !== false) {
        // Update with server response
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === data.taskId ? result.task : task
          )
        );
        console.log("Task updated:", result);
      } else {
        // Revert optimistic update on error
        await fetchTasks();
        setError(result.errorMessage || "Failed to update task");
        throw new Error(result.errorMessage || "Failed to update task");
      }
    } catch (error) {
      // Revert optimistic update on error
      await fetchTasks();
      const errorMessage = "Failed to update task";
      setError(errorMessage);
      console.error("Update task error:", error);
      throw error;
    }
  };

  // Archive Task
  const archiveTask = async (data: ArchiveTaskRequest) => {
    try {
      setError(null);

      // Optimistic update
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === data.taskId
            ? { ...task, status: "archived_by_client" as const }
            : task
        )
      );

      const result = await monday.archiveTask(data);

      if (result.successful !== false) {
        console.log("Task archived:", result);
      } else {
        // Revert optimistic update on error
        await fetchTasks();
        setError(result.errorMessage || "Failed to archive task");
        throw new Error(result.errorMessage || "Failed to archive task");
      }
    } catch (error) {
      // Revert optimistic update on error
      await fetchTasks();
      const errorMessage = "Failed to archive task";
      setError(errorMessage);
      console.error("Archive task error:", error);
      throw error;
    }
  };

  // Get Task Comments
  const getTaskComments = async (taskId: string) => {
    try {
      setCommentsLoading(true);
      setCommentsError(null);
      const result = await monday.getTaskComments(taskId);

      if (result.successful !== false) {
        setCurrentTaskComments(result.comments || []);
        console.log("Task comments fetched:", result);
      } else {
        setCommentsError(result.errorMessage || "Failed to fetch comments");
      }
    } catch (error) {
      setCommentsError("Failed to fetch comments");
      console.error("Get task comments error:", error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Add Task Comment
  const addTaskComment = async (data: AddCommentRequest) => {
    try {
      setCommentsError(null);
      const result = await monday.addTaskComment(data);

      if (result.successful !== false) {
        // Add the new comment to the current list
        setCurrentTaskComments((prevComments) => [
          ...prevComments,
          result.comment,
        ]);
        console.log("Comment added:", result);
      } else {
        setCommentsError(result.errorMessage || "Failed to add comment");
        throw new Error(result.errorMessage || "Failed to add comment");
      }
    } catch (error) {
      const errorMessage = "Failed to add comment";
      setCommentsError(errorMessage);
      console.error("Add comment error:", error);
      throw error;
    }
  };

  // Clear Comments (when closing comments view)
  const clearComments = () => {
    setCurrentTaskComments([]);
    setCommentsError(null);
  };

  // Refresh Tasks (convenience method)
  const refreshTasks = async () => {
    await fetchTasks();
  };

  // Auto-fetch tasks when domain changes
  useEffect(() => {
    if (selectedDomain?.domain) {
      fetchTasks();
    }
  }, [selectedDomain]);

  const contextValue: MondayContextType = {
    // State
    tasks,
    isLoading,
    error,

    // Comments state
    currentTaskComments,
    commentsLoading,
    commentsError,

    // Actions
    createTask,
    fetchTasks,
    updateTask,
    archiveTask,

    // Comments actions
    getTaskComments,
    addTaskComment,
    clearComments,

    // Utility
    refreshTasks,
  };

  return (
    <MondayContext.Provider value={contextValue}>
      {children}
    </MondayContext.Provider>
  );
};
