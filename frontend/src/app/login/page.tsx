"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { apiFetch } from "@/utils/api";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Read optional tab param from URL
    const tab = searchParams.get("tab");
    if (tab === "signup") {
      setActiveTab("signup");
    }
  }, [searchParams]);

  useEffect(() => {
    // If user is already logged in, send them directly to dashboard
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Hook Form setups
  const { register: regLogin, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const { register: regSignup, handleSubmit: handleSignupSubmit, formState: { errors: signupErrors } } = useForm({
    resolver: zodResolver(signupSchema)
  });

  const onLogin = async (data: any) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Post credentials to get tokens
      const tokenData = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
        skipAuth: true,
      });

      // 2. Temporarily set token in localstorage to fetch user profile
      localStorage.setItem("token", tokenData.access_token);

      // 3. Fetch user details
      const userProfile = await apiFetch("/auth/me");

      // 4. Save to Zustand store
      setAuth(tokenData.access_token, tokenData.refresh_token, userProfile);
      
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (data: any) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Register student account
      const regResponse = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ ...data, role: "student" }),
        skipAuth: true,
      });

      // 2. Perform auto login post registration
      const tokenData = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: data.email, password: data.password }),
        skipAuth: true,
      });

      localStorage.setItem("token", tokenData.access_token);
      const userProfile = await apiFetch("/auth/me");
      setAuth(tokenData.access_token, tokenData.refresh_token, userProfile);
      
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed. Try using a different email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark px-4 py-12 relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md bg-card-dark border border-border rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <span className="text-2xl font-extrabold bg-gradient-to-r from-brand-500 to-indigo-400 bg-clip-text text-transparent">
            BhartX Academy
          </span>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">
            Cognitive Learning OS
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => { setActiveTab("login"); setErrorMsg(null); }}
            className={`flex-1 pb-3 text-xs font-bold transition-all text-center focus:outline-none ${activeTab === "login" ? 'border-b-2 border-brand-500 text-brand-500' : 'text-gray-500 hover:text-foreground'}`}
          >
            Log In
          </button>
          <button
            onClick={() => { setActiveTab("signup"); setErrorMsg(null); }}
            className={`flex-1 pb-3 text-xs font-bold transition-all text-center focus:outline-none ${activeTab === "signup" ? 'border-b-2 border-brand-500 text-brand-500' : 'text-gray-500 hover:text-foreground'}`}
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg border border-danger-500/20 bg-danger-500/10 text-danger-500 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        {activeTab === "login" ? (
          <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                {...regLogin("email")}
                className="w-full bg-bg-dark border border-border focus:border-brand-500 rounded-lg px-4 py-2.5 text-xs text-foreground focus:outline-none"
                placeholder="you@example.com"
              />
              {loginErrors.email && <span className="text-[10px] text-danger-500 mt-1 block">{loginErrors.email.message as string}</span>}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                {...regLogin("password")}
                className="w-full bg-bg-dark border border-border focus:border-brand-500 rounded-lg px-4 py-2.5 text-xs text-foreground focus:outline-none"
                placeholder="Enter password"
              />
              {loginErrors.password && <span className="text-[10px] text-danger-500 mt-1 block">{loginErrors.password.message as string}</span>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-brand-600/50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Unlock Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={handleSignupSubmit(onSignup)} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                {...regSignup("name")}
                className="w-full bg-bg-dark border border-border focus:border-brand-500 rounded-lg px-4 py-2.5 text-xs text-foreground focus:outline-none"
                placeholder="Enter your name"
              />
              {signupErrors.name && <span className="text-[10px] text-danger-500 mt-1 block">{signupErrors.name.message as string}</span>}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                {...regSignup("email")}
                className="w-full bg-bg-dark border border-border focus:border-brand-500 rounded-lg px-4 py-2.5 text-xs text-foreground focus:outline-none"
                placeholder="you@example.com"
              />
              {signupErrors.email && <span className="text-[10px] text-danger-500 mt-1 block">{signupErrors.email.message as string}</span>}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                {...regSignup("password")}
                className="w-full bg-bg-dark border border-border focus:border-brand-500 rounded-lg px-4 py-2.5 text-xs text-foreground focus:outline-none"
                placeholder="Create password"
              />
              {signupErrors.password && <span className="text-[10px] text-danger-500 mt-1 block">{signupErrors.password.message as string}</span>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-brand-600/50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Account & Start</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-bg-dark text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
