"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useQuiz, useSubmitQuiz } from "@/hooks/useApi";
import { Loader2, CheckCircle, AlertTriangle, ArrowRight, ClipboardList } from "lucide-react";
import Link from "next/link";

export default function QuizTaker() {
  const { quizId } = useParams();
  const qzId = parseInt(quizId as string);
  const router = useRouter();

  // APIs
  const { data: quiz, isLoading: quizLoading } = useQuiz(qzId);
  const submitQuizMutation = useSubmitQuiz();

  // State
  const [answers, setAnswers] = useState<Record<number, { choice: number; confidence: string }>>({});
  const [scoreOutcome, setScoreOutcome] = useState<any | null>(null);

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        choice: optionIndex,
        confidence: prev[questionId]?.confidence || "medium"
      }
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

  const handleSubmit = () => {
    if (!quiz || !quiz.questions) return;
    
    // Format answers array
    const formatted = quiz.questions.map((q: any) => ({
      question_id: q.id,
      selected_option_index: answers[q.id]?.choice ?? -1,
      confidence_rating: answers[q.id]?.confidence ?? "medium"
    }));

    submitQuizMutation.mutate({
      quizId: qzId,
      answers: formatted
    }, {
      onSuccess: (data) => {
        setScoreOutcome(data);
      }
    });
  };

  const allAnswered = quiz?.questions?.every((q: any) => answers[q.id]?.choice !== undefined) ?? false;

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen overflow-hidden bg-bg-dark">
        <Navbar />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {quizLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              </div>
            ) : !quiz ? (
              <p className="text-xs text-gray-500">Quiz details not found.</p>
            ) : scoreOutcome ? (
              /* Score outcome board (Post-submission) */
              <div className="max-w-xl mx-auto w-full border border-border bg-card-dark rounded-2xl p-8 shadow-2xl space-y-6 text-center mt-10">
                {scoreOutcome.score >= 80.0 ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                    <h2 className="text-sm font-extrabold text-foreground">Checkpoint Mastered!</h2>
                    <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 uppercase">Passed</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <AlertTriangle className="w-12 h-12 text-danger-500" />
                    <h2 className="text-sm font-extrabold text-foreground">Mastery Checkpoint Failed</h2>
                    <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-danger-500/10 text-danger-500 border border-danger-500/10 uppercase">Retry Required</span>
                  </div>
                )}

                <div className="py-4 border-y border-border">
                  <div className="text-2xl font-black text-foreground">{scoreOutcome.score}%</div>
                  <p className="text-[10px] text-gray-500 mt-1">Passing score requires at least 80% (4 correct out of 5).</p>
                </div>

                {scoreOutcome.score >= 80.0 ? (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Excellent job! You have demonstrated key understanding. Next chapter topics are now unlocked in your workspace.
                    </p>
                    <Link
                      href="/courses/3"
                      className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1"
                    >
                      <span>Continue Syllabus</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Your incorrect responses have been logged to your **Mistake Journal** with structured guidance. Please review them before attempting again.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Link
                        href="/journal"
                        className="py-2.5 rounded-xl border border-danger-500/20 bg-danger-500/10 text-danger-500 text-xs font-bold transition-all flex items-center justify-center gap-1"
                      >
                        <ClipboardList className="w-4 h-4" />
                        <span>Mistake Journal</span>
                      </Link>
                      <button
                        onClick={() => setScoreOutcome(null)}
                        className="py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all"
                      >
                        Retake Checkpoint
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Active quiz checkpoint questions list */
              <div className="max-w-2xl mx-auto w-full space-y-6">
                <div>
                  <span className="text-[10px] font-bold text-brand-500 tracking-wider uppercase">Mastery Checkpoint</span>
                  <h1 className="text-xl font-extrabold text-foreground mt-0.5">{quiz.title}</h1>
                  <p className="text-xs text-gray-500 mt-1">{quiz.description || "Attempt questions honestly."}</p>
                </div>

                <div className="space-y-6">
                  {quiz.questions.map((q: any, qIdx: number) => {
                    const selected = answers[q.id]?.choice;
                    const confidence = answers[q.id]?.confidence || "medium";
                    
                    return (
                      <div key={q.id} className="p-5 rounded-2xl border border-border bg-card-dark space-y-4">
                        <h3 className="text-xs font-bold text-foreground">
                          Q{qIdx + 1}. {q.text}
                        </h3>

                        {/* Options Select */}
                        <div className="grid gap-2.5">
                          {q.options.map((opt: string, optIdx: number) => (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectOption(q.id, optIdx)}
                              className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
                                selected === optIdx
                                  ? "bg-brand-600/10 border-brand-500 text-foreground font-bold"
                                  : "bg-bg-dark border-border hover:border-gray-700 text-gray-300"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>

                        {/* Metacognitive Confidence Calibration selector (Only visible if answered) */}
                        {selected !== undefined && (
                          <div className="mt-3 p-3 rounded-xl bg-bg-dark border border-border/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">How confident are you?</span>
                            <div className="flex gap-2">
                              {["low", "medium", "high"].map((cValue) => (
                                <button
                                  key={cValue}
                                  onClick={() => handleSelectConfidence(q.id, cValue)}
                                  className={`px-3 py-1 rounded border text-[10px] font-extrabold uppercase transition-all ${
                                    confidence === cValue
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
                    );
                  })}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitQuizMutation.isPending}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-600/40 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  {submitQuizMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Submit Checkpoint</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
