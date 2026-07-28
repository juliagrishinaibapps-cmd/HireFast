"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type Tab = "match" | "cv" | "cover" | "interview";

interface MatchScore {
  score: number;
  positives: string[];
  gaps: string[];
  gap_fixes: string[];
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
  const [editedCv, setEditedCv] = useState("");
  const [editedCover, setEditedCover] = useState("");
  const [cvHistory, setCvHistory] = useState<string[]>([]);
  const [coverHistory, setCoverHistory] = useState<string[]>([]);

  useEffect(() => {
    const data = sessionStorage.getItem("hirefast_result");
    if (data) {
      const parsed = JSON.parse(data);
      setResult(parsed);
      setEditedCv(parsed.rewrittenCv);
      setEditedCover(parsed.coverLetter);
    }
  }, []);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCvPdf = async (cv: string, role: string, company: string) => {
    const { generateCvPdf } = await import("@/lib/generatePdf");
    generateCvPdf(cv, role, company);
  };

  const downloadCoverPdf = async (letter: string, role: string, company: string) => {
    const { generateCoverLetterPdf } = await import("@/lib/generatePdf");
    generateCoverLetterPdf(letter, role, company);
  };

  if (!result) {
    return (
      <main className="min-h-screen bg-hero flex flex-col items-center justify-center px-4">
        <div className="glass-strong rounded-3xl p-10 text-center">
          <p className="text-gray-400 mb-4">No results found.</p>
          <Link href="/analyse" className="text-gold hover:text-gold-light transition-colors">
            Run a new analysis →
          </Link>
        </div>
      </main>
    );
  }

  const score = result.matchScore.score;
  const company = result.company ?? "the company";
  const role = result.role ?? "this role";
  const questions = Array.isArray(result.interviewQuestions) ? result.interviewQuestions : [];

  const tabs: { key: Tab; label: string }[] = [
    { key: "match", label: "Match" },
    { key: "cv", label: "CV" },
    { key: "cover", label: "Cover Letter" },
    { key: "interview", label: "Interview" },
  ];

