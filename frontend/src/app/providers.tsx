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
      // Hydrate localstorage state first
      hydrate();
      
      // Cross-check session against cookies by fetching profile
      try {
        const { apiFetch } = await import("@/utils/api");
        const user = await apiFetch("/auth/me");
        if (user) {
          useAuthStore.setState({ user, isAuthenticated: true });
        }
      } catch (e) {
        // If profile fetch fails and local tokens are empty, log out
        const hasToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!hasToken) {
          useAuthStore.getState().clearAuth();
        }
      }
    };
    initAuth();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
