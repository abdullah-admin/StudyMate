"use client";

import Link from "next/link";
import { useRef } from "react";

export default function LandingPage() {
  const footerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!footerRef.current) return;
    const rect = footerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    footerRef.current.style.setProperty("--mouse-x", `${x}px`);
    footerRef.current.style.setProperty("--mouse-y", `${y}px`);
    footerRef.current.style.setProperty("--spotlight-opacity", "1");
  };

  const handleMouseLeave = () => {
    if (!footerRef.current) return;
    footerRef.current.style.setProperty("--spotlight-opacity", "0");
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-light text-brand-dark">
      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center pt-24 sm:pt-32 md:pt-40 p-6 md:p-12 text-center min-h-[85vh]">
        <div className="max-w-3xl space-y-8 md:space-y-10">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight select-none leading-none">
            Study smarter, not longer.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-brand-dark/70 font-medium max-w-xl mx-auto leading-relaxed">
            An AI study planner and concept-clearing companion designed specifically for Intermediate and FSc students.
          </p>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/tool"
              className="inline-flex items-center justify-center bg-brand-dark text-brand-light font-bold text-lg md:text-xl px-10 py-5 rounded-none hover:bg-brand-dark/95 active:scale-95 transition-all duration-200 min-h-[44px] w-full sm:w-auto"
            >
              Ask StudyMate
            </Link>
            <Link
              href="/planner"
              className="inline-flex items-center justify-center border border-brand-dark bg-transparent text-brand-dark font-bold text-lg md:text-xl px-10 py-5 rounded-none hover:bg-brand-dark hover:text-brand-light active:scale-95 transition-all duration-200 min-h-[44px] w-full sm:w-auto"
            >
              Create Study Plan
            </Link>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="w-full max-w-4xl py-24 px-6 md:px-12 mx-auto border-t border-brand-dark/8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-16">
          {/* Feature 1 */}
          <div className="flex items-start space-x-4">
            <span className="font-mono text-sm tracking-wider text-brand-dark/40 mt-1 select-none">
              01
            </span>
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-brand-dark">
                Explanations that stick
              </h3>
              <p className="text-brand-dark/65 text-base font-normal leading-relaxed">
                Complex topics broken into simple, plain-language points.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-start space-x-4">
            <span className="font-mono text-sm tracking-wider text-brand-dark/40 mt-1 select-none">
              02
            </span>
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-brand-dark">
                Real-life analogies
              </h3>
              <p className="text-brand-dark/65 text-base font-normal leading-relaxed">
                Every concept tied to something familiar, so it actually clicks.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-start space-x-4">
            <span className="font-mono text-sm tracking-wider text-brand-dark/40 mt-1 select-none">
              03
            </span>
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-brand-dark">
                Instant practice MCQs
              </h3>
              <p className="text-brand-dark/65 text-base font-normal leading-relaxed">
                5 fresh questions generated per topic, no searching for past papers.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="flex items-start space-x-4">
            <span className="font-mono text-sm tracking-wider text-brand-dark/40 mt-1 select-none">
              04
            </span>
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-brand-dark">
                Your history, saved
              </h3>
              <p className="text-brand-dark/65 text-base font-normal leading-relaxed">
                Every topic you&apos;ve studied, organized by date, one click away.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with cursor-spotlight watermark */}
      <footer
        ref={footerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full overflow-hidden select-none py-16 px-6 border-t border-brand-dark/8 flex flex-col items-center justify-center min-h-[280px]"
        style={{
          "--mouse-x": "0px",
          "--mouse-y": "0px",
          "--spotlight-opacity": "0",
        }}
      >
        <div className="w-full relative flex items-center justify-center select-none pointer-events-none">
          {/* Faint base watermark */}
          <div className="font-extrabold text-[12vw] uppercase leading-none tracking-tighter text-center w-full text-brand-dark/[0.06] select-none pointer-events-none">
            STUDYMATE
          </div>

          {/* Spotlight reveal watermark */}
          <div
            className="absolute inset-0 flex items-center justify-center font-extrabold text-[12vw] uppercase leading-none tracking-tighter text-center w-full text-brand-dark select-none pointer-events-none transition-opacity duration-500 ease-out spotlight-layer"
            style={{
              opacity: "var(--spotlight-opacity)",
              maskImage: "radial-gradient(150px circle at var(--mouse-x) var(--mouse-y), black 0%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(150px circle at var(--mouse-x) var(--mouse-y), black 0%, transparent 100%)",
            }}
          >
            STUDYMATE
          </div>
        </div>

        <div className="mt-8 text-center z-10 select-none pointer-events-none">
          <p className="font-mono text-xs text-brand-dark/50 tracking-wider">
            Built for PGC Stars of Tomorrow 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
