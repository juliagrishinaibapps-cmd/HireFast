"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AnalysisResult {
  matchScore: {
    score: number;
    positives: string[];
    gaps: string[];
    improvements: string[];
  };
  rewrittenCv: string;
  coverLetter: string;
  interviewQuestions: { question: string; answer_structure: string }[];
}

export default function Analyse() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [jobText, setJobText] = useState("");
  const [cvText, setCvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "text/plain") {
      const text = await file.text();
      setCvText(text);
    } else {
      setCvText(`[Uploaded: ${file.name}] — For best results, paste your CV text directly.`);
    }
  };

  const handleAnalyse = async () => {
    if (!jobText.trim() || !cvText.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jobText, cvText }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Analysis failed");
      }

      const result: AnalysisResult = await res.json();

      sessionStorage.setItem("hirefast_result", JSON.stringify(result));
      sessionStorage.setItem("hirefast_job", jobText.slice(0, 100));
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            AI is reading your CV and the job listing...
          </h2>
          <p className="text-gray-500">This usually takes 15–30 seconds</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center py-16 px-4">
      <div className="max-w-2xl w-full">
        <Link
          href={step === 2 ? "#" : "/"}
          onClick={
            step === 2
              ? (e) => {
                  e.preventDefault();
                  setStep(1);
                }
              : undefined
          }
          className="text-blue-600 text-sm mb-6 inline-block hover:underline"
        >
          ← Back
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-1">New analysis</h1>
        <p className="text-sm text-gray-500 mb-8">Step {step} of 2</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Job description
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Paste the full job listing or a URL
            </p>
            <textarea
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base min-h-[220px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              placeholder="Paste job description here..."
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
            />
            <button
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-4 rounded-xl transition-colors disabled:opacity-50"
              onClick={() => {
                if (!jobText.trim()) {
                  setError("Please provide a job description.");
                  return;
                }
                setError("");
                setStep(2);
              }}
            >
              Next: Add your CV
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Your CV
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Upload a file or paste your CV text
            </p>

            <label className="block border-2 border-dashed border-gray-300 rounded-xl py-8 text-center cursor-pointer hover:border-blue-400 transition-colors mb-4">
              <span className="text-2xl block mb-1">📄</span>
              <span className="text-sm font-medium text-gray-600">
                Click to upload PDF or TXT
              </span>
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-400">or paste text</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <textarea
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base min-h-[220px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              placeholder="Paste your CV text here..."
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
            />

            <button
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-4 rounded-xl transition-colors disabled:opacity-50"
              disabled={loading}
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
