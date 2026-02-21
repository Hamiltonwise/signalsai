import type {
  ActionItem,
  GroupedActionItemsResponse,
  ActionItemsResponse,
  CreateActionItemRequest,
  UpdateActionItemRequest,
  FetchActionItemsRequest,
  ClientsResponse,
} from "../types/tasks";

const API_BASE = "/api/tasks";

/**
 * Fetch tasks for logged-in client (grouped by category)
 */
export const fetchClientTasks = async (
  organizationId: number
): Promise<GroupedActionItemsResponse> => {
  const response = await fetch(
    `${API_BASE}?googleAccountId=${organizationId}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch tasks: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Mark a USER category task as complete
 */
export const completeTask = async (
  taskId: number,
  organizationId: number
): Promise<{ success: boolean; task: ActionItem; message: string }> => {
  const response = await fetch(`${API_BASE}/${taskId}/complete`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ googleAccountId: organizationId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to complete task");
  }

  return response.json();
};

/**
 * Create a new task (admin only)
 */
export const createTask = async (
  task: CreateActionItemRequest
): Promise<{ success: boolean; task: ActionItem; message: string }> => {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create task");
  }

  return response.json();
};

/**
 * Fetch all tasks with filters (admin only)
 */
export const fetchAllTasks = async (
  filters: FetchActionItemsRequest = {}
): Promise<ActionItemsResponse> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const response = await fetch(
    `${API_BASE}/admin/all${params.toString() ? `?${params.toString()}` : ""}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch tasks: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Update a task (admin only)
 */
export const updateTask = async (
  taskId: number,
  updates: Omit<UpdateActionItemRequest, "id">
): Promise<{ success: boolean; task: ActionItem; message: string }> => {
  const response = await fetch(`${API_BASE}/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update task");
  }

  return response.json();
};

/**
 * Update task category (admin only)
 */
export const updateTaskCategory = async (
  taskId: number,
  category: "ALLORO" | "USER"
): Promise<{ success: boolean; task: ActionItem; message: string }> => {
  const response = await fetch(`${API_BASE}/${taskId}/category`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ category }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update task category");
  }

  return response.json();
};

/**
 * Archive a task (soft delete)
 */
export const archiveTask = async (
  taskId: number
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE}/${taskId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to archive task");
  }

  return response.json();
};

/**
 * Unarchive a task (restore from archived)
 */
export const unarchiveTask = async (
  taskId: number
): Promise<{ success: boolean; task: ActionItem; message: string }> => {
  const response = await fetch(`${API_BASE}/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "pending" }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to unarchive task");
  }

  return response.json();
};

/**
 * Get list of available clients for task creation
 */
export const fetchClients = async (): Promise<ClientsResponse> => {
  const response = await fetch(`${API_BASE}/clients`);

  if (!response.ok) {
    throw new Error(`Failed to fetch clients: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Bulk archive tasks (admin only)
 */
export const bulkArchiveTasks = async (
  taskIds: number[]
): Promise<{ success: boolean; message: string; count: number }> => {
  const response = await fetch(`${API_BASE}/bulk/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ taskIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to bulk archive tasks");
  }

  return response.json();
};

/**
 * Bulk unarchive tasks (restore from archived)
 */
export const bulkUnarchiveTasks = async (
  taskIds: number[]
): Promise<{ success: boolean; message: string; count: number }> => {
  const response = await fetch(`${API_BASE}/bulk/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ taskIds, status: "pending" }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to bulk unarchive tasks");
  }

  return response.json();
};

/**
 * Bulk approve/unapprove tasks (admin only)
 */
export const bulkApproveTasks = async (
  taskIds: number[],
  is_approved: boolean
): Promise<{ success: boolean; message: string; count: number }> => {
  const response = await fetch(`${API_BASE}/bulk/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ taskIds, is_approved }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to bulk approve tasks");
  }

  return response.json();
};

/**
 * Bulk update task status (admin only)
 */
export const bulkUpdateStatus = async (
  taskIds: number[],
  status: "pending" | "in_progress" | "complete" | "archived"
): Promise<{ success: boolean; message: string; count: number }> => {
  const response = await fetch(`${API_BASE}/bulk/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ taskIds, status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to bulk update status");
  }

  return response.json();
};

/**
 * Health check
 */
export const healthCheck = async (): Promise<{
  success: boolean;
  status: string;
  timestamp: string;
}> => {
  const response = await fetch(`${API_BASE}/health`);

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }

  return response.json();
};
