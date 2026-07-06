"use client";

import React, { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useCourses, useSemesters } from "@/hooks/useApi";
import { Loader2, ChevronRight, BookOpen, Clock } from "lucide-react";
import Link from "next/link";

export default function Courses() {
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  // Fetch semesters for first course (A-Level, id: 1)
  const { data: semesters = [], isLoading: semestersLoading } = useSemesters(1);

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen overflow-hidden bg-bg-dark">
        <Navbar />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <span className="text-[10px] font-bold text-brand-500 tracking-wider uppercase">Course Catalog</span>
              <h1 className="text-xl font-extrabold text-foreground mt-0.5">NIELIT A-Level Curriculum</h1>
              <p className="text-xs text-gray-500 mt-1">
                Structured into 3 Semesters. Complete each module checkpoint to unlock subsequent subjects.
              </p>
            </div>

            {semestersLoading || coursesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              </div>
            ) : (
              <div className="space-y-8">
                {semesters.map((sem: any) => (
                  <div key={sem.id} className="space-y-4">
                    {/* Semester Header */}
                    <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                      <span className="text-xs font-bold text-foreground">{sem.title}</span>
                      <span className="text-[10px] text-gray-500">&mdash; {sem.description}</span>
                    </div>

                    {/* Subjects Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sem.subjects.map((sub: any) => {
                        // Static mock progress for visualization
                        const isPython = sub.code === "A3-R5";
                        const isIT = sub.code === "A1-R5";
                        const progress = isPython ? 82 : isIT ? 35 : 0;
                        
                        return (
                          <div key={sub.id} className="p-5 rounded-2xl border border-border bg-card-dark flex flex-col justify-between h-44 hover:border-brand-500/30 transition-all duration-300 group">
                            <div>
                              <div className="flex justify-between items-start">
                                <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-brand-glow text-brand-500 border border-brand-500/10 uppercase tracking-wider">
                                  {sub.code}
                                </span>
                                <span className="text-[10px] text-gray-500 font-semibold">12 Lessons</span>
                              </div>
                              <h3 className="text-xs font-bold text-foreground mt-3 group-hover:text-brand-500 transition-colors leading-snug">
                                {sub.title}
                              </h3>
                            </div>

                            {/* Progress bar and Link */}
                            <div className="mt-4 space-y-2">
                              <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                                <span>Mastery Progress</span>
                                <span>{progress}%</span>
                              </div>
                              <div className="w-full bg-bg-dark rounded-full h-1.5 overflow-hidden">
                                <div className="bg-brand-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                              </div>

                              <div className="flex justify-between items-center pt-2">
                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>24 hours</span>
                                </span>
                                <Link
                                  href={`/courses/${sub.id}`}
                                  className="text-[11px] font-bold text-brand-500 hover:text-brand-600 flex items-center gap-0.5"
                                >
                                  <span>Study Syllabus</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
