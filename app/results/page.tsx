"use client";

import { useEffect, useState, useRef } from "react";
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
  company?: string;
  role?: string;
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

  const downloadPdf = (content: string, title: string) => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 48px; line-height: 1.6; color: #1a1a1a; max-width: 700px; margin: 0 auto; }
      h1 { font-size: 22px; border-bottom: 2px solid #d4a853; padding-bottom: 8px; margin-bottom: 16px; }
      h2 { font-size: 16px; text-transform: uppercase; letter-spacing: 1px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 24px; }
      p { margin: 4px 0; } li { margin: 2px 0; }
    </style></head><body>
      ${content.split("\n").map((line) => {
        if (line.match(/^[A-Z\s]{4,}$/)) return `<h2>${line}</h2>`;
        if (line.startsWith("•") || line.startsWith("-")) return `<li>${line.slice(1).trim()}</li>`;
        if (line.trim() === "") return "<br/>";
        return `<p>${line}</p>`;
      }).join("\n")}
    </body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!result) {
    return (
      <main className="min-h-screen bg-hero flex flex-col items-center justify-center px-4">
        <div className="glass-strong rounded-3xl p-10 text-center">
          <p className="text-gray-400 mb-4">No results found.</p>
          <Link
            href="/analyse"
            className="text-gold hover:text-gold-light transition-colors"
          >
            Run a new analysis →
          </Link>
        </div>
      </main>
    );
  }

  const score = result.matchScore.score;
  const company = result.company ?? "the company";
  const role = result.role ?? "this role";

  const questions = Array.isArray(result.interviewQuestions)
    ? result.interviewQuestions
    : [];

  const tabs: { key: Tab; label: string }[] = [
    { key: "match", label: "Match" },
    { key: "cv", label: "CV" },
    { key: "cover", label: "Cover Letter" },
    { key: "interview", label: "Interview" },
  ];

  return (
    <main className="min-h-screen bg-hero py-12 px-4">
      <div className="max-w-2xl mx-auto relative z-10">
        <Link
          href="/analyse"
          className="text-gold/70 text-sm mb-4 inline-block hover:text-gold transition-colors"
        >
          ← New analysis
        </Link>

        <div className="glass-strong rounded-2xl px-6 py-4 mb-6 animate-fade-in-up">
          <p className="text-sm text-gray-400">Your application for</p>
          <p className="text-lg font-semibold text-white">
            {role}{" "}
            <span className="text-gold">at {company}</span>
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                tab === t.key
                  ? "bg-gold text-navy shadow-lg shadow-gold/20"
                  : "glass text-gray-400 hover:text-white"
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

        <div className="animate-fade-in-up">
          {tab === "match" && <MatchTab matchScore={result.matchScore} score={score} />}
          {tab === "cv" && (
            <CVTab
              cv={result.rewrittenCv}
              copied={copied}
              onCopy={() => copy(result.rewrittenCv)}
              onDownload={() => downloadPdf(result.rewrittenCv, `CV - ${role}`)}
            />
          )}
          {tab === "cover" && (
            <CoverTab
              letter={result.coverLetter}
              copied={copied}
              onCopy={() => copy(result.coverLetter)}
            />
          )}
          {tab === "interview" && (
            <InterviewTab
              questions={questions}
              practiceMode={practiceMode}
              practiceIdx={practiceIdx}
              onToggle={() => {
                setPracticeMode(!practiceMode);
                setPracticeIdx(0);
              }}
              onNext={() =>
                setPracticeIdx((i) =>
                  i < questions.length - 1 ? i + 1 : 0
                )
              }
            />
          )}
        </div>
      </div>
    </main>
  );
}

function AnimatedScore({ score }: { score: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * score);
      setDisplay(start);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [score]);

  const color =
    score >= 71
      ? "text-emerald-400"
      : score >= 41
        ? "text-amber-400"
        : "text-red-400";

  const glow =
    score >= 71
      ? "shadow-emerald-400/30"
      : score >= 41
        ? "shadow-amber-400/30"
        : "shadow-red-400/30";

  return (
    <div className={`glass-strong rounded-3xl p-10 text-center mb-6 shadow-lg ${glow}`}>
      <span ref={ref} className={`text-8xl font-bold ${color} animate-count-up inline-block`}>
        {display}
      </span>
      <p className="text-sm text-gray-400 mt-3">Your CV match for this role</p>
    </div>
  );
}

function MatchTab({ matchScore, score }: { matchScore: MatchScore; score: number }) {
  return (
    <div>
      <AnimatedScore score={score} />

      <Section title="Strengths" icon="✓" color="text-emerald-400">
        {matchScore.positives?.map((p, i) => (
          <BulletCard key={i} icon="✓" color="text-emerald-400" border="border-emerald-500/20" text={p} delay={i} />
        ))}
      </Section>

      <Section title="Gaps" icon="✗" color="text-red-400">
        {matchScore.gaps?.map((g, i) => (
          <BulletCard key={i} icon="✗" color="text-red-400" border="border-red-500/20" text={g} delay={i} />
        ))}
      </Section>

      <Section title="What to improve" icon="→" color="text-gold">
        {matchScore.improvements?.map((imp, i) => (
          <BulletCard key={i} icon="→" color="text-gold" border="border-gold/20" text={imp} delay={i} />
        ))}
      </Section>
    </div>
  );
}

