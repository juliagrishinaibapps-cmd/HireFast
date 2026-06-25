export interface Profile {
  id: string;
  full_name: string;
  email: string;
  plan: "free" | "pro";
  analyses_count: number;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface MatchReasons {
  score: number;
  positives: string[];
  gaps: string[];
  improvements: string[];
}

export interface InterviewQuestion {
  question: string;
  answer_structure: string;
}

export interface Analysis {
  id: string;
  user_id: string;
  job_title: string;
  company_name: string;
  job_description: string;
  cv_text: string;
  match_score: number;
  match_reasons: MatchReasons;
  rewritten_cv: string;
  cover_letter: string;
  interview_questions: InterviewQuestion[];
  created_at: string;
}

export const FREE_ANALYSIS_LIMIT = 2;
