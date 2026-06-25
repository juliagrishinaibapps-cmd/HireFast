import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic();

async function callClaude(system: string, userMessage: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = message.content[0];
  if (block.type === "text") return block.text;
  return "";
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const { jobDescription, cvText } = await req.json();

    if (!jobDescription || !cvText) {
      return NextResponse.json(
        { error: "Job description and CV text are required" },
        { status: 400 }
      );
    }

    const userPrompt = `JOB DESCRIPTION:\n${jobDescription}\n\nCV:\n${cvText}`;

    const [matchRaw, rewrittenCv, coverLetter, interviewRaw] =
      await Promise.all([
        callClaude(
          "You are an expert recruiter and career coach. Analyse the CV against the job listing. Return a JSON object with: score (0-100), positives (array of 3 strengths), gaps (array of 3 weaknesses), improvements (array of 3 specific actions to improve the match). Be brutally honest and specific. Return ONLY valid JSON, no markdown code fences.",
          userPrompt
        ),
        callClaude(
          "You are an expert CV writer. Rewrite the provided CV to be perfectly tailored for this specific job listing. Naturally incorporate keywords from the job listing. Keep it truthful — enhance presentation only, never invent experience. Format it cleanly. Return only the rewritten CV text.",
          userPrompt
        ),
        callClaude(
          "You are an expert cover letter writer. Write a compelling, personalised cover letter for this specific job and company. It should sound human and genuine, not generic. Reference specific details from the job listing. Maximum 4 paragraphs. Return only the cover letter text.",
          userPrompt
        ),
        callClaude(
          'You are an expert interview coach. Generate the 10 most likely interview questions for this specific role and company. For each question provide: the question itself, and a 2-3 sentence suggested answer structure (not a full answer, just the framework). Return as a JSON array of objects with "question" and "answer_structure" fields. Return ONLY valid JSON, no markdown code fences.',
          userPrompt
        ),
      ]);

    let matchScore;
    try {
      matchScore = JSON.parse(matchRaw);
    } catch {
      matchScore = { score: 50, positives: [], gaps: [], improvements: [] };
    }

    let interviewQuestions;
    try {
      interviewQuestions = JSON.parse(interviewRaw);
    } catch {
      interviewQuestions = [];
    }

    return NextResponse.json({
      matchScore,
      rewrittenCv,
      coverLetter,
      interviewQuestions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
