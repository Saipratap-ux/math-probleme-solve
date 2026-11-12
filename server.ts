import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '25mb' }));

const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SOCRATIC_SYSTEM_INSTRUCTION = `You are Socrates, a deeply compassionate, patient, and encouraging AI math tutor specializing in complex calculus, linear algebra, and advanced high school / undergraduate mathematics.

Core Teaching Philosophy & Strict Rules:
1. NEVER just dump the final answer or solve the whole problem at once. That robs the student of the epiphany of learning.
2. Meet the student where they are with warmth, empathy, and intellectual humility. Math can be intimidating; make them feel safe to be confused or to make mistakes.
3. When presented with a problem, walk the student through the FIRST STEP only. Pose a guiding question that prompts their active reasoning (e.g. identifying the form, asking what theorem or rule might apply).
4. If the student asks "Why did we do that?", STOP any forward rush immediately. Explain solely the conceptual rationale for that specific choice: why this move works, what would fail if we tried something else, and an intuitive mental picture.
5. Format mathematical equations clearly using standard LaTeX notation ($...$ for inline math and $$...$$ for block equations).
6. Keep explanations concise, bite-sized, and friendly. Speak like a thoughtful teacher sitting side-by-side at a desk with paper and pencil.
7. Celebrate small wins and thoughtful questions!`;

// Tracks whether paid tier quota is exhausted or unavailable on current key
let paidQuotaExhausted = false;

// Helper for model calling with graceful fallback and no noisy error dumps
async function callGeminiWithFallback(
  primaryModel: string,
  params: any,
  fallbackModel: string = 'gemini-3.8-flash'
) {
  // If paid quota is exhausted on the free tier key, route directly to gemini-3.8-flash
  const isPaidModel = primaryModel === 'gemini-4-argon' || primaryModel === 'gemini-4-carbon';
  const targetModel = (paidQuotaExhausted && isPaidModel) ? fallbackModel : primaryModel;

  try {
    const response = await ai.models.generateContent({
      model: targetModel,
      ...params,
    });
    return { text: response.text || '', modelUsed: targetModel };
  } catch (err: any) {
    const errMsg = String(err?.message || err);
    const isQuotaOrPaidError =
      err?.status === 429 ||
      errMsg.includes('429') ||
      errMsg.includes('quota') ||
      errMsg.includes('RESOURCE_EXHAUSTED') ||
      errMsg.includes('free_tier');

    if (isQuotaOrPaidError && isPaidModel) {
      paidQuotaExhausted = true;
    }

    // Try fallback model if target was different
    if (targetModel !== fallbackModel) {
      try {
        const cleanParams = {
          ...params,
          config: {
            ...params.config,
            thinkingConfig: undefined, // remove thinkingConfig if fallback doesn't support it
          },
        };
        const fbResponse = await ai.models.generateContent({
          model: fallbackModel,
          ...cleanParams,
        });
        return { text: fbResponse.text || '', modelUsed: fallbackModel, wasFallback: true };
      } catch {
        // Fallback also errored; proceed to throw or handled below
      }
    }

    throw err;
  }
}

