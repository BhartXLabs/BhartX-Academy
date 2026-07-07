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
      // CRITICAL FIX: Do NOT call hydrate() before /auth/me resolves.
      // Calling hydrate() early sets isHydrated=true + isAuthenticated=false,
      // which causes ProtectedRoute to instantly redirect to /login BEFORE the
      // session cookie is validated — resulting in blank pages for logged-in users.
      //
      // setAuth()  → sets isHydrated=true AND isAuthenticated=true  (logged in)
      // clearAuth() → sets isHydrated=true AND isAuthenticated=false (not logged in)
      // Both are called AFTER /auth/me settles.

      try {
        const { apiFetch } = await import("@/utils/api");
        const user = await apiFetch("/auth/me", { skipAuth: true });
        if (user && user.id) {
          useAuthStore.getState().setAuth(user);
        } else {
          useAuthStore.getState().clearAuth();
        }
      } catch {
        // No valid session cookie — set clean unauthenticated state
        useAuthStore.getState().clearAuth();
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
  }, []); // Empty deps — run only on mount. No hydrate dependency needed.

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
