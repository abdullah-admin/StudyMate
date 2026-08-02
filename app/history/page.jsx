"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
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
      <main className="flex min-h-screen flex-col bg-brand-dark text-brand-light p-6 md:p-12"></main>
    );
  }

  // Group history items by calendar date
  const groupedHistory = history.reduce((groups, item) => {
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

  // Sort groups by actual timestamp descending
  // Since keys are formatted date strings, we can sort based on the newest item in each group
  const sortedDates = Object.keys(groupedHistory).sort((a, b) => {
    const itemA = groupedHistory[a][0];
    const itemB = groupedHistory[b][0];
    return new Date(itemB.date).getTime() - new Date(itemA.date).getTime();
  });

  return (
    <main className="flex min-h-screen flex-col bg-brand-dark text-brand-light p-6 md:p-12">
      <div className="max-w-3xl w-full mx-auto space-y-12">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-brand-light/8 pb-6">
          <h2 className="text-xl font-bold select-none tracking-tight">
            <Link href="/" className="hover:text-brand-light/80 transition-colors">
              StudyMate AI
            </Link>
          </h2>
          <Link
            href="/tool"
            className="text-xs uppercase tracking-wider text-brand-light/60 hover:text-brand-light transition-colors font-semibold"
          >
            ← Back to Tool
          </Link>
        </header>

        <section className="space-y-8">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Study History</h3>
            <p className="text-brand-light/60 text-sm mt-1">
              Your generated study guides stored locally in this browser.
            </p>
          </div>

          {sortedDates.length === 0 ? (
            <div className="border border-brand-light/8 bg-brand-light/4 p-12 text-center select-none">
              <p className="text-brand-light/60 text-base">No topics generated yet.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {sortedDates.map((dateString) => {
                // Sort items within group by time descending
                const items = [...groupedHistory[dateString]].sort(
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
                            className="block bg-brand-light/4 border border-brand-light/8 hover:border-brand-light/20 p-4 transition-all duration-200 select-none hover:bg-brand-light/[6%]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-sans font-bold text-base md:text-lg text-brand-light">
                                {entry.topic}
                              </span>
                              <span className="font-mono text-xs text-brand-light/50">
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
        </section>
      </div>
    </main>
  );
}
