"use client";

import React, { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { apiFetch } from "@/utils/api";
import { Loader2, ArrowRight, Sparkles, CheckCircle, AlertCircle } from "lucide-react";

export default function AiTestGenerator() {
  // Generation state
  const [subjectId, setSubjectId] = useState<number>(3); // Default to Python (id 3)
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [numQuestions, setNumQuestions] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  
  // Taker state
  const [testQuestions, setTestQuestions] = useState<any[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [scoreOutcome, setScoreOutcome] = useState<any | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setScoreOutcome(null);
    setAnswers({});
    try {
      const res = await apiFetch("/ai/test-generate", {
        method: "POST",
        body: JSON.stringify({
          subject_id: subjectId,
          difficulty,
          num_questions: numQuestions
        })
      });
      setTestQuestions(res.questions || []);
    } catch (e: any) {
      alert(`Generation failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (idx: number, optIdx: number) => {
    setAnswers((prev) => ({ ...prev, [idx]: optIdx }));
  };

  const handleSubmitTest = () => {
    if (!testQuestions) return;
    
    let correct = 0;
    testQuestions.forEach((q, idx) => {
      if (answers[idx] === q.correct_option_index) {
        correct++;
      }
    });

    const score = (correct / testQuestions.length) * 100.0;
    setScoreOutcome({
      score,
      correct,
      total: testQuestions.length
    });
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen overflow-hidden bg-bg-dark">
        <Navbar />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <span className="text-[10px] font-bold text-brand-500 tracking-wider uppercase">AI Hub</span>
              <h1 className="text-xl font-extrabold text-foreground mt-0.5">AI Custom Test Generator</h1>
              <p className="text-xs text-gray-500 mt-1">
                Select topics and parameters to generate personalized dynamic assessments from our AI Examiner.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              </div>
            ) : scoreOutcome ? (
              /* Score screen */
              <div className="max-w-xl mx-auto w-full border border-border bg-card-dark rounded-2xl p-8 shadow-2xl space-y-6 text-center mt-10">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <h2 className="text-sm font-extrabold text-foreground">Custom Quiz Completed!</h2>
                
                <div className="py-4 border-y border-border">
                  <div className="text-2xl font-black text-foreground">{scoreOutcome.score.toFixed(0)}%</div>
                  <p className="text-[10px] text-gray-500 mt-1">Correct answers: {scoreOutcome.correct} out of {scoreOutcome.total}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setTestQuestions(null); setScoreOutcome(null); }}
                    className="flex-1 py-2 rounded-xl border border-border bg-bg-dark text-xs font-bold text-gray-300 hover:text-foreground"
                  >
                    Generate Another
                  </button>
                  <button
                    onClick={() => setScoreOutcome(null)}
                    className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl"
                  >
                    Review Answers
                  </button>
                </div>
              </div>
            ) : testQuestions ? (
              /* Active test taker */
              <div className="max-w-2xl mx-auto w-full space-y-6">
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-xs font-bold text-foreground">Generated {difficulty} Test</span>
                  <button onClick={() => setTestQuestions(null)} className="text-[10px] text-gray-500 hover:text-foreground">Cancel</button>
                </div>

                <div className="space-y-6">
                  {testQuestions.map((q, idx) => (
                    <div key={idx} className="p-5 rounded-2xl border border-border bg-card-dark space-y-4">
                      <h3 className="text-xs font-bold text-foreground">Q{idx + 1}. {q.text}</h3>
                      <div className="grid gap-2.5">
                        {q.options.map((opt: string, optIdx: number) => (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(idx, optIdx)}
                            className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
                              answers[idx] === optIdx
                                ? "bg-brand-600/10 border-brand-500 text-foreground font-bold"
                                : "bg-bg-dark border-border hover:border-gray-700 text-gray-300"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSubmitTest}
                  disabled={Object.keys(answers).length < testQuestions.length}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-600/40 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Submit Answers</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Form Selector dashboard */
              <div className="max-w-xl mx-auto w-full border border-border bg-card-dark rounded-2xl p-6 shadow-2xl space-y-6 mt-10">
                <div className="pb-3 border-b border-border flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-500" />
                  <span className="text-xs font-bold text-foreground">Custom Quiz Generator Options</span>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Select Subject</label>
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(parseInt(e.target.value))}
                      className="w-full bg-bg-dark border border-border rounded-lg px-4 py-2.5 text-xs text-foreground focus:outline-none"
                    >
                      <option value={3}>A3-R5: Python Programming</option>
                      <option value={1}>A1-R5: IT Tools & Networking</option>
                      <option value={2}>A2-R5: Web Designing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Difficulty Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["easy", "medium", "hard"].map((diff) => (
                        <button
                          key={diff}
                          onClick={() => setDifficulty(diff)}
                          className={`py-2 rounded-lg border text-xs font-extrabold uppercase transition-all ${
                            difficulty === diff
                              ? "bg-brand-600 border-brand-500 text-white"
                              : "bg-bg-dark border-border hover:border-gray-700 text-gray-400"
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Number of Questions</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[3, 5, 10].map((num) => (
                        <button
                          key={num}
                          onClick={() => setNumQuestions(num)}
                          className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                            numQuestions === num
                              ? "bg-brand-600 border-brand-500 text-white"
                              : "bg-bg-dark border-border hover:border-gray-700 text-gray-400"
                          }`}
                        >
                          {num} Items
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>Generate Quiz Sheet</span>
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