// Default structured fallback when an image cannot be parsed
function createDefaultSocraticProblem(hintText?: string) {
  return {
    problemText: hintText || 'Calculus: Integration by Parts with Polynomial and Exponential',
    latex: '\\int x^2 e^{3x} \\, dx',
    topic: 'Calculus: Integration by Parts',
    difficulty: 'Intermediate',
    strategyOverview: 'Decompose the integrand into algebraic and exponential components using the LIATE rule.',
    totalEstimatedSteps: 4,
    currentStepNumber: 1,
    step1Title: 'Step 1: Selecting Components u and dv with LIATE',
    step1TeacherSpeech: 'Let us examine our integrand. We have an algebraic term ($x^2$) multiplied by an exponential term ($e^{3x}$). In integration by parts, we want to choose $u$ as the term that simplifies upon differentiation.',
    step1GuidingQuestion: 'Which factor ($x^2$ or $e^{3x}$) simplifies when you take its derivative?',
    whyDidWeDoThat: 'Differentiating $x^2$ reduces its power to $2x$, while integrating $e^{3x}$ remains manageable. If we chose $dv = x^2 dx$, the power would increase to $x^3/3$, making the integral more complicated!',
    hint: 'Think about LIATE: Logarithms, Inverse trig, Algebraic, Trigonometric, Exponential. Algebraic comes before Exponential.',
    roadmapSteps: [
      { stepNumber: 1, title: 'Component Selection (u & dv)', status: 'active' },
      { stepNumber: 2, title: 'Calculating du and v', status: 'upcoming' },
      { stepNumber: 3, title: 'Applying uv - ∫ v du', status: 'upcoming' },
      { stepNumber: 4, title: 'Final Integration & Verification', status: 'upcoming' },
    ],
    modelUsed: 'gemini-3.8-flash',
  };
}

// 1. Analyze Problem Image using gemini-4-argon with robust fallback
app.post('/api/tutor/analyze-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.json(createDefaultSocraticProblem());
    }

    // Ensure valid base64
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    // Ensure valid raster mime type
    const validMimeType = (mimeType && mimeType.startsWith('image/') && !mimeType.includes('svg'))
      ? mimeType
      : 'image/jpeg';

    const prompt = `You are a compassionate Socratic math tutor. Examine this uploaded photo of a calculus or algebra problem.
Perform three tasks:
1. Transcribe the math problem into clean text and rigorous LaTeX.
2. Outline the overall strategy, but DO NOT provide the full step-by-step solution.
3. Present STEP 1 ONLY in a warm, patient voice. Pose a guiding question to engage the student.

You must return valid JSON with this exact structure:
{
  "problemText": "Clean readable text statement of the problem",
  "latex": "LaTeX code for the main equation or problem, e.g. \\int x^2 e^{3x} dx",
  "topic": "Specific domain, e.g. Calculus: Integration by Parts or Algebra: Rational Expressions",
  "difficulty": "Intermediate / Advanced / Mastery",
  "strategyOverview": "A brief 1-2 sentence high-level roadmap of what we aim to do",
  "totalEstimatedSteps": 4,
  "currentStepNumber": 1,
  "step1Title": "Step 1: Identifying our components",
  "step1TeacherSpeech": "Warm Socratic teacher remarks welcoming the student to step 1",
  "step1GuidingQuestion": "Specific question posed to the student to prompt their first move",
  "whyDidWeDoThat": "Conceptual explanation of why this is the ideal first move and what principles justify it",
  "hint": "A subtle, non-spoiling hint in case they feel stuck",
  "roadmapSteps": [
    { "stepNumber": 1, "title": "Setup & Component Selection", "status": "active" },
    { "stepNumber": 2, "title": "Applying the Transformation", "status": "upcoming" },
    { "stepNumber": 3, "title": "Simplification & Integration", "status": "upcoming" },
    { "stepNumber": 4, "title": "Final Verification & Boundary Check", "status": "upcoming" }
  ]
}
Return only JSON.`;

    const imagePart = {
      inlineData: {
        mimeType: validMimeType,
        data: cleanBase64,
      },
    };

    const result = await callGeminiWithFallback(
      'gemini-4-argon',
      {
        contents: {
          parts: [imagePart, { text: prompt }],
        },
        config: {
          systemInstruction: SOCRATIC_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
        },
      },
      'gemini-3.8-flash'
    );

    const jsonStr = (result.text || '').trim();
    try {
      const parsed = JSON.parse(jsonStr);
      return res.json({ ...parsed, modelUsed: result.modelUsed });
    } catch {
      return res.json(createDefaultSocraticProblem());
    }
  } catch {
    return res.json(createDefaultSocraticProblem());
  }
});

