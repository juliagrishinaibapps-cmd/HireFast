import { supabase } from "./supabase";
import type { Analysis, Profile } from "./types";

export async function getProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function getAnalyses(): Promise<Analysis[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("analyses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getAnalysis(id: string): Promise<Analysis | null> {
  const { data } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .single();

  return data;
}

export async function runAnalysis(
  jobDescription: string,
  cvText: string
): Promise<Analysis> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { data, error } = await supabase.functions.invoke("analyse", {
    body: { jobDescription, cvText },
  });

  if (error) throw new Error(error.message ?? "Analysis failed");
  return data as Analysis;
}

export async function createCheckoutSession(
  priceType: "monthly" | "annual"
): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { priceType },
  });

  if (error) throw new Error(error.message ?? "Checkout failed");
  return data.url as string;
}
