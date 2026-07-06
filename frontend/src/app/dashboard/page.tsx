"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useCourses, useSpacedRevisions, useCompleteRevision, useCoachTip, useMistakeStats, useOnboardUser } from "@/hooks/useApi";
import { useAuthStore } from "@/store/useAuthStore";
import { apiFetch } from "@/utils/api";
import { Play, RotateCcw, AlertTriangle, ArrowRight, Loader2, Sparkles, CheckCircle, ClipboardList, HelpCircle } from "lucide-react";
import Link from "next/link";

function DashboardContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search");
  const { user } = useAuthStore();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // APIs
  const { data: courses = [] } = useCourses();
  const { data: revisions = [], refetch: refetchRevisions } = useSpacedRevisions();
  const { data: coachTip, isLoading: coachLoading } = useCoachTip();
  const { data: mistakeStats, refetch: refetchMistakes } = useMistakeStats();
  const completeRevisionMutation = useCompleteRevision();
  const onboardMutation = useOnboardUser();

  // Onboarding Form States
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [whoAreYou, setWhoAreYou] = useState("Student");
  const [whyLearning, setWhyLearning] = useState("Government Job Prep");
  const [examDate, setExamDate] = useState("July 2026");
  const [dailyTime, setDailyTime] = useState("2 hours");
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [strongSubjects, setStrongSubjects] = useState<string[]>([]);
  const [knowledgeLevel, setKnowledgeLevel] = useState("Beginner");

  useEffect(() => {
    // Show onboarding questionnaire if user holds onboarded = false
    if (user && user.onboarded === false) {
      setShowOnboardModal(true);
    } else {
      setShowOnboardModal(false);
    }
  }, [user]);

  useEffect(() => {
    const runSearch = async () => {
      if (searchQuery) {
        setSearchLoading(true);
        try {
          const res = await apiFetch(`/search?q=${encodeURIComponent(searchQuery)}`);
          setSearchResults(res.results || []);
        } catch (e) {
          console.error(e);
        } finally {
          setSearchLoading(false);
        }
      }
    };
    runSearch();
  }, [searchQuery]);

  const handleCompleteRev = (id: number) => {
    completeRevisionMutation.mutate(id, {
      onSuccess: () => {
        refetchRevisions();
      }
    });
  };

  const handleToggleWeak = (sub: string) => {
    setWeakSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleToggleStrong = (sub: string) => {
    setStrongSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleSubmitOnboarding = () => {
    onboardMutation.mutate({
      who_are_you: whoAreYou,
      why_learning: whyLearning,
      exam_date: examDate,
      daily_time: dailyTime,
      weak_subjects: weakSubjects,
      strong_subjects: strongSubjects,
      knowledge_level: knowledgeLevel
    }, {
      onSuccess: () => {
        setShowOnboardModal(false);
        refetchMistakes();
        refetchRevisions();
      }
    });
  };

  // Generate personalized greeting tips based on student's onboarding responses
  const getPersonalizedCoachGreeting = () => {
    if (!user) return "";
    if (user.onboarding_profile) {
      const profile = user.onboarding_profile;
      const weakStr = profile.weak_subjects?.join(", ") || "Python Programming";
      return (
        `Namaste ${user.name}! Your cognitive growth plan is active. We are targeting your ` +
        `upcoming ${profile.exam_date} exams. Since you flagged [${weakStr}] as areas for improvement, ` +
        `let's allocate ${profile.daily_time} today. We recommend beginning with Python chapter lessons!`
      );
    }
    return coachTip?.answer || "Your personalized Socratic study goals are loading...";
  };

  // Static mock variables for learning heatmap & cognitive mastery metrics
  const heatmapWeeks = Array.from({ length: 15 }, (_, i) => i);
  const heatmapDays = [0, 1, 2, 3, 4, 5, 6];

  const cognitiveMetrics = [
    { label: "Concept Understanding", value: 78, desc: "Syllabus checkpoints accuracy" },
    { label: "Long-Term Retention", value: 81, desc: "Spaced revision retrieval rates" },
    { label: "Practical Application", value: 69, desc: "Try Yourself coding exercises score" },
    { label: "Metacognitive Confidence", value: 74, desc: "Confidence calibration alignment" },
    { label: "Study Consistency", value: 90, desc: "Active daily streak rate" },
    { label: "Cognitive Focus", value: 85, desc: "Undistracted workspace sessions" }
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-dark">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {searchQuery ? (
            /* Search results container */
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">Search results for "{searchQuery}"</span>
                <button onClick={() => window.location.href = "/dashboard"} className="text-xs text-gray-500 hover:text-foreground">Clear search</button>
              </div>
              {searchLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
              ) : searchResults.length === 0 ? (
                <p className="text-xs text-gray-500">No matching items found. Try searching for lists, operating systems, or functions.</p>
              ) : (
                <div className="grid gap-3">
                  {searchResults.map((res, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border bg-card-dark flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-500">{res.type}</span>
                        <h4 className="text-xs font-bold text-foreground mt-0.5">{res.title}</h4>
                        <p className="text-[11px] text-gray-500 mt-1">{res.description}</p>
                      </div>
                      <Link
                        href={res.type === "lesson" ? `/lessons/${res.id}` : `/courses`}
                        className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded text-[11px] font-bold"
                      >
                        Open
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Dashboard widgets */
            <>
              {/* Dynamic Coach Greeting */}
              <div className="p-5 rounded-2xl border border-brand-500/10 bg-brand-glow/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-brand-glow text-brand-500 border border-brand-500/10 mt-1">
                    <Sparkles className="w-5 h-5 fill-brand-500/20" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Cognitive Assistant</h2>
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed max-w-2xl">
                      {getPersonalizedCoachGreeting()}
                    </p>
                  </div>
                </div>
                <Link href="/courses/3" className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 self-end md:self-auto">
                  <span>Open Class</span>
                  <Play className="w-3.5 h-3.5 fill-white" />
                </Link>
              </div>

              {/* Subordinate Grid: Revisions and Streaks */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Spaced Revisions */}
                <div className="md:col-span-2 p-5 rounded-2xl border border-border bg-card-dark flex flex-col h-[280px]">
                  <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                    <span className="text-xs font-extrabold text-foreground">Spaced Revisions Due</span>
                    <span className="px-2 py-0.5 text-[9px] font-bold text-orange-500 bg-orange-500/10 rounded-full border border-orange-500/10">
                      {revisions.length} Overdue
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {revisions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-6">
                        <p className="text-xs font-bold">Memory Strength at 100%!</p>
                        <p className="text-[10px] mt-1 text-gray-600 font-semibold">No revisions scheduled for today. Complete more lessons to seed new curves.</p>
                      </div>
                    ) : (
                      revisions.map((rev: any) => (
                        <div key={rev.id} className="p-3 rounded-xl bg-bg-dark border border-border/60 flex items-center justify-between hover:border-brand-500/30 transition-all">
                          <div>
                            <h4 className="text-xs font-bold text-foreground leading-snug">{rev.lesson_title}</h4>
                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-1 block">Stage {rev.stage} Review</span>
                          </div>
                          <button
                            onClick={() => handleCompleteRev(rev.id)}
                            disabled={completeRevisionMutation.isPending}
                            className="px-3 py-1.5 rounded-lg border border-brand-500/20 text-brand-500 hover:bg-brand-glow text-[11px] font-bold transition-all flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Review Now</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Streaks and Journals */}
                <div className="space-y-6 flex flex-col justify-between h-[280px]">
                  {/* Mistake journal */}
                  <div className="p-5 rounded-2xl border border-border bg-card-dark flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-danger-500 tracking-wider uppercase">Deliberate Practice</span>
                      <h3 className="text-xs font-bold text-foreground mt-1">Mistake Journal</h3>
                      <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                        You have <span className="font-extrabold text-danger-500">{mistakeStats?.unresolved || 0}</span> unresolved errors in your notebook. Re-test them before exams.
                      </p>
                    </div>
                    <Link href="/journal" className="w-full py-2 bg-danger-500/10 hover:bg-danger-500/20 border border-danger-500/20 text-danger-500 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1">
                      <span>Open Journal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Cognitive Mastery Index dashboard (Radar-style equivalent grids) */}
              <div className="p-5 rounded-2xl border border-border bg-card-dark space-y-4">
                <div className="pb-3 border-b border-border">
                  <span className="text-xs font-extrabold text-foreground">Cognitive Growth Metrics</span>
                  <p className="text-[10px] text-gray-500 mt-0.5">Calculated based on active recalls, practice, and consistency logs.</p>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {cognitiveMetrics.map((met, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-bg-dark border border-border/60 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{met.label}</span>
                        <span className="text-sm font-black text-brand-500">{met.value}%</span>
                      </div>
                      <div className="w-full bg-card-dark rounded-full h-1.5 overflow-hidden">
                        <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: `${met.value}%` }} />
                      </div>
                      <p className="text-[9px] text-gray-500">{met.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SVG Heatmap */}
              <div className="p-5 rounded-2xl border border-border bg-card-dark">
                <div className="pb-3 border-b border-border mb-4">
                  <span className="text-xs font-extrabold text-foreground">Study Activity Heatmap</span>
                  <p className="text-[10px] text-gray-500 mt-0.5">Tracking daily active learning cycles. Keep the streak active!</p>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto py-2">
                  <div className="grid grid-rows-7 grid-flow-col gap-1.5">
                    {heatmapWeeks.map((week) => (
                      heatmapDays.map((day) => {
                        const randomValue = (week + day) % 7;
                        let bgClass = "bg-gray-800";
                        if (randomValue === 2) bgClass = "bg-brand-500/35";
                        if (randomValue === 4) bgClass = "bg-brand-500/70";
                        if (randomValue === 5) bgClass = "bg-brand-600";
                        return (
                          <div
                            key={`${week}-${day}`}
                            className={`w-3.5 h-3.5 rounded-sm ${bgClass} border border-transparent hover:border-gray-500 transition-colors cursor-pointer`}
                          />
                        );
                      })
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Onboarding Profile questionnaire modal */}
          {showOnboardModal && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="w-full max-w-2xl bg-card-dark border border-border rounded-2xl p-8 shadow-2xl space-y-6 my-8">
                <div className="pb-3 border-b border-border text-center">
                  <span className="px-3 py-1 rounded-full bg-brand-glow border border-brand-500/20 text-brand-500 text-[10px] font-bold flex items-center gap-1.5 w-max mx-auto mb-3">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-brand-500" />
                    Cognitive Setup
                  </span>
                  <h2 className="text-sm font-extrabold text-foreground">Establish Your Learning Profile</h2>
                  <p className="text-[10px] text-gray-500 mt-1">Our AI Engine will customize your curriculum parameters based on your goals.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-5 text-xs text-left">
                  {/* Q1: Who are you */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Who are you?</label>
                    <select
                      value={whoAreYou}
                      onChange={(e) => setWhoAreYou(e.target.value)}
                      className="w-full bg-bg-dark border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                    >
                      <option>Student</option>
                      <option>Working Professional</option>
                      <option>Self-Educator</option>
                    </select>
                  </div>

                  {/* Q2: Why learning */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Primary Motivation?</label>
                    <select
                      value={whyLearning}
                      onChange={(e) => setWhyLearning(e.target.value)}
                      className="w-full bg-bg-dark border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                    >
                      <option>Government Job Prep</option>
                      <option>Career Switch</option>
                      <option>Syllabus Exam</option>
                    </select>
                  </div>

                  {/* Q3: Exam date */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Exam Date Target</label>
                    <input
                      type="text"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full bg-bg-dark border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                      placeholder="e.g. July 2026"
                    />
                  </div>

                  {/* Q4: Daily available time */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Daily Study Time</label>
                    <select
                      value={dailyTime}
                      onChange={(e) => setDailyTime(e.target.value)}
                      className="w-full bg-bg-dark border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                    >
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>2 hours</option>
                      <option>4+ hours</option>
                    </select>
                  </div>

                  {/* Q5: Knowledge level */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Programming Experience</label>
                    <select
                      value={knowledgeLevel}
                      onChange={(e) => setKnowledgeLevel(e.target.value)}
                      className="w-full bg-bg-dark border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Experienced</option>
                    </select>
                  </div>
                </div>

                {/* Checkboxes: weak and strong subjects */}
                <div className="grid sm:grid-cols-2 gap-5 text-left text-xs pt-2">
                  <div>
                    <span className="block text-[10px] font-bold text-danger-500 uppercase tracking-wider mb-2">Select Weak Areas</span>
                    <div className="space-y-1.5">
                      {["Python Programming", "Database Technologies", "Operating System", "IT Tools & Networking"].map((sub) => (
                        <label key={sub} className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-foreground">
                          <input
                            type="checkbox"
                            checked={weakSubjects.includes(sub)}
                            onChange={() => handleToggleWeak(sub)}
                            className="rounded border-gray-700 bg-bg-dark text-brand-500 focus:ring-brand-500"
                          />
                          <span>{sub}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-2">Select Strong Areas</span>
                    <div className="space-y-1.5">
                      {["Python Programming", "Database Technologies", "Operating System", "IT Tools & Networking"].map((sub) => (
                        <label key={sub} className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-foreground">
                          <input
                            type="checkbox"
                            checked={strongSubjects.includes(sub)}
                            onChange={() => handleToggleStrong(sub)}
                            className="rounded border-gray-700 bg-bg-dark text-brand-500 focus:ring-brand-500"
                          />
                          <span>{sub}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSubmitOnboarding}
                  disabled={onboardMutation.isPending}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {onboardMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Commit Learning Contract</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-bg-dark text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
