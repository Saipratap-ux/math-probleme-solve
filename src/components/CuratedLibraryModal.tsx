import React, { useState } from 'react';
import { SAMPLE_PROBLEMS } from '../data/sampleProblems';
import { SampleProblem } from '../types/tutor';
import { MathRenderer } from './MathRenderer';

interface CuratedLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProblem: (sample: SampleProblem) => Promise<void>;
  isLoading: boolean;
}

export const CuratedLibraryModal: React.FC<CuratedLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectProblem,
  isLoading,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Calculus', 'Algebra'];

  const filteredProblems = selectedCategory === 'All'
    ? SAMPLE_PROBLEMS
    : SAMPLE_PROBLEMS.filter((p) => p.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-stone-200 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h2 className="text-base font-semibold text-stone-900 font-display">
              Curated Problem Vault
            </h2>
            <p className="text-xs text-stone-500">
              Classic calculus & algebra puzzles ready for step-by-step Socratic breakdown
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Interactive Segmented Filter (Allowed by §1.A) */}
        <div className="flex items-center gap-1.5 p-3 border-b border-stone-200 bg-white">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Problem Grid */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {filteredProblems.map((problem) => (
            <div
              key={problem.id}
              className="p-4 rounded-xl border border-stone-200 hover:border-amber-800/40 bg-white hover:bg-amber-50/20 transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                  <span>{problem.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{problem.difficulty}</span>
                </div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 group-hover:text-amber-900 transition-colors">
                  {problem.title}
                </h3>
                <div className="p-3 bg-stone-900 text-amber-200 rounded-lg mb-3 flex items-center justify-center text-center overflow-x-auto">
                  <MathRenderer content={`$$${problem.latex}$$`} block className="text-sm py-0.5 text-amber-200" />
                </div>
                <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-4">
                  {problem.description}
                </p>
              </div>

              <button
                onClick={async () => {
                  await onSelectProblem(problem);
                  onClose();
                }}
                disabled={isLoading}
                className="w-full py-2 bg-stone-100 group-hover:bg-stone-900 text-stone-700 group-hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>Study With Socrates</span>
                <span>→</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