  return (
    <main className="min-h-screen bg-hero py-12 px-4">
      <div className="max-w-2xl mx-auto relative z-10">
        <Link href="/analyse" className="text-gold/70 text-sm mb-4 inline-block hover:text-gold transition-colors">
          ← New analysis
        </Link>

        <div className="glass-strong rounded-2xl px-6 py-4 mb-6 animate-fade-in-up">
          <p className="text-sm text-gray-400">Your application for</p>
          <p className="text-lg font-semibold text-white">
            {role} <span className="text-gold">at {company}</span>
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                tab === t.key ? "bg-gold text-navy shadow-lg shadow-gold/20" : "glass text-gray-400 hover:text-white"
              }`}
              onClick={() => { setTab(t.key); setPracticeMode(false); }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="animate-fade-in-up">
          {tab === "match" && <MatchTab matchScore={result.matchScore} score={score} />}
          {tab === "cv" && (
            <CVTab
              cv={editedCv} role={role} company={company} copied={copied}
              onCopy={() => copy(editedCv)}
              onDownload={() => downloadCvPdf(editedCv, role, company)}
              onRefine={(newCv) => { setCvHistory((h) => [...h, editedCv]); setEditedCv(newCv); }}
              onUndo={cvHistory.length > 0 ? () => { setEditedCv(cvHistory[cvHistory.length - 1]); setCvHistory((h) => h.slice(0, -1)); } : undefined}
            />
          )}
          {tab === "cover" && (
            <CoverTab
              letter={editedCover} role={role} company={company} copied={copied}
              onCopy={() => copy(editedCover)}
              onDownload={() => downloadCoverPdf(editedCover, role, company)}
              onRefine={(newCover) => { setCoverHistory((h) => [...h, editedCover]); setEditedCover(newCover); }}
              onUndo={coverHistory.length > 0 ? () => { setEditedCover(coverHistory[coverHistory.length - 1]); setCoverHistory((h) => h.slice(0, -1)); } : undefined}
            />
          )}
          {tab === "interview" && (
            <InterviewTab
              questions={questions} practiceMode={practiceMode} practiceIdx={practiceIdx}
              onToggle={() => { setPracticeMode(!practiceMode); setPracticeIdx(0); }}
              onNext={() => setPracticeIdx((i) => (i < questions.length - 1 ? i + 1 : 0))}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function RefineChat({ currentText, type, onRefine }: {
  currentText: string; type: "cv" | "cover"; onRefine: (text: string) => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const chips = type === "cv"
    ? ["Make it more senior", "Make it shorter", "Add more metrics", "Stronger action verbs"]
    : ["Make it more confident", "Make it shorter", "More specific to the role", "Warmer tone"];

  const refine = useCallback(async (msg: string) => {
    if (!msg.trim() || streaming) return;
    setStreaming(true);
    setStreamText("");
    setInstruction("");

    try {
      const supabase = createClient();
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;

      const res = await fetch("/api/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ currentText, instruction: msg, type }),
      });

      if (!res.ok) { setStreaming(false); return; }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreamText(full);
      }

      onRefine(full);
    } finally {
      setStreaming(false);
      setStreamText("");
    }
  }, [currentText, type, streaming, onRefine]);

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2 mb-3">
        {chips.map((chip) => (
          <button key={chip} disabled={streaming}
            className="text-xs px-3 py-1.5 rounded-full glass text-gold hover:bg-white/10 transition-all disabled:opacity-40"
            onClick={() => refine(chip)}>{chip}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input ref={inputRef}
          className="flex-1 glass rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gold/50"
          placeholder={`Tell AI how to refine this ${type === "cv" ? "CV" : "cover letter"}...`}
          value={instruction} onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && refine(instruction)} disabled={streaming}
        />
        <button className="bg-gold hover:bg-gold-light text-navy text-sm font-semibold px-4 py-2.5 rounded-xl transition-all disabled:opacity-40"
          onClick={() => refine(instruction)} disabled={streaming || !instruction.trim()}>
          {streaming ? "Refining..." : "Refine"}
        </button>
      </div>
      {streaming && streamText && (
        <div className="glass-strong rounded-xl p-4 mt-3 max-h-48 overflow-y-auto">
          <p className="text-xs text-gold mb-2 font-semibold">Generating...</p>
          <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans">{streamText}</pre>
        </div>
      )}
    </div>
  );
}

function AnimatedScore({ score }: { score: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / 1200, 1);
      setDisplay(Math.round((1 - Math.pow(1 - progress, 3)) * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);
  const color = score >= 71 ? "text-emerald-400" : score >= 41 ? "text-amber-400" : "text-red-400";
  const glow = score >= 71 ? "shadow-emerald-400/30" : score >= 41 ? "shadow-amber-400/30" : "shadow-red-400/30";
  return (
    <div className={`glass-strong rounded-3xl p-10 text-center mb-6 shadow-lg ${glow}`}>
      <span className={`text-8xl font-bold ${color} animate-count-up inline-block`}>{display}</span>
      <p className="text-sm text-gray-400 mt-3">Your CV match for this role</p>
    </div>
  );
}

function MatchTab({ matchScore, score }: { matchScore: MatchScore; score: number }) {
  return (
    <div>
      <AnimatedScore score={score} />
      <Section title="Strengths" icon="✓" color="text-emerald-400">
        {matchScore.positives?.map((p, i) => <BulletCard key={i} icon="✓" color="text-emerald-400" border="border-emerald-500/20" text={p} delay={i} />)}
      </Section>
      <Section title="Gaps" icon="✗" color="text-red-400">
        {matchScore.gaps?.map((g, i) => <GapCard key={i} gap={g} fix={matchScore.gap_fixes?.[i]} delay={i} />)}
      </Section>
      <Section title="What to improve" icon="→" color="text-gold">
        {matchScore.improvements?.map((imp, i) => <BulletCard key={i} icon="→" color="text-gold" border="border-gold/20" text={imp} delay={i} />)}
      </Section>
    </div>
  );
}

function GapCard({ gap, fix, delay }: { gap: string; fix?: string; delay: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-xl p-4 mb-2 border border-red-500/20 animate-fade-in-up cursor-pointer"
      style={{ animationDelay: `${delay * 100}ms`, opacity: 0 }} onClick={() => fix && setOpen(!open)}>
      <div className="flex gap-3 items-start">
        <span className="text-red-400 text-lg">✗</span>
        <div className="flex-1">
          <p className="text-sm text-gray-300 leading-relaxed">{gap}</p>
          {fix && <span className="text-xs text-gold/60 mt-1 inline-block">{open ? "▾ Hide fix" : "▸ How to fix"}</span>}
          {open && fix && <p className="text-sm text-emerald-300/80 mt-2 leading-relaxed pl-2 border-l-2 border-emerald-500/30">{fix}</p>}
        </div>
      </div>
    </div>
  );
}

function formatCvLine(line: string, i: number) {
  const SECTION_HEADERS = /^(PROFESSIONAL SUMMARY|WORK EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS|PROJECTS|PERSONAL DETAILS|PERSONAL)/i;
  if (line.match(SECTION_HEADERS) || (line.match(/^[A-Z\s]{4,}$/) && line.length < 40)) {
    return <div key={i} className="mt-6 mb-2"><h3 className="text-xs font-bold uppercase tracking-widest text-[#1a2942] border-b border-[#1a2942]/30 pb-1">{line}</h3></div>;
  }
  if (line.match(/\|/) && line.match(/\d{4}/)) {
    const parts = line.split("|").map(p => p.trim());
    return <div key={i} className="mt-3 flex justify-between items-baseline"><span className="font-bold text-sm text-[#1a2942]">{parts[0]}</span><span className="text-xs text-[#666] italic">{parts.slice(1).join(" | ")}</span></div>;
  }
  if (line.startsWith("•") || line.startsWith("-") || line.startsWith("–")) {
    return <div key={i} className="flex gap-2 pl-4 mt-0.5"><span className="text-[#666] text-xs mt-0.5 shrink-0">•</span><p className="text-[#333] text-[13px] leading-relaxed">{line.replace(/^[•\-–]\s*/, "")}</p></div>;
  }
  if (!line.trim()) return <div key={i} className="h-1" />;
  return <p key={i} className="text-[#222] text-[13px] leading-relaxed mt-0.5">{line}</p>;
}

function CVTab({ cv, role, company, copied, onCopy, onDownload, onRefine, onUndo }: {
  cv: string; role: string; company: string; copied: boolean;
  onCopy: () => void; onDownload: () => void; onRefine: (t: string) => void; onUndo?: () => void;
}) {
  const lines = cv.split("\n");
  const firstName = lines.find(l => l.trim());
  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <button className="bg-gold hover:bg-gold-light text-navy text-sm font-semibold px-5 py-2.5 rounded-xl transition-all" onClick={onCopy}>{copied ? "Copied ✓" : "Copy text"}</button>
        <button className="glass text-gold text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white/10 transition-all" onClick={onDownload}>Download PDF</button>
        {onUndo && <button className="glass text-gray-400 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white/10 transition-all" onClick={onUndo}>Undo</button>}
      </div>
      <div className="bg-white rounded-lg shadow-2xl shadow-black/40 p-8 font-sans">
        {firstName && <div className="mb-4"><h1 className="text-[22px] font-bold text-[#1a2942] leading-tight">{firstName}</h1><div className="h-[2px] bg-[#b8943f] mt-2" /></div>}
        <div>{lines.map((line, i) => { if (i === 0 && line.trim() === firstName?.trim()) return null; return formatCvLine(line, i); })}</div>
      </div>
      <RefineChat currentText={cv} type="cv" onRefine={onRefine} />
    </div>
  );
}

function CoverTab({ letter, role, company, copied, onCopy, onDownload, onRefine, onUndo }: {
  letter: string; role: string; company: string; copied: boolean;
  onCopy: () => void; onDownload: () => void; onRefine: (t: string) => void; onUndo?: () => void;
}) {
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <button className="bg-gold hover:bg-gold-light text-navy text-sm font-semibold px-5 py-2.5 rounded-xl transition-all" onClick={onCopy}>{copied ? "Copied ✓" : "Copy text"}</button>
        <button className="glass text-gold text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white/10 transition-all" onClick={onDownload}>Download PDF</button>
        {onUndo && <button className="glass text-gray-400 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white/10 transition-all" onClick={onUndo}>Undo</button>}
      </div>
      <div className="bg-white rounded-lg shadow-2xl shadow-black/40 p-8 font-sans">
        <div className="text-right text-[12px] text-[#666] mb-6">{today}</div>
        <div className="mb-4"><p className="text-[13px] font-bold text-[#1a2942]">Re: Application for {role} at {company}</p><div className="h-px bg-[#1a2942]/20 mt-2" /></div>
        {letter.split(/\n\n+/).filter(Boolean).map((para, i) => (
          <p key={i} className="text-[13px] text-[#222] leading-[1.7] mb-4">{para.replace(/\n/g, " ")}</p>
        ))}
        <div className="mt-8"><p className="text-[13px] text-[#222]">Yours sincerely,</p><div className="mt-8 w-40 border-b border-[#ccc]" /></div>
      </div>
      <RefineChat currentText={letter} type="cover" onRefine={onRefine} />
    </div>
  );
}

function InterviewTab({ questions, practiceMode, practiceIdx, onToggle, onNext }: {
  questions: InterviewQuestion[]; practiceMode: boolean; practiceIdx: number; onToggle: () => void; onNext: () => void;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  if (!questions.length) return <div className="glass-strong rounded-2xl p-8 text-center"><p className="text-gray-400">No interview questions generated.</p></div>;
  const toggle = (i: number) => { setExpanded(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; }); };
  return (
    <div>
      <button className={`text-sm font-semibold px-5 py-2.5 rounded-xl mb-5 transition-all ${practiceMode ? "glass text-gray-300 hover:bg-white/10" : "bg-gold hover:bg-gold-light text-navy"}`} onClick={onToggle}>
        {practiceMode ? "← Show all questions" : "Practice mode"}
      </button>
      {practiceMode ? (
        <div className="animate-fade-in-up">
          <p className="text-xs text-gray-500 mb-3">Question {practiceIdx + 1} of {questions.length}</p>
          <div className="glass-strong rounded-2xl p-6 mb-4">
            <div className="flex items-start gap-3 mb-4">
              <span className="bg-gold/20 text-gold rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">{practiceIdx + 1}</span>
              <p className="font-semibold text-white text-base leading-relaxed">{questions[practiceIdx]?.question}</p>
            </div>
            <div className="bg-navy/40 rounded-xl p-4 ml-11">
              <p className="text-xs uppercase tracking-wider text-gold/70 mb-2 font-semibold">Suggested answer framework</p>
              <p className="text-sm text-gray-300 leading-relaxed">{questions[practiceIdx]?.answer_structure}</p>
            </div>
          </div>
          <button className="w-full bg-gold hover:bg-gold-light text-navy font-semibold py-3.5 rounded-xl transition-all hover:scale-[1.02]" onClick={onNext}>
            {practiceIdx < questions.length - 1 ? "Next question →" : "Start over ↺"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={i} className="glass-strong rounded-2xl p-5 animate-fade-in-up cursor-pointer"
              style={{ animationDelay: `${i * 50}ms`, opacity: 0 }} onClick={() => toggle(i)}>
              <div className="flex items-start gap-3">
                <span className="bg-gold/20 text-gold rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white leading-relaxed">{q.question}</p>
                  <span className="text-xs text-gold/50 mt-1 inline-block">{expanded.has(i) ? "▾ Hide answer" : "▸ Show answer"}</span>
                </div>
              </div>
              {expanded.has(i) && <div className="bg-navy/40 rounded-xl p-3 ml-11 mt-3"><p className="text-xs text-gray-400 leading-relaxed">{q.answer_structure}</p></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, color, children }: { title: string; icon: string; color: string; children: React.ReactNode }) {
  return <div className="mb-5"><h3 className="font-semibold text-white mb-3 flex items-center gap-2"><span className={color}>{icon}</span> {title}</h3>{children}</div>;
}

function BulletCard({ icon, color, border, text, delay }: { icon: string; color: string; border: string; text: string; delay: number }) {
  return (
    <div className={`glass rounded-xl p-4 mb-2 border ${border} animate-fade-in-up`} style={{ animationDelay: `${delay * 100}ms`, opacity: 0 }}>
      <div className="flex gap-3"><span className={`${color} text-lg`}>{icon}</span><p className="text-sm text-gray-300 leading-relaxed">{text}</p></div>
    </div>
  );
}
