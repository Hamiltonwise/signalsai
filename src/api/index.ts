import axios, { type ResponseType } from "axios";
import { getItem } from "../hooks/useLocalStorage";

const api = "http://localhost:3000/api";
// const api = "https://app.getalloro.com/api";

/**
 * Helper function to get common headers for API requests
 * Includes both authorization token and google account ID for multi-tenant requests
 */
const getCommonHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};

  const token = getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Add Google Account ID for multi-tenant OAuth token refresh
  const googleAccountId = localStorage.getItem("google_account_id");
  if (googleAccountId) {
    headers["x-google-account-id"] = googleAccountId;
  }

  return headers;
};

export async function apiGet({ path }: { path: string }) {
  try {
    const { data } = await axios.get(api + path, {
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

export async function apiPost({
  path,
  passedData = {},
  responseType = "json",
  additionalHeaders,
}: {
  path: string;
  passedData?: object | FormData;
  responseType?: ResponseType;
  additionalHeaders?: {
    Accept?: string;
    [key: string]: string | undefined;
  };
}) {
  try {
    // Handle FormData differently - don't set Content-Type for FormData
    const isFormData = passedData instanceof FormData;

    // Start with common headers (includes google-account-id)
    const headers: Record<string, string> = getCommonHeaders();

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