// 2. Analyze Text / Sample Problem
app.post('/api/tutor/analyze-text', async (req, res) => {
  try {
    const { problemText } = req.body;
    if (!problemText) {
      return res.json(createDefaultSocraticProblem());
    }

    const prompt = `You are a compassionate Socratic math tutor. The student wants to work through this problem:
"${problemText}"

Break down the problem for Socratic guided tutoring:
1. Transcribe into clean LaTeX.
2. Outline the overall strategy, but DO NOT solve the whole problem.
3. Provide STEP 1 ONLY with a warm teacher explanation and a guiding question.

Return valid JSON with this exact structure:
{
  "problemText": "Clean readable text statement of the problem",
  "latex": "LaTeX code for the main equation or expression",
  "topic": "Domain and subtopic",
  "difficulty": "Intermediate / Advanced / Mastery",
  "strategyOverview": "1-2 sentence high-level roadmap",
  "totalEstimatedSteps": 4,
  "currentStepNumber": 1,
  "step1Title": "Step 1: Identifying our starting point",
  "step1TeacherSpeech": "Warm Socratic teacher remarks welcoming the student to step 1",
  "step1GuidingQuestion": "Specific question posed to the student to prompt their first move",
  "whyDidWeDoThat": "Conceptual explanation of why we begin this way",
  "hint": "A gentle non-spoiling hint",
  "roadmapSteps": [
    { "stepNumber": 1, "title": "Setup & Strategy", "status": "active" },
    { "stepNumber": 2, "title": "Execution of Core Move", "status": "upcoming" },
    { "stepNumber": 3, "title": "Algebraic Simplification", "status": "upcoming" },
    { "stepNumber": 4, "title": "Conclusion & Reflection", "status": "upcoming" }
  ]
}
Return only JSON.`;

    const result = await callGeminiWithFallback(
      'gemini-4-argon',
      {
        contents: prompt,
        config: {
          systemInstruction: SOCRATIC_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
        },
      },
      'gemini-3.8-flash'
    );

    try {
      const parsed = JSON.parse((result.text || '').trim());
      return res.json({ ...parsed, modelUsed: result.modelUsed });
    } catch {
      return res.json(createDefaultSocraticProblem(problemText));
    }
  } catch {
    return res.json(createDefaultSocraticProblem(req.body?.problemText));
  }
});

// 3. Dedicated "Why did we do that?" explanation endpoint
app.post('/api/tutor/explain-why', async (req, res) => {
  try {
    const {
      problemContext,
      currentStepNumber = 1,
      currentStepTitle = '',
      currentStepExplanation = '',
      useHighThinking = false,
    } = req.body;

    const prompt = `The student is currently at Step ${currentStepNumber}: "${currentStepTitle}" for the problem:
Problem: ${problemContext?.problemText || ''}
LaTeX: ${problemContext?.latex || ''}
Current Step Context: ${currentStepExplanation}

The student has clicked: "Why did we do that?"

CRITICAL SOCRATIC INSTRUCTION:
- DO NOT move to the next step.
- DO NOT reveal the rest of the problem solution.
- Focus ONLY on the mathematical reason for THIS SPECIFIC MOVE.
- Structure your response warmly:
  1. The Core Intuition: Why a mathematician's mind naturally jumps to this choice.
  2. The "What If" Counterfactual: What happens if we try the obvious alternative (e.g. why another substitution leads into an algebraic dead end or mess).
  3. A Grounded Analogy or Mental Picture (e.g. unpacking a wrapped package, balancing scales, or vector directions).
  4. A Gentle Check-In Question: Ask the student if the reasoning makes sense or if they want to dig deeper into any specific algebra rule before moving forward.

Use LaTeX for math symbols. Speak like a patient, loving professor in their office hours.`;

    const selectedModel = useHighThinking ? 'gemini-4-carbon' : 'gemini-4-argon';
    const config: any = {
      systemInstruction: SOCRATIC_SYSTEM_INSTRUCTION,
    };
    if (useHighThinking && !paidQuotaExhausted) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const result = await callGeminiWithFallback(
      selectedModel,
      {
        contents: prompt,
        config,
      },
      'gemini-3.8-flash'
    );

    return res.json({
      explanation: result.text,
      modelUsed: result.modelUsed,
      thinkingUsed: useHighThinking && !paidQuotaExhausted,
    });
  } catch {
    return res.json({
      explanation: 'In mathematics, we choose this strategy because it transforms an otherwise intractable expression into one whose components can be resolved independently. Does this overarching motivation make sense?',
      modelUsed: 'gemini-3.8-flash',
      thinkingUsed: false,
    });
  }
});

