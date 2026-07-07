"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import { useLesson, useLessonProgress, useUpdateProgress, useSubmitReflection } from "@/hooks/useApi";
import { apiFetch } from "@/utils/api";
import {
  Loader2,
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Play
} from "lucide-react";
import Link from "next/link";

export default function LessonWorkspace() {
  const { lessonId } = useParams();
  const lesId = parseInt(lessonId as string);
  const router = useRouter();

  // APIs
  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useLesson(lesId);
  const { data: progress, isLoading: progressLoading, refetch: refetchProgress } = useLessonProgress(lesId);
  const updateProgressMutation = useUpdateProgress();
  const submitReflectionMutation = useSubmitReflection();

  // Contract Gateway State
  const [acceptedContract, setAcceptedContract] = useState(false);
  const [contractUninterrupted, setContractUninterrupted] = useState(false);
  const [contractHonest, setContractHonest] = useState(false);

  // In-Video Checkpoint MCQ State
  const [activePrompt, setActivePrompt] = useState<any | null>(null);
  const [selectedPromptAns, setSelectedPromptAns] = useState<number | null>(null);
  const [promptChecked, setPromptChecked] = useState(false);
  const [promptCorrect, setPromptCorrect] = useState(false);

  // Recall / Reflection State
  const [showReflection, setShowReflection] = useState(false);
  const [recallText, setRecallText] = useState("");
  const [unresolvedText, setUnresolvedText] = useState("");
  const [confidenceRating, setConfidenceRating] = useState<number | null>(null);
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);

  // AI Sidebar State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Hi! I am your BhartX Socratic Tutor. Ask me any doubt about this lesson, and I will guide you to understand it!" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Read accepted contract state from localStorage to remember it if student refreshes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`contract-accepted-${lesId}`);
      if (saved === "true") {
        setAcceptedContract(true);
      }
    }
  }, [lesId]);

  // If lesson status is already completed, skip the contract screen automatically
  useEffect(() => {
    if (progress && progress.status === "completed") {
      setAcceptedContract(true);
    }
  }, [progress]);

  const handleEnterWorkspace = () => {
    if (contractUninterrupted && contractHonest) {
      setAcceptedContract(true);
      if (typeof window !== "undefined") {
        localStorage.setItem(`contract-accepted-${lesId}`, "true");
      }
    }
  };

  const handleTriggerPrompt = (prompt: any) => {
    setActivePrompt(prompt);
    setSelectedPromptAns(null);
    setPromptChecked(false);
  };

  const handleCheckPromptAnswer = () => {
    if (selectedPromptAns === null || !activePrompt) return;
    
    const isCorrect = (selectedPromptAns === activePrompt.correct_option_index);
    setPromptCorrect(isCorrect);
    setPromptChecked(true);
    
    // Log in Mistake Journal directly via dedicated endpoint — avoids hardcoded quiz hack
    if (!isCorrect) {
      apiFetch("/journal", {
        method: "POST",
        body: JSON.stringify({
          question_text: activePrompt.question_text,
          options: activePrompt.options,
          selected_option_index: selectedPromptAns,
          correct_option_index: activePrompt.correct_option_index,
          confidence_rating: "medium",
          explanation: `Correct answer is '${activePrompt.options[activePrompt.correct_option_index]}'.`,
          source_type: "video_prompt",
          source_id: lesId
        })
      }).catch(err => console.error("Mistake journal log error:", err));
    }
  };

  const handleResumeVideo = () => {
    setActivePrompt(null);
    setPromptChecked(false);
    // Call video component resume command
    if ((window as any).bhartxResumeVideo) {
      (window as any).bhartxResumeVideo();
    }
  };

  const handleTimeUpdate = (seconds: number) => {
    // Send progress head updates to server every 10 seconds
    if (seconds > 0 && seconds % 10 === 0 && progress) {
      const percentage = Math.min(100.0, (seconds / (lesson?.duration_seconds || 1)) * 100.0);
      updateProgressMutation.mutate({
        lessonId: lesId,
        watch_percentage: parseFloat(percentage.toFixed(1)),
        time_spent_seconds: 10,
        resume_position: seconds,
        status: "in_progress"
      });
    }
  };

  const handleVideoEnd = () => {
    // Reveal reflection form
    setShowReflection(true);
    // Mark progress complete
    if (progress) {
      updateProgressMutation.mutate({
        lessonId: lesId,
        watch_percentage: 100.0,
        time_spent_seconds: 10,
        resume_position: lesson?.duration_seconds || 0,
        status: "completed"
      });
    }
  };

  const handleSubmitReflection = () => {
    if (!recallText.trim() || confidenceRating === null) return;
    
    submitReflectionMutation.mutate({
      lessonId: lesId,
      retrieval_text: recallText,
      unresolved_question: unresolvedText,
      confidence_rating: confidenceRating
    }, {
      onSuccess: () => {
        setReflectionSubmitted(true);
        refetchProgress();
      }
    });
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await apiFetch("/ai/doubt", {
        method: "POST",
        body: JSON.stringify({
          question: userText,
          lesson_id: lesId
        })
      });
      setChatMessages((prev) => [...prev, { sender: "ai", text: res.answer }]);
    } catch (e: any) {
      setChatMessages((prev) => [...prev, { sender: "ai", text: `Sorry, there was an error: ${e.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (lessonLoading || progressLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg-dark text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (lessonError || !lesson) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-bg-dark text-foreground p-6 text-center">
        <AlertCircle className="w-12 h-12 text-danger-500 mb-4" />
        <h2 className="text-sm font-bold">Workspace Access Denied</h2>
        <p className="text-xs text-gray-500 max-w-sm mt-2 leading-relaxed">
          {lessonError?.message || "Verify your connection. Master preceding chapters and pass checkpoint quizzes to unlock this lesson."}
        </p>
        <Link href="/courses" className="mt-6 px-4 py-2 bg-brand-600 rounded-xl text-xs font-bold text-white shadow-md">
          Return to Syllabus
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
            {/* Pre-Learning Gateway Panel */}
            {!acceptedContract ? (
              <div className="max-w-2xl mx-auto w-full border border-border bg-card-dark rounded-2xl p-8 shadow-2xl space-y-6 mt-10">
                <div className="pb-3 border-b border-border">
                  <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">Lesson Gateway</span>
                  <h2 className="text-sm font-extrabold text-foreground mt-0.5">{lesson.title}</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 text-xs text-gray-400">
                  <div className="space-y-3">
                    <h3 className="font-bold text-foreground">Prerequisites</h3>
                    <p className="text-[11px] leading-relaxed">{lesson.prerequisites || "General programming constructs."}</p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-bold text-foreground">Learning Target</h3>
                    <p className="text-[11px] leading-relaxed">{lesson.outcomes || "Understand operations and syntax."}</p>
                  </div>
                </div>

                {/* Commitments contract checklist */}
                <div className="p-4 rounded-xl bg-brand-glow/5 border border-brand-500/10 space-y-3.5">
                  <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block">Learning Contract</span>
                  <label className="flex items-start gap-3 cursor-pointer text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={contractUninterrupted}
                      onChange={(e) => setContractUninterrupted(e.target.checked)}
                      className="mt-0.5 rounded border-gray-700 bg-bg-dark text-brand-500 focus:ring-brand-500 focus:ring-offset-bg-dark"
                    />
                    <span>I have 15 uninterrupted minutes to focus on this topic.</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={contractHonest}
                      onChange={(e) => setContractHonest(e.target.checked)}
                      className="mt-0.5 rounded border-gray-700 bg-bg-dark text-brand-500 focus:ring-brand-500 focus:ring-offset-bg-dark"
                    />
                    <span>I will attempt all mid-video concept check questions honestly.</span>
                  </label>
                </div>

                <button
                  onClick={handleEnterWorkspace}
                  disabled={!contractUninterrupted || !contractHonest}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-600/40 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Enter Study Workspace</span>
                </button>
              </div>
            ) : (
              /* Active Workspace Panel */
              <div className="grid lg:grid-cols-3 gap-6 items-start flex-1">
                {/* Left side: Video & prompts & reflection */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Active prompt question overlay */}
                  {activePrompt ? (
                    <div className="p-6 rounded-2xl border border-brand-500 bg-card-dark shadow-2xl space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <HelpCircle className="w-4 h-4 text-brand-500" />
                        <span className="text-xs font-bold text-foreground">In-Video Concept Check</span>
                      </div>
                      <h3 className="text-xs font-bold text-foreground">{activePrompt.question_text}</h3>
                      
                      <div className="grid gap-2">
                        {activePrompt.options.map((opt: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => !promptChecked && setSelectedPromptAns(idx)}
                            className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
                              selectedPromptAns === idx 
                                ? 'bg-brand-600/10 border-brand-500 text-foreground font-bold' 
                                : 'bg-bg-dark border-border hover:border-gray-700 text-gray-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        {promptChecked ? (
                          <div className="flex items-center gap-2">
                            {promptCorrect ? (
                              <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                <span>Correct! Video unlocked.</span>
                              </span>
                            ) : (
                              <span className="text-xs text-danger-500 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Incorrect. Logging to mistake journal.</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-500">Pick an option to verify your progress.</span>
                        )}

                        <div className="flex gap-2">
                          {!promptChecked ? (
                            <button
                              onClick={handleCheckPromptAnswer}
                              disabled={selectedPromptAns === null}
                              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all"
                            >
                              Verify
                            </button>
                          ) : (
                            <button
                              onClick={handleResumeVideo}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                            >
                              Resume Video
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : !showReflection && progress?.status !== "completed" ? (
                    <VideoPlayer
                      videoId={lesson.video_id}
                      prompts={lesson.prompts}
                      onTriggerPrompt={handleTriggerPrompt}
                      onTimeUpdate={handleTimeUpdate}
                      onVideoEnd={handleVideoEnd}
                      resumePosition={progress?.resume_position || 0}
                    />
                  ) : (
                    /* Post-Video Feynman Reflection Panel */
                    <div className="p-6 rounded-2xl border border-border bg-card-dark space-y-6">
                      <div className="pb-3 border-b border-border">
                        <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">Retrieval Practice</span>
                        <h3 className="text-xs font-extrabold text-foreground mt-0.5">Feynman Recall & Self-Reflection</h3>
                      </div>

                      {reflectionSubmitted ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center text-xs space-y-2">
                          <CheckCircle className="w-10 h-10 text-emerald-500" />
                          <p className="font-bold text-foreground">Feynman Recall Logged!</p>
                          <p className="text-gray-500 max-w-sm">Spaced revisions have been scheduled for this topic. Complete chapter checks to unlock next segments.</p>
                          <Link href={`/courses/${lesson.subject_id || lesson.chapter_id}`} className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl font-bold">
                            Return to Syllabus
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                              Explain what you learned in your own words (Without looking at notes)
                            </label>
                            <textarea
                              rows={4}
                              value={recallText}
                              onChange={(e) => setRecallText(e.target.value)}
                              className="w-full bg-bg-dark border border-border focus:border-brand-500 rounded-lg px-4 py-2.5 text-xs text-foreground focus:outline-none"
                              placeholder="Write a brief explanation here..."
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                              Is there anything you still feel confused about? (Optional)
                            </label>
                            <input
                              type="text"
                              value={unresolvedText}
                              onChange={(e) => setUnresolvedText(e.target.value)}
                              className="w-full bg-bg-dark border border-border focus:border-brand-500 rounded-lg px-4 py-2.5 text-xs text-foreground focus:outline-none"
                              placeholder="e.g. Memory allocations, index offsets..."
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                              Self-Reported Understanding Level
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                              {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                  key={num}
                                  onClick={() => setConfidenceRating(num)}
                                  className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                                    confidenceRating === num
                                      ? "bg-brand-600 border-brand-500 text-white"
                                      : "bg-bg-dark border-border hover:border-gray-700 text-gray-400"
                                  }`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                            <div className="flex justify-between text-[9px] text-gray-500 mt-1.5 px-1 font-bold">
                              <span>Lost</span>
                              <span>Mastered</span>
                            </div>
                          </div>

                          <button
                            onClick={handleSubmitReflection}
                            disabled={!recallText.trim() || confidenceRating === null || submitReflectionMutation.isPending}
                            className="w-full py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-600/40 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            {submitReflectionMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <span>Lock In Knowledge</span>
                                <CheckCircle className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lesson notes outlines */}
                  <div className="p-5 rounded-2xl border border-border bg-card-dark space-y-3">
                    <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block">Workspace Notes</span>
                    <h3 className="text-xs font-bold text-foreground">{lesson.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{lesson.description}</p>
                  </div>
                </div>

                {/* Right side: downloads and Socratic AI Doubt Solver panel */}
                <div className="space-y-6">
                  {/* Resources Downloads Widget */}
                  <div className="p-5 rounded-2xl border border-border bg-card-dark space-y-4">
                    <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block">Attached Resources</span>
                    <div className="space-y-2">
                      {lesson.resources.length === 0 ? (
                        <p className="text-xs text-gray-500">No downloads associated with this lesson.</p>
                      ) : (
                        lesson.resources.map((res: any) => (
                          <a
                            key={res.id}
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 rounded-xl border border-border/80 bg-bg-dark/40 flex items-center gap-3 hover:border-brand-500/20 transition-all"
                          >
                            <div className="p-1.5 rounded-lg bg-gray-800 text-gray-400">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <h4 className="text-xs font-bold text-foreground truncate w-40">{res.title}</h4>
                              <span className="text-[9px] text-gray-500 uppercase font-semibold">{(res.file_size / 1024).toFixed(0)} KB &bull; {res.resource_type}</span>
                            </div>
                          </a>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Socratic AI Tutor Workspace Sidepanel */}
                  <div className="p-5 rounded-2xl border border-border bg-card-dark flex flex-col h-[380px]">
                    <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider pb-2 border-b border-border/40 block">Socratic Tutor</span>
                    
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto space-y-3.5 py-4 pr-1 text-xs leading-relaxed">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`p-3 rounded-xl max-w-[85%] ${
                            msg.sender === "user"
                              ? "bg-brand-600 text-white"
                              : "bg-bg-dark border border-border text-gray-300"
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start"><Loader2 className="w-4 h-4 animate-spin text-brand-500" /></div>
                      )}
                    </div>

                    {/* Chat Input form */}
                    <form onSubmit={handleSendChat} className="flex gap-2 border-t border-border/40 pt-3">
                      <input
                        type="text"
                        placeholder="Ask a question..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="flex-1 bg-bg-dark border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-brand-500"
                      />
                      <button
                        type="submit"
                        disabled={chatLoading}
                        className="p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
    </div>
  );
}
