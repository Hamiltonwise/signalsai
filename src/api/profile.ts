import { apiGet, apiPut } from "./index";

export interface ProfileData {
  phone: string | null;
  operational_jurisdiction: string | null;
}

export interface ProfileResponse {
  success: boolean;
  data?: ProfileData;
  errorMessage?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  errorMessage?: string;
}

/**
 * Fetches the user's profile data (phone and operational_jurisdiction)
 * from the google_accounts table
 */
export const getProfile = async (): Promise<ProfileResponse> => {
  return apiGet({ path: "/profile/get" });
};

/**
 * Updates the user's profile data (phone and/or operational_jurisdiction)
 * in the google_accounts table
 */
export const updateProfile = async (
  data: Partial<ProfileData>
): Promise<UpdateProfileResponse> => {
  return apiPut({ path: "/profile/update", passedData: data });
};

export default {
  getProfile,
  updateProfile,
};
