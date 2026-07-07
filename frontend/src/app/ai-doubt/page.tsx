"use client";

import React, { useState, useRef, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { apiFetch } from "@/utils/api";
import { useNewConversation } from "@/hooks/useApi";
import { Loader2, Send, Sparkles, RotateCcw, BookOpen, Lightbulb, Code2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  sender: "user" | "ai";
  text: string;
  details?: any;
}

export default function AiDoubtSolver() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Namaste! I am your **BhartX Socratic Tutor**.\n\nAsk me any doubt about NIELIT A-Level subjects — Python, Data Structures, DBMS, Networking, OS, or IoT — and I will guide you to understand it through analogies and examples!\n\n> 💡 I remember our conversation context, so you can ask follow-up questions naturally."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const newConversationMutation = useNewConversation();

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userQ = input;
    setMessages((prev) => [...prev, { sender: "user", text: userQ }]);
    setInput("");
    setLoading(true);

    try {
      // Backend manages conversation history — we just send the question
      const res = await apiFetch("/ai/doubt", {
        method: "POST",
        body: JSON.stringify({ question: userQ })
      });

      // Save conversation_id for new session tracking
      if (res.conversation_id && !conversationId) {
        setConversationId(res.conversation_id);
      }

      const aiText = res.answer || res.explanation || "I could not generate a response. Please try again.";
      setMessages((prev) => [...prev, { sender: "ai", text: aiText, details: res }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, {
        sender: "ai",
        text: `**Connection Error:** ${err.message || "Something went wrong. Please try again."}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = async () => {
    try {
      const res = await newConversationMutation.mutateAsync();
      setConversationId(res.conversation_id);
      setMessages([{
        sender: "ai",
        text: "New conversation started! 🆕\n\nWhat would you like to understand today?"
      }]);
    } catch (err) {
      console.error("Failed to start new session:", err);
    }
  };

  const sampleSuggestions = [
    "Explain Python Lists vs Tuples",
    "How does Round Robin scheduling work?",
    "What is a SQL OUTER JOIN?",
    "Explain OSI model layers",
    "What are ACID properties in DBMS?"
  ];

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen overflow-hidden bg-bg-dark">
        <Navbar />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold text-brand-500 tracking-wider uppercase">AI Learning Hub</span>
                <h1 className="text-lg font-extrabold text-foreground mt-0.5 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-500" />
                  Socratic AI Tutor
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Guided learning through analogies — never just answers. I remember our conversation.
                </p>
              </div>
              <button
                onClick={handleNewSession}
                disabled={newConversationMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-gray-400 hover:text-foreground hover:border-brand-500/40 transition-all"
                title="Start a fresh conversation on a new topic"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Topic</span>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.sender === "ai" && (
                    <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center shrink-0 mr-2 mt-1">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-2xl rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-brand-600 text-white shadow-lg ml-8"
                      : "bg-card-dark border border-border text-gray-200 shadow-md"
                  }`}>
                    {msg.sender === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      /* AI messages rendered as Markdown */
                      <div className="prose prose-invert prose-xs max-w-none
                        [&_h3]:text-brand-400 [&_h3]:font-bold [&_h3]:text-xs [&_h3]:mt-3 [&_h3]:mb-1
                        [&_h2]:text-foreground [&_h2]:font-bold [&_h2]:text-sm [&_h2]:mt-3 [&_h2]:mb-1
                        [&_p]:text-gray-200 [&_p]:leading-relaxed [&_p]:my-1.5
                        [&_ul]:my-1.5 [&_ul]:pl-4 [&_li]:my-0.5 [&_li]:text-gray-300
                        [&_ol]:my-1.5 [&_ol]:pl-4
                        [&_strong]:text-foreground [&_strong]:font-bold
                        [&_em]:text-brand-400
                        [&_blockquote]:border-l-2 [&_blockquote]:border-brand-500/40 [&_blockquote]:pl-3 [&_blockquote]:text-gray-400 [&_blockquote]:italic [&_blockquote]:my-2
                        [&_code]:bg-bg-dark [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-emerald-400 [&_code]:text-[11px] [&_code]:font-mono
                        [&_pre]:bg-bg-dark [&_pre]:border [&_pre]:border-border [&_pre]:rounded-xl [&_pre]:p-3 [&_pre]:my-2 [&_pre]:overflow-x-auto
                        [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-emerald-300
                        [&_hr]:border-border/40 [&_hr]:my-3
                        [&_table]:w-full [&_th]:text-left [&_th]:text-[10px] [&_th]:font-bold [&_th]:text-gray-400 [&_th]:pb-1
                        [&_td]:text-xs [&_td]:py-1 [&_td]:border-t [&_td]:border-border/30"
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Structured details panel for offline provider responses */}
                    {msg.details?.try_yourself && msg.details.try_yourself !== "null" && (
                      <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                          <Code2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <div>
                            <span className="text-[10px] font-bold text-emerald-400 block">🛠️ Try Yourself</span>
                            <span className="text-[11px] text-gray-300">{msg.details.try_yourself}</span>
                          </div>
                        </div>
                        {msg.details?.practice_question && (
                          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-brand-500/5 border border-brand-500/15">
                            <Lightbulb className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] font-bold text-brand-400 block">💭 Think Further</span>
                              <span className="text-[11px] text-gray-300">{msg.details.practice_question}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center shrink-0 mr-2">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-card-dark border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                    <span className="text-xs text-gray-500">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestions (first message only) */}
            {messages.length === 1 && (
              <div className="px-4 md:px-6 pb-3 shrink-0">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Try asking</span>
                <div className="flex flex-wrap gap-2">
                  {sampleSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(sug)}
                      className="px-3 py-1.5 rounded-full border border-border bg-card-dark text-[11px] text-gray-400 hover:text-foreground hover:border-brand-500/30 transition-all font-medium"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <div className="px-4 md:px-6 py-3 border-t border-border bg-bg-dark shrink-0">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a doubt... (e.g. 'How does SQL JOIN work?')"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-card-dark border border-border focus:border-brand-500 rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none shadow-md"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-600/40 text-white rounded-xl transition-all shadow-lg flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[10px] text-gray-600 mt-1.5 text-center">
                AI remembers this conversation context • <button onClick={handleNewSession} className="text-brand-500 hover:underline">Start new topic</button>
              </p>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
