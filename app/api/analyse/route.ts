import { NextRequest, NextResponse } from "next/server";

async function callClaude(
  system: string,
  userMessage: string
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error: ${err}`);
  }

  const data = await res.json();
  return data.content[0].text;
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

    const [matchRaw, rewrittenCv, coverLetter, interviewRaw, metaRaw] =
      await Promise.all([
        callClaude(
          `You are an expert recruiter and career coach. Analyse the CV against the job listing. Return a JSON object with these exact fields:
- score: number 0-100
- positives: array of 3-5 strings describing strengths (what matches well)
- gaps: array of 3-5 strings describing gaps (what's missing or weak)
- gap_fixes: array of strings, one per gap, explaining how to fix each gap specifically
- improvements: array of 3 specific action strings to improve the match
Be brutally honest and specific. Return ONLY valid JSON, no markdown code fences.`,
          userPrompt
        ),
        callClaude(
          `You are an expert CV writer. Rewrite the provided CV to be perfectly tailored for this specific job listing.

Format with these exact section headers on their own lines:
PROFESSIONAL SUMMARY
WORK EXPERIENCE
EDUCATION
SKILLS

Under WORK EXPERIENCE, format each role as:
Company Name | Role Title | Mon YYYY – Mon YYYY
• Achievement bullet point

Use proper date formatting like "Jan 2022 – Mar 2024" (abbreviated month + year).
Properly capitalise all company names and job titles.
Naturally incorporate keywords from the job listing.
Keep it truthful — enhance presentation only, never invent experience.
Return only the rewritten CV text, no commentary.`,
          userPrompt
        ),
        callClaude(
          "You are an expert cover letter writer. Write a compelling, personalised cover letter for this specific job and company. It should sound human and genuine, not generic. Reference specific details from the job listing. Maximum 4 paragraphs. Return only the cover letter text.",
          userPrompt
        ),
        callClaude(
          'You are an expert interview coach. Generate exactly 10 interview questions for this specific role and company. For each question provide: the question itself, and a 2-3 sentence suggested answer structure (not a full answer, just the framework). Return ONLY a JSON array of 10 objects. Each object must have exactly two fields: "question" (string) and "answer_structure" (string). No markdown code fences, no extra text, just the JSON array.',
          userPrompt
        ),
        callClaude(
          'Extract the company name and job title from this job description. Return ONLY a JSON object with two fields: "company" (string) and "role" (string). If you cannot determine one, use a reasonable guess based on the content. No markdown code fences.',
          jobDescription
        ),
      ]);

    let matchScore;
    try {
      const cleaned = matchRaw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      matchScore = JSON.parse(cleaned);
    } catch {
      matchScore = { score: 50, positives: [], gaps: [], gap_fixes: [], improvements: [] };
    }

    let interviewQuestions;
    try {
      const cleaned = interviewRaw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      interviewQuestions = JSON.parse(cleaned);
      if (!Array.isArray(interviewQuestions)) interviewQuestions = [];
    } catch {
      interviewQuestions = [];
    }

    let company = "the company";
    let role = "this role";
    try {
      const cleaned = metaRaw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const meta = JSON.parse(cleaned);
      if (meta.company) company = meta.company;
      if (meta.role) role = meta.role;
    } catch {
      // keep defaults
    }

    return NextResponse.json({
      matchScore,
      rewrittenCv,
      coverLetter,
      interviewQuestions,
      company,
      role,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
