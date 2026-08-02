"use client";

import { useState } from "react";
import Link from "next/link";
import { checkRateLimit } from "../../utils/rateLimiter";

export default function PlannerPage() {
  const [className, setClassName] = useState("");
  const [subjects, setSubjects] = useState([{ subject: "", chapters: "" }]);
  const [weakSubjects, setWeakSubjects] = useState("");
  const [days, setDays] = useState("");
  const [hours, setHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [planData, setPlanData] = useState(null);

  const handleAddSubject = () => {
    setSubjects([...subjects, { subject: "", chapters: "" }]);
  };

  const handleRemoveSubject = (index) => {
    if (subjects.length <= 1) return;
    const nextSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(nextSubjects);
  };

  const handleSubjectChange = (index, field, value) => {
    const nextSubjects = subjects.map((sub, i) => {
      if (i === index) {
        return { ...sub, [field]: value };
      }
      return sub;
    });
    setSubjects(nextSubjects);
  };

  const parsePlannerResponse = (rawText) => {
    let text = rawText || "";
    // Clean any residual markdown characters if generated despite prompt instruction
    text = text.replace(/[\*_\$#]/g, "");

    // Split by DAY X: pattern
    const dayBlocks = text
      .split(/(?=DAY\s+\d+:)/i)
      .map((block) => block.trim())
      .filter((block) => block.length > 0);

    const dailyPlan = dayBlocks.map((block) => {
      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      
      const title = lines[0] || "";
      const tasks = lines.slice(1);
      
      return { title, tasks };
    });

    return {
      dailyPlan,
    };
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (
      !className.trim() ||
      subjects.some((s) => !s.subject.trim() || !s.chapters.trim()) ||
      !days ||
      !hours
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    setPlanData(null);

    const rateLimit = checkRateLimit("studymate_rate_limit_planner");
    if (!rateLimit.allowed) {
      setError(`Too many requests. Please wait ${rateLimit.waitTime} seconds before trying again.`);
      setLoading(false);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_key_here") {
      setError("API key is not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your env.");
      setLoading(false);
      return;
    }

    const subjectsString = subjects
      .map((s) => `${s.subject.trim()} - ${s.chapters.trim()} chapters`)
      .join(", ");

    const weakSubjectsVal = weakSubjects.trim() ? weakSubjects.trim() : "None specified";

    const prompt = `A ${className.trim()} student has these subjects, each with a number of chapters to cover: ${subjectsString}
If any subject name contains an obvious spelling mistake or typo (e.g. 'physyca', 'chemestry', 'boilogy'), correct it to the proper subject name in your response. Use correct spelling and standard capitalization for all subject names throughout the schedule, even if the input had a typo. Do not change the subject if it's ambiguous or could be a valid but unfamiliar name — only fix clear, obvious misspellings of common school subjects.

They have ${days} days available, roughly ${hours} hours per day.
Weak subjects (need extra focus and revision time): ${weakSubjectsVal}

Create a day-wise study schedule. Refer to chapters generically by number only (e.g. "Physics Chapter 1", "Physics Chapter 2") since exact chapter names/content are not provided — do not invent chapter titles or topics.

Give weak subjects more time per session, more frequent revision slots, and prioritize them earlier in the schedule when possible. Distribute remaining subjects' chapters realistically across the available days and hours.

For each chapter or topic listed under a day, include a realistic time allocation in parentheses (e.g. '(90 mins)' or '(1.5 hours)'), based on the total hours available per day divided sensibly across that day's items — the total time per day should not exceed the stated hours per day.

Respond in EXACTLY this format:

DAY 1:
- Physics Chapter 1 (90 mins)
- Physics Chapter 2 (90 mins)
- Maths Chapter 1 (60 mins)

DAY 2:
- [what to study, referencing generic subject and chapter number with time allocation in parentheses]

(continue for all days)

Include at least one revision day near the end if days allow, weighted toward weak subjects. Do not use markdown formatting like **, *, $, or # anywhere. Plain text only.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("Gemini API Error Response:", errData);
        const errMsg = errData?.error?.message || `API request failed: ${response.status}`;
        throw new Error(errMsg);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error("Empty response from AI");
      }

      const parsedData = parsePlannerResponse(rawText);
      setPlanData(parsedData);

      // Save to localStorage history
      try {
        const historyItem = {
          id: "plan_" + Date.now().toString(),
          date: new Date().toISOString(),
          type: "planner",
          class: className.trim(),
          subjects: subjects.map(s => ({
            subject: s.subject.trim(),
            chapters: Number(s.chapters)
          })),
          weakSubjects: weakSubjects.trim(),
          days: Number(days),
          hoursPerDay: Number(hours),
          schedule: parsedData,
        };
        const existingHistory = JSON.parse(localStorage.getItem("studymate_history") || "[]");
        existingHistory.push(historyItem);
        localStorage.setItem("studymate_history", JSON.stringify(existingHistory));
      } catch (storageErr) {
        console.error("Failed to save plan history:", storageErr);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

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
              className="text-xs uppercase tracking-wider text-brand-light/60 hover:text-brand-light transition-colors font-semibold"
            >
              History
            </Link>
            <Link
              href="/tool"
              className="text-xs uppercase tracking-wider text-brand-light/60 hover:text-brand-light transition-colors font-semibold"
            >
              Tool
            </Link>
            <Link
              href="/"
              className="text-xs uppercase tracking-wider text-brand-light/60 hover:text-brand-light transition-colors font-semibold"
            >
              Home
            </Link>
          </div>
        </header>

        {/* Input Form */}
        <section className="bg-brand-light/4 border border-brand-light/8 p-4 sm:p-6 md:p-8 space-y-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Class Field */}
            <div className="space-y-2">
              <label
                htmlFor="className"
                className="text-xs uppercase tracking-wider text-brand-light/60 font-bold block"
              >
                Class
              </label>
              <input
                id="className"
                type="text"
                required
                disabled={loading}
                placeholder="e.g. FSc Part 1, 1st Year"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full bg-brand-light/4 border border-brand-light/8 p-4 text-brand-light placeholder-brand-light/30 focus:outline-none focus:border-brand-light/30 transition-colors rounded-none text-base resize-none"
              />
            </div>

            {/* Dynamic Subject Rows */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-wider text-brand-light/60 font-bold block">
                Subjects & Chapter Counts
              </label>

              <div className="space-y-3">
                {subjects.map((sub, index) => (
                  <div key={index} className="flex items-center space-x-2 sm:space-x-3 w-full">
                    <input
                      type="text"
                      required
                      disabled={loading}
                      placeholder="Subject (e.g. Physics)"
                      value={sub.subject}
                      onChange={(e) => handleSubjectChange(index, "subject", e.target.value)}
                      className="flex-[5] min-w-0 bg-brand-light/4 border border-brand-light/8 p-4 text-brand-light placeholder-brand-light/30 focus:outline-none focus:border-brand-light/30 transition-colors rounded-none text-base resize-none"
                    />
                    <input
                      type="number"
                      required
                      min="1"
                      disabled={loading}
                      placeholder="Chapters"
                      value={sub.chapters}
                      onChange={(e) => handleSubjectChange(index, "chapters", e.target.value)}
                      className="flex-[3] min-w-0 bg-brand-light/4 border border-brand-light/8 p-4 text-brand-light placeholder-brand-light/30 focus:outline-none focus:border-brand-light/30 transition-colors rounded-none text-base resize-none"
                    />
                    {subjects.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(index)}
                        className="shrink-0 bg-brand-light/4 border border-brand-light/8 hover:border-brand-light/20 text-brand-light transition-all flex items-center justify-center select-none rounded-none w-12 h-12 cursor-pointer"
                        aria-label="Remove subject"
                      >
                        ✕
                      </button>
                    ) : (
                      <div className="shrink-0 w-12 h-12" />
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddSubject}
                  className="inline-flex items-center text-xs uppercase tracking-wider text-brand-light/60 hover:text-brand-light transition-colors font-bold cursor-pointer min-h-[44px]"
                >
                  + Add subject
                </button>
              </div>
            </div>

            {/* Weak Subjects Field */}
            <div className="space-y-2">
              <label
                htmlFor="weakSubjects"
                className="text-xs uppercase tracking-wider text-brand-light/60 font-bold block"
              >
                Weak subjects (optional)
              </label>
              <input
                id="weakSubjects"
                type="text"
                disabled={loading}
                placeholder="e.g. Physics, Chemistry"
                value={weakSubjects}
                onChange={(e) => setWeakSubjects(e.target.value)}
                className="w-full bg-brand-light/4 border border-brand-light/8 p-4 text-brand-light placeholder-brand-light/30 focus:outline-none focus:border-brand-light/30 transition-colors rounded-none text-base resize-none"
              />
            </div>

            {/* Days and Hours Available */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="days"
                  className="text-xs uppercase tracking-wider text-brand-light/60 font-bold block"
                >
                  Days available
                </label>
                <input
                  id="days"
                  type="number"
                  required
                  min="1"
                  max="30"
                  disabled={loading}
                  placeholder="e.g. 5"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-full bg-brand-light/4 border border-brand-light/8 p-4 text-brand-light placeholder-brand-light/30 focus:outline-none focus:border-brand-light/30 transition-colors rounded-none text-base resize-none"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="hours"
                  className="text-xs uppercase tracking-wider text-brand-light/60 font-bold block"
                >
                  Hours per day
                </label>
                <input
                  id="hours"
                  type="number"
                  required
                  min="1"
                  max="24"
                  disabled={loading}
                  placeholder="e.g. 2"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full bg-brand-light/4 border border-brand-light/8 p-4 text-brand-light placeholder-brand-light/30 focus:outline-none focus:border-brand-light/30 transition-colors rounded-none text-base resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !className.trim() || subjects.some(s => !s.subject.trim() || !s.chapters.trim()) || !days || !hours}
              className="w-full bg-brand-light text-brand-dark disabled:bg-brand-light/10 disabled:text-brand-light/35 border border-transparent font-extrabold py-4 hover:bg-brand-light/90 active:scale-[0.99] transition-all disabled:cursor-not-allowed text-base select-none rounded-none cursor-pointer"
            >
              {loading ? "Generating..." : "Generate Plan"}
            </button>
          </form>
        </section>

        {/* Error State */}
        {error && (
          <div className="p-4 border border-brand-light/10 bg-brand-light/4 text-center">
            <p className="text-brand-light/80 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
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
        )}

        {/* Output Section */}
        {planData && !loading && (
          <div className="space-y-8 animate-fadeIn">
            <h3 className="text-sm font-bold tracking-widest text-brand-light/60 uppercase select-none">
              Your Customized Study Plan
            </h3>

            <div className="space-y-6">
              {/* Daily Plan Card */}
              <div className="border border-brand-light/8 bg-brand-light/4 p-5 md:p-8 space-y-6">
                <h4 className="text-xs font-bold tracking-widest text-brand-light/60 uppercase select-none">
                  Day-by-Day Schedule
                </h4>
                <div className="space-y-8 divide-y divide-brand-light/8">
                  {planData.dailyPlan.map((day, dIdx) => (
                    <div key={dIdx} className={`space-y-3 ${dIdx > 0 ? "pt-6" : ""}`}>
                      <h5 className="font-sans font-bold text-brand-light text-base md:text-lg uppercase select-none">
                        {day.title}
                      </h5>
                      <div className="space-y-3 text-brand-light/80 text-sm md:text-base leading-relaxed">
                        {day.tasks.map((task, tIdx) => (
                          <p key={tIdx} className="break-words">{task}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