function CVTab({
  cv,
  copied,
  onCopy,
  onDownload,
}: {
  cv: string;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const formatCv = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.match(/^[A-Z\s]{4,}$/) || line.match(/^(PROFESSIONAL SUMMARY|WORK EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS|PROJECTS)/i)) {
        return (
          <h3 key={i} className="text-gold font-bold text-sm uppercase tracking-wider mt-5 mb-2 border-b border-gold/20 pb-1">
            {line}
          </h3>
        );
      }
      if (line.match(/\|/) && line.match(/\d{4}/)) {
        return (
          <p key={i} className="font-semibold text-white text-sm mt-3 mb-1">
            {line}
          </p>
        );
      }
      if (line.startsWith("•") || line.startsWith("-") || line.startsWith("–")) {
        return (
          <p key={i} className="text-sm text-gray-300 pl-4 mb-1">
            {line}
          </p>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return (
        <p key={i} className="text-sm text-gray-300 mb-1">
          {line}
        </p>
      );
    });
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          className="bg-gold hover:bg-gold-light text-navy text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-300"
          onClick={onCopy}
        >
          {copied ? "Copied ✓" : "Copy to clipboard"}
        </button>
        <button
          className="glass text-gold text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white/10 transition-all duration-300"
          onClick={onDownload}
        >
          Download PDF
        </button>
      </div>
      <div className="glass-strong rounded-2xl p-6 cv-section">{formatCv(cv)}</div>
    </div>
  );
}

function CoverTab({
  letter,
  copied,
  onCopy,
}: {
  letter: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <button
        className="bg-gold hover:bg-gold-light text-navy text-sm font-semibold px-5 py-2.5 rounded-xl mb-4 transition-all duration-300"
        onClick={onCopy}
      >
        {copied ? "Copied ✓" : "Copy to clipboard"}
      </button>
      <div className="glass-strong rounded-2xl p-6">
        <pre className="whitespace-pre-wrap text-sm text-gray-200 leading-relaxed font-sans">
          {letter}
        </pre>
      </div>
    </div>
  );
}

function InterviewTab({
  questions,
  practiceMode,
  practiceIdx,
  onToggle,
  onNext,
}: {
  questions: InterviewQuestion[];
  practiceMode: boolean;
  practiceIdx: number;
  onToggle: () => void;
  onNext: () => void;
}) {
  if (!questions.length) {
    return (
      <div className="glass-strong rounded-2xl p-8 text-center">
        <p className="text-gray-400">No interview questions generated.</p>
      </div>
    );
  }

  return (
    <div>
      <button
        className={`text-sm font-semibold px-5 py-2.5 rounded-xl mb-5 transition-all duration-300 ${
          practiceMode
            ? "glass text-gray-300 hover:bg-white/10"
            : "bg-gold hover:bg-gold-light text-navy"
        }`}
        onClick={onToggle}
      >
        {practiceMode ? "← Show all questions" : "Practice mode"}
      </button>

      {practiceMode ? (
        <div className="animate-fade-in-up">
          <p className="text-xs text-gray-500 mb-3">
            Question {practiceIdx + 1} of {questions.length}
          </p>
          <div className="glass-strong rounded-2xl p-6 mb-4">
            <div className="flex items-start gap-3 mb-4">
              <span className="bg-gold/20 text-gold rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">
                {practiceIdx + 1}
              </span>
              <p className="font-semibold text-white text-base leading-relaxed">
                {questions[practiceIdx]?.question}
              </p>
            </div>
            <div className="bg-navy/40 rounded-xl p-4 ml-11">
              <p className="text-xs uppercase tracking-wider text-gold/70 mb-2 font-semibold">
                Suggested answer framework
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                {questions[practiceIdx]?.answer_structure}
              </p>
            </div>
          </div>
          <button
            className="w-full bg-gold hover:bg-gold-light text-navy font-semibold py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02]"
            onClick={onNext}
          >
            {practiceIdx < questions.length - 1 ? "Next question →" : "Start over ↺"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div
              key={i}
              className="glass-strong rounded-2xl p-5 animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms`, opacity: 0 }}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="bg-gold/20 text-gold rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm font-semibold text-white leading-relaxed">
                  {q.question}
                </p>
              </div>
              <div className="bg-navy/40 rounded-xl p-3 ml-11">
                <p className="text-xs text-gray-400 leading-relaxed">
                  💡 {q.answer_structure}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <h3 className={`font-semibold text-white mb-3 flex items-center gap-2`}>
        <span className={color}>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function BulletCard({
  icon,
  color,
  border,
  text,
  delay,
}: {
  icon: string;
  color: string;
  border: string;
  text: string;
  delay: number;
}) {
  return (
    <div
      className={`glass rounded-xl p-4 mb-2 border ${border} animate-fade-in-up`}
      style={{ animationDelay: `${delay * 100}ms`, opacity: 0 }}
    >
      <div className="flex gap-3">
        <span className={`${color} text-lg`}>{icon}</span>
        <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
