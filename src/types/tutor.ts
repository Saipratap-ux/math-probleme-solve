export type TutorModel = 'gemini-4-argon' | 'gemini-4-carbon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';

export interface RoadmapStep {
  stepNumber: number;
  title: string;
  status: 'completed' | 'active' | 'upcoming';
  summary?: string;
  guidingQuestion?: string;
  whyDidWeDoThat?: string;
  studentAnswer?: string;
}

export interface MathProblem {
  id: string;
  problemText: string;
  latex: string;
  topic: string;
  difficulty: 'Intermediate' | 'Challenging' | 'Advanced';
  strategyOverview: string;
  totalEstimatedSteps: number;
  imageUrl?: string;
  currentStepNumber: number;
  currentStepTitle: string;
  currentStepTeacherSpeech: string;
  currentStepGuidingQuestion: string;
  whyDidWeDoThat: string;
  hint?: string;
  roadmap: RoadmapStep[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  modelUsed?: string;
  isWhyExplanation?: boolean;
  thinkingUsed?: boolean;
}

export interface SampleProblem {
  id: string;
  title: string;
  category: 'Calculus' | 'Algebra' | 'Linear Algebra';
  latex: string;
  description: string;
  difficulty: 'Intermediate' | 'Challenging' | 'Advanced';
  previewImage?: string;
}
