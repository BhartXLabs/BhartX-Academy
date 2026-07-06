import { useAuthStore } from "@/store/useAuthStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch(path: string, options: RequestOptions = {}) {
  const { skipAuth = false, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${path}`;

  // Build Headers
  const headers = new Headers(fetchOptions.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  fetchOptions.headers = headers;
  // Always include cookies for HttpOnly session auth
  fetchOptions.credentials = "include";

  try {
    let response = await fetch(url, fetchOptions);

    // Auto-refresh: if access token cookie expired, call /auth/refresh via cookie
    if (response.status === 401 && !skipAuth) {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // Refresh token is already in the HttpOnly cookie, no body needed
        body: JSON.stringify({}),
      });

      if (refreshResponse.ok) {
        // New cookies are set by the server; retry the original request
        response = await fetch(url, fetchOptions);
      } else {
        // Refresh failed — clear client state and redirect to login
        useAuthStore.getState().clearAuth();
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: "An error occurred" }));
      throw new Error(errData.detail || "Server error");
    }

    return await response.json();
  } catch (error: any) {
    throw error;
  }
}
