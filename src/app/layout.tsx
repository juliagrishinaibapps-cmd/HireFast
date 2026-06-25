import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HireFast — Land your dream job faster",
  description:
    "AI-powered CV rewriting, match scoring, cover letters, and interview prep.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
