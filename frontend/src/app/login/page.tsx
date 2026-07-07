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
          use_fedcm_for_prompt: true,
        });

        // Render official Google Sign-In button inside placeholder
        const btnElement = document.getElementById("google-signin-btn");
        if (btnElement) {
          window.google.accounts.id.renderButton(btnElement, {
            theme: "outline",
            size: "large",
            width: 320,
            text: "continue_with",
            shape: "rectangular"
          });
        }
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

        {/* 1. Google OAuth (Official secure iframe Button) */}
        <div className="w-full flex justify-center">
          <div id="google-signin-btn" className="w-full flex justify-center" style={{ minHeight: "44px" }} />
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
