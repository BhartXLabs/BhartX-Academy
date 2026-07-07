"use client";

import React, { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useStudyPlan } from "@/hooks/useApi";
import { 
  Loader2, 
  Calendar, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  Brain, 
  Sparkles, 
  Zap, 
  Flame,
  Target,
  Award
} from "lucide-react";
import Link from "next/link";

export default function StudyPlanPage() {
  const { data: plan, isLoading, error } = useStudyPlan();
  const [completedItems, setCompletedItems] = useState<Record<number, boolean>>({});

  const toggleItem = (idx: number) => {
    setCompletedItems(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return "border-danger-500/30 text-danger-400 bg-danger-500/5";
      case 2: return "border-orange-500/30 text-orange-400 bg-orange-500/5";
      case 3: return "border-brand-500/30 text-brand-400 bg-brand-glow/10";
      default: return "border-cyber-cyan/30 text-cyber-cyan bg-cyan-500/5";
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return "CRITICAL REVISION";
      case 2: return "MISTAKE FIX";
      case 3: return "WEAK SUBJECT WORK";
      default: return "PROGRESS";
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen overflow-hidden bg-bg-dark tech-grid">
        <Navbar />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-border/40">
              <div>
                <span className="text-[10px] font-bold text-brand-500 tracking-wider uppercase">Active Habit System</span>
                <h1 className="text-xl font-extrabold text-foreground mt-0.5 glow-text-indigo">AI Daily Study Planner</h1>
                <p className="text-xs text-gray-500 mt-1">
                  Deterministic priority scheduling based on spacing curves, weak areas, and active mistakes.
                </p>
              </div>
              {plan && (
                <div className="flex items-center gap-2 bg-card-dark border border-border px-3 py-1.5 rounded-xl">
                  <Calendar className="w-4 h-4 text-brand-500" />
                  <span className="text-xs font-bold text-gray-300">{plan.date}</span>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              </div>
            ) : error || !plan ? (
              <div className="p-6 rounded-2xl border border-danger-500/20 bg-danger-500/5 text-center text-xs max-w-md mx-auto space-y-3">
                <p className="font-bold text-danger-500">Failed to load study plan</p>
                <p className="text-gray-500">Please make sure your onboarding profile is initialized in the dashboard.</p>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl">
                {/* AI Summary Banner */}
                <div className="p-5 rounded-2xl border border-brand-500/10 bg-brand-glow/5 relative overflow-hidden glass-card">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-xl" />
                  <div className="flex gap-3">
                    <div className="p-2.5 rounded-xl bg-brand-glow text-brand-500 border border-brand-500/15 shrink-0 self-start animate-float">
                      <Brain className="w-5 h-5 fill-brand-500/10" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-foreground glow-text-indigo">Coach Intelligence Brief</h3>
                      <p className="text-xs text-gray-300 mt-1.5 leading-relaxed font-semibold">
                        "{plan.ai_summary}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-card-dark border border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold">Planned Time</span>
                      <p className="text-base font-black text-foreground mt-0.5">{plan.total_minutes_planned} mins</p>
                    </div>
                    <Clock className="w-5 h-5 text-brand-500" />
                  </div>
                  <div className="p-4 rounded-2xl bg-card-dark border border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold">Daily Target</span>
                      <p className="text-base font-black text-foreground mt-0.5">{plan.daily_target_minutes} mins</p>
                    </div>
                    <Target className="w-5 h-5 text-cyber-cyan" />
                  </div>
                  <div className="p-4 rounded-2xl bg-card-dark border border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold">Daily Streak</span>
                      <p className="text-base font-black text-foreground mt-0.5 flex items-center gap-1">
                        <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
                        <span>{plan.streak} Days</span>
                      </p>
                    </div>
                    <Award className="w-5 h-5 text-cyber-purple" />
                  </div>
                </div>

                {/* Items checklist */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-cyber-cyan tracking-wider uppercase glow-text-cyan flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 fill-cyber-cyan/10" />
                    Today's Priority Task Roadmap
                  </span>

                  <div className="space-y-3">
                    {plan.items.length === 0 ? (
                      <div className="p-8 rounded-2xl border border-border bg-card-dark text-center space-y-2">
                        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                        <h4 className="text-xs font-bold text-foreground">All Tasks Complete!</h4>
                        <p className="text-[11px] text-gray-500">You're fully up-to-date with revisions, mistakes, and curriculum milestones. Check back tomorrow!</p>
                      </div>
                    ) : (
                      plan.items.map((item: any, idx: number) => {
                        const isDone = completedItems[idx];
                        return (
                          <div 
                            key={idx}
                            className={`p-4 rounded-2xl border bg-card-dark flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                              isDone ? "border-emerald-500/25 bg-emerald-500/5 opacity-70" : "border-border hover:border-brand-500/35"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button 
                                onClick={() => toggleItem(idx)}
                                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-all ${
                                  isDone 
                                    ? "bg-emerald-600 border-emerald-500 text-white" 
                                    : "border-border hover:border-brand-500"
                                }`}
                              >
                                {isDone && <CheckCircle className="w-4 h-4 fill-emerald-600 text-white" />}
                              </button>
                              
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded border ${getPriorityColor(item.priority)}`}>
                                    {getPriorityLabel(item.priority)}
                                  </span>
                                  <span className="text-xs font-extrabold text-foreground leading-snug">{item.title}</span>
                                </div>
                                <p className="text-[11px] text-gray-500 leading-relaxed">{item.reason}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto justify-between shrink-0">
                              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{item.duration_minutes} mins</span>
                              </div>
                              <Link 
                                href={item.link}
                                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-600/40 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                              >
                                <span>Go</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
