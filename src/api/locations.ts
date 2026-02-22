import { apiGet, apiPost, apiPut, apiDelete } from "./index";

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
  // apiGet already unwraps axios { data } — response IS the body
  return response.locations || [];
}

/**
 * Fetch the primary location for the current organization.
 */
export async function getPrimaryLocation(): Promise<Location | null> {
  const response = await apiGet({ path: "/locations/primary" });
  return response.location || null;
}

export interface GBPSelection {
  accountId: string;
  locationId: string;
  displayName: string;
}

/**
 * Create a new location with a required GBP profile.
 */
export async function createLocation(data: {
  name: string;
  domain?: string;
  gbp: GBPSelection;
}): Promise<Location> {
  const response = await apiPost({
    path: "/locations",
    passedData: data,
  });
  return response.location;
}

/**
 * Update location metadata (name, domain, is_primary).
 */
export async function updateLocation(
  locationId: number,
  data: { name?: string; domain?: string; is_primary?: boolean }
): Promise<Location> {
  const response = await apiPut({
    path: `/locations/${locationId}`,
    passedData: data,
  });
  return response.location;
}

/**
 * Delete a location (cannot remove the last one).
 */
export async function deleteLocation(locationId: number): Promise<void> {
  await apiDelete({ path: `/locations/${locationId}` });
}

/**
 * Set or change the GBP profile for a location.
 */
export async function updateLocationGBP(
  locationId: number,
  gbp: GBPSelection
): Promise<Location> {
  const response = await apiPut({
    path: `/locations/${locationId}/gbp`,
    passedData: gbp,
  });
  return response.location;
}

/**
 * Disconnect GBP from a location.
 */
export async function disconnectLocationGBP(
  locationId: number
): Promise<void> {
  await apiDelete({ path: `/locations/${locationId}/gbp` });
}
