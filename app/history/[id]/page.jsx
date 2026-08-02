"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import ResultCards from "../../../components/ResultCards";

export default function HistoryDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem("studymate_history");
      if (stored) {
        const historyList = JSON.parse(stored);
        const match = historyList.find((item) => item.id === id);
        setEntry(match || null);
      }
    } catch (err) {
      console.error("Failed to read history detail:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  if (!mounted) {
    return (
      <main className="flex min-h-screen flex-col bg-brand-dark text-brand-light p-4 sm:p-6 md:p-12"></main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-brand-dark text-brand-light p-4 sm:p-6 md:p-12">
      <div className="max-w-3xl w-full mx-auto space-y-12">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-brand-light/8 pb-6">
          <h2 className="text-xl font-bold select-none tracking-tight">
            <Link href="/" className="hover:text-brand-light/80 transition-colors">
              StudyMate AI
            </Link>
          </h2>
          <div className="flex items-center space-x-6">
            <Link
              href="/history"
              className="text-xs uppercase tracking-wider text-brand-light/60 hover:text-brand-light transition-colors font-semibold py-3 inline-flex items-center min-h-[44px]"
            >
              History
            </Link>
            <Link
              href="/planner"
              className="text-xs uppercase tracking-wider text-brand-light/60 hover:text-brand-light transition-colors font-semibold py-3 inline-flex items-center min-h-[44px]"
            >
              Planner
            </Link>
            <Link
              href="/tool"
              className="text-xs uppercase tracking-wider text-brand-light/60 hover:text-brand-light transition-colors font-semibold py-3 inline-flex items-center min-h-[44px]"
            >
              Tool
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="space-y-8 animate-pulse">
            <div className="h-6 w-32 bg-brand-light/10"></div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-brand-light/8 p-6 space-y-4">
                  <div className="h-4 w-24 bg-brand-light/10"></div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-brand-light/5"></div>
                    <div className="h-3 w-5/6 bg-brand-light/5"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : entry ? (
          <section className="space-y-8 animate-fadeIn">
            {entry.type === "planner" ? (
              <div className="space-y-8">
                <h3 className="text-sm font-bold tracking-widest text-brand-light/60 uppercase select-none">
                  Study Plan: {entry.class}
                </h3>

                <div className="space-y-6">
                  {/* Summary Info Card */}
                  <div className="border border-brand-light/8 bg-brand-light/4 p-5 md:p-8 space-y-4">
                    <h4 className="text-xs font-bold tracking-widest text-brand-light/60 uppercase select-none">
                      Plan Overview
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-brand-light/80 text-sm md:text-base leading-relaxed">
                      <div>
                        <span className="text-brand-light/60 font-semibold block text-xs uppercase tracking-wider">
                          Subjects
                        </span>
                        {entry.subjects
                          ?.map((s) => `${s.subject} (${s.chapters} chapters)`)
                          .join(", ")}
                      </div>
                      {entry.weakSubjects && (
                        <div>
                          <span className="text-brand-light/60 font-semibold block text-xs uppercase tracking-wider">
                            Weak Subjects
                          </span>
                          {entry.weakSubjects}
                        </div>
                      )}
                      <div>
                        <span className="text-brand-light/60 font-semibold block text-xs uppercase tracking-wider">
                          Timeline
                        </span>
                        {entry.days} days, {entry.hoursPerDay} hours per day
                      </div>
                    </div>
                  </div>

                  {/* Day-by-Day Card */}
                  <div className="border border-brand-light/8 bg-brand-light/4 p-5 md:p-8 space-y-6">
                    <h4 className="text-xs font-bold tracking-widest text-brand-light/60 uppercase select-none">
                      Day-by-Day Schedule
                    </h4>
                    <div className="space-y-8 divide-y divide-brand-light/8">
                      {entry.schedule?.dailyPlan?.map((day, dIdx) => (
                        <div key={dIdx} className={`space-y-3 ${dIdx > 0 ? "pt-6" : ""}`}>
                          <h5 className="font-sans font-bold text-brand-light text-base md:text-lg uppercase select-none">
                            {day.title}
                          </h5>
                          <div className="space-y-3 text-brand-light/80 text-sm md:text-base leading-relaxed">
                            {day.tasks?.map((task, tIdx) => (
                              <p key={tIdx} className="break-words">
                                {task}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <ResultCards studyData={entry} topic={entry.topic} isHistoryView={true} />
            )}
          </section>
        ) : (
          <div className="border border-brand-light/8 bg-brand-light/4 p-12 text-center select-none space-y-6">
            <p className="text-brand-light/60 text-base">This entry couldn't be found.</p>
            <div className="pt-2">
              <Link
                href="/history"
                className="inline-flex items-center justify-center bg-brand-light text-brand-dark font-extrabold px-6 py-3 hover:bg-brand-light/95 transition-all text-sm rounded-none min-h-[44px]"
              >
                Back to History
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
