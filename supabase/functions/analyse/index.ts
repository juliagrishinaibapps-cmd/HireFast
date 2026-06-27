import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function callClaude(system: string, userMessage: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, analyses_count")
      .eq("id", user.id)
      .single();

    if (profile?.plan !== "pro" && (profile?.analyses_count ?? 0) >= 2) {
      return new Response(
        JSON.stringify({ error: "Free analysis limit reached. Please upgrade to Pro.", code: "LIMIT_REACHED" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { jobDescription, cvText } = await req.json();
    const userPrompt = `JOB DESCRIPTION:\n${jobDescription}\n\nCV:\n${cvText}`;

    const [matchRaw, rewrittenCv, coverLetter, interviewRaw] = await Promise.all([
      callClaude(
        `You are an expert recruiter and career coach. Analyse the CV against the job listing. Return a JSON object with these exact fields:
- score: number 0-100
- positives: array of 3-5 strings describing strengths
- gaps: array of 3-5 strings describing gaps
- gap_fixes: array of strings, one per gap, explaining how to fix each gap
- improvements: array of 3 specific action strings to improve the match
- jobTitle: the job title from the listing
- companyName: the company name from the listing
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

Use proper date formatting like "Jan 2022 – Mar 2024".
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
        'You are an expert interview coach. Generate exactly 10 interview questions for this specific role and company. For each question provide: the question itself, and a 2-3 sentence suggested answer structure. Return ONLY a JSON array of 10 objects with "question" and "answer_structure" fields. No markdown code fences.',
        userPrompt
      ),
    ]);

    const parseJSON = (text: string) => {
      try {
        const clean = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        return JSON.parse(clean);
      } catch {
        return null;
      }
    };

    const matchData = parseJSON(matchRaw);
    const interviewQuestions = (() => {
      const parsed = parseJSON(interviewRaw);
      if (Array.isArray(parsed)) return parsed;
      if (parsed?.questions && Array.isArray(parsed.questions)) return parsed.questions;
      return [];
    })();

    const jobTitle = matchData?.jobTitle || "Job Position";
    const companyName = matchData?.companyName || "Company";
    const matchScore = {
      score: matchData?.score ?? 50,
      positives: matchData?.positives || [],
      gaps: matchData?.gaps || [],
      gap_fixes: matchData?.gap_fixes || [],
      improvements: matchData?.improvements || [],
    };

    const { data: analysis, error: insertError } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        job_title: jobTitle,
        company_name: companyName,
        job_description: jobDescription,
        cv_text: cvText,
        match_score: matchScore.score,
        match_reasons: matchScore,
        rewritten_cv: rewrittenCv,
        cover_letter: coverLetter,
        interview_questions: interviewQuestions,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    await supabase
      .from("profiles")
      .update({ analyses_count: (profile?.analyses_count ?? 0) + 1 })
      .eq("id", user.id);

    return new Response(
      JSON.stringify({
        id: analysis.id,
        matchScore,
        rewrittenCv,
        coverLetter,
        interviewQuestions,
        company: companyName,
        role: jobTitle,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
