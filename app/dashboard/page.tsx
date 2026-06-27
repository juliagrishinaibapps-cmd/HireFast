"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface Profile {
  full_name: string;
  plan: string;
  analyses_count: number;
}

interface Analysis {
  id: string;
  job_title: string;
  company_name: string;
  match_score: number;
  created_at: string;
  match_reasons: Record<string, unknown>;
  rewritten_cv: string;
  cover_letter: string;
  interview_questions: unknown[];
}

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      if (!supabase) { router.push("/login"); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: prof }, { data: items }] = await Promise.all([
        supabase.from("profiles").select("full_name, plan, analyses_count").eq("id", user.id).single(),
        supabase.from("analyses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      setProfile(prof);
      setAnalyses(items || []);
      setLoading(false);
    };
    load();
  }, [router]);

  const openAnalysis = (a: Analysis) => {
    const result = {
      matchScore: a.match_reasons,
      rewrittenCv: a.rewritten_cv,
      coverLetter: a.cover_letter,
      interviewQuestions: a.interview_questions,
      company: a.company_name,
      role: a.job_title,
    };
    sessionStorage.setItem("hirefast_result", JSON.stringify(result));
    router.push("/results");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-hero flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const maxFree = 2;
  const used = profile?.analyses_count ?? 0;
  const isPro = profile?.plan === "pro";
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <main className="min-h-screen bg-hero py-12 px-4">
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="glass-strong rounded-2xl px-6 py-5 mb-6 animate-fade-in-up">
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back, {firstName}</h1>
          <p className="text-sm text-gray-400">
            {isPro ? "Pro plan — unlimited analyses" : `${used} of ${maxFree} free analyses used`}
          </p>
          {!isPro && (
            <div className="mt-3">
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gold rounded-full h-2 transition-all duration-500"
                  style={{ width: `${Math.min((used / maxFree) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <Link
          href="/analyse"
          className="block w-full bg-gold hover:bg-gold-light text-navy text-center text-lg font-semibold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] mb-8 animate-fade-in-up"
        >
          New Analysis
        </Link>

        {analyses.length === 0 ? (
          <div className="glass-strong rounded-2xl p-10 text-center animate-fade-in-up">
            <p className="text-gray-400 mb-2">No analyses yet</p>
            <p className="text-sm text-gray-500">Run your first analysis to see results here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((a, i) => {
              const scoreColor = a.match_score >= 71 ? "bg-emerald-500" : a.match_score >= 41 ? "bg-amber-500" : "bg-red-500";
              return (
                <button
                  key={a.id}
                  onClick={() => openAnalysis(a)}
                  className="w-full glass-strong rounded-2xl p-5 text-left hover:bg-white/20 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${i * 50}ms`, opacity: 0 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold font-bold text-lg shrink-0">
                      {a.company_name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{a.job_title}</p>
                      <p className="text-xs text-gray-400 truncate">{a.company_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span className={`${scoreColor} text-white text-sm font-bold px-3 py-1 rounded-full`}>
                      {a.match_score}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
