import { useState } from "react";

const renderBoldText = (text) => {
  if (!text) return "";
  let cleaned = text.replace(/(?<!\*)\*(?!\*)/g, "");
  cleaned = cleaned.replace(/(?<!_)_(?!_)/g, "");
  const parts = cleaned.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={index} className="font-extrabold text-brand-light">
          {part}
        </strong>
      );
    }
    return part;
  });
};

export default function ResultCards({ studyData, topic, isHistoryView = false }) {
  // Local state for MCQ interactivity (only used if isHistoryView is false)
  const [mcqState, setMcqState] = useState({});

  const handleOptionClick = (qIndex, optionLetter) => {
    if (isHistoryView) return;
    setMcqState((prev) => ({
      ...prev,
      [qIndex]: {
        revealed: true,
        selectedOption: optionLetter,
      },
    }));
  };

  const handleRevealClick = (qIndex) => {
    if (isHistoryView) return;
    setMcqState((prev) => ({
      ...prev,
      [qIndex]: {
        ...prev[qIndex],
        revealed: true,
      },
    }));
  };

  if (!studyData) return null;

  return (
    <div className="space-y-8">
      <h3 className="text-sm font-bold tracking-widest text-brand-light/60 uppercase select-none break-words">
        Study Guide: {topic}
      </h3>

      <div className="space-y-6">
        {/* Card 1: Explanation */}
        <div className="border border-brand-light/8 bg-brand-light/4 p-5 md:p-8 space-y-4">
          <h4 className="text-xs font-bold tracking-widest text-brand-light/60 uppercase select-none">
            Explanation
          </h4>
          <ul className="list-disc pl-5 space-y-3 text-brand-light/80 text-base leading-relaxed">
            {studyData.explanation &&
              studyData.explanation.map((bullet, index) => (
                <li key={index} className="break-words">{renderBoldText(bullet)}</li>
              ))}
          </ul>
        </div>

        {/* Card 2: Analogy */}
        <div className="border border-brand-light/8 bg-brand-light/4 p-5 md:p-8 space-y-4">
          <h4 className="text-xs font-bold tracking-widest text-brand-light/60 uppercase select-none">
            Analogy
          </h4>
          <p className="text-brand-light/80 text-base leading-relaxed break-words">
            {renderBoldText(studyData.analogy)}
          </p>
        </div>

        {/* Card 3: Practice MCQs */}
        <div className="border border-brand-light/8 bg-brand-light/4 p-5 md:p-8 space-y-6">
          <h4 className="text-xs font-bold tracking-widest text-brand-light/60 uppercase select-none">
            Practice MCQs
          </h4>
          <div className="space-y-8 divide-y divide-brand-light/8">
            {studyData.mcqs &&
              studyData.mcqs.map((mcq, qIdx) => {
                // If history view, it's pre-revealed and nothing is user-selected
                const state = isHistoryView
                  ? { revealed: true, selectedOption: null }
                  : mcqState[qIdx] || { revealed: false, selectedOption: null };

                const qNum = String(qIdx + 1).padStart(2, "0");

                return (
                  <div key={qIdx} className={`space-y-4 ${qIdx > 0 ? "pt-8" : ""}`}>
                    <div className="flex items-start space-x-3">
                      <span className="font-mono text-sm tracking-wider text-brand-light/60 pt-0.5 select-none">
                        {qNum}
                      </span>
                      <p className="font-sans text-brand-light font-medium text-base break-words">
                        {renderBoldText(mcq.question)}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4 sm:pl-8">
                      {["A", "B", "C", "D"].map((letter) => {
                        const optionText = mcq.options[letter];
                        const isCorrect = letter === mcq.correct;
                        const isSelected = state.selectedOption === letter;

                        let btnStyle =
                          "border border-brand-light/8 bg-brand-light/4 text-brand-light hover:border-brand-light/20 transition-all text-left p-4 flex items-center space-x-3 w-full rounded-none min-h-[44px]";

                        if (state.revealed) {
                          if (isCorrect) {
                            // Correct answer highlighted as a solid #F7F8FC (brand-light) block with black (brand-dark) text
                            btnStyle =
                              "bg-brand-light text-brand-dark font-bold border-brand-light text-left p-4 flex items-center space-x-3 w-full rounded-none select-none cursor-default min-h-[44px]";
                          } else if (isSelected) {
                            // Selected incorrect option shows with red border
                            btnStyle =
                              "border border-red-500 text-brand-light/70 bg-transparent text-left p-4 flex items-center space-x-3 w-full rounded-none select-none cursor-default min-h-[44px]";
                          } else {
                            // Other options become secondary/disabled
                            btnStyle =
                              "border border-brand-light/4 text-brand-light/35 bg-transparent text-left p-4 flex items-center space-x-3 w-full rounded-none select-none cursor-default min-h-[44px]";
                          }
                        }

                        return (
                          <button
                            key={letter}
                            type="button"
                            disabled={state.revealed || isHistoryView}
                            onClick={() => handleOptionClick(qIdx, letter)}
                            className={btnStyle}
                          >
                            <span className="font-mono text-sm tracking-wider font-semibold border-r border-current/25 pr-3 select-none">
                              {letter}
                            </span>
                            <span className="font-sans text-sm md:text-base break-words">
                              {renderBoldText(optionText)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {!state.revealed && !isHistoryView && (
                      <div className="pl-4 sm:pl-8">
                        <button
                          type="button"
                          onClick={() => handleRevealClick(qIdx)}
                          className="text-xs text-brand-light/40 hover:text-brand-light/70 underline underline-offset-4 cursor-pointer select-none py-3 inline-flex items-center min-h-[44px]"
                        >
                          Reveal Answer
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Card 4: Quick Summary */}
        <div className="border border-brand-light/8 bg-brand-light/4 p-5 md:p-8 space-y-4">
          <h4 className="text-xs font-bold tracking-widest text-brand-light/60 uppercase select-none">
            Quick Revision Summary
          </h4>
          <p className="text-brand-light/80 text-base leading-relaxed italic break-words">
            {renderBoldText(studyData.summary)}
          </p>
        </div>
      </div>
    </div>
  );
}
