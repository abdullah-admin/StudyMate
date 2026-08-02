"use client";

import { useState } from "react";
import Link from "next/link";
import ResultCards from "../../components/ResultCards";
import { checkRateLimit } from "../../utils/rateLimiter";

export default function ToolPage() {
  const [topic, setTopic] = useState("");
  const [confusion, setConfusion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studyData, setStudyData] = useState(null);

  const parseGeminiResponse = (rawText) => {
    let text = rawText || "";
    // 1. LaTeX fix: strip single dollar signs from equations
    text = text.replace(/\$(.*?)\$/g, "$1");
    // 2. Asterisk cleanup: strip single asterisks that aren't part of a double asterisk pair
    text = text.replace(/(?<!\*)\*(?!\*)/g, "");
    // 3. Underscore cleanup: strip single underscores that aren't part of a double underscore pair
    text = text.replace(/(?<!_)_(?!_)/g, "");

    const explanationIndex = text.indexOf("EXPLANATION:");
    const analogyIndex = text.indexOf("ANALOGY:");
    const mcqsIndex = text.indexOf("MCQS:");
    const summaryIndex = text.indexOf("SUMMARY:");

    if (
      explanationIndex === -1 ||
      analogyIndex === -1 ||
      mcqsIndex === -1 ||
      summaryIndex === -1
    ) {
      throw new Error("Something went wrong. Try again.");
    }

    const explanationRaw = text
      .substring(explanationIndex + "EXPLANATION:".length, analogyIndex)
      .trim();
    const analogyRaw = text
      .substring(analogyIndex + "ANALOGY:".length, mcqsIndex)
      .trim();
    const mcqsRaw = text
      .substring(mcqsIndex + "MCQS:".length, summaryIndex)
      .trim();
    const summaryRaw = text
      .substring(summaryIndex + "SUMMARY:".length)
      .trim();

    // 1. Parse Explanation
    const explanationBullets = explanationRaw
      .split("\n")
      .map((line) => line.replace(/^-\s*/, "").replace(/^\*\s*/, "").trim())
      .filter((line) => line.length > 0);

    // 2. Parse Analogy
    const analogy = analogyRaw;

    // 3. Parse MCQs
    const mcqs = [];
    const mcqBlocks = mcqsRaw
      .split(/(?=\b\d+\.\s+)/)
      .filter((block) => block.trim().length > 0);

    mcqBlocks.forEach((block) => {
      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (lines.length < 2) return;

      const questionText = lines[0].replace(/^\d+\.\s*/, "").trim();

      let correctLetter = "";
      const correctMatch = block.match(/Correct:\s*([A-D])/i);
      if (correctMatch) {
        correctLetter = correctMatch[1].toUpperCase();
      }

      const options = { A: "", B: "", C: "", D: "" };

      const optionARegex = /(?:A\)|A\.)\s*([\s\S]*?)(?=(?:B\)|B\.)|$)/i;
      const optionBRegex = /(?:B\)|B\.)\s*([\s\S]*?)(?=(?:C\)|C\.)|$)/i;
      const optionCRegex = /(?:C\)|C\.)\s*([\s\S]*?)(?=(?:D\)|D\.)|$)/i;
      const optionDRegex = /(?:D\)|D\.)\s*([\s\S]*?)(?=(?:Correct:|$))/i;

      const matchA = block.match(optionARegex);
      const matchB = block.match(optionBRegex);
      const matchC = block.match(optionCRegex);
      const matchD = block.match(optionDRegex);

      if (matchA) options.A = matchA[1].replace(/Correct:.*$/i, "").trim();
      if (matchB) options.B = matchB[1].replace(/Correct:.*$/i, "").trim();
      if (matchC) options.C = matchC[1].replace(/Correct:.*$/i, "").trim();
      if (matchD) options.D = matchD[1].replace(/Correct:.*$/i, "").trim();

      options.A = options.A.replace(/\s+/g, " ");
      options.B = options.B.replace(/\s+/g, " ");
      options.C = options.C.replace(/\s+/g, " ");
      options.D = options.D.replace(/\s+/g, " ");

      if (
        questionText &&
        options.A &&
        options.B &&
        options.C &&
        options.D &&
        correctLetter
      ) {
        mcqs.push({
          question: questionText,
          options,
          correct: correctLetter,
        });
      }
    });

    // 4. Parse Summary
    const summary = summaryRaw;

    return {
      explanation: explanationBullets,
      analogy,
      mcqs,
      summary,
    };
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    const rateLimit = checkRateLimit("studymate_rate_limit_tool");
    if (!rateLimit.allowed) {
      setError(`Too many requests. Please wait ${rateLimit.waitTime} seconds before trying again.`);
      return;
    }

    setLoading(true);
    setError(null);
    setStudyData(null);

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_key_here") {
      setError("API key is not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your env.");
      setLoading(false);
      return;
    }

    const prompt = `Student is studying ${topic} for FSc/Intermediate level. Their confusion: ${
      confusion.trim() ? confusion.trim() : "general explanation needed"
    }

Do not use LaTeX or math notation like $...$ for equations. Write equations in plain text, e.g. F = ma.

Respond in EXACTLY this format with these exact section headers:

EXPLANATION:
(3-4 simple bullet points, plain language)

ANALOGY:
(one real-life example that makes this concept click)

MCQS:
1. [question]
A) [option] B) [option] C) [option] D) [option]
Correct: [letter]
(repeat for 5 questions total)

SUMMARY:
(2-line revision note, easy to remember)`;

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

      const parsedData = parseGeminiResponse(rawText);
      setStudyData(parsedData);

      // Save to localStorage history
      try {
        const historyItem = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          topic: topic.trim(),
          explanation: parsedData.explanation,
          analogy: parsedData.analogy,
          mcqs: parsedData.mcqs,
          summary: parsedData.summary,
        };
        const existingHistory = JSON.parse(localStorage.getItem("studymate_history") || "[]");
        existingHistory.push(historyItem);
        localStorage.setItem("studymate_history", JSON.stringify(existingHistory));
      } catch (storageErr) {
        console.error("Failed to save history:", storageErr);
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
              href="/planner"
              className="text-xs uppercase tracking-wider text-brand-light/60 hover:text-brand-light transition-colors font-semibold"
            >
              Planner
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
            <div className="space-y-2">
              <label
                htmlFor="topic"
                className="text-xs uppercase tracking-wider text-brand-light/60 font-bold block"
              >
                Topic or chapter name
              </label>
              <input
                id="topic"
                type="text"
                required
                disabled={loading}
                placeholder="e.g. Newton's Laws of Motion"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-brand-light/4 border border-brand-light/8 p-4 text-brand-light placeholder-brand-light/30 focus:outline-none focus:border-brand-light/30 transition-colors rounded-none text-base"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confusion"
                className="text-xs uppercase tracking-wider text-brand-light/60 font-bold block"
              >
                What's confusing you about it? (optional)
              </label>
              <textarea
                id="confusion"
                disabled={loading}
                placeholder="e.g. Why does a heavier object not fall faster in a vacuum?"
                value={confusion}
                onChange={(e) => setConfusion(e.target.value)}
                className="w-full bg-brand-light/4 border border-brand-light/8 p-4 text-brand-light placeholder-brand-light/30 focus:outline-none focus:border-brand-light/30 transition-colors h-28 resize-none rounded-none text-base"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full bg-brand-light text-brand-dark font-extrabold py-4 hover:bg-brand-light/90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base select-none rounded-none"
            >
              Generate
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
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-brand-light/8 p-6 space-y-4">
                  <div className="h-4 w-24 bg-brand-light/10"></div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-brand-light/5"></div>
                    <div className="h-3 w-5/6 bg-brand-light/5"></div>
                    <div className="h-3 w-4/6 bg-brand-light/5"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Output Section */}
        {studyData && !loading && (
          <ResultCards studyData={studyData} topic={topic} isHistoryView={false} />
        )}
      </div>
    </main>
  );
}
