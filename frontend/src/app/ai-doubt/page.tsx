"use client";

import React, { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { apiFetch } from "@/utils/api";
import { Loader2, Send, Sparkles, AlertCircle, HelpCircle } from "lucide-react";

export default function AiDoubtSolver() {
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string; details?: any }>>([
    {
      sender: "ai",
      text: "Namaste! I am your BhartX Socratic Tutor. Ask me any doubt about NIELIT A-Level subjects (e.g. Lists, Loops, SQL joins, Paging, Software engineering), and I will guide you to understand it!"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userQ = input;
    setMessages((prev) => [...prev, { sender: "user", text: userQ }]);
    setInput("");
    setLoading(true);

    try {
      const res = await apiFetch("/ai/doubt", {
        method: "POST",
        body: JSON.stringify({ question: userQ })
      });
      
      setMessages((prev) => [...prev, { sender: "ai", text: res.answer, details: res }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { sender: "ai", text: `Error: ${err.message || "Something went wrong"}` }]);
    } finally {
      setLoading(false);
    }
  };

  const sampleSuggestions = [
    "Explain what is a Python List?",
    "How does round-robin scheduler work?",
    "What is an outer join in databases?",
    "How do sensors communicate in IoT?"
  ];

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen overflow-hidden bg-bg-dark">
        <Navbar />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-hidden p-6 flex flex-col justify-between">
            <div className="pb-3 border-b border-border">
              <span className="text-[10px] font-bold text-brand-500 tracking-wider uppercase">AI Hub</span>
              <h1 className="text-xl font-extrabold text-foreground mt-0.5">Socratic AI Doubt Solver</h1>
              <p className="text-xs text-gray-500 mt-1">
                Our AI coach challenges assumptions and leads you to concepts via guided analogies instead of copying keys.
              </p>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-1">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed space-y-3 ${
                    msg.sender === "user"
                      ? "bg-brand-600 text-white shadow-lg"
                      : "bg-card-dark border border-border text-gray-300 shadow-md"
                  }`}>
                    {/* Raw text answer */}
                    <p>{msg.text}</p>

                    {/* Socratic structured analogies if offline provider matches */}
                    {msg.details && msg.details.analogy && (
                      <div className="mt-3 pt-3 border-t border-border/40 space-y-2.5 text-gray-400">
                        <div className="bg-bg-dark p-2 rounded-lg text-[11px] font-bold border border-border/40 text-brand-500">
                          {msg.details.analogy}
                        </div>
                        {msg.details.example && (
                          <div className="space-y-1">
                            <span className="font-extrabold text-[10px] uppercase text-gray-500 block">Worked Example</span>
                            <pre className="p-2 bg-bg-dark rounded-lg overflow-x-auto text-[10px] text-gray-300">{msg.details.example.replace(/```python|```/g, "")}</pre>
                          </div>
                        )}
                        {msg.details.try_yourself && (
                          <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[11px]">
                            <span className="font-bold text-emerald-500 block">🛠️ Try Yourself</span>
                            <span>{msg.details.try_yourself}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start"><Loader2 className="w-5 h-5 animate-spin text-brand-500" /></div>
              )}
            </div>

            {/* Suggestion tags if chat is starting */}
            {messages.length === 1 && (
              <div className="pb-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Suggested Topics</span>
                <div className="flex flex-wrap gap-2.5">
                  {sampleSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(sug)}
                      className="px-3.5 py-1.5 rounded-full border border-border bg-card-dark text-[11px] text-gray-400 hover:text-foreground hover:border-brand-500/30 transition-all font-semibold"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex gap-3 border-t border-border pt-4 bg-bg-dark">
              <input
                type="text"
                placeholder="Describe what you want to understand..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-card-dark border border-border focus:border-brand-500 rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none shadow-md"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-5 py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-600/40 text-white rounded-xl transition-all shadow-lg flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
