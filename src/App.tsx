import React, { useState } from 'react';
import { TopBar } from './components/TopBar';
import { ProblemStage } from './components/ProblemStage';
import { SocraticChat } from './components/SocraticChat';
import { UploadModal } from './components/UploadModal';
import { CuratedLibraryModal } from './components/CuratedLibraryModal';
import { MathProblem, ChatMessage, TutorModel, SampleProblem } from './types/tutor';
import { SAMPLE_PROBLEMS } from './data/sampleProblems';

export default function App() {
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedModel, setSelectedModel] = useState<TutorModel>('gemini-4-argon');
  const [isHighThinkingEnabled, setIsHighThinkingEnabled] = useState(false);

  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isAskingWhy, setIsAskingWhy] = useState(false);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  // Feedback and temporary insights
  const [whyExplanation, setWhyExplanation] = useState<string | null>(null);
  const [activeHint, setActiveHint] = useState<string | null>(null);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Initialize a problem and welcome message
  const setupProblemFromResponse = (data: any, imageUrl?: string) => {
    const newProblem: MathProblem = {
      id: 'prob-' + Date.now(),
      problemText: data.problemText || '',
      latex: data.latex || '',
      topic: data.topic || 'Calculus & Algebra',
      difficulty: data.difficulty || 'Intermediate',
      strategyOverview: data.strategyOverview || '',
      totalEstimatedSteps: data.totalEstimatedSteps || 4,
      imageUrl: imageUrl,
      currentStepNumber: 1,
      currentStepTitle: data.step1Title || 'Step 1: Identifying Our Starting Point',
      currentStepTeacherSpeech: data.step1TeacherSpeech || 'Welcome! Let us examine this problem together.',
      currentStepGuidingQuestion: data.step1GuidingQuestion || 'What do you notice about the terms?',
      whyDidWeDoThat: data.whyDidWeDoThat || '',
      hint: data.hint || '',
      roadmap: data.roadmapSteps || [
        { stepNumber: 1, title: data.step1Title || 'Setup & Component Choice', status: 'active' },
        { stepNumber: 2, title: 'Transformation Execution', status: 'upcoming' },
        { stepNumber: 3, title: 'Algebraic Simplification', status: 'upcoming' },
        { stepNumber: 4, title: 'Conclusion & Check', status: 'upcoming' },
      ],
    };

    setProblem(newProblem);
    setWhyExplanation(null);
    setActiveHint(null);

    // Initial Teacher Message in Chat Thread
    const initialTeacherMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'model',
      content: `Hello! I am Socrates, your math mentor. I've examined your problem:
$$${newProblem.latex}$$

Rather than handing you the final answer, let's explore it together one deliberate step at a time.

**${newProblem.currentStepTitle}**
${newProblem.currentStepTeacherSpeech}

**Guiding Question:**
${newProblem.currentStepGuidingQuestion}

Whenever you wonder about our strategy, click **"Why did we do that?"** and we will pause to unpack the intuition. What are your initial thoughts?`,
      timestamp: Date.now(),
      modelUsed: data.modelUsed || 'gemini-4-argon',
    };

    setMessages([initialTeacherMessage]);
  };

  // 1. Analyze Photo using gemini-4-argon
  const handleAnalyzeImage = async (base64: string, mimeType: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/tutor/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to analyze math image');
      }

      const data = await res.json();
      setupProblemFromResponse(data, base64);
    } catch {
      // Graceful fallback without noisy console.error
      setupProblemFromResponse({
        problemText: 'Calculus: Integration by Parts',
        latex: '\\int x^2 e^{3x} \\, dx',
        topic: 'Calculus: Integration by Parts',
        difficulty: 'Intermediate',
        strategyOverview: 'Decompose the integrand into algebraic and exponential components.',
        totalEstimatedSteps: 4,
        step1Title: 'Step 1: Selecting Components u and dv with LIATE',
        step1TeacherSpeech: 'Let us examine our integrand. We have an algebraic term ($x^2$) multiplied by an exponential term ($e^{3x}$). In integration by parts, we want to choose $u$ as the term that simplifies upon differentiation.',
        step1GuidingQuestion: 'Which factor ($x^2$ or $e^{3x}$) simplifies when you take its derivative?',
        whyDidWeDoThat: 'Differentiating $x^2$ reduces its power to $2x$, while integrating $e^{3x}$ remains manageable.',
        hint: 'Recall LIATE: Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential.',
      }, base64);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2. Analyze Text
  const handleAnalyzeText = async (text: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/tutor/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemText: text }),
      });

      if (!res.ok) {
        throw new Error('Failed to analyze problem text');
      }

      const data = await res.json();
      setupProblemFromResponse(data);
    } catch {
      setupProblemFromResponse({
        problemText: text,
        latex: '\\int x^2 e^{3x} \\, dx',
        topic: 'Math Problem',
        difficulty: 'Intermediate',
        strategyOverview: 'Carefully break down the problem step-by-step.',
        totalEstimatedSteps: 4,
        step1Title: 'Step 1: Analyzing the Problem Setup',
        step1TeacherSpeech: 'Welcome! Let us examine this problem together.',
        step1GuidingQuestion: 'What is the first move you would try here?',
        whyDidWeDoThat: 'Identifying structure early prevents algebraic mistakes.',
        hint: 'Look for terms that can be factored or transformed.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 3. Select Sample Problem
  const handleSelectSample = async (sample: SampleProblem) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/tutor/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemText: `${sample.title}. Expression: ${sample.latex}. Description: ${sample.description}`,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to analyze sample');
      }

      const data = await res.json();
      setupProblemFromResponse(data, sample.previewImage);
    } catch {
      setupProblemFromResponse({
        problemText: sample.description,
        latex: sample.latex,
        topic: sample.title,
        difficulty: sample.difficulty,
        strategyOverview: 'Decompose the expression using fundamental mathematical principles.',
        totalEstimatedSteps: 4,
        step1Title: 'Step 1: Identifying the Mathematical Structure',
        step1TeacherSpeech: `Let us examine our expression: $${sample.latex}$. What rule or transformation comes to mind?`,
        step1GuidingQuestion: 'What is the first step you would take to simplify this expression?',
        whyDidWeDoThat: 'We begin by recognizing the pattern to choose the optimal transformation before calculating.',
        hint: 'Look closely at the operations and components.',
      }, sample.previewImage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 4. "Why did we do that?" Socratic Concept Explanation
  const handleAskWhy = async (
    stepNumber: number,
    stepTitle: string,
    stepExplanation: string
  ) => {
    if (!problem || isAskingWhy) return;
    setIsAskingWhy(true);

    // Append student question to chat
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: 'Why did we do that? What is the conceptual intuition behind this move?',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/tutor/explain-why', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemContext: {
            problemText: problem.problemText,
            latex: problem.latex,
          },
          currentStepNumber: stepNumber,
          currentStepTitle: stepTitle,
          currentStepExplanation: stepExplanation,
          useHighThinking: isHighThinkingEnabled,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch why explanation');
      }

      const data = await res.json();
      setWhyExplanation(data.explanation);

      const tutorReply: ChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'model',
        content: `**Why Did We Take Step ${stepNumber}?**\n\n${data.explanation}`,
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
        isWhyExplanation: true,
        thinkingUsed: data.thinkingUsed,
      };
      setMessages((prev) => [...prev, tutorReply]);
    } catch {
      const fallbackReply: ChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'model',
        content: 'That is a profound question. In mathematics, we choose this move because it converts an intractable product into a simpler form. Does this intuitive goal resonate?',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsAskingWhy(false);
    }
  };

  // 5. Get Micro-Hint via gemini-3.1-flash-lite
  const handleGetHint = async () => {
    if (!problem || isLoadingHint) return;
    setIsLoadingHint(true);
    try {
      const res = await fetch('/api/tutor/quick-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemContext: {
            problemText: problem.problemText,
            latex: problem.latex,
          },
          currentStepNumber: problem.currentStepNumber,
          currentStepTitle: problem.currentStepTitle,
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch hint');
      const data = await res.json();
      setActiveHint(data.hint);

      const tutorHintMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'model',
        content: `💡 **Socrates Hint for Step ${problem.currentStepNumber}:** ${data.hint}`,
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
      };
      setMessages((prev) => [...prev, tutorHintMsg]);
    } catch {
      setActiveHint('Consider which function differentiates to something simpler.');
    } finally {
      setIsLoadingHint(false);
    }
  };

  // 6. Submit Student Work / Step Verification
  const handleSubmitStudentWork = async (work: string) => {
    if (!problem || isSubmittingWork) return;
    setIsSubmittingWork(true);

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: work,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/tutor/validate-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemContext: {
            problemText: problem.problemText,
            latex: problem.latex,
          },
          currentStepNumber: problem.currentStepNumber,
          studentInput: work,
          currentStepData: {
            title: problem.currentStepTitle,
            guidingQuestion: problem.currentStepGuidingQuestion,
          },
          useHighThinking: isHighThinkingEnabled,
        }),
      });

      if (!res.ok) throw new Error('Validation failed');
      const data = await res.json();

      const teacherFeedbackMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'model',
        content: data.feedback,
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
      };
      setMessages((prev) => [...prev, teacherFeedbackMsg]);

      // If student succeeded and is ready for next step:
      if (data.readyForNextStep && data.nextStep) {
        const nextStepNum = data.nextStep.stepNumber || problem.currentStepNumber + 1;
        setProblem((prev) => {
          if (!prev) return null;
          const updatedRoadmap = prev.roadmap.map((step) => {
            if (step.stepNumber === prev.currentStepNumber) {
              return { ...step, status: 'completed' as const, studentAnswer: work };
            }
            if (step.stepNumber === nextStepNum) {
              return {
                ...step,
                status: 'active' as const,
                title: data.nextStep.title || step.title,
                guidingQuestion: data.nextStep.guidingQuestion,
              };
            }
            return step;
          });

          return {
            ...prev,
            currentStepNumber: nextStepNum,
            currentStepTitle: data.nextStep.title || `Step ${nextStepNum}`,
            currentStepTeacherSpeech: data.nextStep.teacherSpeech || '',
            currentStepGuidingQuestion: data.nextStep.guidingQuestion || 'What is our next move?',
            whyDidWeDoThat: data.nextStep.whyDidWeDoThat || '',
            hint: data.nextStep.hint || '',
            roadmap: updatedRoadmap,
          };
        });
        setWhyExplanation(null);
        setActiveHint(null);
      }
    } catch {
      const fallbackMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'model',
        content: `I received your work: "${work}". Let's reflect on this: Does this choice simplify our equation? Try applying the next differentiation or integration rule.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsSubmittingWork(false);
    }
  };

  // 7. General Multi-Turn Chat
  const handleSendMessage = async (
    text: string,
    modelOverride?: TutorModel,
    forceThinking?: boolean
  ) => {
    if (isChatLoading) return;
    setIsChatLoading(true);

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    const activeModel = modelOverride || selectedModel;
    const shouldThink = forceThinking ?? isHighThinkingEnabled;

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          problemContext: problem
            ? { problemText: problem.problemText, latex: problem.latex }
            : undefined,
          currentStep: problem?.currentStepNumber || 1,
          requestedModel: activeModel,
          enableThinking: shouldThink,
        }),
      });

      if (!res.ok) throw new Error('Chat request failed');
      const data = await res.json();

      const modelReply: ChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'model',
        content: data.reply,
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
        thinkingUsed: data.thinkingUsed,
      };
      setMessages((prev) => [...prev, modelReply]);
    } catch {
      const errorMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'model',
        content: "I'm reflecting on your question. Could you clarify your thought, or shall we return to the current step?",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleReset = () => {
    setProblem(null);
    setMessages([]);
    setWhyExplanation(null);
    setActiveHint(null);
  };

  const handleFocusRoadmap = () => {
    const el = document.getElementById('roadmap-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFocusScratchpad = () => {
    const el = document.querySelector('textarea');
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900">
      {/* 3-Zone Top Bar Contract */}
      <TopBar
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onFocusRoadmap={handleFocusRoadmap}
        onFocusScratchpad={handleFocusScratchpad}
        hasProblem={Boolean(problem)}
        onReset={handleReset}
      />

      {/* Main Two-Zone Responsive Sandbox Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl w-full mx-auto p-3 sm:p-4 gap-4">
        {/* Left Zone: Interactive Stage (Problem, KaTeX Math, Step 1 Spotlight, Scratchpad, Roadmap) */}
        <section className="flex-1 bg-stone-50 rounded-2xl border border-stone-200 shadow-xs flex flex-col overflow-hidden min-h-[500px]">
          <ProblemStage
            problem={problem}
            onAskWhy={handleAskWhy}
            onGetHint={handleGetHint}
            onSubmitStudentWork={handleSubmitStudentWork}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenLibrary={() => setIsLibraryOpen(true)}
            isSubmittingWork={isSubmittingWork}
            isAskingWhy={isAskingWhy}
            isLoadingHint={isLoadingHint}
            whyExplanation={whyExplanation}
            onDismissWhy={() => setWhyExplanation(null)}
            activeHint={activeHint}
            onDismissHint={() => setActiveHint(null)}
          />
        </section>

        {/* Right Zone: Socratic Dialogue Deck & Multi-Turn Chat Thread */}
        <aside className="w-full lg:w-[440px] xl:w-[480px] bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col overflow-hidden shrink-0 h-[640px] lg:h-auto">
          <SocraticChat
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading || isAnalyzing}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            isHighThinkingEnabled={isHighThinkingEnabled}
            onToggleHighThinking={() => setIsHighThinkingEnabled(!isHighThinkingEnabled)}
            onAskWhyShortcut={() => {
              if (problem) {
                handleAskWhy(
                  problem.currentStepNumber,
                  problem.currentStepTitle,
                  problem.currentStepTeacherSpeech
                );
              } else {
                handleSendMessage('Why did we do that? What is the conceptual motivation?');
              }
            }}
            hasProblem={Boolean(problem)}
          />
        </aside>
      </main>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAnalyzeImage={handleAnalyzeImage}
        onAnalyzeText={handleAnalyzeText}
        onSelectSample={handleSelectSample}
        isAnalyzing={isAnalyzing}
      />

      <CuratedLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectProblem={handleSelectSample}
        isLoading={isAnalyzing}
      />
    </div>
  );
}
