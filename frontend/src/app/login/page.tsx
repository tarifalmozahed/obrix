"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setMessage({ text: error.message, type: "error" });
        } else if (data.session) {
          setMessage({ text: "Account created successfully! Redirecting...", type: "success" });
          setTimeout(() => router.push("/dashboard"), 1200);
        } else {
          setMessage({
            text: "Account registered! Please check your email inbox to confirm your account.",
            type: "success",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage({ text: error.message, type: "error" });
        } else {
          setMessage({ text: "Signed in successfully! Redirecting...", type: "success" });
          setTimeout(() => router.push("/dashboard"), 1000);
        }
      }
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "An unexpected error occurred",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage({ text: "Please enter your email address first.", type: "error" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setMessage({ text: error.message, type: "error" });
    } else {
      setMessage({ text: "Password reset link sent to your email!", type: "success" });
    }
  };

  const handleOAuth = async (provider: "google" | "facebook" | "apple") => {
    setMessage({ text: `Connecting with ${provider}...`, type: "success" });
    await supabase.auth.signInWithOAuth({
      provider: provider === "facebook" ? "github" : provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden font-sans select-none">
      {/* Background Cloudscape Wallpaper */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/sky_clouds_bg.jpg"
          alt="Serene Sky with Soft Clouds"
          fill
          priority
          className="object-cover object-center pointer-events-none"
        />
        {/* Soft pastel ambient tint overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-200/20 via-sky-100/10 to-white/40 pointer-events-none" />
      </div>

      {/* Subtle Concentric Wireframe Orbit Lines (Matching Design Reference) */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[550px] h-[550px] rounded-full border border-white/50 opacity-60" />
        <div className="absolute w-[800px] h-[800px] rounded-full border border-white/40 opacity-50" />
        <div className="absolute w-[1100px] h-[1100px] rounded-full border border-white/30 opacity-40" />
        <div className="absolute w-[1400px] h-[1400px] rounded-full border border-white/20 opacity-30" />
      </div>

      {/* Top Header with Brand */}
      <header className="relative z-10 p-6 sm:p-10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* Brand Icon: Four rounded dots / clover */}
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/10 group-hover:scale-105 transition-transform">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4zm-6 6a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4zm12 0a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4zm-6 6a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4z" />
            </svg>
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">Orbix</span>
        </Link>

        <Link
          href="/"
          className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-white/60 hover:bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/80 shadow-sm transition-all"
        >
          ← Return to Dashboard
        </Link>
      </header>

      {/* Centered Glassmorphism Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <div
          className="w-full max-w-[420px] rounded-[32px] p-8 sm:p-9 space-y-6 transition-all"
          style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.82) 0%, rgba(240, 248, 255, 0.68) 100%)",
            backdropFilter: "blur(28px) saturate(160%)",
            WebkitBackdropFilter: "blur(28px) saturate(160%)",
            border: "1px solid rgba(255, 255, 255, 0.85)",
            boxShadow:
              "0 24px 60px -12px rgba(15, 60, 110, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.7) inset",
          }}
        >
          {/* Top Floating Badge Icon */}
          <div className="flex justify-center -mt-2">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(30,70,120,0.1)] border border-slate-100 text-slate-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isSignUp ? "Create an account" : "Sign in with email"}
            </h1>
            <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
              {isSignUp
                ? "Join Orbix to streamline your business management in minutes."
                : "Make a new doc to bring your words, data, and teams together. For free"}
            </p>
          </div>

          {/* Inline Feedback Banner */}
          {message && (
            <div
              className={`p-3 rounded-xl text-xs text-center border font-medium ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                  : "bg-rose-50 text-rose-800 border-rose-200/80"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full pl-10 pr-4 py-3 bg-slate-100/70 hover:bg-slate-100/90 focus:bg-white border border-slate-200/70 focus:border-slate-400 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/40 transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-10 py-3 bg-slate-100/70 hover:bg-slate-100/90 focus:bg-white border border-slate-200/70 focus:border-slate-400 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Forgot password link */}
            {!isSignUp && (
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#1e2025] hover:bg-black text-white font-semibold text-xs tracking-wide shadow-lg shadow-black/10 hover:shadow-black/20 active:scale-[0.99] transition-all disabled:opacity-50 mt-1"
            >
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Get Started"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="w-full border-t border-dashed border-slate-300/80" />
            <span className="bg-transparent px-3 text-[11px] text-slate-400 whitespace-nowrap">
              Or sign in with
            </span>
            <div className="w-full border-t border-dashed border-slate-300/80" />
          </div>

          {/* Social Logins Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              className="py-2.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 hover:border-slate-300 flex items-center justify-center shadow-sm hover:shadow transition-all group"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </button>

            {/* Facebook / Meta */}
            <button
              type="button"
              onClick={() => handleOAuth("facebook")}
              className="py-2.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 hover:border-slate-300 flex items-center justify-center shadow-sm hover:shadow transition-all group"
            >
              <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>

            {/* Apple */}
            <button
              type="button"
              onClick={() => handleOAuth("apple")}
              className="py-2.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 hover:border-slate-300 flex items-center justify-center shadow-sm hover:shadow transition-all group text-slate-900"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.67-.82 1.13-1.96 1-3.1-.98.04-2.16.65-2.85 1.47-.61.71-1.14 1.87-1 2.99 1.1.08 2.21-.55 2.85-1.36z" />
              </svg>
            </button>
          </div>

          {/* Toggle between Sign In & Sign Up */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage(null);
              }}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              {isSignUp ? (
                <>Already have an account? <span className="font-semibold text-slate-900 underline">Sign in</span></>
              ) : (
                <>Don&apos;t have an account? <span className="font-semibold text-slate-900 underline">Sign up</span></>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="relative z-10 p-4 text-center text-[11px] text-slate-500/80">
        Orbix Business Management System • Enterprise Security with Supabase Auth
      </footer>
    </div>
  );
}
