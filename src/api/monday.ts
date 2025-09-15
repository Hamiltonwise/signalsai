import { apiPost, apiGet } from "./index";

const baseurl = "/monday";

// Monday.com TypeScript interfaces
export interface MondayTask {
  id: string;
  name: string;
  client: string;
  content: string;
  type: "ai" | "custom";
  status: "completed" | "in_progress" | "archived_by_client" | "on_hold";
  created_at?: string;
  updated_at?: string;
  group?: {
    id: string;
    title: string;
  };
  board?: {
    id: string;
  };
}

export interface MondayComment {
  id: string;
  body: string;
  created_at: string;
  creator: {
    id: string;
    name: string;
  };
}

export interface CreateTaskRequest {
  domain: string;
  content: string;
  type?: "ai" | "custom";
}

export interface CreateTaskResponse {
  success: true;
  taskId: string;
  boardId: string;
  task: MondayTask;
  message: string;
}

export interface FetchTasksRequest {
  domain: string;
  status?: "completed" | "in_progress" | "archived_by_client" | "on_hold";
  limit?: number;
}

export interface FetchTasksResponse {
  success: true;
  domain: string;
  tasks: MondayTask[];
  totalCount: number;
  filters: {
    status?: string;
  };
}

export interface UpdateTaskRequest {
  taskId: string;
  updates: {
    content?: string;
    type?: "ai" | "custom";
    status?: "completed" | "in_progress" | "archived_by_client" | "on_hold";
  };
}

export interface UpdateTaskResponse {
  success: true;
  taskId: string;
  task: MondayTask;
  appliedUpdates: object;
  message: string;
}

export interface ArchiveTaskRequest {
  taskId: string;
  domain: string;
}

export interface ArchiveTaskResponse {
  success: true;
  taskId: string;
  domain: string;
  updatedStatus: "archived_by_client";
  message: string;
}

export interface GetCommentsResponse {
  success: true;
  taskId: string;
  comments: MondayComment[];
  totalComments: number;
}

export interface AddCommentRequest {
  taskId: string;
  comment: string;
  domain: string;
}

export interface AddCommentResponse {
  success: true;
  taskId: string;
  comment: MondayComment;
  message: string;
}

// API Functions
async function createTask(data: CreateTaskRequest) {
  try {
    return await apiPost({
      path: baseurl + `/createTask`,
      passedData: data,
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

async function fetchTasks(data: FetchTasksRequest) {
  try {
    return await apiPost({
      path: baseurl + `/fetchTasks`,
      passedData: data,
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

async function updateTask(data: UpdateTaskRequest) {
  try {
    return await apiPost({
      path: baseurl + `/updateTask`,
      passedData: data,
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

async function archiveTask(data: ArchiveTaskRequest) {
  try {
    return await apiPost({
      path: baseurl + `/archiveTask`,
      passedData: data,
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

async function getTaskComments(taskId: string) {
  try {
    return await apiPost({
      path: baseurl + `/getTaskComments`,
      passedData: { taskId },
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

async function addTaskComment(data: AddCommentRequest) {
  try {
    return await apiPost({
      path: baseurl + `/addTaskComment`,
      passedData: data,
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

async function getDiagnosticBoards() {
  try {
    return await apiGet({
      path: baseurl + `/diag/boards`,
    });
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

const monday = {
  createTask,
  fetchTasks,
  updateTask,
  archiveTask,
  getTaskComments,
  addTaskComment,
  getDiagnosticBoards,
};

export default monday;
