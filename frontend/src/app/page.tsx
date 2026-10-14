"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function RootPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
      setChecking(false);
    });
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Orbix Logo Badge */}
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-md shadow-indigo-600/20 animate-pulse">
          O
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            Orbix ERP
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {checking ? "Verifying secure session..." : "Redirecting..."}
          </p>
        </div>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-1/2 animate-[shimmer_1.5s_infinite] bg-indigo-600 rounded-full" />
        </div>
      </div>
    </div>
  );
}
