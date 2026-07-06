"use client";

import React, { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { apiFetch } from "@/utils/api";
import { Loader2, FileText, Play, Compass } from "lucide-react";

export default function PyqsDirectory() {
  const [pyqs, setPyqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<number>(3); // Default to Python (id 3)

  useEffect(() => {
    const fetchPyqs = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/courses/subjects/${subjectFilter}/pyqs`);
        setPyqs(res || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPyqs();
  }, [subjectFilter]);

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen overflow-hidden bg-bg-dark">
        <Navbar />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-bold text-brand-500 tracking-wider uppercase">Exam Archive</span>
                <h1 className="text-xl font-extrabold text-foreground mt-0.5">Previous Year Papers</h1>
                <p className="text-xs text-gray-500 mt-1">
                  Database of official NIELIT exam papers from 2020-2025. Review questions and check video solutions.
                </p>
              </div>

              {/* Subject selectors */}
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(parseInt(e.target.value))}
                className="bg-card-dark border border-border rounded-xl px-4 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
              >
                <option value={3}>A3-R5: Python Programming</option>
                <option value={1}>A1-R5: IT Tools & Networking</option>
                <option value={2}>A2-R5: Web Designing</option>
                <option value={8}>A8-R5: Database Technologies</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              </div>
            ) : pyqs.length === 0 ? (
              <div className="text-center py-20 max-w-sm mx-auto space-y-2">
                <Compass className="w-12 h-12 text-gray-500 mx-auto" />
                <h3 className="text-xs font-bold text-foreground">No Papers Found</h3>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  We are currently uploading PYQ documents for this subject. Try switching modules.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pyqs.map((pyq: any) => (
                  <div key={pyq.id} className="p-5 rounded-2xl border border-border bg-card-dark flex flex-col justify-between h-44 hover:border-brand-500/20 transition-all duration-300">
                    <div>
                      <span className="px-2.5 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/10 text-[9px] font-extrabold uppercase">
                        Year {pyq.year} Exam
                      </span>
                      <h3 className="text-xs font-bold text-foreground mt-3 leading-snug">
                        {pyq.title}
                      </h3>
                      <p className="text-[10px] text-gray-500 mt-1">Official syllabus copy with solutions.</p>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-border/40">
                      <a
                        href={pyq.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-gray-400 hover:text-foreground font-bold flex items-center gap-1"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Download Paper PDF</span>
                      </a>
                      {pyq.video_solution_url && (
                        <a
                          href={pyq.video_solution_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded bg-brand-glow text-brand-500 text-[10px] font-extrabold flex items-center gap-1 hover:bg-brand-500/10 border border-brand-500/15"
                        >
                          <Play className="w-3 h-3 fill-brand-500" />
                          <span>Video Key</span>
                        </a>
                      )}
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
