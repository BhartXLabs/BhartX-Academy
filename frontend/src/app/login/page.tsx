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

  // Load Google Identity Services script and initialize
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return; // GSI unavailable in dev without client ID

    const loadGSI = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      }
    };

    if (document.getElementById("google-gsi-script")) {
      loadGSI();
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = loadGSI;
    document.head.appendChild(script);
  }, []);

  // Called by Google GSI with the real credential (id_token)
  const handleGoogleCredentialResponse = async (credentialResponse: { credential: string }) => {
    setGoogleLoading(true);
    setErrorMsg(null);
    try {
      await googleLoginMutation.mutateAsync(credentialResponse.credential);
      // Fetch user profile (cookie is now set by server)
      const userProfile = await apiFetch("/auth/me");
      setAuth(userProfile);
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Google Authentication failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleButtonClick = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google) {
      setErrorMsg("Google Sign-In is not configured. Please use email login.");
      return;
    }
    setGoogleLoading(true);
    window.google.accounts.id.prompt();
    // googleLoading will be reset inside handleGoogleCredentialResponse
    // Safety reset in case user closes the popup
    setTimeout(() => setGoogleLoading(false), 5000);
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

        {/* 1. Google OAuth (Primary CTA) */}
        <button
          onClick={handleGoogleButtonClick}
          disabled={googleLoading || loading}
          className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-gray-100 text-gray-900 text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-900" />
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

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
