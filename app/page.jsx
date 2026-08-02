import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-brand-light text-brand-dark">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight select-none">
          Study smarter, not longer.
        </h1>
        <p className="text-lg md:text-xl text-brand-dark/70 font-medium max-w-xl mx-auto">
          A concept-clearing companion designed specifically for Intermediate and FSc students.
        </p>
        <div className="pt-4">
          <Link
            href="/tool"
            className="inline-block bg-brand-dark text-brand-light font-bold text-lg md:text-xl px-10 py-5 rounded-none hover:bg-brand-dark/90 active:scale-95 transition-all duration-200"
          >
            Try StudyMate
          </Link>
        </div>
      </div>
    </main>
  );
}
