"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isHydrated, router]);

  if (!isHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg-dark text-foreground">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <span className="text-xs text-gray-500 font-semibold tracking-wide">Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (isHydrated && !isAuthenticated) {
    return null; // Prevents flashing protected layout before navigation completes
  }

  return <>{children}</>;
}
