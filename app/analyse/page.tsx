"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function Analyse() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [jobText, setJobText] = useState("");
  const [cvText, setCvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "ok" | "error">("idle");
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "text/plain") {
      const text = await file.text();
      setCvText(text);
      const words = text.split(/\s+/).filter(Boolean).length;
      setUploadStatus("ok");
      setUploadMsg(`✅ CV uploaded — ${words} words detected`);
      return;
    }

    if (file.type === "application/pdf") {
      setUploadLoading(true);
      setUploadStatus("idle");
      setUploadMsg("");
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/parse-pdf", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok || data.error) {
          setUploadStatus("error");
          setUploadMsg("❌ Could not read PDF — paste your CV as text instead");
        } else {
          setCvText(data.text);
          setUploadStatus("ok");
          setUploadMsg(`✅ CV uploaded — ${data.wordCount} words detected`);
        }
      } catch {
        setUploadStatus("error");
        setUploadMsg("❌ Could not read PDF — paste your CV as text instead");
      } finally {
        setUploadLoading(false);
      }
      return;
    }

    setUploadStatus("error");
    setUploadMsg("❌ Unsupported file type — upload a PDF or TXT, or paste your CV below");
  };

  const handleAnalyse = async () => {
    if (!jobText.trim() || !cvText.trim()) return;
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      if (!supabase) { router.push("/login"); return; }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ jobDescription: jobText, cvText }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Analysis failed");
      }
      const result = await res.json();
      sessionStorage.setItem("hirefast_result", JSON.stringify(result));
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-hero flex flex-col items-center justify-center px-4">
        <div className="glass-strong rounded-3xl p-12 text-center max-w-md">
          <div className="w-14 h-14 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-white mb-2">AI is analysing your application...</h2>
          <p className="text-gray-400 text-sm">Reading your CV and the job listing. This takes 15–30 seconds.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-hero flex flex-col items-center py-16 px-4">
      <div className="max-w-2xl w-full relative z-10">
        <Link
          href={step === 2 ? "#" : "/"}
          onClick={step === 2 ? (e) => { e.preventDefault(); setStep(1); } : undefined}
          className="text-gold/70 text-sm mb-6 inline-block hover:text-gold transition-colors"
        >
          ← Back
        </Link>

        <h1 className="text-3xl font-bold text-white mb-1">New analysis</h1>
        <p className="text-sm text-gray-400 mb-8">Step {step} of 2</p>

        {error && (
          <div className="glass border-red-500/30 text-red-300 rounded-xl p-3 mb-6 text-sm">{error}</div>
        )}

        {step === 1 && (
          <div className="animate-fade-in-up">
            <label className="block text-sm font-semibold text-white mb-1">Job description</label>
            <p className="text-sm text-gray-400 mb-3">Paste the full job listing</p>
            <textarea
              className="w-full glass rounded-xl px-4 py-3 text-base min-h-[220px] text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gold/50 resize-y"
              placeholder="Paste job description here..."
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
            />
            <button
              className="mt-6 w-full bg-gold hover:bg-gold-light text-navy text-lg font-semibold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02]"
              onClick={() => {
                if (!jobText.trim()) { setError("Please provide a job description."); return; }
                setError("");
                setStep(2);
              }}
            >
              Next: Add your CV
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in-up">
            <label className="block text-sm font-semibold text-white mb-1">Your CV</label>
            <p className="text-sm text-gray-400 mb-3">Upload a PDF or paste your CV text below</p>

            <label className={`block glass border-2 border-dashed rounded-xl py-8 text-center cursor-pointer transition-colors mb-3 ${
              uploadStatus === "ok" ? "border-emerald-500/50" : uploadStatus === "error" ? "border-red-500/40" : "border-white/10 hover:border-gold/40"
            }`}>
              {uploadLoading ? (
                <>
                  <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-sm text-gray-400">Reading PDF...</span>
                </>
              ) : (
                <>
                  <span className="text-2xl block mb-1">📄</span>
                  <span className="text-sm font-medium text-gray-300">Click to upload PDF or TXT</span>
                </>
              )}
              <input type="file" accept=".pdf,.txt" className="hidden" onChange={handleFileUpload} disabled={uploadLoading} />
            </label>

            {uploadMsg && (
              <p className={`text-sm mb-3 ${uploadStatus === "ok" ? "text-emerald-400" : "text-red-400"}`}>{uploadMsg}</p>
            )}

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-sm text-gray-500">or paste text</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <textarea
              className="w-full glass rounded-xl px-4 py-3 text-base min-h-[220px] text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gold/50 resize-y"
              placeholder="Paste your CV text here..."
              value={cvText}
              onChange={(e) => { setCvText(e.target.value); setUploadStatus("idle"); setUploadMsg(""); }}
            />

            <button
              className="mt-6 w-full bg-gold hover:bg-gold-light text-navy text-lg font-semibold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
              disabled={loading || uploadLoading || !cvText.trim()}
              onClick={handleAnalyse}
            >
              Analyse now
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
