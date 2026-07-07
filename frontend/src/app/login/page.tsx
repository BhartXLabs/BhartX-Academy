"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowRight, Mail } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useLoginOrSignup, useGoogleLogin } from "@/hooks/useApi";
import { apiFetch } from "@/utils/api";

const authSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Extend Window interface for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, options: object) => void;
        };
      };
    };
  }
}

function LoginContent() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();
  const loginOrSignupMutation = useLoginOrSignup();
  const googleLoginMutation = useGoogleLogin();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Redirect to landing page if user refreshes the login page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isReload = window.performance && 
        window.performance.getEntriesByType("navigation").some(
          (nav: any) => nav.type === "reload"
        );
      if (isReload) {
        router.push("/");
      }
    }
  }, [router]);

  // Parse id_token from window.location.hash on callback redirect (OAuth 2.0 Implicit Flow)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const idToken = params.get("id_token");
      if (idToken) {
        // Clear hash from address bar cleanly
        window.history.replaceState(null, "", window.location.pathname);
        handleGoogleCredentialResponse(idToken);
      }
    }
  }, [router]);

  const handleGoogleCredentialResponse = async (idToken: string) => {
    setGoogleLoading(true);
    setErrorMsg(null);
    try {
      await googleLoginMutation.mutateAsync(idToken);
      const userProfile = await apiFetch("/auth/me");
      setAuth(userProfile);
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Google Authentication failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCustomGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setErrorMsg("Google OAuth client ID is not configured.");
      return;
    }
    setGoogleLoading(true);
    const redirectUri = window.location.origin + "/login";
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=id_token&scope=openid%20email%20profile&nonce=bhartxnonce_${Date.now()}`;
    window.location.href = oauthUrl;
  };



  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(authSchema)
  });

  const onAuthSubmit = async (data: any) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginOrSignupMutation.mutateAsync(data);
      // Fetch user profile (cookie is now set by server)
      const userProfile = await apiFetch("/auth/me");
      setAuth(userProfile);
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md bg-card-dark border border-border rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">

        {/* Header Title */}
        <div className="flex flex-col items-center text-center">
          <span className="text-2xl font-extrabold bg-gradient-to-r from-brand-500 to-indigo-400 bg-clip-text text-transparent">
            BhartX Academy
          </span>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">
            Cognitive Growth Platform
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg border border-danger-500/20 bg-danger-500/10 text-danger-500 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* 1. Google OAuth (Standard GET Redirect Flow) */}
        <div className="w-full flex justify-center">
          <button
            type="button"
            onClick={handleCustomGoogleLogin}
            disabled={googleLoading}
            className="w-full py-2.5 rounded-xl border border-border bg-card-dark hover:bg-white/5 text-gray-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.34 0-6.05-2.71-6.05-6.05s2.71-6.05 6.05-6.05c1.496 0 2.857.545 3.906 1.446l3.064-3.064C18.985 2.112 15.795 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.898 0 10.87-4.212 10.87-11.24 0-.768-.078-1.503-.223-2.227H12.24z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border/40" />
          <span className="text-[10px] text-gray-500 font-bold uppercase">OR</span>
          <div className="flex-1 h-px bg-border/40" />
        </div>

        {/* 2. Unified Credentials Form (Secondary CTA) */}
        <form onSubmit={handleSubmit(onAuthSubmit)} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                {...register("email")}
                className="w-full bg-bg-dark border border-border focus:border-brand-500 rounded-lg pl-9 pr-4 py-2.5 text-xs text-foreground focus:outline-none"
                placeholder="name@domain.com"
              />
              <Mail className="absolute left-3 top-3.5 w-3.5 h-3.5 text-gray-500" />
            </div>
            {errors.email && <span className="text-[10px] text-danger-500 mt-1 block">{errors.email.message as string}</span>}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              {...register("password")}
              className="w-full bg-bg-dark border border-border focus:border-brand-500 rounded-lg px-4 py-2.5 text-xs text-foreground focus:outline-none"
              placeholder="Min 6 characters"
            />
            {errors.password && <span className="text-[10px] text-danger-500 mt-1 block">{errors.password.message as string}</span>}
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-brand-600/50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Continue with Email</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] text-gray-500 text-center leading-relaxed">
          Entering an email address registers a new secure account automatically if it does not exist.
        </p>
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
