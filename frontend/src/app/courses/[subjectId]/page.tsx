"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useSubject, useSpacedRevisions } from "@/hooks/useApi";
import { apiFetch } from "@/utils/api";
import { Loader2, Play, Lock, Unlock, CheckCircle, FileText, Sparkles, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function SubjectDetail() {
  const { subjectId } = useParams();
  const subId = parseInt(subjectId as string);

  // APIs
  const { data: subject, isLoading: subjectLoading } = useSubject(subId);
  const [pyqs, setPyqs] = useState<any[]>([]);
  const [pyqsLoading, setPyqsLoading] = useState(false);
  const [unlockMap, setUnlockMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchPyqsAndLocks = async () => {
      if (subId) {
        setPyqsLoading(true);
        try {
          const pyqRes = await apiFetch(`/courses/subjects/${subId}/pyqs`);
          setPyqs(pyqRes || []);
        } catch (e) {
          console.error(e);
        } finally {
          setPyqsLoading(false);
        }
      }
    };
    fetchPyqsAndLocks();
  }, [subId]);

  // Read locks dynamically when subject data finishes loading
  useEffect(() => {
    const fetchLocks = async () => {
      if (subject && subject.chapters) {
        const tempLocks: Record<number, boolean> = {};
        for (const ch of subject.chapters) {
          for (const les of ch.lessons) {
            try {
              const status = await apiFetch(`/courses/lessons/${les.id}/unlock-status`);
              tempLocks[les.id] = status.unlocked;
            } catch (e) {
              tempLocks[les.id] = false;
            }
          }
        }
        setUnlockMap(tempLocks);
      }
    };
    fetchLocks();
  }, [subject]);

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen overflow-hidden bg-bg-dark">
        <Navbar />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {subjectLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              </div>
            ) : !subject ? (
              <p className="text-xs text-gray-500">Subject details not found.</p>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6 items-start">
                {/* Left side: Chapters syllabus */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <span className="text-[10px] font-bold text-brand-500 tracking-wider uppercase">{subject.code} syllabus</span>
                    <h1 className="text-xl font-extrabold text-foreground mt-0.5">{subject.title}</h1>
                    <p className="text-xs text-gray-500 mt-1">{subject.description || "Detailed outline parameters."}</p>
                  </div>

                  <div className="space-y-4">
                    {subject.chapters.map((ch: any, index: number) => (
                      <div key={ch.id} className="p-5 rounded-2xl border border-border bg-card-dark space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-border/40">
                          <div>
                            <span className="text-[9px] font-bold text-brand-500 tracking-wider uppercase">Chapter {index + 1}</span>
                            <h2 className="text-xs font-bold text-foreground mt-0.5">{ch.title}</h2>
                          </div>
                        </div>

                        {/* Lessons List */}
                        <div className="space-y-2.5">
                          {ch.lessons.map((les: any) => {
                            const isUnlocked = unlockMap[les.id] ?? false;
                            
                            return (
                              <div key={les.id} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                                isUnlocked 
                                  ? "bg-bg-dark/50 border-border hover:border-brand-500/30" 
                                  : "bg-bg-dark/20 border-border/40 opacity-70"
                              }`}>
                                <div className="flex items-start gap-3">
                                  <div className={`p-1.5 rounded-lg border mt-0.5 ${
                                    isUnlocked 
                                      ? "bg-brand-glow/10 border-brand-500/10 text-brand-500" 
                                      : "bg-gray-800 border-gray-700 text-gray-500"
                                  }`}>
                                    {isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-foreground">{les.title}</h4>
                                    <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{les.prerequisites ? `Prereq: ${les.prerequisites}` : 'Outcome-focused module'}</p>
                                  </div>
                                </div>

                                {isUnlocked ? (
                                  <Link
                                    href={`/lessons/${les.id}`}
                                    className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-md shadow-brand-600/10"
                                  >
                                    <Play className="w-3 h-3 fill-white" />
                                    <span>Learn</span>
                                  </Link>
                                ) : (
                                  <span className="px-3.5 py-1.5 rounded-lg bg-gray-800 text-gray-500 text-[11px] font-bold border border-gray-700 flex items-center gap-1 cursor-not-allowed">
                                    <Lock className="w-3 h-3" />
                                    <span>Locked</span>
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Chapter quiz mastery checkpoint */}
                        <div className="mt-4 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex items-start gap-2.5">
                            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 mt-0.5">
                              <HelpCircle className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-foreground">Chapter Mastery Checkpoint</h4>
                              <p className="text-[10px] text-gray-400 mt-0.5">Complete chapter lessons to attempt the checkpoint quiz (requires &ge; 80% to advance).</p>
                            </div>
                          </div>
                          {/* Python Module Chapter 2 has quiz seeded with ID 1 */}
                          <Link
                            href={ch.id === 2 ? `/quizzes/1` : `#`}
                            className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                              ch.id === 2
                                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/15"
                                : "bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed"
                            }`}
                          >
                            Attempt Checkpoint
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right side: PYQ materials list */}
                <div className="p-5 rounded-2xl border border-border bg-card-dark space-y-4">
                  <div className="pb-3 border-b border-border">
                    <span className="text-xs font-extrabold text-foreground">Past Year Papers (PYQs)</span>
                    <p className="text-[10px] text-gray-500 mt-0.5">Year-wise official NIELIT exam papers with video solutions.</p>
                  </div>

                  <div className="space-y-3">
                    {pyqsLoading ? (
                      <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-brand-500" /></div>
                    ) : pyqs.length === 0 ? (
                      <p className="text-center py-4 text-xs text-gray-500">No PYQ papers logged for this subject.</p>
                    ) : (
                      pyqs.map((pyq: any) => (
                        <div key={pyq.id} className="p-3 rounded-xl bg-bg-dark border border-border/60 flex flex-col justify-between h-28 hover:border-brand-500/20 transition-all duration-300">
                          <div>
                            <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 text-[9px] font-bold border border-orange-500/10 uppercase">{pyq.year} Paper</span>
                            <h4 className="text-xs font-bold text-foreground mt-2 leading-snug">{pyq.title}</h4>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <a
                              href={pyq.pdf_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-gray-500 hover:text-foreground font-bold flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Download PDF</span>
                            </a>
                            {pyq.video_solution_url && (
                              <a
                                href={pyq.video_solution_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-brand-500 hover:underline font-bold flex items-center gap-0.5"
                              >
                                <Play className="w-3 h-3 fill-brand-500" />
                                <span>Video Solution</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))
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
