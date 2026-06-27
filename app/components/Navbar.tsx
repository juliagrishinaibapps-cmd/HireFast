"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white">
          Hire<span className="text-gold">Fast</span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white transition-colors">
                Dashboard
              </Link>
              <button onClick={handleSignOut} className="text-sm text-gray-400 hover:text-white transition-colors">
                Sign out
              </button>
              <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors">
                Login
              </Link>
              <Link
                href="/signup"
                className="text-sm bg-gold hover:bg-gold-light text-navy font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Get started free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
