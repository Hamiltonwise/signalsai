import axios, { type ResponseType } from "axios";
import { getPriorityItem } from "../hooks/useLocalStorage";

// Prefer environment-configured API base; default to relative "/api" so Vite dev proxy handles CORS in development.
// Define VITE_API_URL in .env for deployments that need an absolute URL.
const api = (import.meta as any)?.env?.VITE_API_URL ?? "/api";

/**
 * Helper function to get common headers for API requests
 * Includes both authorization token and google account ID for multi-tenant requests
 */
const getCommonHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};

  // Use priority item for pilot support
  const token = getPriorityItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Add Google Account ID for multi-tenant OAuth token refresh
  // Use priority item for pilot support
  const googleAccountId = getPriorityItem("google_account_id");
  if (googleAccountId) {
    headers["x-google-account-id"] = googleAccountId;
  }

  return headers;
};

export async function apiGet({
  path,
  token,
}: {
  path: string;
  token?: string;
}) {
  try {
    const headers = getCommonHeaders();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const { data } = await axios.get(api + path, {
      headers,
    });
    return data;
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

export async function apiPost({
  path,
  passedData = {},
  responseType = "json",
  additionalHeaders,
  token,
}: {
  path: string;
  passedData?: object | FormData;
  responseType?: ResponseType;
  additionalHeaders?: {
    Accept?: string;
    [key: string]: string | undefined;
  };
  token?: string;
}) {
  try {
    // Handle FormData differently - don't set Content-Type for FormData
    const isFormData = passedData instanceof FormData;

    // Start with common headers (includes google-account-id)
    const headers: Record<string, string> = getCommonHeaders();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Only add additional headers if they exist and aren't Content-Type for FormData
    if (additionalHeaders) {
      Object.entries(additionalHeaders).forEach(([key, value]) => {
        if (value && !(isFormData && key.toLowerCase() === "content-type")) {
          headers[key] = value;
        }
      });
    }

    // For non-FormData, set default Content-Type if not provided
    if (!isFormData && !headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }

    const { data } = await axios.post(api + path, passedData, {
      responseType,
      headers,
    });
    return data;
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

export async function apiPatch({
  path,
  passedData = {},
  additionalHeaders,
}: {
  path: string;
  passedData?: object;
  additionalHeaders?: {
    Accept?: string;
    [key: string]: string | undefined;
  };
}) {
  try {
    // Start with common headers (includes google-account-id)
    const headers: Record<string, string> = {
      ...getCommonHeaders(),
      "Content-Type": "application/json",
    };

    if (additionalHeaders) {
      Object.entries(additionalHeaders).forEach(([key, value]) => {
        if (value) {
          headers[key] = value;
        }
      });
    }

    const { data } = await axios.patch(api + path, passedData, {
      headers,
    });
    return data;
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

export async function apiPut({
  path,
  passedData = {},
  additionalHeaders,
}: {
  path: string;
  passedData?: object;
  additionalHeaders?: {
    Accept?: string;
    [key: string]: string | undefined;
  };
}) {
  try {
    // Start with common headers (includes google-account-id)
    const headers: Record<string, string> = {
      ...getCommonHeaders(),
      "Content-Type": "application/json",
    };

    if (additionalHeaders) {
      Object.entries(additionalHeaders).forEach(([key, value]) => {
        if (value) {
          headers[key] = value;
        }
      });
    }

    const { data } = await axios.put(api + path, passedData, {
      headers,
    });
    return data;
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}

export async function apiDelete({ path }: { path: string }) {
  try {
    const { data } = await axios.delete(api + path, {
      headers: getCommonHeaders(),
    });

    return data;
  } catch (err) {
    console.log(err);
    return {
      successful: false,
      errorMessage: "Technical error, contact developer",
    };
  }
}
