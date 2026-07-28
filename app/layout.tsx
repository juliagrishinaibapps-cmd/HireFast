import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "HireFast — Land your dream job faster",
  description:
    "AI-powered CV rewriting, match scoring, cover letters, and interview prep.",
};

const supabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased pt-14">{/* pt-14 for fixed navbar */}
        <Navbar />
        {!supabaseConfigured && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-amber-900/90 border border-amber-500/40 text-amber-200 text-sm px-5 py-3 rounded-xl shadow-lg backdrop-blur">
            ⚙️ Configuration needed — Supabase environment variables are not set for this deployment.
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
