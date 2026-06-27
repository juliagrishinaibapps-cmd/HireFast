import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

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
      <body className="antialiased pt-14">{/* pt-14 for fixed navbar */}
        <Navbar />
        {children}
      </body>
    </html>
  );
}
