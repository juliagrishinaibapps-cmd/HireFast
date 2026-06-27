import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-hero relative overflow-hidden flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }} />

      <div className="relative z-10 max-w-2xl w-full text-center">
        <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-white mb-4 animate-fade-in-up">
          Hire<span className="text-gold">Fast</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-14 animate-fade-in-up animate-delay-100">
          Land your dream job faster with AI
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-14">
          <FeatureCard
            icon="📄"
            title="AI CV Rewriting"
            sub="Tailored to every job listing"
            className="animate-float"
          />
          <FeatureCard
            icon="🎯"
            title="Match Score"
            sub="Know your chances instantly"
            className="animate-float-delay"
          />
          <FeatureCard
            icon="💌"
            title="Cover Letters"
            sub="Personalised, not generic"
            className="animate-float-delay"
          />
          <FeatureCard
            icon="🎤"
            title="Interview Prep"
            sub="Role-specific Q&A"
            className="animate-float-delay-2"
          />
        </div>

        <Link
          href="/analyse"
          className="inline-block glass-strong text-gold text-lg font-semibold px-10 py-4 rounded-2xl transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_40px_rgba(212,168,83,0.15)] animate-fade-in-up animate-delay-400"
        >
          Get started free →
        </Link>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  sub,
  className = "",
}: {
  icon: string;
  title: string;
  sub: string;
  className?: string;
}) {
  return (
    <div className={`glass rounded-2xl p-5 text-left ${className}`}>
      <span className="text-2xl block mb-2">{icon}</span>
      <p className="font-semibold text-white text-sm">{title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
