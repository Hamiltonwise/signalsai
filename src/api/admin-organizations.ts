/**
 * Admin Organizations API
 *
 * Typed functions for admin organization management endpoints.
 * All functions use apiGet/apiPatch/apiDelete which internally call getPriorityItem
 * for auth tokens, making them pilot-mode-aware.
 */

import { apiGet, apiPatch, apiDelete, apiPost } from "./index";

/**
 * Typed interfaces for admin org responses
 */

export interface AdminOrganization {
  id: number;
  name: string;
  domain: string | null;
  subscription_tier: "DWY" | "DFY" | null;
  created_at: string;
  userCount: number;
  connections: { gbp: boolean };
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

export interface AdminConnection {
  accountId: string;
  email: string;
  properties: { gbp?: any[] };
}

export interface AdminWebsite {
  id: number;
  generated_hostname: string;
  status: string;
  created_at: string;
}

export interface AdminOrganizationDetail {
  id: number;
  name: string;
  domain: string | null;
  subscription_tier: "DWY" | "DFY" | null;
  created_at: string;
  userCount?: number;
  users: AdminUser[];
  connections: AdminConnection[];
  website: AdminWebsite | null;
}

export interface AdminGoogleProperty {
  id: number;
  location_id: number;
  type: "gbp";
  external_id: string;
  display_name: string | null;
  metadata: Record<string, unknown> | null;
  selected: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminLocation {
  id: number;
  organization_id: number;
  name: string;
  domain: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  googleProperties: AdminGoogleProperty[];
}

export interface AdminLocationsResponse {
  success: boolean;
  locations: AdminLocation[];
  total: number;
}

export interface AdminOrganizationsListResponse {
  success: boolean;
  organizations: AdminOrganization[];
}

export interface AdminOrganizationDetailResponse {
  success: boolean;
  organization: AdminOrganizationDetail;
  users: AdminUser[];
  connections: AdminConnection[];
  website: AdminWebsite | null;
}

export interface PilotSessionResponse {
  success: boolean;
  token: string;
  googleAccountId: number;
  user: { id: number; email: string };
}

/**
 * List all organizations with summary metadata
 */
export async function adminListOrganizations(): Promise<AdminOrganizationsListResponse> {
  return apiGet({ path: "/admin/organizations" });
}

/**
 * Get a single organization with users, connections, and website details
 */
export async function adminGetOrganization(
  orgId: number
): Promise<AdminOrganizationDetailResponse> {
  return apiGet({ path: `/admin/organizations/${orgId}` });
}

/**
 * Update organization name
 */
export async function adminUpdateOrganizationName(
  orgId: number,
  name: string
): Promise<{ success: boolean; message: string; organization: { id: number; name: string } }> {
  return apiPatch({
    path: `/admin/organizations/${orgId}`,
    passedData: { name },
  });
}

/**
 * Update organization subscription tier
 */
export async function adminUpdateOrganizationTier(
  orgId: number,
  tier: "DWY" | "DFY"
): Promise<{ success: boolean; tier: string; message: string }> {
  return apiPatch({
    path: `/admin/organizations/${orgId}/tier`,
    passedData: { tier },
  });
}

/**
 * Delete organization (requires confirmation)
 */
export async function adminDeleteOrganization(orgId: number): Promise<{ success: boolean }> {
  return apiDelete({ path: `/admin/organizations/${orgId}?confirmDelete=true` });
}

/**
 * Get all locations for an organization with their Google Properties
 */
export async function adminGetOrganizationLocations(
  orgId: number
): Promise<AdminLocationsResponse> {
  return apiGet({ path: `/admin/organizations/${orgId}/locations` });
}

/**
 * Start a pilot session as a specific user
 */
export async function adminStartPilotSession(
  userId: number
): Promise<PilotSessionResponse> {
  return apiPost({
    path: `/admin/pilot/${userId}`,
    passedData: {},
  });
}
