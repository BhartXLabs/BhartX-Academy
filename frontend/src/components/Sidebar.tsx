"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  BookOpen,
  Award,
  BookOpenCheck,
  Flame,
  HelpCircle,
  User,
  Shield,
  Sparkles,
  ClipboardList
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: Compass },
    { name: "Subjects Syllabus", href: "/courses", icon: BookOpen },
    { name: "Mistake Journal", href: "/journal", icon: ClipboardList },
    { name: "Exam Mock Tests", href: "/mocks", icon: BookOpenCheck },
    { name: "Previous Papers", href: "/pyqs", icon: Award },
    { name: "Socratic AI Doubts", href: "/ai-doubt", icon: Sparkles },
    { name: "Student Profile", href: "/profile", icon: User },
  ];

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <aside className="w-64 border-r border-border bg-card-dark h-[calc(100vh-57px)] flex flex-col justify-between py-4 select-none shrink-0">
      <div className="space-y-1.5 px-3">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-600/10"
                  : "text-gray-400 hover:text-foreground hover:bg-bg-dark"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Admin Panel button if role matches */}
      {isAdmin && (
        <div className="px-3 border-t border-border/40 pt-4">
          <Link
            href="/admin"
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
    </aside>
  );
}
