import axios, { AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";

declare const process: {
  env: Record<string, string | undefined>;
};

const API_ORIGIN =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://inkindi-construction-backend.onrender.com";

const normalizedApiOrigin = API_ORIGIN.replace(/\/+$/, "").replace(
  /\/api\/v1$/,
  "",
);

export const API_BASE_URL = `${normalizedApiOrigin}/api/v1`;
export const AUTH_TOKEN_KEY = "inkingi_auth_token";

export const getAuthToken = () => SecureStore.getItemAsync(AUTH_TOKEN_KEY);

export const setAuthToken = (token: string) =>
  SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);

export const clearAuthToken = () => SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Request failed. Please try again.";

    return Promise.reject(new Error(message));
  },
);
