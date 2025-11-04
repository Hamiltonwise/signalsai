// Task Management System Types (Frontend)

export type ActionItemCategory = "ALLORO" | "USER";
export type ActionItemStatus =
  | "complete"
  | "pending"
  | "in_progress"
  | "archived";

export interface ActionItem {
  id: number;
  domain_name: string;
  google_account_id?: number;
  title: string;
  description?: string;
  category: ActionItemCategory;
  status: ActionItemStatus;
  is_approved: boolean;
  created_by_admin: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  due_date?: string;
  metadata?: unknown;
}

export interface GroupedActionItems {
  ALLORO: ActionItem[];
  USER: ActionItem[];
}

export interface GroupedActionItemsResponse {
  success: boolean;
  tasks: GroupedActionItems;
  total: number;
  message?: string;
}

export interface ActionItemsResponse {
  success: boolean;
  tasks: ActionItem[];
  total: number;
  message?: string;
}

export interface CreateActionItemRequest {
  domain_name: string;
  google_account_id?: number;
  title: string;
  description?: string;
  category: ActionItemCategory;
  is_approved?: boolean;
  due_date?: string;
  metadata?: unknown;
}

export interface UpdateActionItemRequest {
  id: number;
  title?: string;
  description?: string;
  status?: ActionItemStatus;
  is_approved?: boolean;
  due_date?: string;
  metadata?: unknown;
}

export interface FetchActionItemsRequest {
  domain_name?: string;
  google_account_id?: number;
  category?: ActionItemCategory;
  status?: ActionItemStatus;
  is_approved?: boolean;
  limit?: number;
  offset?: number;
  date_from?: string;
  date_to?: string;
}

export interface ClientOption {
  id: number;
  domain_name: string;
  email: string;
}

export interface ClientsResponse {
  success: boolean;
  clients: ClientOption[];
  total: number;
}
