"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { apiRequest } from "@/lib/api";

interface HealthData {
  status: string;
  service: string;
  version: string;
  uptime: number;
  environment: string;
  system: {
    platform: string;
    memoryFreeMB: number;
    memoryTotalMB: number;
  };
  supabase: {
    configured: boolean;
    url: string;
  };
}

interface OrgMemberItem {
  role: string;
  created_at: string;
  organizations: {
    id: string;
    name: string;
    slug: string;
    created_at: string;
  };
}

export default function Home() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Auth Form State (for unauthenticated landing)
  const [isSignUp, setIsSignUp] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"owner" | "admin" | "manager" | "member">("owner");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Health and System Diagnostics
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Organization State
  const [organizations, setOrganizations] = useState<OrgMemberItem[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string>("");
  const [activeRole, setActiveRole] = useState<string>("owner");
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgMessage, setOrgMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const supabase = createClient();

  // 1. Initial Auth Check and Session Listener
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({ id: user.id, email: user.email });
        loadOrganizations();
      }
      setAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        loadOrganizations();
      } else {
        setUser(null);
        setOrganizations([]);
      }
      setAuthChecking(false);
    });

    checkHealth();

    return () => subscription.unsubscribe();
  }, []);

  // 2. Load User's Organizations
  const loadOrganizations = async () => {
    try {
      const res = await apiRequest<OrgMemberItem[]>("/organizations");
      if (res.success && res.data && res.data.length > 0) {
        setOrganizations(res.data);
        setActiveOrgId(res.data[0].organizations.id);
        setActiveRole(res.data[0].role);
      }
    } catch {
      // Schema may be pending in remote DB
    }
  };

  // 3. Ping Backend Health
  const checkHealth = async () => {
    setHealthLoading(true);
    setBackendError(null);
    const start = performance.now();
    try {
      const res = await apiRequest<HealthData>("/health");
      const elapsed = Math.round(performance.now() - start);
      setPingLatency(elapsed);

      if (res.success && res.data) {
        setHealth(res.data);
      } else {
        setBackendError(res.error?.message || "Failed to reach backend");
      }
    } catch (err: unknown) {
      setBackendError(err instanceof Error ? err.message : "Backend is offline");
    } finally {
      setHealthLoading(false);
    }
  };

  // 4. Handle Auth Submit (Sign In or Sign Up with Role)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              role: selectedRole,
            },
          },
        });

        if (error) {
          setAuthMessage({ text: error.message, type: "error" });
        } else if (data.session) {
          setAuthMessage({ text: `Account created as ${selectedRole.toUpperCase()}! Entering dashboard...`, type: "success" });
          setUser({ id: data.user!.id, email: data.user!.email });
          loadOrganizations();
        } else {
          setAuthMessage({
            text: "Account registered! Please check your email inbox to confirm your account.",
            type: "success",
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });

        if (error) {
          setAuthMessage({ text: error.message, type: "error" });
        } else if (data.user) {
          setUser({ id: data.user.id, email: data.user.email });
          loadOrganizations();
        }
      }
    } catch (err: unknown) {
      setAuthMessage({
        text: err instanceof Error ? err.message : "Authentication error occurred",
        type: "error",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOrganizations([]);
  };

  // 5. Create Organization
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName || !newOrgSlug) return;
    setOrgLoading(true);
    setOrgMessage(null);

    const res = await apiRequest("/organizations", {
      method: "POST",
      body: JSON.stringify({ name: newOrgName, slug: newOrgSlug.toLowerCase() }),
    });

    setOrgLoading(false);
    if (res.success) {
      setOrgMessage({ text: `Organization "${newOrgName}" created successfully!`, type: "success" });
      setNewOrgName("");
      setNewOrgSlug("");
      loadOrganizations();
    } else {
      setOrgMessage({ text: res.error?.message || "Failed to create organization", type: "error" });
    }
  };

  const handleOAuth = async (provider: "google" | "facebook" | "apple") => {
    setAuthMessage({ text: `Connecting with ${provider}...`, type: "success" });
    await supabase.auth.signInWithOAuth({
      provider: provider === "facebook" ? "github" : provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  // =========================================================================
  // SCENARIO A: UNAUTHENTICATED -> RENDER CLOUD LOGIN / SIGNUP EXPERIENCE
  // =========================================================================
  if (!user && !authChecking) {
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
          <div className="absolute inset-0 bg-gradient-to-b from-sky-200/25 via-sky-100/10 to-white/45 pointer-events-none" />
        </div>

        {/* Concentric Wireframe Orbit Rings */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="w-[550px] h-[550px] rounded-full border border-white/50 opacity-60" />
          <div className="absolute w-[800px] h-[800px] rounded-full border border-white/40 opacity-50" />
          <div className="absolute w-[1100px] h-[1100px] rounded-full border border-white/30 opacity-40" />
          <div className="absolute w-[1400px] h-[1400px] rounded-full border border-white/20 opacity-30" />
        </div>

        {/* Top Header */}
        <header className="relative z-10 p-6 sm:p-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/10">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4zm-6 6a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4zm12 0a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4zm-6 6a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">Orbix</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-white/70 backdrop-blur-md border border-white text-slate-700 shadow-sm flex items-center gap-1.5 font-medium">
              <span className={`h-2 w-2 rounded-full ${health ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
              API: {health ? "Operational" : "Connecting..."}
            </span>
          </div>
        </header>

        {/* Centered Glass Card */}
        <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-4">
          <div
            className="w-full max-w-[420px] rounded-[32px] p-8 sm:p-9 space-y-6 transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.84) 0%, rgba(243, 249, 255, 0.7) 100%)",
              backdropFilter: "blur(28px) saturate(160%)",
              WebkitBackdropFilter: "blur(28px) saturate(160%)",
              border: "1px solid rgba(255, 255, 255, 0.85)",
              boxShadow: "0 24px 60px -12px rgba(15, 60, 110, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.7) inset",
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

            {/* Title & Subtitle */}
            <div className="text-center space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {isSignUp ? "Create an account" : "Sign in with email"}
              </h1>
              <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                {isSignUp
                  ? "Choose your operational role and register to begin managing business operations."
                  : "Make a new doc to bring your words, data, and teams together. For free"}
              </p>
            </div>

            {/* Inline Message */}
            {authMessage && (
              <div
                className={`p-3 rounded-xl text-xs text-center border font-medium ${
                  authMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                {authMessage.text}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {/* Email */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full pl-10 pr-4 py-3 bg-slate-100/75 hover:bg-slate-100 focus:bg-white border border-slate-200/70 focus:border-slate-400 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/40 transition-all"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-100/75 hover:bg-slate-100 focus:bg-white border border-slate-200/70 focus:border-slate-400 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/40 transition-all"
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

              {/* Role Selection on Sign Up */}
              {isSignUp && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[11px] font-semibold text-slate-700">Select Initial Role Access</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: "owner", label: "👑 Owner / CEO", desc: "Full organization ownership" },
                      { id: "admin", label: "🛡️ Administrator", desc: "System & personnel manager" },
                      { id: "manager", label: "👥 HR Manager", desc: "Leaves & operations manager" },
                      { id: "member", label: "💼 Employee", desc: "Standard workforce member" },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRole(r.id as typeof selectedRole)}
                        className={`p-2 rounded-xl text-left border transition-all ${
                          selectedRole === r.id
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-white/70 text-slate-700 border-slate-200/80 hover:bg-white"
                        }`}
                      >
                        <div className="font-semibold text-[11px]">{r.label}</div>
                        <div className={`text-[9px] ${selectedRole === r.id ? "text-slate-300" : "text-slate-400"}`}>{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Forgot password */}
              {!isSignUp && (
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => setAuthMessage({ text: "Please enter your email and click Get Started or request reset.", type: "error" })}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 rounded-xl bg-[#1e2025] hover:bg-black text-white font-semibold text-xs tracking-wide shadow-lg shadow-black/10 hover:shadow-black/20 active:scale-[0.99] transition-all disabled:opacity-50 mt-1"
              >
                {authLoading ? "Authenticating..." : isSignUp ? "Create Account & Enter" : "Get Started"}
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

            {/* Social Logins */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                className="py-2.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 hover:border-slate-300 flex items-center justify-center shadow-sm hover:shadow transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => handleOAuth("facebook")}
                className="py-2.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 hover:border-slate-300 flex items-center justify-center shadow-sm hover:shadow transition-all text-[#1877F2]"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => handleOAuth("apple")}
                className="py-2.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 hover:border-slate-300 flex items-center justify-center shadow-sm hover:shadow transition-all text-slate-900"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.67-.82 1.13-1.96 1-3.1-.98.04-2.16.65-2.85 1.47-.61.71-1.14 1.87-1 2.99 1.1.08 2.21-.55 2.85-1.36z" />
                </svg>
              </button>
            </div>

            {/* Toggle Sign In / Sign Up */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthMessage(null);
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

        <footer className="relative z-10 p-4 text-center text-[11px] text-slate-500/80">
          Orbix Business Management System • Enterprise Security with Supabase Auth
        </footer>
      </div>
    );
  }

  // =========================================================================
  // SCENARIO B: AUTHENTICATED -> RENDER COMPLETE CLOUD-THEMED DASHBOARD
  // =========================================================================
  return (
    <div className="relative min-h-screen w-full bg-[#f0f7ff] text-slate-900 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      {/* Background Cloudscape Wallpaper */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/sky_clouds_bg.jpg"
          alt="Serene Sky"
          fill
          priority
          className="object-cover object-top opacity-60 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-100/50 via-sky-50/40 to-white/80 pointer-events-none" />
      </div>

      {/* Orbit Rings */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] rounded-full border border-white/60 opacity-60" />
        <div className="w-[1200px] h-[1200px] rounded-full border border-white/40 opacity-40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Bar */}
        <header className="glass-cloud-card rounded-2xl p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/10">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4zm-6 6a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4zm12 0a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4zm-6 6a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-2">
                <span>Orbix</span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-900 text-white">
                  v0.1.0
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Business Management System</div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Active Org Selector */}
            {organizations.length > 0 && (
              <select
                value={activeOrgId}
                onChange={(e) => {
                  setActiveOrgId(e.target.value);
                  const matched = organizations.find((o) => o.organizations.id === e.target.value);
                  if (matched) setActiveRole(matched.role);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200/80 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-sm"
              >
                {organizations.map((item) => (
                  <option key={item.organizations.id} value={item.organizations.id}>
                    {item.organizations.name}
                  </option>
                ))}
              </select>
            )}

            {/* Role Access Badge */}
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-sm flex items-center gap-1.5">
              <span>{activeRole === "owner" ? "👑" : activeRole === "admin" ? "🛡️" : activeRole === "manager" ? "👥" : "💼"}</span>
              <span>Role: {activeRole}</span>
            </span>

            {/* Go to Enterprise Dashboard */}
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Enterprise Dashboard</span>
              <span>→</span>
            </Link>

            {/* User Email & Sign Out */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="text-xs text-slate-600 font-medium hidden md:inline">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 shadow-sm transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Hero Banner */}
        <div className="text-center space-y-2 py-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Enterprise Operations Dashboard
          </h1>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Connected to Next.js App Router, Express REST APIs, and Supabase PostgreSQL with verified Role-Based Access Control.
          </p>
        </div>

        {/* Diagnostic Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Express REST API Status */}
          <div className="glass-cloud-card glass-cloud-card-hover rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  ⚡
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Express REST API</h3>
              </div>
              <button
                onClick={checkHealth}
                disabled={healthLoading}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white text-slate-600 border border-slate-200 shadow-sm font-medium"
              >
                {healthLoading ? "Pinging..." : "Refresh"}
              </button>
            </div>

            {health ? (
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span>Server Status:</span>
                  <span className="text-emerald-600 font-bold uppercase">{health.status}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span>Ping Latency:</span>
                  <span className="font-mono text-indigo-600 font-semibold">{pingLatency !== null ? `${pingLatency}ms` : "-"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Memory Free:</span>
                  <span className="font-mono text-slate-700">{health.system.memoryFreeMB} MB</span>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-amber-600 font-medium">
                {backendError ? `❌ ${backendError}` : "Checking API health..."}
              </div>
            )}
          </div>

          {/* Card 2: Supabase PostgreSQL & RLS */}
          <div className="glass-cloud-card glass-cloud-card-hover rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                🔒
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Supabase PostgreSQL</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span>Database Engine:</span>
                <span className="font-semibold text-slate-800">Postgres 15+</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span>Security Engine:</span>
                <span className="text-emerald-700 font-semibold">Row Level Security (RLS)</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Multi-Tenant Model:</span>
                <span className="text-indigo-600 font-semibold">Organization Isolation</span>
              </div>
            </div>
          </div>

          {/* Card 3: Role Access Profile */}
          <div className="glass-cloud-card glass-cloud-card-hover rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                👑
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Active Role Access</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span>Permissions Tier:</span>
                <span className="font-bold text-slate-900 uppercase">{activeRole}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span>Organizations Joined:</span>
                <span className="font-mono text-purple-700 font-bold">{organizations.length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Organization Creator:</span>
                <span className="text-emerald-600 font-semibold">{["owner", "admin"].includes(activeRole) ? "Authorized" : "Member Only"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Management Section */}
        <div className="glass-cloud-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/70 pb-4 gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>🏢</span> Organizations Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your enterprise organizations or register a new subsidiary.
              </p>
            </div>
            {organizations.length > 0 && (
              <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                {organizations.length} Organization{organizations.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Create Org Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">➕ Register New Organization</h3>
              <form onSubmit={handleCreateOrg} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization Name</label>
                  <input
                    type="text"
                    required
                    value={newOrgName}
                    onChange={(e) => {
                      setNewOrgName(e.target.value);
                      setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                    }}
                    placeholder="e.g. Acme Corporation"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Slug (Identifier)</label>
                  <input
                    type="text"
                    required
                    value={newOrgSlug}
                    onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase())}
                    placeholder="acme-corp"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <button
                  type="submit"
                  disabled={orgLoading}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-md active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {orgLoading ? "Creating Organization..." : "Create Organization (Auto-Assigned Owner)"}
                </button>
              </form>

              {orgMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium border ${
                    orgMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  {orgMessage.text}
                </div>
              )}
            </div>

            {/* Organizations List */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Your Organizations</h3>
              {organizations.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/60 border border-slate-200/80 text-center text-xs text-slate-500">
                  No organizations found. Use the form on the left to create your first organization!
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {organizations.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                        activeOrgId === item.organizations?.id
                          ? "bg-white border-indigo-300 shadow-sm ring-1 ring-indigo-200"
                          : "bg-white/70 border-slate-200/80 hover:bg-white"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900">{item.organizations?.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{item.organizations?.slug}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase border border-indigo-200">
                        {item.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Business Modules Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Modular Business Modules</h2>
              <p className="text-xs text-slate-500">All modules operate under role-based access and tenant isolation.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Module 1: HRMS */}
            <div className="glass-cloud-card glass-cloud-card-hover rounded-2xl p-6 space-y-4 border border-emerald-300/80 bg-gradient-to-br from-white to-emerald-50/30">
              <div className="flex items-center justify-between">
                <span className="text-3xl">👥</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Active Module
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">HRMS</h3>
                <p className="text-xs text-slate-500 mt-1">Human Resources & Workforce Management</p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Personnel directory & roles</li>
                <li>Daily clock-in & clock-out</li>
                <li>Leave request & approval flow</li>
                <li>Department operational units</li>
              </ul>
              <div className="pt-2">
                <Link
                  href="/hrms"
                  className="block w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-center text-xs font-semibold text-white shadow-md active:scale-[0.99] transition-all"
                >
                  Open HRMS Module ➔
                </Link>
              </div>
            </div>

            {/* Module 2: CRM */}
            <div className="glass-cloud-card glass-cloud-card-hover rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl">💼</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Phase 5
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">CRM</h3>
                <p className="text-xs text-slate-500 mt-1">Customer Relationship Management</p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Lead capture & assignment</li>
                <li>Customer accounts & contacts</li>
                <li>Deal pipeline stages</li>
                <li>Interaction timeline</li>
              </ul>
              <div className="pt-2">
                <button disabled className="w-full py-2.5 rounded-xl bg-slate-200 text-slate-500 text-xs font-semibold cursor-not-allowed">
                  Upcoming Module
                </button>
              </div>
            </div>

            {/* Module 3: Project Management */}
            <div className="glass-cloud-card glass-cloud-card-hover rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl">📋</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Phase 6
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Project Management</h3>
                <p className="text-xs text-slate-500 mt-1">Projects, Tasks & Milestones</p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Multi-project tracking</li>
                <li>Kanban task workflows</li>
                <li>Milestones & deliverables</li>
                <li>Member assignments</li>
              </ul>
              <div className="pt-2">
                <button disabled className="w-full py-2.5 rounded-xl bg-slate-200 text-slate-500 text-xs font-semibold cursor-not-allowed">
                  Upcoming Module
                </button>
              </div>
            </div>

            {/* Module 4: Accounting */}
            <div className="glass-cloud-card glass-cloud-card-hover rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl">💰</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Phase 7
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Accounting</h3>
                <p className="text-xs text-slate-500 mt-1">Invoices, Expenses & Ledgers</p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Invoice generation & status</li>
                <li>Expense categorization</li>
                <li>General ledger transactions</li>
                <li>Financial summaries</li>
              </ul>
              <div className="pt-2">
                <button disabled className="w-full py-2.5 rounded-xl bg-slate-200 text-slate-500 text-xs font-semibold cursor-not-allowed">
                  Upcoming Module
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>Orbix Business Management System • Cloud Frosted Glassmorphism</div>
          <div>Role-Based Permissions Enforced</div>
        </footer>
      </div>
    </div>
  );
}
