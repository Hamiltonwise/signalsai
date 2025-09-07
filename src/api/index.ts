import axios, { type ResponseType } from "axios";
import { getItem } from "../hooks/useLocalStorage";

// const api = "http://localhost:3000/api";
const api = "https://signals.hamiltonwise.com/api";

export async function apiGet({ path }: { path: string }) {
  try {
    const { data } = await axios.get(api + path, {
      headers: getItem("token")
        ? {
            Authorization: `Bearer ${getItem("token")}`,
          }
        : {},
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
  passedData?: object;
  responseType?: ResponseType;
  additionalHeaders?: {
    Accept: string;
  };
}) {
  try {
    const { data } = await axios.post(api + path, passedData, {
      responseType,
      headers: {
        Authorization: `Bearer ${getItem("token")}`,
        ...additionalHeaders,
      },
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
