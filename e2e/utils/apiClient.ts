import { getApiUrl } from "./getApiUrl.js";

const getBaseUrl = () => getApiUrl();

export interface ApiClientOptions {
  headers?: Record<string, string> | undefined;
}

export const apiClient = {
  get: async (endpoint: string, options?: ApiClientOptions) => {
    const init: RequestInit = {
      method: "GET",
      headers: {
        ...(options?.headers || {}),
      },
    };
    return fetch(`${getBaseUrl()}${endpoint}`, init);
  },

  post: async (endpoint: string, data?: any, options?: ApiClientOptions) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    };
    const init: RequestInit = {
      method: "POST",
      headers,
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    };
    return fetch(`${getBaseUrl()}${endpoint}`, init);
  },

  put: async (endpoint: string, data?: any, options?: ApiClientOptions) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    };
    const init: RequestInit = {
      method: "PUT",
      headers,
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    };
    return fetch(`${getBaseUrl()}${endpoint}`, init);
  },

  patch: async (endpoint: string, data?: any, options?: ApiClientOptions) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    };
    const init: RequestInit = {
      method: "PATCH",
      headers,
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    };
    return fetch(`${getBaseUrl()}${endpoint}`, init);
  },

  delete: async (endpoint: string, options?: ApiClientOptions & { data?: any }) => {
    const headers: Record<string, string> = {
      ...(options?.data !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(options?.headers || {}),
    };
    const init: RequestInit = {
      method: "DELETE",
      headers,
      ...(options?.data !== undefined ? { body: JSON.stringify(options.data) } : {}),
    };
    return fetch(`${getBaseUrl()}${endpoint}`, init);
  },
};
