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

    // Verify user
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

    // Check usage limit
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, analyses_count")
      .eq("id", user.id)
      .single();

    if (profile?.plan !== "pro" && (profile?.analyses_count ?? 0) >= 2) {
      return new Response(
        JSON.stringify({ error: "Free analysis limit reached. Please upgrade to Pro." }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { jobDescription, cvText } = await req.json();

    const userPrompt = `JOB DESCRIPTION:\n${jobDescription}\n\nCV:\n${cvText}`;

    // Run all 4 AI calls in parallel
    const [matchRaw, rewrittenCv, coverLetter, interviewRaw] = await Promise.all([
      callClaude(
        "You are an expert recruiter and career coach. Analyse the CV against the job listing. Return a JSON object with: score (0-100), positives (array of 3 strengths), gaps (array of 3 weaknesses), improvements (array of 3 specific actions to improve the match). Be brutally honest and specific. Return ONLY valid JSON, no markdown.",
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
        'You are an expert interview coach. Generate the 10 most likely interview questions for this specific role and company. For each question provide: the question itself, and a 2-3 sentence suggested answer structure (not a full answer, just the framework). Return as a JSON array of objects with "question" and "answer_structure" fields. Return ONLY valid JSON, no markdown.',
        userPrompt
      ),
    ]);

    // Parse JSON responses
    let matchReasons;
    try {
      matchReasons = JSON.parse(matchRaw);
    } catch {
      matchReasons = { score: 50, positives: [], gaps: [], improvements: [] };
    }

    let interviewQuestions;
    try {
      interviewQuestions = JSON.parse(interviewRaw);
    } catch {
      interviewQuestions = [];
    }

    // Extract job title and company from the AI or fallback
    const titleMatch = jobDescription.match(/(?:title|position|role)[:\s]*([^\n]+)/i);
    const companyMatch = jobDescription.match(/(?:company|at|@)[:\s]*([^\n]+)/i);
    const jobTitle = titleMatch?.[1]?.trim() || "Job Position";
    const companyName = companyMatch?.[1]?.trim() || "Company";

    // Save to database
    const { data: analysis, error: insertError } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        job_title: jobTitle,
        company_name: companyName,
        job_description: jobDescription,
        cv_text: cvText,
        match_score: matchReasons.score ?? 50,
        match_reasons: matchReasons,
        rewritten_cv: rewrittenCv,
        cover_letter: coverLetter,
        interview_questions: interviewQuestions,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Increment analyses count
    await supabase
      .from("profiles")
      .update({ analyses_count: (profile?.analyses_count ?? 0) + 1 })
      .eq("id", user.id);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
