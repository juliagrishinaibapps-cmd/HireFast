"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    if (!supabase) { setError("Auth not configured"); setLoading(false); return; }
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleGoogle = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <main className="min-h-screen bg-hero flex flex-col items-center justify-center px-4">
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="text-gold/70 text-sm mb-6 inline-block hover:text-gold transition-colors">
          ← Back to home
        </Link>

        <div className="glass-strong rounded-2xl p-8 animate-fade-in-up">
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-gray-400 mb-6">Sign in to your HireFast account</p>

          {error && (
            <div className="glass border-red-500/30 text-red-300 rounded-xl p-3 mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-1">Email</label>
              <input
                type="email"
                className="w-full glass rounded-xl px-4 py-3 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gold/50"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-1">Password</label>
              <input
                type="password"
                className="w-full glass rounded-xl px-4 py-3 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gold/50"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-light text-navy text-lg font-semibold py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-sm text-gray-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={handleGoogle}
            className="w-full glass text-white font-semibold py-3.5 rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <p className="text-sm text-gray-400 mt-6 text-center">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-gold hover:text-gold-light transition-colors">Sign up</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
