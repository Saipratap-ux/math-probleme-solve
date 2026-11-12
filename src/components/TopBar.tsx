import React from 'react';

interface TopBarProps {
  onOpenUpload: () => void;
  onOpenLibrary: () => void;
  onFocusRoadmap: () => void;
  onFocusScratchpad: () => void;
  hasProblem: boolean;
  onReset: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenUpload,
  onOpenLibrary,
  onFocusRoadmap,
  onFocusScratchpad,
  hasProblem,
  onReset,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-stone-50 border-b border-stone-200 shrink-0 sticky top-0 z-30">
      {/* Zone 1: Brand wordmark as a single text element */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onReset}
          className="text-lg font-semibold tracking-tight text-stone-900 hover:text-amber-800 transition-colors whitespace-nowrap shrink-0 font-display text-left"
        >
          Socrates Math
        </button>
      </div>

      {/* Zone 2: 4 single-line nav links with subtle hover underlines */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Tutor Desk
        </button>
        <button
          onClick={onFocusRoadmap}
          className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Step Roadmap
        </button>
        <button
          onClick={onFocusScratchpad}
          className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Scratchpad
        </button>
        <button
          onClick={onOpenLibrary}
          className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Sample Vault
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenUpload}
          className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0 shadow-xs flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Upload Problem Photo
        </button>
      </div>
    </header>
  );
};
