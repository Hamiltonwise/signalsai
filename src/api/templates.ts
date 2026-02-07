/**
 * Templates API - Admin portal for managing website-builder templates
 */

export type TemplateStatus = "draft" | "published";

export interface Template {
  id: string;
  name: string;
  html_template: string;
  status: TemplateStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const API_BASE = "/api/admin/websites/templates";

/**
 * Fetch all templates
 */
export const fetchTemplates = async (): Promise<{
  success: boolean;
  data: Template[];
}> => {
  const response = await fetch(API_BASE);

  if (!response.ok) {
    throw new Error(`Failed to fetch templates: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch a single template
 */
export const fetchTemplate = async (
  id: string
): Promise<{ success: boolean; data: Template }> => {
  const response = await fetch(`${API_BASE}/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch template: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Create a new template
 */
export const createTemplate = async (data: {
  name: string;
  html_template?: string;
  is_active?: boolean;
}): Promise<{ success: boolean; data: Template }> => {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create template");
  }

  return response.json();
};

/**
 * Update a template
 */
export const updateTemplate = async (
  id: string,
  data: Partial<Pick<Template, "name" | "html_template" | "status" | "is_active">>
): Promise<{ success: boolean; data: Template }> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update template");
  }

  return response.json();
};

/**
 * Delete a template
 */
export const deleteTemplate = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete template");
  }

  return response.json();
};

/**
 * Activate a template (deactivates all others)
 */
export const activateTemplate = async (
  id: string
): Promise<{ success: boolean; data: Template }> => {
  const response = await fetch(`${API_BASE}/${id}/activate`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to activate template");
  }

  return response.json();
};
