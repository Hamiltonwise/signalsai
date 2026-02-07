/**
 * Websites API - Admin portal for website-builder data
 */

export interface WebsiteProject {
  id: string;
  user_id: string;
  generated_hostname: string;
  status: string;
  selected_place_id: string | null;
  selected_website_url: string | null;
  step_gbp_scrape: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface WebsitePage {
  id: string;
  project_id: string;
  path: string;
  version: number;
  status: string;
  html_content: { html: string };
  created_at: string;
  updated_at: string;
}

export interface WebsiteProjectWithPages extends WebsiteProject {
  pages: WebsitePage[];
}

export interface FetchWebsitesRequest {
  status?: string;
  page?: number;
  limit?: number;
}

export interface WebsitesResponse {
  success: boolean;
  data: WebsiteProject[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WebsiteDetailResponse {
  success: boolean;
  data: WebsiteProjectWithPages;
}

export interface StatusesResponse {
  success: boolean;
  statuses: string[];
}

const API_BASE = "/api/admin/websites";

/**
 * Fetch all website projects with pagination
 */
export const fetchWebsites = async (
  filters: FetchWebsitesRequest = {}
): Promise<WebsitesResponse> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const response = await fetch(
    `${API_BASE}${params.toString() ? `?${params.toString()}` : ""}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch websites: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch a single website project with pages
 */
export const fetchWebsiteDetail = async (
  id: string
): Promise<WebsiteDetailResponse> => {
  const response = await fetch(`${API_BASE}/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch website: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Get unique statuses for filter dropdown
 */
export const fetchStatuses = async (): Promise<StatusesResponse> => {
  const response = await fetch(`${API_BASE}/statuses`);

  if (!response.ok) {
    throw new Error(`Failed to fetch statuses: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Create a new website project
 */
export const createWebsite = async (data: {
  user_id?: string;
  hostname?: string;
}): Promise<{ success: boolean; data: WebsiteProject }> => {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create website");
  }

  return response.json();
};

/**
 * Delete a website project
 */
export const deleteWebsite = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete website");
  }

  return response.json();
};

/**
 * Update a website project
 */
export const updateWebsite = async (
  id: string,
  data: Partial<WebsiteProject>
): Promise<{ success: boolean; data: WebsiteProject }> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update website");
  }

  return response.json();
};
