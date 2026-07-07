"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

/**
 * Shared layout for all authenticated pages.
 * Renders ProtectedRoute, Navbar, and Sidebar ONCE.
 * Individual pages only need to render their <main> content.
 *
 * Pages using this layout:
 *   /dashboard, /study-plan, /courses, /journal, /mocks,
 *   /pyqs, /ai-doubt, /ai-test, /profile, /settings, /admin
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen overflow-hidden bg-bg-dark tech-grid">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
