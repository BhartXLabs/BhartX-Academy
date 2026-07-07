"use client";

import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes cache
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    const initAuth = async () => {
      // CRITICAL: Do NOT call hydrate() here.
      // hydrate() must only be called AFTER /auth/me resolves.
      // Calling it early sets isHydrated=true with isAuthenticated=false,
      // which causes ProtectedRoute to redirect to /login BEFORE the
      // session cookie is validated — resulting in blank pages for logged-in users.

      // Validate session by fetching profile from server (uses HttpOnly cookie)
      try {
        const { apiFetch } = await import("@/utils/api");
        const user = await apiFetch("/auth/me", { skipAuth: true });
        if (user && user.id) {
          useAuthStore.getState().setAuth(user); // sets isHydrated=true + isAuthenticated=true
        } else {
          useAuthStore.getState().clearAuth(); // sets isHydrated=true + isAuthenticated=false
        }
      } catch {
        // No valid session cookie — clean unauthenticated state
        useAuthStore.getState().clearAuth(); // sets isHydrated=true + isAuthenticated=false
      }
    };
    initAuth();

    // Register Service Worker for PWA offline capabilities in production
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => {
            console.log("PWA Service Worker registered with scope: ", registration.scope);
          },
          (err) => {
            console.error("PWA Service Worker registration failed: ", err);
          }
        );
      });
    }
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
