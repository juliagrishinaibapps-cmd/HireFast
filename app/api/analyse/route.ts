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

function extractCompanyAndRole(jobDescription: string): {
  company: string;
  role: string;
} {
  const companyPatterns = [
    /(?:company|organisation|organization|employer)[:\s]+([^\n,]+)/i,
    /(?:at|@)\s+([A-Z][A-Za-z\s&.]+?)(?:\s*[-–,\n])/,
    /(?:about|join)\s+([A-Z][A-Za-z\s&.]+?)(?:\s*[-–,.\n])/i,
    /([A-Z][A-Za-z&.\s]{2,30}?)\s+(?:is\s+(?:looking|hiring|seeking))/,
  ];

  const rolePatterns = [
    /(?:title|position|role|job)[:\s]+([^\n]+)/i,
    /^(?:senior\s+|junior\s+|lead\s+|staff\s+|principal\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4}(?:\s+(?:Engineer|Developer|Manager|Designer|Analyst|Consultant|Specialist|Coordinator|Director|Lead))/m,
  ];

  let company = "the company";
  for (const p of companyPatterns) {
    const m = jobDescription.match(p);
    if (m?.[1]) {
      company = m[1].trim().replace(/[.\s]+$/, "");
      break;
    }
  }

  let role = "this role";
  for (const p of rolePatterns) {
    const m = jobDescription.match(p);
    if (m) {
      role = (m[1] ?? m[0]).trim();
      break;
    }
  }

  return { company, role };
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

    const { company, role } = extractCompanyAndRole(jobDescription);
    const userPrompt = `JOB DESCRIPTION:\n${jobDescription}\n\nCV:\n${cvText}`;

    const [matchRaw, rewrittenCv, coverLetter, interviewRaw] =
      await Promise.all([
        callClaude(
          "You are an expert recruiter and career coach. Analyse the CV against the job listing. Return a JSON object with these exact fields: score (number 0-100), positives (array of 3 string strengths), gaps (array of 3 string weaknesses), improvements (array of 3 specific action strings). Be brutally honest and specific. Return ONLY the JSON object, no markdown code fences, no extra text.",
          userPrompt
        ),
        callClaude(
          `You are an expert CV writer. Rewrite the provided CV to be perfectly tailored for this specific job listing. Format the CV with clear sections using these exact headers on their own lines:

PROFESSIONAL SUMMARY
WORK EXPERIENCE
EDUCATION
SKILLS

Under WORK EXPERIENCE, format each role as:
Company Name | Role Title | Start Date – End Date
• Achievement bullet point

Naturally incorporate keywords from the job listing. Keep it truthful — enhance presentation only, never invent experience. Return only the rewritten CV text, no commentary.`,
          userPrompt
        ),
        callClaude(
          "You are an expert cover letter writer. Write a compelling, personalised cover letter for this specific job and company. It should sound human and genuine, not generic. Reference specific details from the job listing. Maximum 4 paragraphs. Return only the cover letter text.",
          userPrompt
        ),
        callClaude(
          'You are an expert interview coach. Generate the 10 most likely interview questions for this specific role and company. For each question provide: the question itself, and a 2-3 sentence suggested answer structure (not a full answer, just the framework). Return ONLY a JSON array of objects. Each object must have exactly two fields: "question" (string) and "answer_structure" (string). No markdown code fences, no extra text, just the JSON array.',
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
      const cleaned = interviewRaw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      interviewQuestions = JSON.parse(cleaned);
      if (!Array.isArray(interviewQuestions)) {
        interviewQuestions = [];
      }
    } catch {
      interviewQuestions = [];
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
