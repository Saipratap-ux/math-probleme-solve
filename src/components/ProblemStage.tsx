import React, { useState, useRef } from 'react';
import { MathProblem } from '../types/tutor';
import { MathRenderer } from './MathRenderer';

interface ProblemStageProps {
  problem: MathProblem | null;
  onAskWhy: (stepNumber: number, stepTitle: string, context: string) => void;
  onGetHint: () => void;
  onSubmitStudentWork: (work: string) => void;
  onOpenUpload: () => void;
  onOpenLibrary: () => void;
  isSubmittingWork: boolean;
  isAskingWhy: boolean;
  isLoadingHint: boolean;
  whyExplanation: string | null;
  onDismissWhy: () => void;
  activeHint: string | null;
  onDismissHint: () => void;
}

export const ProblemStage: React.FC<ProblemStageProps> = ({
  problem,
  onAskWhy,
  onGetHint,
  onSubmitStudentWork,
  onOpenUpload,
  onOpenLibrary,
  isSubmittingWork,
  isAskingWhy,
  isLoadingHint,
  whyExplanation,
  onDismissWhy,
  activeHint,
  onDismissHint,
}) => {
  const [studentInput, setStudentInput] = useState('');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const scratchpadRef = useRef<HTMLDivElement>(null);

  const handleQuickInsert = (snippet: string) => {
    setStudentInput((prev) => prev + snippet);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentInput.trim() || isSubmittingWork) return;
    onSubmitStudentWork(studentInput.trim());
    setStudentInput('');
  };

  if (!problem) {
    return (
      <div className="flex flex-col items-center justify-center p-8 lg:p-12 text-center h-full max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-700 mb-6 border border-stone-200 shadow-xs">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold font-display text-stone-900 tracking-tight mb-3">
          Your Patient Socratic Math Tutor
        </h2>
        <p className="text-stone-600 text-sm leading-relaxed mb-8 max-w-md">
          Upload a photo of any complex calculus or algebra problem. Socrates won't dump the final answer on you. We will take the first step together, pause whenever you ask <span className="font-semibold text-stone-800">"Why did we do that?"</span>, and build genuine mathematical intuition.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={onOpenUpload}
            className="px-5 py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Upload Photo of Math Problem
          </button>
          <button
            onClick={onOpenLibrary}
            className="px-5 py-2.5 bg-white text-stone-700 border border-stone-200 rounded-lg text-sm font-medium hover:bg-stone-100 transition-colors shadow-xs"
          >
            Try a Sample Problem
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-200 w-full grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-4 bg-white rounded-xl border border-stone-200">
            <h3 className="text-xs font-semibold text-stone-900 mb-1">01. Step-by-Step Only</h3>
            <p className="text-xs text-stone-500 leading-normal">
              No calculator answer dumps. We walk through Step 1 first to cultivate understanding.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-stone-200">
            <h3 className="text-xs font-semibold text-stone-900 mb-1">02. "Why Did We Do That?"</h3>
            <p className="text-xs text-stone-500 leading-normal">
              Get deep conceptual justifications, counterfactuals, and intuitive geometric analogies.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-stone-200">
            <h3 className="text-xs font-semibold text-stone-900 mb-1">03. High Thinking Mode</h3>
            <p className="text-xs text-stone-500 leading-normal">
              Powered by Gemini 4 Carbon and Argon for deep mathematical proofs and multimodal vision.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = problem.roadmap.find((s) => s.stepNumber === problem.currentStepNumber) || {
    stepNumber: problem.currentStepNumber,
    title: problem.currentStepTitle,
    status: 'active' as const,
    guidingQuestion: problem.currentStepGuidingQuestion,
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 overflow-y-auto">
      {/* Problem Header Card */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="flex items-center justify-between text-xs text-stone-500 mb-3 pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="font-medium text-stone-800">{problem.topic}</span>
            <span aria-hidden="true">·</span>
            <span>{problem.difficulty}</span>
            <span aria-hidden="true">·</span>
            <span>Step {problem.currentStepNumber} of {problem.totalEstimatedSteps}</span>
          </div>

          {problem.imageUrl && (
            <button
              onClick={() => setShowImagePreview(!showImagePreview)}
              className="text-amber-800 hover:text-amber-900 font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {showImagePreview ? 'Hide Problem Photo' : 'View Problem Photo'}
            </button>
          )}
        </div>

        {/* Optional Collapsible Original Photo */}
        {showImagePreview && problem.imageUrl && (
          <div className="mb-4 p-2 bg-stone-900 rounded-lg overflow-hidden border border-stone-300">
            <div className="text-[11px] text-stone-400 mb-1 px-1 flex items-center justify-between">
              <span>Original Uploaded Math Source</span>
              <button
                onClick={() => setShowImagePreview(false)}
                className="hover:text-stone-200"
              >
                Close
              </button>
            </div>
            <img
              src={problem.imageUrl}
              alt="Uploaded problem"
              referrerPolicy="no-referrer"
              className="max-h-56 w-auto mx-auto object-contain rounded"
            />
          </div>
        )}

        {/* Problem Statement & LaTeX Equation */}
        <div className="text-stone-700 text-sm mb-3">
          {problem.problemText}
        </div>

        <div className="p-4 bg-stone-900 text-amber-100 rounded-lg my-2 border border-stone-800 flex items-center justify-center text-center overflow-x-auto shadow-inner">
          <MathRenderer content={`$$${problem.latex}$$`} block className="text-lg md:text-xl py-1 text-amber-200" />
        </div>

        <div className="text-xs text-stone-500 mt-3 flex items-start gap-2 bg-stone-50 p-3 rounded-lg border border-stone-100">
          <svg className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="font-semibold text-stone-700">Strategic Target:</span>{' '}
            <span>{problem.strategyOverview}</span>
          </div>
        </div>
      </div>

      {/* Current Step Spotlight Card */}
      <div className="bg-white rounded-xl border-2 border-amber-800/20 p-5 shadow-xs relative">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {problem.currentStepNumber}
            </span>
            <h3 className="text-base font-semibold text-stone-900 font-display">
              {problem.currentStepTitle}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onGetHint}
              disabled={isLoadingHint}
              className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {isLoadingHint ? 'Thinking...' : 'Subtle Hint'}
            </button>
          </div>
        </div>

        {/* Teacher's Voice for this Step */}
        <div className="text-sm text-stone-700 leading-relaxed mb-4 p-3.5 bg-stone-50 rounded-lg border border-stone-200">
          <div className="text-xs font-semibold text-amber-900 mb-1 flex items-center gap-1.5">
            <span>Socrates</span>
          </div>
          <MathRenderer content={problem.currentStepTeacherSpeech || currentStep.summary || ''} />
        </div>

        {/* The Guiding Question posed to student */}
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl mb-4">
          <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Guiding Question For You
          </div>
          <div className="text-sm font-medium text-stone-900">
            <MathRenderer content={problem.currentStepGuidingQuestion || currentStep.guidingQuestion || 'What is our first step?'} />
          </div>
        </div>

        {/* CORE USER FEATURE: "Why did we do that?" button */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <button
            onClick={() => onAskWhy(
              problem.currentStepNumber,
              problem.currentStepTitle,
              problem.currentStepTeacherSpeech
            )}
            disabled={isAskingWhy}
            className="px-4 py-2 bg-amber-100 text-amber-950 font-medium text-xs rounded-lg hover:bg-amber-200 transition-colors border border-amber-300 flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <svg className="w-4 h-4 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isAskingWhy ? 'Analyzing conceptual rationale...' : 'Ask Socrates: "Why did we do that?"'}
          </button>
        </div>

        {/* Inline "Why did we do that?" Conceptual Rationale Card if activated */}
        {whyExplanation && (
          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-300 text-sm text-stone-800 relative">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200">
              <span className="font-semibold text-xs text-amber-900 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Concept Intuition · Why We Take This Path
              </span>
              <button
                onClick={onDismissWhy}
                className="text-amber-800 hover:text-amber-950 text-xs font-medium"
              >
                Dismiss
              </button>
            </div>
            <MathRenderer content={whyExplanation} className="leading-relaxed" />
          </div>
        )}

        {/* Fast Hint Banner if triggered */}
        {activeHint && (
          <div className="mt-3 p-3 bg-stone-100 rounded-lg border border-stone-200 text-xs text-stone-700 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-stone-900">Hint:</span>
              <MathRenderer content={activeHint} />
            </div>
            <button
              onClick={onDismissHint}
              className="text-stone-400 hover:text-stone-600 text-xs shrink-0"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Interactive Scratchpad & Formula Working Area */}
      <div ref={scratchpadRef} className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-stone-900 font-display flex items-center gap-2">
            <svg className="w-4 h-4 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Student Scratchpad & Step Submission
          </h3>
          <span className="text-xs text-stone-400 font-mono">LaTeX supported ($...$)</span>
        </div>

        {/* Quick math symbol insertions */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs">
          <span className="text-stone-400 mr-1 text-[11px]">Insert:</span>
          {[
            { label: 'u =', val: 'u = ' },
            { label: 'dv =', val: 'dv = ' },
            { label: '∫', val: '\\int ' },
            { label: 'd/dx', val: '\\frac{d}{dx}' },
            { label: 'x²', val: 'x^2' },
            { label: 'eˣ', val: 'e^{x}' },
            { label: '√x', val: '\\sqrt{x}' },
            { label: 'a/b', val: '\\frac{a}{b}' },
            { label: 'ln(x)', val: '\\ln(x)' },
            { label: 'sin(x)', val: '\\sin(x)' },
            { label: 'dx', val: 'dx' },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleQuickInsert(item.val)}
              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded font-mono text-[11px] transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3">
          <textarea
            value={studentInput}
            onChange={(e) => setStudentInput(e.target.value)}
            placeholder="Type your mathematical reasoning or attempt here... (e.g. 'I let u = x^2 and dv = e^(3x) dx because differentiating x^2 reduces the power')"
            rows={3}
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:bg-white transition-all font-sans"
          />

          {/* Real-time Math Preview if student entered LaTeX */}
          {studentInput.includes('$') || studentInput.includes('\\') ? (
            <div className="p-3 bg-stone-100 rounded-lg text-xs border border-stone-200 text-stone-800">
              <span className="font-semibold text-stone-500 block mb-1">Live Formula Preview:</span>
              <MathRenderer content={studentInput} />
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-stone-500">
              Socrates will review your specific step without spoiling ahead.
            </span>
            <button
              type="submit"
              disabled={!studentInput.trim() || isSubmittingWork}
              className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
            >
              {isSubmittingWork ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking With Socrates...
                </>
              ) : (
                <>
                  Submit My Step Attempt
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Progressive Step Roadmap */}
      <div id="roadmap-section" className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-stone-900 font-display mb-4">
          Learning Journey Roadmap
        </h3>

        <div className="space-y-3">
          {problem.roadmap.map((step) => {
            const isCurrent = step.stepNumber === problem.currentStepNumber;
            const isCompleted = step.stepNumber < problem.currentStepNumber;
            const isUpcoming = step.stepNumber > problem.currentStepNumber;

            return (
              <div
                key={step.stepNumber}
                className={`p-3.5 rounded-lg border transition-all ${
                  isCurrent
                    ? 'border-amber-800/40 bg-amber-50/40 ring-1 ring-amber-800/20'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-stone-200 bg-stone-50/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? 'bg-amber-800 text-white'
                          : isCompleted
                          ? 'bg-emerald-700 text-white'
                          : 'bg-stone-300 text-stone-600'
                      }`}
                    >
                      {isCompleted ? '✓' : step.stepNumber}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-stone-900">
                        {step.title}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {isCompleted
                          ? 'Completed with Socratic verification'
                          : isCurrent
                          ? 'Currently active · Engage in inquiry'
                          : 'Locked · Unlocks after Step ' + (step.stepNumber - 1)}
                      </div>
                    </div>
                  </div>

                  {isUpcoming && (
                    <span className="text-[11px] text-stone-400 font-medium flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Hidden to encourage self-discovery
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
