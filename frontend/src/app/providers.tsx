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

  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    const initAuth = async () => {
      // Mark as hydrated immediately (no localStorage to read)
      hydrate();

      // Validate session by fetching profile from server (uses HttpOnly cookie)
      try {
        const { apiFetch } = await import("@/utils/api");
        const user = await apiFetch("/auth/me");
        if (user) {
          useAuthStore.getState().setAuth(user);
        }
      } catch {
        // No valid session cookie — ensure clean unauthenticated state
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
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
