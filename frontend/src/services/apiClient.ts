// frontend/src/services/apiClient.ts
import { useCallback } from "react";

interface ApiOptions {
  headers?: Record<string, string>;
  noAuth?: boolean;
}

export const useApiClient = () => {
  const getAuthToken = useCallback(() => {
    return localStorage.getItem("authToken");
  }, []);

  const getBaseUrl = useCallback(() => {
    return import.meta.env.VITE_API_URL || "";
  }, []);

  const createHeaders = useCallback(
    (options?: ApiOptions) => {
      const headers: Record<string, string> = {
        Accept: "application/json",
        ...(options?.headers || {}),
      };

      // Add Content-Type header if not a FormData request
      if (
        !options?.headers?.["Content-Type"] &&
        !(options?.headers?.["Content-Type"] === "")
      ) {
        headers["Content-Type"] = "application/json";
      }

      // Add authorization header if not skipped
      if (!options?.noAuth) {
        const token = getAuthToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      return headers;
    },
    [getAuthToken]
  );

  const handleResponse = useCallback(async (response: Response) => {
    // Check if response is JSON
    const contentType = response.headers.get("Content-Type");
    const isJson = contentType && contentType.includes("application/json");

    // Parse response
    const data = isJson ? await response.json() : await response.text();

    // Check if response is ok
    if (!response.ok) {
      // If there's an error with a message, throw it
      if (isJson && data.message) {
        throw new Error(data.message);
      }

      // Otherwise throw a generic error
      throw new Error(`API request failed with status ${response.status}`);
    }

    return data;
  }, []);

  const get = useCallback(
    async <T = any>(path: string, options?: ApiOptions): Promise<T> => {
      const url = `${getBaseUrl()}${path}`;
      const headers = createHeaders(options);

      const response = await fetch(url, {
        method: "GET",
        headers,
        credentials: "include",
      });

      return handleResponse(response);
    },
    [getBaseUrl, createHeaders, handleResponse]
  );

  const post = useCallback(
    async <T = any>(
      path: string,
      body?: any,
      options?: ApiOptions
    ): Promise<T> => {
      const url = `${getBaseUrl()}${path}`;
      const headers = createHeaders(options);

      // Handle FormData
      let processedBody = body;
      if (!(body instanceof FormData) && body !== undefined) {
        processedBody = JSON.stringify(body);
      }

      // If it's FormData, let the browser set the Content-Type
      if (body instanceof FormData) {
        delete headers["Content-Type"];
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: processedBody,
        credentials: "include",
      });

      return handleResponse(response);
    },
    [getBaseUrl, createHeaders, handleResponse]
  );

  const put = useCallback(
    async <T = any>(
      path: string,
      body?: any,
      options?: ApiOptions
    ): Promise<T> => {
      const url = `${getBaseUrl()}${path}`;
      const headers = createHeaders(options);

      // Handle FormData
      let processedBody = body;
      if (!(body instanceof FormData) && body !== undefined) {
        processedBody = JSON.stringify(body);
      }

      // If it's FormData, let the browser set the Content-Type
      if (body instanceof FormData) {
        delete headers["Content-Type"];
      }

      const response = await fetch(url, {
        method: "PUT",
        headers,
        body: processedBody,
        credentials: "include",
      });

      return handleResponse(response);
    },
    [getBaseUrl, createHeaders, handleResponse]
  );

  const del = useCallback(
    async <T = any>(path: string, options?: ApiOptions): Promise<T> => {
      const url = `${getBaseUrl()}${path}`;
      const headers = createHeaders(options);

      const response = await fetch(url, {
        method: "DELETE",
        headers,
        credentials: "include",
      });

      return handleResponse(response);
    },
    [getBaseUrl, createHeaders, handleResponse]
  );

  return { get, post, put, del };
};
