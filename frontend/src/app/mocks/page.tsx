"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useMocks } from "@/hooks/useApi";
import { Loader2, Award, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function MocksDirectory() {
  const { data: mocks = [], isLoading: mocksLoading } = useMocks();

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen overflow-hidden bg-bg-dark">
        <Navbar />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <span className="text-[10px] font-bold text-brand-500 tracking-wider uppercase">Exam Center</span>
              <h1 className="text-xl font-extrabold text-foreground mt-0.5">NIELIT A-Level Mock Lab</h1>
              <p className="text-xs text-gray-500 mt-1">
                Real exam simulations featuring standard timed countdown constraints and negative marking models.
              </p>
            </div>

            {mocksLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              </div>
            ) : mocks.length === 0 ? (
              <p className="text-xs text-gray-500">No mock tests available at this moment.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mocks.map((mock: any) => (
                  <div key={mock.id} className="p-5 rounded-2xl border border-border bg-card-dark flex flex-col justify-between h-44 hover:border-brand-500/20 transition-all duration-300">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-orange-500/10 text-orange-500 border border-orange-500/10 uppercase tracking-wider">
                          {mock.difficulty} Mock
                        </span>
                        <span className="text-[10px] text-gray-500 font-semibold">{mock.total_questions} Questions</span>
                      </div>
                      <h3 className="text-xs font-bold text-foreground mt-3 leading-snug">
                        {mock.title}
                      </h3>
                      <p className="text-[10px] text-danger-500 font-semibold mt-1">
                        Warning: Negative marking (-{mock.negative_marks_per_question} per error) is active.
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-border/40">
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{mock.duration_minutes} Mins</span>
                      </span>
                      <Link
                        href={`/mocks/${mock.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-md"
                      >
                        <span>Start Lab</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
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
