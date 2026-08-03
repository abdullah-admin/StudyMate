"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    try {
      const stored = localStorage.getItem("studymate_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load history from localStorage:", err);
    }
  }, []);

  if (!mounted) {
    // Avoid server-side rendering hydration issues
    return (
      <main className="flex min-h-screen flex-col bg-brand-dark text-brand-light p-4 sm:p-6 md:p-12"></main>
    );
  }

  // Filter study plans and explanations
  const explainerEntries = history.filter((item) => item && item.type !== "planner");
  const plannerEntries = history.filter((item) => item && item.type === "planner");

  // 1. Group Explainer/Tool entries by calendar date
  const groupedExplainer = explainerEntries.reduce((groups, item) => {
    try {
      const dateKey = new Date(item.date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    } catch (e) {
      console.error("Failed parsing date:", e);
    }
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedExplainer).sort((a, b) => {
    const itemA = groupedExplainer[a][0];
    const itemB = groupedExplainer[b][0];
    return new Date(itemB.date).getTime() - new Date(itemA.date).getTime();
  });

  // 2. Group Planner entries by Class field
  const groupedPlanner = plannerEntries.reduce((groups, item) => {
    const classKey = item.class || "Unknown Class";
    if (!groups[classKey]) {
      groups[classKey] = [];
    }
    groups[classKey].push(item);
    return groups;
  }, {});

  // Sort within each class group by date descending (newest first)
  Object.keys(groupedPlanner).forEach((classKey) => {
    groupedPlanner[classKey].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });

  // Sort class groups by the date of their newest item descending
  const sortedClasses = Object.keys(groupedPlanner).sort((a, b) => {
    const newestA = groupedPlanner[a][0];
    const newestB = groupedPlanner[b][0];
    return new Date(newestB.date).getTime() - new Date(newestA.date).getTime();
  });

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
              href="/planner"
              className="text-xs uppercase tracking-wider text-brand-light/60 hover:text-brand-light transition-colors font-semibold py-3 inline-flex items-center min-h-[44px]"
            >
              Planner
            </Link>
            <Link
              href="/tool"
              className="text-xs uppercase tracking-wider text-brand-light/60 hover:text-brand-light transition-colors font-semibold py-3 inline-flex items-center min-h-[44px]"
            >
              Ask
            </Link>
            <Link
              href="/"
              className="text-xs uppercase tracking-wider text-brand-light/60 hover:text-brand-light transition-colors font-semibold py-3 inline-flex items-center min-h-[44px]"
            >
              Home
            </Link>
          </div>
        </header>

        <section className="space-y-12">
          {/* Study Plans Section */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Study Plans</h3>
              <p className="text-brand-light/60 text-sm mt-1">
                Your generated custom study schedules.
              </p>
            </div>

            {sortedClasses.length === 0 ? (
              <div className="border border-brand-light/8 bg-brand-light/4 p-8 text-center select-none">
                <p className="text-brand-light/60 text-sm">No study plans generated yet.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {sortedClasses.map((classKey) => {
                  const items = groupedPlanner[classKey];
                  return (
                    <div key={classKey} className="space-y-4">
                      <h4 className="text-xs font-bold tracking-widest text-brand-light/60 uppercase select-none border-b border-brand-light/4 pb-2">
                        {classKey}
                      </h4>
                      <div className="space-y-3">
                        {items.map((entry) => {
                          const timeString = new Date(entry.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          }) + " at " + new Date(entry.date).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          });

                          const subjectsSummary = entry.subjects
                            ?.map((s) => s.subject)
                            .join(", ");
                          const daysText = `${entry.days} day${entry.days > 1 ? "s" : ""}`;
                          const previewText = `${subjectsSummary} — ${daysText}`;

                          return (
                            <Link
                              key={entry.id}
                              href={`/history/${entry.id}`}
                              className="block bg-brand-light/4 border border-brand-light/8 hover:border-brand-light/20 p-4 transition-all duration-200 select-none hover:bg-brand-light/[6%] min-h-[44px]"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-sans font-bold text-base md:text-lg text-brand-light break-words mr-4">
                                  {previewText}
                                </span>
                                <span className="font-mono text-xs text-brand-light/50 shrink-0">
                                  {timeString}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Topic Explanations Section */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Topic Explanations</h3>
              <p className="text-brand-light/60 text-sm mt-1">
                Your generated concept-clearing study guides.
              </p>
            </div>

            {sortedDates.length === 0 ? (
              <div className="border border-brand-light/8 bg-brand-light/4 p-8 text-center select-none">
                <p className="text-brand-light/60 text-sm">No topics generated yet.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {sortedDates.map((dateString) => {
                  const items = [...groupedExplainer[dateString]].sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                  );

                  return (
                    <div key={dateString} className="space-y-4">
                      <h4 className="text-xs font-bold tracking-widest text-brand-light/60 uppercase select-none border-b border-brand-light/4 pb-2">
                        {dateString}
                      </h4>
                      <div className="space-y-3">
                        {items.map((entry) => {
                          const timeString = new Date(entry.date).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            }
                          );

                          return (
                            <Link
                              key={entry.id}
                              href={`/history/${entry.id}`}
                              className="block bg-brand-light/4 border border-brand-light/8 hover:border-brand-light/20 p-4 transition-all duration-200 select-none hover:bg-brand-light/[6%] min-h-[44px]"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-sans font-bold text-base md:text-lg text-brand-light break-words mr-4">
                                  {entry.topic}
                                </span>
                                <span className="font-mono text-xs text-brand-light/50 shrink-0">
                                  {timeString}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
