"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Award, Bell, Settings, LogOut, Search, Check, Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useApi";
import Sidebar from "./Sidebar";

export default function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { data: notifications = [] } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const { apiFetch } = await import("@/utils/api");
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Backend logout call failed: ", err);
    } finally {
      clearAuth();
      window.location.href = "/login";
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard?search=${encodeURIComponent(searchQuery)}`);
      setMobileSearchOpen(false);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-border bg-card-dark/80 px-4 md:px-6 py-3 backdrop-blur-md flex items-center justify-between gap-3">

        {/* Left: Hamburger (mobile) + Brand */}
        <div className="flex items-center gap-3">
          {/* Hamburger — only on mobile */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-lg border border-border text-gray-400 hover:text-foreground hover:bg-bg-dark transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-brand-500 to-indigo-400 bg-clip-text text-transparent tracking-tight whitespace-nowrap">
            BhartX
          </Link>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded bg-brand-glow text-brand-500 border border-brand-500/20 uppercase">
            Learning OS
          </span>
        </div>

        {/* Center: Desktop Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-80">
          <input
            type="text"
            placeholder="Search subjects, lessons, pyqs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-dark border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-foreground focus:outline-none focus:border-brand-500"
          />
          <Search className="absolute left-3 w-4 h-4 text-gray-500" />
        </form>

        {/* Right: Stats + Actions */}
        <div className="flex items-center gap-2 md:gap-4">

          {/* Mobile Search Toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden p-1.5 rounded-lg border border-border text-gray-400 hover:text-foreground hover:bg-bg-dark transition-colors"
            aria-label="Search"
          >
            {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Streak — hide label on very small screens */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-semibold cursor-default" title="Current Daily Streak">
            <Flame className="w-4 h-4 fill-orange-500" />
            <span>{user?.streak || 0}</span>
          </div>

          {/* XP */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-glow border border-brand-500/20 text-brand-500 text-xs font-semibold cursor-default" title="Total Experience Points">
            <Award className="w-4 h-4" />
            <span>{user?.xp || 0} XP</span>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 rounded-lg border border-border text-gray-400 hover:text-foreground hover:bg-bg-dark transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown — fixed width, responsive positioning */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl border border-border bg-card-dark p-4 shadow-xl z-50">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-xs font-bold text-foreground">Notifications</span>
                  <span className="text-[10px] text-gray-500">{unreadCount} Unread</span>
                </div>
                <div className="mt-2 max-h-60 overflow-y-auto space-y-2.5">
                  {notifications.length === 0 ? (
                    <p className="text-center py-4 text-xs text-gray-500">No notifications yet</p>
                  ) : (
                    notifications.map((n: any) => (
                      <div key={n.id} className={`p-2 rounded-lg text-xs border ${n.is_read ? "bg-transparent border-transparent" : "bg-brand-glow/10 border-brand-500/10"}`}>
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-foreground leading-tight">{n.title}</span>
                          {!n.is_read && (
                            <button
                              onClick={() => markReadMutation.mutate(n.id)}
                              className="p-0.5 rounded text-brand-500 hover:bg-brand-glow shrink-0"
                              title="Mark as read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-gray-400 mt-1 text-[11px] leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings + Logout */}
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="p-1.5 rounded-lg border border-border text-gray-400 hover:text-foreground hover:bg-bg-dark transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg border border-danger-500/20 text-danger-500 hover:bg-danger-500/10 transition-colors"
              title="Log Out"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Search Bar — slides in below navbar */}
      {mobileSearchOpen && (
        <div className="md:hidden sticky top-[57px] z-30 w-full bg-card-dark/95 backdrop-blur border-b border-border px-4 py-2.5">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search subjects, lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-bg-dark border border-border rounded-lg pl-8 pr-4 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 transition-colors"
            >
              Go
            </button>
          </form>
        </div>
      )}

      {/* Mobile Sidebar Drawer — rendered here so it's above everything */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
    </>
  );
}
