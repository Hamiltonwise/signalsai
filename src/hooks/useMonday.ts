import { useContext } from "react";
import { MondayContext } from "../contexts/MondayContext";
import type {
  MondayTask,
  MondayComment,
  CreateTaskRequest,
  FetchTasksRequest,
  UpdateTaskRequest,
  ArchiveTaskRequest,
  AddCommentRequest,
} from "../api/monday";

export interface MondayContextType {
  // State
  tasks: MondayTask[];
  isLoading: boolean;
  error: string | null;

  // Comments state
  currentTaskComments: MondayComment[];
  commentsLoading: boolean;
  commentsError: string | null;

  // Actions
  createTask: (data: CreateTaskRequest) => Promise<void>;
  fetchTasks: (data?: FetchTasksRequest) => Promise<void>;
  updateTask: (data: UpdateTaskRequest) => Promise<void>;
  archiveTask: (data: ArchiveTaskRequest) => Promise<void>;

  // Comments actions
  getTaskComments: (taskId: string) => Promise<void>;
  addTaskComment: (data: AddCommentRequest) => Promise<void>;
  clearComments: () => void;

  // Utility
  refreshTasks: () => Promise<void>;
}

export const useMonday = (): MondayContextType => {
  const context = useContext(MondayContext);
  if (context === undefined) {
    throw new Error("useMonday must be used within a MondayProvider");
  }
  return context;
};

export type { MondayTask, MondayComment };
