"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useAuthStore } from "@/store/useAuthStore";
import { Award, Flame, Zap, Award as BadgeIcon, Clock, CheckCircle } from "lucide-react";

export default function StudentProfile() {
  const { user } = useAuthStore();

  const badges = [
    { name: "First Steps", desc: "Completed your first video lesson successfully", icon: Zap, color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/15" },
    { name: "Active Thinker", desc: "Answered a mid-video checkpoint correctly", icon: Flame, color: "text-orange-500 bg-orange-500/10 border-orange-500/15" },
    { name: "Mastery Mind", desc: "Scored 100% on a chapter checkpoint quiz", icon: Award, color: "text-purple-500 bg-purple-500/10 border-purple-500/15" },
  ];

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen overflow-hidden bg-bg-dark">
        <Navbar />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Header banner */}
            <div className="p-6 rounded-2xl border border-border bg-card-dark flex flex-col sm:flex-row gap-5 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-brand-glow text-brand-500 border border-brand-500/20 flex items-center justify-center text-2xl font-black">
                  {user?.name?.charAt(0) || "S"}
                </div>
                <div className="text-left">
                  <h1 className="text-sm font-extrabold text-foreground">{user?.name}</h1>
                  <p className="text-xs text-gray-500 mt-1">{user?.email} &bull; Student ID #{user?.id}</p>
                </div>
              </div>
              <div className="flex gap-4 text-center text-xs">
                <div className="p-3 bg-bg-dark border border-border rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Streak</span>
                  <span className="text-lg font-black text-orange-500 mt-1 block">{user?.streak} Days</span>
                </div>
                <div className="p-3 bg-bg-dark border border-border rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">XP Level</span>
                  <span className="text-lg font-black text-brand-500 mt-1 block">{user?.xp} XP</span>
                </div>
              </div>
            </div>

            {/* Sub-grid: Badges & Certificate mockups */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Badges List */}
              <div className="md:col-span-2 p-5 rounded-2xl border border-border bg-card-dark space-y-4">
                <div className="pb-2 border-b border-border">
                  <span className="text-xs font-extrabold text-foreground">Badges Earned</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {badges.map((b, i) => {
                    const Icon = b.icon;
                    return (
                      <div key={i} className="p-3.5 rounded-xl border border-border/80 bg-bg-dark/40 flex items-center gap-3.5 hover:border-brand-500/10 transition-all duration-300">
                        <div className={`p-2 rounded-xl border ${b.color} shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-foreground leading-snug">{b.name}</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{b.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Certificate Widget */}
              <div className="p-5 rounded-2xl border border-border bg-card-dark flex flex-col justify-between h-[220px]">
                <div>
                  <span className="text-[10px] font-bold text-brand-500 tracking-wider uppercase block">Achievements</span>
                  <h3 className="text-xs font-bold text-foreground mt-1">Course Certification</h3>
                  <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                    Certificates generate automatically once you master all 10 subjects and submit your Project Guidance milestones.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-bg-dark border border-border flex items-center gap-2 text-[10px] text-gray-500 font-semibold cursor-default">
                  <Clock className="w-4 h-4 text-brand-500" />
                  <span>Requires 8 more subjects completions.</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
