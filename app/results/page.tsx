"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Tab = "match" | "cv" | "cover" | "interview";

interface MatchScore {
  score: number;
  positives: string[];
  gaps: string[];
  improvements: string[];
}

interface InterviewQuestion {
  question: string;
  answer_structure: string;
}

interface AnalysisResult {
  matchScore: MatchScore;
  rewrittenCv: string;
  coverLetter: string;
  interviewQuestions: InterviewQuestion[];
}

export default function Results() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [tab, setTab] = useState<Tab>("match");
  const [copied, setCopied] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceIdx, setPracticeIdx] = useState(0);

  useEffect(() => {
    const data = sessionStorage.getItem("hirefast_result");
    if (data) setResult(JSON.parse(data));
  }, []);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!result) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-gray-500 mb-4">No results found.</p>
        <Link href="/analyse" className="text-blue-600 hover:underline">
          Run a new analysis
        </Link>
      </main>
    );
  }

  const score = result.matchScore.score;
  const scoreColor =
    score >= 71
      ? "text-green-600 bg-green-50"
      : score >= 41
        ? "text-amber-500 bg-amber-50"
        : "text-red-500 bg-red-50";

  const tabs: { key: Tab; label: string }[] = [
    { key: "match", label: "Match" },
    { key: "cv", label: "CV" },
    { key: "cover", label: "Cover Letter" },
    { key: "interview", label: "Interview" },
  ];

  return (
    <main className="min-h-screen py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/analyse"
          className="text-blue-600 text-sm mb-6 inline-block hover:underline"
        >
          ← New analysis
        </Link>

        <div className="flex gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                tab === t.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => {
                setTab(t.key);
                setPracticeMode(false);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "match" && (
          <div>
            <div
              className={`rounded-2xl p-10 text-center mb-6 ${scoreColor.split(" ")[1]}`}
            >
              <p className={`text-7xl font-bold ${scoreColor.split(" ")[0]}`}>
                {score}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Your CV match for this role
              </p>
            </div>

            <Section title="Strengths">
              {result.matchScore.positives?.map((p, i) => (
                <BulletItem key={i} icon="✓" color="text-green-600" text={p} />
              ))}
            </Section>

            <Section title="Gaps">
              {result.matchScore.gaps?.map((g, i) => (
                <BulletItem key={i} icon="✗" color="text-red-500" text={g} />
              ))}
            </Section>

            <Section title="What to improve">
              {result.matchScore.improvements?.map((imp, i) => (
                <BulletItem
                  key={i}
                  icon="→"
                  color="text-blue-600"
                  text={imp}
                />
              ))}
            </Section>
          </div>
        )}

        {tab === "cv" && (
          <div>
            <div className="flex gap-2 mb-4">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                onClick={() => copy(result.rewrittenCv)}
              >
                {copied ? "Copied ✓" : "Copy to clipboard"}
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-5">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
                {result.rewrittenCv}
              </pre>
            </div>
          </div>
        )}

        {tab === "cover" && (
          <div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg mb-4 transition-colors"
              onClick={() => copy(result.coverLetter)}
            >
              {copied ? "Copied ✓" : "Copy to clipboard"}
            </button>
            <div className="bg-gray-50 rounded-xl p-5">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
                {result.coverLetter}
              </pre>
            </div>
          </div>
        )}

        {tab === "interview" && (
          <div>
            <button
              className="text-sm font-medium px-4 py-2.5 rounded-lg mb-4 transition-colors bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                setPracticeMode(!practiceMode);
                setPracticeIdx(0);
              }}
            >
              {practiceMode ? "Show all questions" : "Practice mode"}
            </button>

            {practiceMode ? (
              <div>
                <p className="text-xs text-gray-400 mb-2">
                  Question {practiceIdx + 1} of{" "}
                  {result.interviewQuestions.length}
                </p>
                <div className="bg-gray-50 rounded-xl p-5 mb-4">
                  <p className="font-semibold text-gray-900 mb-3">
                    {result.interviewQuestions[practiceIdx]?.question}
                  </p>
                  <p className="text-sm text-gray-600">
                    💡 {result.interviewQuestions[practiceIdx]?.answer_structure}
                  </p>
                </div>
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                  onClick={() =>
                    setPracticeIdx((i) =>
                      i < result.interviewQuestions.length - 1 ? i + 1 : 0
                    )
                  }
                >
                  Next question →
                </button>
              </div>
            ) : (
              result.interviewQuestions.map((q, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 mb-3">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    {i + 1}. {q.question}
                  </p>
                  <p className="text-sm text-gray-600">
                    💡 {q.answer_structure}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function BulletItem({
  icon,
  color,
  text,
}: {
  icon: string;
  color: string;
  text: string;
}) {
  return (
    <div className="flex gap-2 mb-2">
      <span className={color}>{icon}</span>
      <p className="text-sm text-gray-700">{text}</p>
    </div>
  );
}
