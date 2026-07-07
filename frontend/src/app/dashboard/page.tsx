"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  useCourses,
  useSpacedRevisions,
  useCompleteRevision,
  useCoachTip,
  useMistakeStats,
  useProfileUpdate,
  useMyAnalytics
} from "@/hooks/useApi";
import { useAuthStore } from "@/store/useAuthStore";
import { apiFetch } from "@/utils/api";
import {
  Play,
  RotateCcw,
  ArrowRight,
  Loader2,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Compass,
  Flame,
  Award,
  BookOpen,
  ChevronRight,
  Activity,
  Zap,
  Target
} from "lucide-react";
import Link from "next/link";

function DashboardContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search");
  const { user } = useAuthStore();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // PWA Install states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect if already installed (standalone mode)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      // Show iOS install tip once if not stand-alone
      const dismissed = localStorage.getItem("pwa-ios-dismissed");
      if (!dismissed) setShowInstallBanner(true);
    } else {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        const dismissed = localStorage.getItem("pwa-android-dismissed");
        if (!dismissed) setShowInstallBanner(true);
      };
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    }
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    });
  };

  // APIs
  const { data: courses = [] } = useCourses();
  const { data: revisions = [], refetch: refetchRevisions } = useSpacedRevisions();
  const { data: coachTip } = useCoachTip();
  const { data: mistakeStats, refetch: refetchMistakes } = useMistakeStats();
  const { data: analytics, refetch: refetchAnalytics } = useMyAnalytics();
  const completeRevisionMutation = useCompleteRevision();
  const profileUpdateMutation = useProfileUpdate();

  // Onboarding wizard states
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("A-Level");

  useEffect(() => {
    if (user) {
      setStudentName(user.name || "");
      if (user.onboarded === false) {
        setShowOnboardModal(true);
      } else {
        setShowOnboardModal(false);
      }
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
        refetchAnalytics();
      }
    });
  };

  // Click handler for Onboarding Gateway
  const handleStartLearning = () => {
    if (!studentName.trim()) return;
    profileUpdateMutation.mutate({
      name: studentName,
      course: selectedCourse,
      onboarded: true
    }, {
      onSuccess: () => {
        setShowOnboardModal(false);
        refetchAnalytics();
      }
    });
  };

  // Profile Completion Engine click handlers
  const handleSelectDailyTime = (time: string) => {
    profileUpdateMutation.mutate({ daily_time: time }, { onSuccess: () => refetchAnalytics() });
  };

  const handleSelectExamDate = (date: string) => {
    profileUpdateMutation.mutate({ exam_date: date }, { onSuccess: () => refetchAnalytics() });
  };

  const handleSelectWeakSubject = (subject: string) => {
    profileUpdateMutation.mutate({ weak_subjects: [subject] }, { onSuccess: () => refetchAnalytics() });
  };

  // Generate dynamic AI Welcome / Greeting tips
  const getPersonalizedCoachGreeting = () => {
    if (!user) return "";
    const profile = user.onboarding_profile || {};
    
    if (profile.daily_time && profile.exam_date) {
      const weakStr = profile.weak_subjects?.join(", ") || "Python Programming";
      return (
        `Welcome back, ${user.name}! Let's make today productive. Our AI Engine has set a ` +
        `${profile.daily_time} study goal towards your ${profile.exam_date} exams. Let's focus on ` +
        `mastering [${weakStr}] concept lessons today!`
      );
    }
    
    return (
      `Welcome, ${user.name} 👋 I'm your AI Learning Coach. Let's make today productive. ` +
      `Start your first lesson below, and let's work to unlock your best possible version!`
    );
  };

  // Static mock variables for learning heatmap
  const heatmapWeeks = Array.from({ length: 15 }, (_, i) => i);
  const heatmapDays = [0, 1, 2, 3, 4, 5, 6];

  // Dynamic real DB analytics mapping (Upgrade-3)
  const lMetrics = analytics?.learning || {};
  const mMetrics = analytics?.memory || {};
  const recs = analytics?.recommendations || [];

  const cognitiveMetrics = [
    { label: "Concept Understanding", value: lMetrics.concept_understanding || 0, desc: "Syllabus checkpoints accuracy", badge: "badge-brand" },
    { label: "Long-Term Retention", value: mMetrics.long_term_retention_score || 0, desc: "Spaced revision retrieval rates", badge: "badge-purple" },
    { label: "Revision Compliance", value: mMetrics.revision_compliance_rate || 0, desc: "Scheduled memory recall accuracy", badge: "badge-cyan" },
    { label: "Mistake Resolution", value: mMetrics.mistake_resolution_rate || 0, desc: "Deliberate error correction percentage", badge: "badge-purple" },
    { label: "Confidence Calibration", value: (lMetrics.avg_confidence_rating ? Math.round((lMetrics.avg_confidence_rating / 5) * 100) : 0), desc: "Self-reported mastery alignment", badge: "badge-brand" },
    { label: "Syllabus Progress", value: lMetrics.completion_percentage || 0, desc: "Completed lessons percentage", badge: "badge-cyan" }
  ];

  const profile = user?.onboarding_profile || {};

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-dark tech-grid">
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
                    <div key={i} className="p-4 rounded-xl border border-border bg-card-dark flex justify-between items-center glass-card">
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
              {/* PWA Install Banner */}
              {showInstallBanner && (
                <div className="p-4 rounded-2xl border border-brand-500/20 bg-brand-glow/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-pulse-glow">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-brand-glow text-brand-500 mt-0.5">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Install BhartX Academy</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {isIOS 
                          ? "iOS पर ऐप इंस्टॉल करने के लिए Safari में Share बटन पर क्लिक करके 'Add to Home Screen' चुनें।"
                          : "आसान Spaced Revisions और Mistake Journal को ऑफ़लाइन एक्सेस करने के लिए ऐप इंस्टॉल करें।"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-1 sm:mt-0">
                    {!isIOS && (
                      <button 
                        onClick={handleInstallClick} 
                        className="w-full sm:w-auto px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-[11px] font-bold transition-all"
                      >
                        Install App
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setShowInstallBanner(false);
                        localStorage.setItem(isIOS ? "pwa-ios-dismissed" : "pwa-android-dismissed", "true");
                      }} 
                      className="px-2.5 py-1.5 border border-border hover:bg-white/5 text-gray-400 hover:text-foreground rounded-xl text-[11px] font-bold"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic Coach Greeting Header */}
              <div className="p-6 rounded-2xl border border-brand-500/10 bg-brand-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden glass-card">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-brand-glow text-brand-500 border border-brand-500/20 mt-1 animate-float">
                    <Sparkles className="w-6 h-6 fill-brand-500/15" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-foreground tracking-tight glow-text-indigo">Socratic Engine Active</h2>
                    <p className="text-xs text-gray-300 mt-1.5 leading-relaxed max-w-2xl font-medium">
                      {getPersonalizedCoachGreeting()}
                    </p>
                  </div>
                </div>
                <Link href="/courses" className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-lg hover:shadow-brand-600/20 flex items-center gap-1.5 shrink-0 self-end md:self-auto">
                  <span>Continue Curriculum</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Recommendation Engine priority list (Upgrade-10) */}
              {recs.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-cyber-cyan tracking-wider uppercase glow-text-cyan flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 fill-cyber-cyan/10" />
                    Recommended Actions
                  </span>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {recs.map((rec: any, idx: number) => (
                      <Link
                        key={idx}
                        href={rec.link}
                        className={`p-4 rounded-2xl border bg-card-dark flex flex-col justify-between h-32 transition-all hover:translate-y-[-2px] ${
                          rec.urgency === "high"
                            ? "border-danger-500/20 hover:border-danger-500/40 hover:shadow-danger-500/5"
                            : "border-border/60 hover:border-brand-500/30 hover:shadow-brand-500/5"
                        }`}
                      >
                        <div className="space-y-1">
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            rec.urgency === "high" 
                              ? "bg-danger-500/10 border-danger-500/20 text-danger-500" 
                              : "bg-brand-500/10 border-brand-500/20 text-brand-400"
                          }`}>
                            {rec.urgency} priority
                          </span>
                          <h4 className="text-xs font-bold text-foreground line-clamp-1 mt-1.5">{rec.title}</h4>
                          <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{rec.description}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-brand-500 group">
                          <span>{rec.action}</span>
                          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Profile Completion Engine (Progressive Micro-Onboarding prompts) */}
              {user?.onboarded && (
                <div className="space-y-4">
                  {/* Step A: Daily study duration */}
                  {!profile.daily_time && (
                    <div className="p-5 rounded-2xl border border-border bg-card-dark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-card">
                      <div>
                        <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">AI Question check</span>
                        <h3 className="text-xs font-bold text-foreground mt-0.5">How much time can you allocate to study today?</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["15 min", "30 min", "1 hour", "2+ hours"].map((t) => (
                          <button
                            key={t}
                            onClick={() => handleSelectDailyTime(t)}
                            className="px-3.5 py-1.5 rounded-lg border border-border bg-bg-dark text-[11px] font-semibold text-gray-300 hover:border-brand-500 hover:text-foreground transition-all"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step B: Exam Date (only show if daily_time completed but no exam_date) */}
                  {profile.daily_time && !profile.exam_date && (
                    <div className="p-5 rounded-2xl border border-border bg-card-dark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-card">
                      <div>
                        <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">AI Question check</span>
                        <h3 className="text-xs font-bold text-foreground mt-0.5">When is your target exam date?</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["July 2026", "January 2027"].map((d) => (
                          <button
                            key={d}
                            onClick={() => handleSelectExamDate(d)}
                            className="px-3.5 py-1.5 rounded-lg border border-border bg-bg-dark text-[11px] font-semibold text-gray-300 hover:border-brand-500 hover:text-foreground transition-all"
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step C: Weak areas (only show if exam_date completed but no weak_subjects) */}
                  {profile.exam_date && (!profile.weak_subjects || profile.weak_subjects.length === 0) && (
                    <div className="p-5 rounded-2xl border border-border bg-card-dark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-card">
                      <div>
                        <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">AI Question check</span>
                        <h3 className="text-xs font-bold text-foreground mt-0.5">Which syllabus area do you find most difficult?</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["Python Programming", "Database Technologies", "Operating Systems", "IT Tools & Networking"].map((sub) => (
                          <button
                            key={sub}
                            onClick={() => handleSelectWeakSubject(sub)}
                            className="px-3.5 py-1.5 rounded-lg border border-border bg-bg-dark text-[11px] font-semibold text-gray-300 hover:border-brand-500 hover:text-foreground transition-all"
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subordinate Grid: Revisions and Streaks */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Spaced Revisions */}
                <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card-dark flex flex-col h-[280px] glass-card">
                  <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                    <span className="text-xs font-extrabold text-foreground">Spaced Revisions Due</span>
                    <span className="px-2 py-0.5 text-[9px] font-bold text-orange-500 bg-orange-500/10 rounded-full border border-orange-500/10">
                      {revisions.length} Overdue
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {revisions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-6">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                        <p className="text-xs font-bold">Memory Strength at 100%!</p>
                        <p className="text-[10px] mt-1 text-gray-500 font-semibold max-w-xs">No revisions scheduled for today. Complete more lessons to seed new curves.</p>
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
                            className="px-3 py-1.5 rounded-lg border border-brand-500/20 text-brand-500 hover:bg-brand-glow text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 animate-spin-slow" />
                            <span>Review Now</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Deliberate Practice & Active Habits */}
                <div className="p-5 rounded-2xl border border-border bg-card-dark h-[280px] flex flex-col justify-between glass-card">
                  <div>
                    <span className="text-[10px] font-bold text-danger-500 tracking-wider uppercase glow-text-purple">Mistake Intelligence</span>
                    <h3 className="text-xs font-bold text-foreground mt-1">Error Journal</h3>
                    <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                      You have <span className="font-extrabold text-danger-500">{mistakeStats?.unresolved || 0}</span> unresolved errors in your active loop.
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                      Correcting mistakes triggers deliberate neural rewiring, maximizing retention rate.
                    </p>
                  </div>
                  <Link href="/journal" className="w-full py-2.5 bg-danger-500/10 hover:bg-danger-500/20 border border-danger-500/20 text-danger-500 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-md">
                    <span>Re-test Weak Concepts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Cognitive Mastery Index dashboard */}
              <div className="p-5 rounded-2xl border border-border bg-card-dark space-y-4 glass-card">
                <div className="pb-3 border-b border-border flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-foreground">Cognitive Growth Metrics</span>
                    <p className="text-[10px] text-gray-500 mt-0.5">Calculated based on active recalls, practice, and consistency logs.</p>
                  </div>
                  <Target className="w-5 h-5 text-brand-500" />
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {cognitiveMetrics.map((met, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-bg-dark border border-border/60 space-y-3 relative overflow-hidden group">
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${met.badge}`}>{met.label}</span>
                        <span className="text-sm font-black text-brand-500">{met.value}%</span>
                      </div>
                      <div className="w-full bg-card-dark rounded-full h-1.5 overflow-hidden">
                        <div className="bg-brand-600 h-1.5 rounded-full transition-all duration-500 group-hover:bg-cyan-400" style={{ width: `${met.value}%` }} />
                      </div>
                      <p className="text-[9px] text-gray-500 leading-snug">{met.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SVG Heatmap */}
              <div className="p-5 rounded-2xl border border-border bg-card-dark glass-card">
                <div className="pb-3 border-b border-border mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-foreground">Study Activity Heatmap</span>
                    <p className="text-[10px] text-gray-500 mt-0.5">Tracking daily active learning cycles. Keep the streak active!</p>
                  </div>
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto py-2">
                  <div className="grid grid-rows-7 grid-flow-col gap-1.5">
                    {heatmapWeeks.map((week) => (
                      heatmapDays.map((day) => {
                        const randomValue = (week + day) % 7;
                        let bgClass = "bg-gray-800";
                        if (randomValue === 2) bgClass = "bg-brand-500/25";
                        if (randomValue === 4) bgClass = "bg-purple-500/40 border border-purple-500/20";
                        if (randomValue === 5) bgClass = "bg-brand-600 shadow-sm shadow-brand-500/20";
                        return (
                          <div
                            key={`${week}-${day}`}
                            className={`w-3.5 h-3.5 rounded-sm ${bgClass} border border-transparent hover:border-brand-500/50 transition-colors cursor-pointer`}
                          />
                        );
                      })
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 60-Second Onboarding Gateway Modal */}
          {showOnboardModal && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-card-dark border border-border rounded-2xl p-6 shadow-2xl space-y-6 text-center glass-card">
                
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block glow-text-indigo">Curriculum Selection</span>
                  <h2 className="text-base font-extrabold text-foreground">Configure BhartX Learning OS</h2>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Set your target curriculum. You can customize daily study hours later.
                  </p>
                </div>

                <div className="space-y-4 text-left">
                  {/* Name field (Required if missing) */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Your Name</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full bg-bg-dark border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
                      placeholder="Enter name"
                    />
                  </div>

                  {/* Course select list */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Course target</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full bg-bg-dark border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
                    >
                      <option value="A-Level">NIELIT A-Level (Diploma)</option>
                      <option value="O-Level" disabled>NIELIT O-Level (Coming Soon)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleStartLearning}
                  disabled={!studentName.trim() || profileUpdateMutation.isPending}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  {profileUpdateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Initialize Learning Engine</span>
                      <ArrowRight className="w-4 h-4 animate-pulse" />
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
    <ProtectedRoute>
      <Suspense fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-bg-dark text-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
