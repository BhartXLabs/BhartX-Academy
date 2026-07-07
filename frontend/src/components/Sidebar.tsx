"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  BookOpen,
  Award,
  BookOpenCheck,
  Flame,
  User,
  Shield,
  Sparkles,
  ClipboardList,
  Calendar,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSidebarStore } from "@/store/useSidebarStore";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { mobileOpen, closeMobile } = useSidebarStore();

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: Compass },
    { name: "Daily AI Planner", href: "/study-plan", icon: Calendar },
    { name: "Subjects Syllabus", href: "/courses", icon: BookOpen },
    { name: "Mistake Journal", href: "/journal", icon: ClipboardList },
    { name: "Exam Mock Tests", href: "/mocks", icon: BookOpenCheck },
    { name: "Previous Papers", href: "/pyqs", icon: Award },
    { name: "Socratic AI Doubts", href: "/ai-doubt", icon: Sparkles },
    { name: "AI Custom Test", href: "/ai-test", icon: Flame },
    { name: "Student Profile", href: "/profile", icon: User },
  ];

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  // Close mobile drawer on route change
  useEffect(() => {
    closeMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const NavLinks = () => (
    <>
      <div className="space-y-1.5 px-3 flex-1">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-600/10"
                  : "text-gray-400 hover:text-foreground hover:bg-bg-dark"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-gray-400"}`} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </div>

      {isAdmin && (
        <div className="px-3 border-t border-border/40 pt-4 mt-2">
          <Link
            href="/admin"
            onClick={closeMobile}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              pathname === "/admin"
                ? "bg-purple-600 text-white shadow-lg"
                : "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border border-purple-500/20"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin Center</span>
          </Link>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 border-r border-border bg-card-dark h-full flex-col justify-between py-4 select-none shrink-0">
        <NavLinks />
      </aside>

      {/* ── Mobile Drawer Overlay ────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={closeMobile}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Drawer Panel */}
          <aside
            className="absolute left-0 top-0 h-full w-72 bg-card-dark border-r border-border flex flex-col py-4 select-none shadow-2xl"
            style={{ animation: "slideInLeft 0.25s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 pb-4 border-b border-border mb-2">
              <span className="text-sm font-bold bg-gradient-to-r from-brand-500 to-indigo-400 bg-clip-text text-transparent">
                BhartX Academy
              </span>
              <button
                onClick={closeMobile}
                className="p-1.5 rounded-lg text-gray-400 hover:text-foreground hover:bg-bg-dark transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <NavLinks />
          </aside>
        </div>
      )}

      {/* Slide-in animation for mobile drawer */}
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