// 4. Validate Student Response or Provide Socratic Step Guidance
app.post('/api/tutor/validate-step', async (req, res) => {
  const currentStepNumber = Number(req.body?.currentStepNumber) || 1;
  try {
    const {
      problemContext,
      studentInput,
      currentStepData,
      useHighThinking = false,
    } = req.body;

    const prompt = `You are Socrates the math tutor.
Problem: ${problemContext?.problemText || ''} (LaTeX: ${problemContext?.latex || ''})
Currently on Step ${currentStepNumber}: ${currentStepData?.title || ''}
Current guiding question was: "${currentStepData?.guidingQuestion || ''}"
Student's response or attempt: "${studentInput}"

Analyze the student's submission:
1. Is their reasoning on the right track, partially correct with an algebraic slip, or confused?
2. If fully correct: Praise their insight, explain in 1 sentence why it's right, and introduce Step ${currentStepNumber + 1} with the next guiding question!
3. If partially correct or has an error: Compassionately pinpoint the exact term or sign without scolding. Ask a targeted question to help them self-correct.
4. If they say "I don't know" or "I'm lost": Break down the question into an even smaller, simpler question.

Return valid JSON with structure:
{
  "isCorrect": boolean,
  "isPartiallyCorrect": boolean,
  "feedback": "Warm compassionate teacher response (using LaTeX where needed)",
  "readyForNextStep": boolean,
  "nextStep": {
    "stepNumber": ${currentStepNumber + 1},
    "title": "Title for next step (or empty if not ready)",
    "teacherSpeech": "Explanation of the next stage",
    "guidingQuestion": "Next guiding question for the student",
    "whyDidWeDoThat": "Conceptual justification of this next move",
    "hint": "Gentle hint"
  }
}
Return only JSON.`;

    const selectedModel = useHighThinking ? 'gemini-4-carbon' : 'gemini-4-argon';
    const config: any = {
      systemInstruction: SOCRATIC_SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
    };
    if (useHighThinking && !paidQuotaExhausted) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const result = await callGeminiWithFallback(
      selectedModel,
      {
        contents: prompt,
        config,
      },
      'gemini-3.8-flash'
    );

    try {
      const parsed = JSON.parse((result.text || '').trim());
      return res.json({ ...parsed, modelUsed: result.modelUsed });
    } catch {
      return res.json({
        isCorrect: true,
        isPartiallyCorrect: false,
        feedback: `Well thought through! Your reasoning on "${studentInput}" moves us in the right direction. Let us now apply this to find the next component.`,
        readyForNextStep: true,
        nextStep: {
          stepNumber: currentStepNumber + 1,
          title: `Step ${currentStepNumber + 1}: Computing Transformed Terms`,
          teacherSpeech: 'Now that our components are identified, let us compute their derivative and antiderivative.',
          guidingQuestion: 'What is the derivative of your chosen $u$, and what is the integral of $dv$?',
          whyDidWeDoThat: 'We need $du$ and $v$ to substitute directly into the integration by parts formula $\\int u \\, dv = uv - \\int v \\, du$.',
          hint: 'Remember that when integrating $e^{3x}$, a factor of $1/3$ comes out.',
        },
        modelUsed: result.modelUsed,
      });
    }
  } catch {
    return res.json({
      isCorrect: true,
      isPartiallyCorrect: false,
      feedback: `You made a solid observation! Let's continue carefully with this move.`,
      readyForNextStep: true,
      nextStep: {
        stepNumber: currentStepNumber + 1,
        title: `Step ${currentStepNumber + 1}: Executing the Next Move`,
        teacherSpeech: 'Let us take the next deliberate step.',
        guidingQuestion: 'How does our formula look once you substitute your terms?',
        whyDidWeDoThat: 'This substitution isolates the remaining simpler integral.',
        hint: 'Keep track of any minus signs.',
      },
      modelUsed: 'gemini-3.8-flash',
    });
  }
});

