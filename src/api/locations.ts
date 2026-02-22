import { apiGet } from "./index";

export interface GooglePropertyInfo {
  type: string;
  external_id: string;
  account_id: string | null;
  display_name: string | null;
}

export interface Location {
  id: number;
  organization_id: number;
  name: string;
  domain: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  googleProperties: GooglePropertyInfo[];
}

interface LocationsResponse {
  success: boolean;
  locations: Location[];
  total: number;
}

/**
 * Fetch all locations accessible to the current user.
 * Backend filters by organization + user_locations for non-admin users.
 */
export async function getLocations(): Promise<Location[]> {
  const response = await apiGet({ path: "/locations" });
  const data = response.data as LocationsResponse;
  return data.locations || [];
}

/**
 * Fetch the primary location for the current organization.
 */
export async function getPrimaryLocation(): Promise<Location | null> {
  const response = await apiGet({ path: "/locations/primary" });
  const data = response.data as { success: boolean; location: Location };
  return data.location || null;
}
