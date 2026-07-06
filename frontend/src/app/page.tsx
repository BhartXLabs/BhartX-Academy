"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Sparkles, BookOpen, Clock, FileText, ChevronRight } from "lucide-react";

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const features = [
    { title: "Active Video Prompts", desc: "Interactive MCQs trigger mid-video to test your understanding before continuing." },
    { title: "Spaced Revision Engine", desc: "Revisions automatically scheduled at Day +1, +3, +7, +15, and +30 to block forgetting." },
    { title: "Feynman Recall Drills", desc: "Explain concepts in your own words. Long-term memory is built on retrieval." },
    { title: "Socratic AI Tutor", desc: "Stuck on a concept? Our AI guides you with hints instead of copy-paste answers." },
    { title: "Confidence Calibration", desc: "Matches answer accuracy with confidence to target latent misconceptions." },
    { title: "Personal Mistake Journal", desc: "Mistakes are logged automatically. Re-test and resolve them before exams." }
  ];

  const subjects = [
    { code: "A1-R5", name: "IT Tools & Networking" },
    { code: "A2-R5", name: "Web Designing" },
    { code: "A3-R5", name: "Python Programming" },
    { code: "A4-R5", name: "Internet of Things" },
    { code: "A5-R5", name: "Data Structure through Python" },
    { code: "A6-R5", name: "Computer Organization" },
    { code: "A7-R5", name: "Operating System" },
    { code: "A8-R5", name: "Database Technologies" },
    { code: "A9-R5", name: "Software Engineering" },
    { code: "A10-R5", name: "Project Guidance" }
  ];

  const faqs = [
    { q: "What is NIELIT A-Level?", a: "The A-Level course is equivalent to an Advanced Diploma in Computer Applications, recognized by the Ministry of Electronics and Information Technology (MeitY), Government of India." },
    { q: "How does the Mastery Unlock work?", a: "To ensure deep comprehension, you cannot advance to a consecutive lesson until you pass the current chapter quiz with at least an 80% score. This stops passive binge-watching." },
    { q: "What is Spaced Repetition?", a: "It is a learning science method where concepts are reviewed at increasing intervals. The system dynamically schedules reviews based on your forgetting curves." },
    { q: "Is the AI Tutor free during the MVP?", a: "Yes, the Socratic AI Tutor, Coach, and Examiner agents are fully accessible. They provide interactive guidance on all 10 modules." }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg-dark text-foreground">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-card-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold bg-gradient-to-r from-brand-500 to-indigo-400 bg-clip-text text-transparent">
            BhartX Academy
          </span>
          <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-brand-glow text-brand-500 border border-brand-500/20 uppercase tracking-widest">
            Learning OS
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs font-semibold text-gray-400 hover:text-foreground transition-colors">
            Login
          </Link>
          <Link href="/login?tab=signup" className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-md">
            Start Learning
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 flex flex-col items-center justify-center text-center overflow-hidden border-b border-border">
        {/* Glow decoration */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />

        <span className="px-3 py-1 rounded-full bg-brand-glow border border-brand-500/20 text-brand-500 text-xs font-bold flex items-center gap-1.5 animate-pulse mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Cognitive Learning Science
        </span>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
          Master NIELIT A-Level with the{" "}
          <span className="bg-gradient-to-r from-brand-500 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            BhartX Learning Loop
          </span>
        </h1>

        <p className="mt-6 text-base text-gray-400 max-w-xl leading-relaxed">
          Learn Less. Remember More. Apply Better. The first AI-powered Learning OS designed to help you master programming, systems, and database engineering.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xs sm:max-w-md">
          <Link href="/login?tab=signup" className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition-all shadow-lg shadow-brand-600/25">
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="flex items-center justify-center px-6 py-3 rounded-xl border border-border bg-card-dark text-gray-300 hover:text-foreground transition-all text-sm font-semibold">
            Demo Portal
          </Link>
        </div>
      </section>

      {/* Learning Principles */}
      <section className="px-6 py-20 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-center">
          Engineered for Retention and Application
        </h2>
        <p className="text-gray-500 text-center text-xs mt-2">
          Why traditional video platforms fail, and how BhartX guarantees learning outcomes.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {features.map((feat, i) => (
            <div key={i} className="p-5 rounded-2xl bg-card-dark border border-border hover:border-brand-500/40 hover:shadow-lg transition-all group duration-300">
              <CheckCircle className="w-5 h-5 text-brand-500 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-bold mt-4 text-foreground">{feat.title}</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Course Outline (Subjects) */}
      <section className="px-6 py-20 bg-card-dark/40 border-y border-border">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                NIELIT A-Level Complete Curriculum
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                10 comprehensive modules mapped across 3 Semesters.
              </p>
            </div>
            <Link href="/login" className="text-xs text-brand-500 font-bold hover:underline flex items-center gap-1 mt-4 md:mt-0">
              <span>View detailed syllabus</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {subjects.map((sub, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-card-dark flex flex-col justify-between h-28">
                <span className="text-[10px] font-bold text-brand-500 tracking-wider uppercase">{sub.code}</span>
                <h3 className="text-xs font-bold text-foreground leading-snug">{sub.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="px-6 py-20 max-w-3xl mx-auto w-full">
        <h2 className="text-2xl font-extrabold tracking-tight text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-border bg-card-dark overflow-hidden">
              <button
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full px-5 py-4 text-left flex justify-between items-center text-xs font-bold text-foreground focus:outline-none"
              >
                <span>{faq.q}</span>
                <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${activeFaq === i ? 'rotate-90' : ''}`} />
              </button>
              {activeFaq === i && (
                <div className="px-5 pb-4 text-xs text-gray-400 leading-relaxed border-t border-border/40 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border mt-auto bg-card-dark/80 text-center">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <span>&copy; {new Date().getFullYear()} BhartX Academy. Learn Today. Build Tomorrow.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
