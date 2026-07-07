"use client";

import React, { useState } from "react";
import { useMistakes, useResolveMistake, useMistakeStats } from "@/hooks/useApi";
import { Loader2, ClipboardList, CheckCircle, AlertTriangle, AlertCircle, RefreshCw, X, ArrowRight } from "lucide-react";

export default function MistakeJournalPage() {
  const [showResolved, setShowResolved] = useState(false);
  const [activeMistake, setActiveMistake] = useState<any | null>(null);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [resolveFeedback, setResolveFeedback] = useState<{ status: "success" | "error"; message: string } | null>(null);

  // APIs
  const { data: mistakes = [], isLoading: mistakesLoading, refetch: refetchMistakes } = useMistakes(showResolved);
  const { data: stats, refetch: refetchStats } = useMistakeStats();
  const resolveMutation = useResolveMistake();

  const handleOpenResolveModal = (mistake: any) => {
    setActiveMistake(mistake);
    setSelectedAns(null);
    setResolveFeedback(null);
  };

  const handleCloseResolveModal = () => {
    setActiveMistake(null);
    setSelectedAns(null);
    setResolveFeedback(null);
  };

  const handleSubmitResolve = () => {
    if (selectedAns === null || !activeMistake) return;
    resolveMutation.mutate({
      mistakeId: activeMistake.id,
      selected_option_index: selectedAns
    }, {
      onSuccess: (data) => {
        setResolveFeedback(data);
        if (data.status === "success") {
          refetchMistakes();
          refetchStats();
        }
      }
    });
  };

  return (
<div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-bold text-brand-500 tracking-wider uppercase">Deliberate Practice</span>
                <h1 className="text-xl font-extrabold text-foreground mt-0.5">Personal Mistake Journal</h1>
                <p className="text-xs text-gray-500 mt-1">
                  Mistakes are logs of weak areas. Re-test and resolve them to calibrate your knowledge.
                </p>
              </div>

              {/* Toggle resolved vs unresolved */}
              <div className="flex bg-card-dark p-1 rounded-xl border border-border">
                <button
                  onClick={() => setShowResolved(false)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    !showResolved ? "bg-brand-600 text-white" : "text-gray-400 hover:text-foreground"
                  }`}
                >
                  Unresolved ({stats?.unresolved || 0})
                </button>
                <button
                  onClick={() => setShowResolved(true)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    showResolved ? "bg-brand-600 text-white" : "text-gray-400 hover:text-foreground"
                  }`}
                >
                  Resolved ({stats?.resolved || 0})
                </button>
              </div>
            </div>

            {/* Mistakes list */}
            {mistakesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              </div>
            ) : mistakes.length === 0 ? (
              <div className="text-center py-20 max-w-sm mx-auto space-y-2">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-xs font-bold text-foreground">Mistake Journal is Empty!</h3>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Congratulations! You have resolved all logged misconceptions. Keep learning and practicing.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {mistakes.map((mis: any) => {
                  const isMisconception = mis.confidence_rating === "high";
                  
                  return (
                    <div key={mis.id} className="p-5 rounded-2xl border border-border bg-card-dark flex flex-col justify-between space-y-4 hover:border-brand-500/20 transition-all duration-300">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="px-2 py-0.5 rounded bg-bg-dark text-gray-400 border border-border text-[9px] font-bold uppercase tracking-wider">
                            Source: {mis.source_type}
                          </span>
                          
                          {/* Misconception warning badge (High confidence + wrong answer) */}
                          {isMisconception && !mis.resolved && (
                            <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/10 text-[9px] font-extrabold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 fill-orange-500/20" />
                              <span>Misconception</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs font-bold text-foreground leading-relaxed">
                          {mis.question_text}
                        </h3>

                        <div className="space-y-1.5 text-[11px] leading-snug">
                          <div className="text-danger-500">
                            <span className="font-extrabold">Your incorrect answer:</span> {mis.options[mis.selected_option_index]}
                          </div>
                          {mis.resolved && (
                            <div className="text-emerald-500">
                              <span className="font-extrabold">Correct answer:</span> {mis.options[mis.correct_option_index]}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border/40 flex justify-between items-center gap-3">
                        <span className="text-[9px] text-gray-500 font-bold uppercase">Confidence: {mis.confidence_rating}</span>
                        {!mis.resolved ? (
                          <button
                            onClick={() => handleOpenResolveModal(mis)}
                            className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-bold transition-all shadow-md flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Resolve</span>
                          </button>
                        ) : (
                          <span className="text-emerald-500 text-[11px] font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Resolved</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Resolve recheck Dialog Overlay modal */}
            {activeMistake && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-lg bg-card-dark border border-border rounded-2xl p-6 shadow-2xl space-y-5 relative">
                  <button onClick={handleCloseResolveModal} className="absolute top-4 right-4 text-gray-500 hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>

                  <div className="pb-2 border-b border-border">
                    <span className="text-[9px] font-bold text-brand-500 uppercase tracking-wider">Resolve notebook error</span>
                    <h3 className="text-xs font-bold text-foreground mt-1 leading-relaxed">
                      {activeMistake.question_text}
                    </h3>
                  </div>

                  {resolveFeedback ? (
                    <div className="p-4 rounded-xl text-center space-y-4">
                      {resolveFeedback.status === "success" ? (
                        <>
                          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                          <h4 className="text-xs font-bold text-foreground">Error Resolved!</h4>
                          <p className="text-[11px] text-gray-500 leading-relaxed">{resolveFeedback.message}</p>
                          <button onClick={handleCloseResolveModal} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all">
                            Close
                          </button>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-10 h-10 text-danger-500 mx-auto" />
                          <h4 className="text-xs font-bold text-foreground">Answer Incorrect</h4>
                          <p className="text-[11px] text-gray-500 leading-relaxed">{resolveFeedback.message}</p>
                          <div className="p-3 rounded-lg bg-bg-dark text-left text-[11px] text-gray-400 italic">
                            Hint: {activeMistake.explanation}
                          </div>
                          <button onClick={() => setResolveFeedback(null)} className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all">
                            Try Again
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        {activeMistake.options.map((opt: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedAns(idx)}
                            className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
                              selectedAns === idx
                                ? "bg-brand-600/10 border-brand-500 text-foreground font-bold"
                                : "bg-bg-dark border-border hover:border-gray-700 text-gray-300"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handleSubmitResolve}
                        disabled={selectedAns === null || resolveMutation.isPending}
                        className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-600/40 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1"
                      >
                        {resolveMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span>Submit Answer</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
);
}
