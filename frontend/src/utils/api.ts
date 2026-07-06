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

  // Inject Access Token
  if (!skipAuth) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  fetchOptions.headers = headers;

  try {
    let response = await fetch(url, fetchOptions);

    // Auto Refresh Token Interceptor
    if (response.status === 401 && !skipAuth) {
      const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
      if (refreshToken) {
        // Attempt Token Refresh
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          // Update Zustand storage
          if (typeof window !== "undefined") {
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("refreshToken", data.refresh_token);
          }
          // Retry the original request
          headers.set("Authorization", `Bearer ${data.access_token}`);
          fetchOptions.headers = headers;
          response = await fetch(url, fetchOptions);
        } else {
          // Refresh failed, sign out student
          useAuthStore.getState().clearAuth();
          if (typeof window !== "undefined" && window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
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
