"use client";

import React, { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { apiFetch } from "@/utils/api";
import { Loader2, Users, CheckCircle, AlertTriangle, ShieldAlert } from "lucide-react";

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const stats = await apiFetch("/admin/analytics");
        const studList = await apiFetch("/admin/students");
        setAnalytics(stats);
        setStudents(studList || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen overflow-hidden bg-bg-dark">
        <Navbar />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <span className="text-[10px] font-bold text-brand-500 tracking-wider uppercase">Administration</span>
              <h1 className="text-xl font-extrabold text-foreground mt-0.5">Management Control Panel</h1>
              <p className="text-xs text-gray-500 mt-1">
                Access student progress, review chapter quizzes completion metrics, and track learning index parameters.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              </div>
            ) : !analytics ? (
              <div className="p-8 text-center border border-border bg-card-dark rounded-2xl max-w-sm mx-auto space-y-4">
                <ShieldAlert className="w-10 h-10 text-danger-500 mx-auto" />
                <h3 className="text-xs font-bold text-foreground">Access Restricted</h3>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Only administrators hold permissions to view analytics logs. Log in as `admin@bhartx.com` to inspect values.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stats row cards */}
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="p-5 rounded-2xl border border-border bg-card-dark flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Registered Students</span>
                      <span className="text-xl font-black text-foreground mt-1 block">{analytics.total_students}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-brand-glow text-brand-500 border border-brand-500/10">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-border bg-card-dark flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Daily Active Learners</span>
                      <span className="text-xl font-black text-foreground mt-1 block">{analytics.active_today}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/15">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-border bg-card-dark flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Avg Completion Rate</span>
                      <span className="text-xl font-black text-foreground mt-1 block">{analytics.average_completion_percentage}%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/15">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Performance split panel grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Students list */}
                  <div className="md:col-span-2 p-5 rounded-2xl border border-border bg-card-dark space-y-4">
                    <span className="text-xs font-extrabold text-foreground block pb-2 border-b border-border/40">Active Students Ledger</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-gray-500 border-b border-border/40 pb-2">
                            <th className="font-semibold pb-2">Name</th>
                            <th className="font-semibold pb-2">Email</th>
                            <th className="font-semibold pb-2 text-center">Score XP</th>
                            <th className="font-semibold pb-2 text-center">Streak</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {students.map((std: any) => (
                            <tr key={std.id} className="hover:bg-bg-dark/40 transition-colors">
                              <td className="py-2.5 font-bold text-foreground">{std.name}</td>
                              <td className="py-2.5 text-gray-400">{std.email}</td>
                              <td className="py-2.5 text-center font-bold text-brand-500">{std.xp}</td>
                              <td className="py-2.5 text-center text-orange-500 font-bold">{std.streak}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Confusing chapters alerts panel */}
                  <div className="p-5 rounded-2xl border border-border bg-card-dark space-y-4">
                    <span className="text-xs font-extrabold text-foreground block pb-2 border-b border-border/40">Difficult Chapters</span>
                    <div className="space-y-3">
                      {analytics.difficult_chapters.length === 0 ? (
                        <p className="text-xs text-gray-500 py-4 text-center">No high difficulty flags reported.</p>
                      ) : (
                        analytics.difficult_chapters.map((ch: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-xl bg-bg-dark border border-danger-500/10 flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-danger-500 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-[11px] font-bold text-foreground leading-snug">{ch.chapter_title}</h4>
                              <span className="text-[9px] text-danger-500 font-bold mt-1 block">Avg Quiz score: {ch.avg_score}%</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
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
