import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-3">
          HireFast
        </h1>
        <p className="text-xl text-gray-500 mb-10">
          Land your dream job faster with AI
        </p>

        <div className="text-left max-w-sm mx-auto mb-10 space-y-4">
          <Benefit
            icon="📄"
            title="AI CV Rewriting"
            sub="Tailored to every job listing"
          />
          <Benefit
            icon="🎯"
            title="Match Score"
            sub="Know your chances before applying"
          />
          <Benefit
            icon="💌"
            title="Cover Letters"
            sub="Personalised, not generic"
          />
          <Benefit
            icon="🎤"
            title="Interview Prep"
            sub="Role-specific questions & answers"
          />
        </div>

        <Link
          href="/analyse"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-8 py-4 rounded-xl transition-colors"
        >
          Get started free
        </Link>
      </div>
    </main>
  );
}

function Benefit({
  icon,
  title,
  sub,
}: {
  icon: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{sub}</p>
      </div>
    </div>
  );
}
