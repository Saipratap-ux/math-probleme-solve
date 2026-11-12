import { SampleProblem } from '../types/tutor';

// Generates an educational blackboard / notebook image SVG data URL
function generateMathSvgDataUrl(title: string, latexSnippet: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340">
    <rect width="600" height="340" fill="#1c1917" rx="8" />
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#292524" stroke-width="0.8"/>
    </pattern>
    <rect width="600" height="340" fill="url(#grid)" />
    <!-- Chalk smudge aesthetics -->
    <circle cx="200" cy="160" r="140" fill="#292524" opacity="0.25" filter="blur(20px)" />
    <text x="32" y="44" fill="#a8a29e" font-family="sans-serif" font-size="12" letter-spacing="1">PROBLEM SNAPSHOT · NOTEBOOK EXCERPT</text>
    <line x1="32" y1="56" x2="568" y2="56" stroke="#44403c" stroke-width="1" />
    <text x="32" y="100" fill="#f5f5f4" font-family="serif" font-size="20" font-weight="600">${title}</text>
    <rect x="32" y="128" width="536" height="130" rx="6" fill="#0c0a09" stroke="#38302b" stroke-width="1" />
    <text x="56" y="186" fill="#fef08a" font-family="'STIX Two Text', 'Courier New', serif" font-size="28" font-style="italic">${latexSnippet}</text>
    <text x="56" y="226" fill="#a8a29e" font-family="sans-serif" font-size="13">Handwritten in Prof. Chen's lecture notes (Week 4)</text>
    <text x="32" y="304" fill="#78716c" font-family="sans-serif" font-size="12">Socrates Math Tutor · Ready for Socratic Breakdown</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_PROBLEMS: SampleProblem[] = [
  {
    id: 'calc-int-parts',
    title: 'Calculus: Integration by Parts with Polynomial & Exponential',
    category: 'Calculus',
    latex: '\\int x^2 e^{3x} \\, dx',
    description: 'Evaluate the indefinite integral using repeated integration by parts.',
    difficulty: 'Intermediate',
    previewImage: generateMathSvgDataUrl('Evaluate Indefinite Integral', '∫ x² e³ˣ dx'),
  },
  {
    id: 'calc-trig-sub',
    title: 'Calculus: Trigonometric Substitution with Radicals',
    category: 'Calculus',
    latex: '\\int \\frac{\\sqrt{9 - x^2}}{x^2} \\, dx',
    description: 'Find the antiderivative using a sine substitution $x = 3\\sin(\\theta)$.',
    difficulty: 'Advanced',
    previewImage: generateMathSvgDataUrl('Trigonometric Substitution', '∫ √(9 - x²) / x² dx'),
  },
  {
    id: 'calc-lhopital',
    title: 'Calculus: Indeterminate Limit Requiring L\'Hôpital',
    category: 'Calculus',
    latex: '\\lim_{x \\to 0} \\frac{e^x - 1 - x}{x^2}',
    description: 'Evaluate the limit of indeterminate form 0/0 using series or L\'Hôpital\'s Rule.',
    difficulty: 'Intermediate',
    previewImage: generateMathSvgDataUrl('Indeterminate Limit (0/0)', 'lim[x→0] (eˣ - 1 - x) / x²'),
  },
  {
    id: 'alg-rational',
    title: 'Algebra: Rational Equation with Extraneous Roots',
    category: 'Algebra',
    latex: '\\frac{2x}{x-3} - \\frac{x+2}{x+1} = \\frac{14}{x^2 - 2x - 3}',
    description: 'Solve for x while checking for undefined domain points and extraneous solutions.',
    difficulty: 'Intermediate',
    previewImage: generateMathSvgDataUrl('Rational Equation with Extraneous Roots', '2x/(x-3) - (x+2)/(x+1) = 14/(x²-2x-3)'),
  },
  {
    id: 'alg-logs',
    title: 'Algebra: Coupled Logarithmic System',
    category: 'Algebra',
    latex: '\\log_2(x) + \\log_2(x - 3) = 2',
    description: 'Solve the logarithmic equation, applying the product rule of logarithms.',
    difficulty: 'Intermediate',
    previewImage: generateMathSvgDataUrl('Logarithmic Equation', 'log₂(x) + log₂(x - 3) = 2'),
  },
  {
    id: 'calc-chain-product',
    title: 'Calculus: Implicit Differentiation on Folium of Descartes',
    category: 'Calculus',
    latex: 'x^3 + y^3 = 6xy',
    description: 'Find the derivative dy/dx using implicit differentiation and isolate the slope.',
    difficulty: 'Advanced',
    previewImage: generateMathSvgDataUrl('Implicit Differentiation', 'x³ + y³ = 6xy · Find dy/dx'),
  },
];