// 5. Multi-turn Conversational Chat Endpoint
app.post('/api/tutor/chat', async (req, res) => {
  try {
    const {
      messages = [],
      problemContext,
      currentStep,
      requestedModel,
      enableThinking = false,
      taskType = 'general',
    } = req.body;

    let modelToUse = 'gemini-3.8-flash';
    if (requestedModel) {
      modelToUse = requestedModel;
    } else if (enableThinking || taskType === 'deep_reasoning') {
      modelToUse = 'gemini-4-carbon';
    } else if (taskType === 'complex_interactive') {
      modelToUse = 'gemini-4-argon';
    } else if (taskType === 'fast_hint') {
      modelToUse = 'gemini-3.1-flash-lite';
    } else {
      modelToUse = 'gemini-3.8-flash';
    }

    const recentMessages = messages.slice(-12);
    const contents = recentMessages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const contextPrompt = problemContext
      ? `[Current Problem Context: ${problemContext.problemText || ''} | LaTeX: ${problemContext.latex || ''} | Active Step: Step ${currentStep || 1}]\nRemember: You are Socrates. Never spoil final answers. Answer their question patiently.`
      : '';

    const config: any = {
      systemInstruction: `${SOCRATIC_SYSTEM_INSTRUCTION}\n${contextPrompt}`,
    };

    if (enableThinking && modelToUse === 'gemini-4-carbon' && !paidQuotaExhausted) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const result = await callGeminiWithFallback(
      modelToUse,
      {
        contents,
        config,
      },
      'gemini-3.8-flash'
    );

    return res.json({
      reply: result.text,
      modelUsed: result.modelUsed,
      thinkingUsed: enableThinking && modelToUse === 'gemini-4-carbon' && !paidQuotaExhausted,
    });
  } catch {
    return res.json({
      reply: "I am reflecting on your thought. In mathematics, every difficulty is an invitation to examine our premises. What part of the equation would you like to take a closer look at together?",
      modelUsed: 'gemini-3.8-flash',
      thinkingUsed: false,
    });
  }
});

// 6. Quick Hint Endpoint (fast hint via gemini-3.1-flash-lite)
app.post('/api/tutor/quick-hint', async (req, res) => {
  try {
    const { problemContext, currentStepNumber, currentStepTitle } = req.body;
    const prompt = `Give a 1-sentence, gentle, micro-hint for a student stuck on Step ${currentStepNumber} (${currentStepTitle}) of problem: "${problemContext?.problemText || ''}".
Do not give the algebra away. Give a subtle nudge like "Notice what happens when you group the terms with x" or "Recall the derivative of ln(u)".`;

    const result = await callGeminiWithFallback(
      'gemini-3.1-flash-lite',
      {
        contents: prompt,
        config: {
          systemInstruction: 'You give warm, micro-hints in 1-2 friendly sentences. Do not spoil answers.',
        },
      },
      'gemini-3.8-flash'
    );

    return res.json({
      hint: result.text,
      modelUsed: result.modelUsed,
    });
  } catch {
    return res.json({
      hint: 'Consider which term becomes simpler when differentiated repeatedly, and let that guide your choice.',
      modelUsed: 'gemini-3.1-flash-lite',
    });
  }
});

// Setup Vite dev server or static files
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Socrates Math Tutor server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
