"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useMockDetails, useSubmitMock } from "@/hooks/useApi";
import { Loader2, Timer, CheckCircle, AlertTriangle, ArrowRight, ClipboardList, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function MockExamLab() {
  const { mockId } = useParams();
  const mckId = parseInt(mockId as string);
  const router = useRouter();

  // APIs
  const { data: mock, isLoading: mockLoading } = useMockDetails(mckId);
  const submitMockMutation = useSubmitMock();

  // Local States
  const [answers, setAnswers] = useState<Record<number, { choice: number; confidence: string }>>({});
  const [reviewStatus, setReviewStatus] = useState<Record<number, "answered" | "skipped" | "review">>({});
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [scoreOutcome, setScoreOutcome] = useState<any | null>(null);
  const timerRef = useRef<any>(null);

  // Refs to hold latest state for use inside setInterval (avoids stale closures)
  const answersRef = React.useRef(answers);
  const mockRef = React.useRef(mock);
  const examSubmittedRef = React.useRef(examSubmitted);

  // Keep refs in sync with state on every render
  React.useEffect(() => { answersRef.current = answers; }, [answers]);
  React.useEffect(() => { mockRef.current = mock; }, [mock]);
  React.useEffect(() => { examSubmittedRef.current = examSubmitted; }, [examSubmitted]);

  // Initialize Timer once when mock data arrives
  useEffect(() => {
    if (mock && timeLeft === null) {
      setTimeLeft(mock.duration_minutes * 60);
    }
  }, [mock]);

  // Single interval — created once when timeLeft is initialized, never re-created
  useEffect(() => {
    if (timeLeft === null) return; // Wait for mock data

    // Clear any existing interval before starting new one
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current);
          // Use refs to get latest state — avoids stale closure problem
          if (!examSubmittedRef.current) {
            handleSubmitExamWithRefs();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // Only run once when timer is first initialized — NOT on every timeLeft change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft === null ? null : "initialized"]);


  // Ref-based submit — safe to call from inside setInterval (no stale closures)
  const handleSubmitExamWithRefs = () => {
    const currentMock = mockRef.current;
    const currentAnswers = answersRef.current;
    if (!currentMock || !currentMock.questions) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const formattedAnswers = currentMock.questions.map((q: any) => ({
      question_id: q.id,
      selected_option_index: currentAnswers[q.id]?.choice ?? -1,
      confidence_rating: currentAnswers[q.id]?.confidence ?? "medium"
    }));

    submitMockMutation.mutate({
      mockId: mckId,
      answers: formattedAnswers,
      review_palette: reviewStatus
    }, {
      onSuccess: (data) => {
        setScoreOutcome(data);
        setExamSubmitted(true);
      }
    });
  };

  const handleSelectOption = (questionId: number, idx: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        choice: idx,
        confidence: prev[questionId]?.confidence || "medium"
      }
    }));
    setReviewStatus((prev) => ({
      ...prev,
      [questionId]: "answered"
    }));
  };

  const handleSelectConfidence = (questionId: number, rating: string) => {
    if (answers[questionId] === undefined) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        confidence: rating
      }
    }));
  };

  const handleClearResponse = (questionId: number) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
    setReviewStatus((prev) => ({
      ...prev,
      [questionId]: "skipped"
    }));
  };

  const handleMarkForReview = (questionId: number) => {
    setReviewStatus((prev) => ({
      ...prev,
      [questionId]: "review"
    }));
  };

  const handleSubmitExam = () => {
    if (!mock || !mock.questions) return;
    if (timerRef.current) clearInterval(timerRef.current);

    // Format answers payload
    const formattedAnswers = mock.questions.map((q: any) => ({
      question_id: q.id,
      selected_option_index: answers[q.id]?.choice ?? -1, // -1 means skipped
      confidence_rating: answers[q.id]?.confidence ?? "medium"
    }));

    submitMockMutation.mutate({
      mockId: mckId,
      answers: formattedAnswers,
      review_palette: reviewStatus
    }, {
      onSuccess: (data) => {
        setScoreOutcome(data);
        setExamSubmitted(true);
      }
    });
  };

  // Helper to format remaining seconds into mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (mockLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg-dark text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!mock) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg-dark text-foreground">
        <p className="text-xs text-gray-500">Mock test sheets not found.</p>
      </div>
    );
  }

  const currentQuestion = mock.questions[currentQIdx];

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen overflow-hidden bg-bg-dark">
        <Navbar />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {examSubmitted && scoreOutcome ? (
              /* Post-exam analytics display */
              <div className="max-w-2xl mx-auto w-full border border-border bg-card-dark rounded-2xl p-8 shadow-2xl space-y-6 mt-10">
                <div className="text-center pb-4 border-b border-border">
                  <span className="text-[10px] font-bold text-brand-500 tracking-wider uppercase">Exam Scorecard</span>
                  <h2 className="text-sm font-extrabold text-foreground mt-1">{mock.title}</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-bg-dark border border-border">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Final Score</span>
                    <span className="text-2xl font-black text-foreground mt-1 block">{scoreOutcome.score.toFixed(1)}%</span>
                  </div>
                  <div className="p-4 rounded-xl bg-bg-dark border border-border">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Negative marking applied</span>
                    <span className="text-xs text-danger-500 font-bold mt-2 block">-{mock.negative_marks_per_question} per error</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-brand-glow/5 border border-brand-500/10 space-y-3">
                  <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block">Analysis Summary</span>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Any incorrect selections have been captured inside your **Mistake Journal** for conceptual study. Retake mock tests to recalibrate parameters.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 pt-4">
                  <Link
                    href="/journal"
                    className="py-2.5 rounded-xl border border-danger-500/20 bg-danger-500/10 text-danger-500 text-xs font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Mistake Journal</span>
                  </Link>
                  <button
                    onClick={() => {
                      setAnswers({});
                      setReviewStatus({});
                      setCurrentQIdx(0);
                      setTimeLeft(mock.duration_minutes * 60);
                      setExamSubmitted(false);
                      setScoreOutcome(null);
                    }}
                    className="py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    <span>Retake Mock Test</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Active timed exam layout interface */
              <div className="grid lg:grid-cols-4 gap-6 items-start">
                
                {/* Left Area: Question Panel */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Top Bar: Question Index & Timer */}
                  <div className="flex justify-between items-center p-4 rounded-xl border border-border bg-card-dark">
                    <span className="text-xs font-bold text-foreground">
                      Question {currentQIdx + 1} of {mock.total_questions}
                    </span>
                    <div className="flex items-center gap-2 text-xs font-bold text-brand-500 bg-brand-glow/10 border border-brand-500/15 px-3 py-1.5 rounded-full">
                      <Timer className="w-4 h-4" />
                      <span>{timeLeft !== null ? formatTime(timeLeft) : "00:00"}</span>
                    </div>
                  </div>

                  {/* Question details card */}
                  {currentQuestion && (
                    <div className="p-6 rounded-2xl border border-border bg-card-dark space-y-5">
                      <h2 className="text-xs font-bold text-foreground leading-relaxed">
                        {currentQuestion.text}
                      </h2>

                      {/* Options selector */}
                      <div className="grid gap-2.5">
                        {currentQuestion.options.map((opt: string, idx: number) => {
                          const isSelected = answers[currentQuestion.id]?.choice === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() => handleSelectOption(currentQuestion.id, idx)}
                              className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
                                isSelected
                                  ? "bg-brand-600/10 border-brand-500 text-foreground font-bold"
                                  : "bg-bg-dark border-border hover:border-gray-700 text-gray-300"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {/* Confidence Calibration */}
                      {answers[currentQuestion.id]?.choice !== undefined && (
                        <div className="mt-3 p-3 rounded-xl bg-bg-dark border border-border/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Metacognitive Calibration</span>
                          <div className="flex gap-2">
                            {["low", "medium", "high"].map((cValue) => (
                              <button
                                key={cValue}
                                onClick={() => handleSelectConfidence(currentQuestion.id, cValue)}
                                className={`px-3 py-1 rounded border text-[10px] font-extrabold uppercase transition-all ${
                                  answers[currentQuestion.id]?.confidence === cValue
                                    ? "bg-brand-600 border-brand-500 text-white"
                                    : "bg-card-dark border-border hover:border-gray-700 text-gray-400"
                                }`}
                              >
                                {cValue}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Navigation Panel */}
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentQIdx((prev) => Math.max(0, prev - 1))}
                        disabled={currentQIdx === 0}
                        className="px-4 py-2 rounded-xl border border-border bg-card-dark text-xs font-bold text-gray-300 hover:text-foreground disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentQIdx((prev) => Math.min(mock.total_questions - 1, prev + 1))}
                        disabled={currentQIdx === mock.total_questions - 1}
                        className="px-4 py-2 rounded-xl border border-border bg-card-dark text-xs font-bold text-gray-300 hover:text-foreground disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleClearResponse(currentQuestion.id)}
                        className="px-4 py-2 rounded-xl border border-danger-500/20 text-danger-500 hover:bg-danger-500/10 text-xs font-semibold"
                      >
                        Clear Response
                      </button>
                      <button
                        onClick={() => handleMarkForReview(currentQuestion.id)}
                        className="px-4 py-2 rounded-xl border border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/10 text-xs font-semibold"
                      >
                        Mark for Review
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Area: Question Palette sidebar */}
                <div className="p-5 rounded-2xl border border-border bg-card-dark space-y-5">
                  <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block pb-2 border-b border-border/40">
                    Question Palette
                  </span>

                  <div className="grid grid-cols-4 gap-2">
                    {mock.questions.map((q: any, idx: number) => {
                      const status = reviewStatus[q.id];
                      let colorClass = "bg-gray-800 text-gray-400 border-gray-700";
                      
                      if (status === "answered") {
                        colorClass = "bg-emerald-600 text-white border-emerald-500 shadow-md";
                      } else if (status === "review") {
                        colorClass = "bg-yellow-500 text-white border-yellow-400 shadow-md";
                      } else if (status === "skipped") {
                        colorClass = "bg-danger-500 text-white border-danger-400 shadow-md";
                      }

                      const isCurrent = currentQIdx === idx;

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQIdx(idx)}
                          className={`w-10 h-10 rounded-lg border text-xs font-bold flex items-center justify-center transition-all ${colorClass} ${
                            isCurrent ? "ring-2 ring-brand-500 scale-105" : ""
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Palette Indicators explanation legend */}
                  <div className="space-y-2 border-t border-border/40 pt-4 text-[10px] text-gray-500 font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-500" />
                      <span>Answered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded bg-yellow-500 border border-yellow-400" />
                      <span>Marked for Review</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded bg-danger-500 border border-danger-400" />
                      <span>Skipped / Cleared</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded bg-gray-800 border border-gray-700" />
                      <span>Not Visited</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitExam}
                    disabled={submitMockMutation.isPending}
                    className="w-full mt-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1"
                  >
                    {submitMockMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Submit Exam</span>
                        <CheckCircle className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
