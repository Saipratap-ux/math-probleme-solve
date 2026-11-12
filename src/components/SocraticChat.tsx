import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, TutorModel } from '../types/tutor';
import { MathRenderer } from './MathRenderer';

interface SocraticChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, modelOverride?: TutorModel, forceThinking?: boolean) => void;
  isLoading: boolean;
  selectedModel: TutorModel;
  onSelectModel: (model: TutorModel) => void;
  isHighThinkingEnabled: boolean;
  onToggleHighThinking: () => void;
  onAskWhyShortcut: () => void;
  hasProblem: boolean;
}

export const SocraticChat: React.FC<SocraticChatProps> = ({
  messages,
  onSendMessage,
  isLoading,
  selectedModel,
  onSelectModel,
  isHighThinkingEnabled,
  onToggleHighThinking,
  onAskWhyShortcut,
  hasProblem,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const quickQuestions = [
    { label: '"Why did we do that?"', action: () => onAskWhyShortcut() },
    { label: 'Can you give me a smaller hint?', action: () => onSendMessage('Can you give me a smaller, gentle hint without giving away the algebra?', 'gemini-3.1-flash-lite') },
    { label: 'What if we tried another way?', action: () => onSendMessage('What would happen if we tried an alternative approach here instead of this rule?') },
    { label: 'Check my sign / algebra', action: () => onSendMessage('I often make mistakes with negative signs or chain rule factors. Could you verify if my signs are right?') },
  ];

  return (
    <div className="flex flex-col h-full bg-stone-50/50 border-l border-stone-200">
      {/* Dialogue Deck Header */}
      <div className="p-4 bg-white border-b border-stone-200 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-stone-800 text-amber-200 flex items-center justify-center font-serif text-sm font-bold shadow-xs">
              Σ
            </div>
            <div>
              <h3 className="text-xs font-semibold text-stone-900 font-display">
                Socrates Chat Dialogue
              </h3>
              <p className="text-[11px] text-stone-500">
                Patient, multi-turn reasoning · Never spoils ahead
              </p>
            </div>
          </div>

          {/* Model & Thinking Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleHighThinking}
              title="Toggle High Thinking Mode (uses gemini-4-carbon for deep mathematical proofs)"
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1.5 border ${
                isHighThinkingEnabled
                  ? 'bg-amber-900 text-amber-100 border-amber-950 shadow-xs'
                  : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
              }`}
            >
              <span>🧠</span>
              <span className="hidden sm:inline">High Thinking</span>
              {isHighThinkingEnabled && <span className="text-[10px] bg-amber-800 px-1 rounded">Carbon</span>}
            </button>

            <select
              value={selectedModel}
              onChange={(e) => onSelectModel(e.target.value as TutorModel)}
              className="text-[11px] bg-stone-100 border border-stone-200 rounded-md px-2 py-1 text-stone-700 font-sans focus:outline-hidden focus:ring-1 focus:ring-stone-400"
            >
              <option value="gemini-4-carbon">gemini-4-carbon (Deep Reasoning)</option>
              <option value="gemini-4-argon">gemini-4-argon (Complex Interactive)</option>
              <option value="gemini-3.8-flash">gemini-3.8-flash (General Tasks)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Hints)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scrollable Conversation Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-xs text-stone-500 font-medium mb-1">
              Dialogue thread will appear here
            </p>
            <p className="text-[11px] text-stone-400 max-w-xs">
              Upload a problem photo or pick a sample to start your Socratic walkthrough.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-stone-400">
                  <span>{isUser ? 'You' : 'Socrates'}</span>
                  {message.modelUsed && (
                    <>
                      <span>·</span>
                      <span className="font-mono text-[10px] text-stone-500">
                        {message.modelUsed}
                      </span>
                    </>
                  )}
                  {message.thinkingUsed && (
                    <>
                      <span>·</span>
                      <span className="text-[10px] text-amber-700 font-medium">
                        🧠 High Thinking
                      </span>
                    </>
                  )}
                </div>

                <div
                  className={`max-w-[88%] rounded-xl p-3.5 text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-stone-900 text-stone-100 rounded-tr-xs'
                      : message.isWhyExplanation
                      ? 'bg-amber-50/90 text-stone-900 border border-amber-200 rounded-tl-xs'
                      : 'bg-white text-stone-900 border border-stone-200 rounded-tl-xs'
                  }`}
                >
                  <MathRenderer content={message.content} />
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-stone-400">
              <span>Socrates</span>
              <span>·</span>
              <span className="font-mono text-[10px]">
                {isHighThinkingEnabled ? 'gemini-4-carbon (Reasoning...)' : selectedModel}
              </span>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl rounded-tl-xs p-3.5 text-xs text-stone-500 shadow-xs flex items-center gap-2.5">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span>
                {isHighThinkingEnabled
                  ? 'Engaging deep mathematical reasoning...'
                  : 'Formulating Socratic guidance...'}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts strip */}
      {hasProblem && (
        <div className="px-4 py-2 bg-stone-100/70 border-t border-stone-200 overflow-x-auto flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider shrink-0 mr-1">
            Prompt:
          </span>
          {quickQuestions.map((q) => (
            <button
              key={q.label}
              onClick={q.action}
              disabled={isLoading}
              className="px-2.5 py-1 bg-white hover:bg-stone-200 text-stone-700 rounded-md text-[11px] font-medium whitespace-nowrap shrink-0 border border-stone-200 transition-colors shadow-2xs disabled:opacity-50"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-stone-200 shrink-0">
        <div className="relative flex items-center">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasProblem
                ? "Ask Socrates: 'Why this move?', 'What if...', or type your thoughts..."
                : "Ask Socrates a question or upload a problem to begin..."
            }
            rows={2}
            className="w-full pl-3 pr-20 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:bg-white resize-none transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2 bottom-2.5 px-3 py-1.5 bg-stone-900 text-white rounded-md text-xs font-medium hover:bg-stone-800 transition-colors disabled:opacity-40 flex items-center gap-1 shadow-2xs"
          >
            <span>Send</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-stone-400">
          <span>Shift+Enter for newline</span>
          <span>LaTeX syntax like $x^2$ supported</span>
        </div>
      </form>
    </div>
  );
};
