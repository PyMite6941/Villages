import type { CourseCreate, LessonCreate } from '../types'

/**
 * Sources that are pre-approved for course content (no per-course review needed).
 * College Board / AP Classroom are always approved for AP courses.
 */
export const APPROVED_SOURCES = [
  'College Board AP',
  'AP Classroom (College Board)',
  'Khan Academy',
]

export function isApprovedSource(source?: string | null): boolean {
  if (!source) return false
  return APPROVED_SOURCES.some((s) => source.toLowerCase().includes(s.toLowerCase().split(' (')[0]))
}

// order_index is assigned when the lessons are seeded, so templates omit it.
export type TemplateLesson = Omit<LessonCreate, 'order_index'>

export interface CourseTemplate {
  id: string
  name: string
  emoji: string
  blurb: string
  course: CourseCreate
  lessons: TemplateLesson[]
}

const KA_CALC = 'https://www.khanacademy.org/math/ap-calculus-ab'

// AP Calculus AB — the 8 official College Board CED units, aligned with Khan Academy.
const apCalcAB: CourseTemplate = {
  id: 'ap-calc-ab',
  name: 'AP Calculus AB (College Board aligned)',
  emoji: '∫',
  blurb: '8-unit AP course following the official College Board framework. Add a video per lesson.',
  course: {
    title: 'AP Calculus AB',
    description:
      'A complete AP Calculus AB course following the official College Board framework\'s 8 units — limits, derivatives, integrals, and their applications. Aligned with Khan Academy\'s free AP Calculus AB course.',
    category: 'math',
    subject: 'Calculus',
    difficulty: 'advanced',
    estimated_hours: 45,
    thumbnail_emoji: '∫',
    source: 'College Board AP + Khan Academy',
  },
  lessons: [
    {
      title: 'Unit 1 — Limits and Continuity',
      duration_minutes: 60,
      video_url: '',
      content:
        'Exam weight: 10–12%.\n\nKey ideas:\n• Estimating limits from graphs and tables\n• Determining limits algebraically (factoring, conjugates, limit laws)\n• One-sided limits\n• The Squeeze Theorem\n• Continuity at a point and over an interval; types of discontinuity\n• The Intermediate Value Theorem (IVT)\n• Infinite limits and limits at infinity → vertical & horizontal asymptotes\n\n▶️ Add a video for this unit. Practice: ' + KA_CALC + '\nSource: College Board AP Course & Exam Description.',
    },
    {
      title: 'Unit 2 — Differentiation: Definition & Fundamental Properties',
      duration_minutes: 60,
      video_url: '',
      content:
        'Exam weight: 10–12%.\n\nKey ideas:\n• Average vs. instantaneous rate of change\n• The derivative as the limit of a difference quotient\n• Differentiability implies continuity (but not vice versa)\n• Power rule, constant multiple, sum/difference rules\n• Product rule and quotient rule\n• Derivatives of sin x, cos x, eˣ, and ln x\n\n▶️ Add a video for this unit. Practice: ' + KA_CALC + '\nSource: College Board AP Course & Exam Description.',
    },
    {
      title: 'Unit 3 — Differentiation: Composite, Implicit & Inverse Functions',
      duration_minutes: 55,
      video_url: '',
      content:
        'Exam weight: 9–13%.\n\nKey ideas:\n• The Chain Rule for composite functions\n• Implicit differentiation\n• Derivatives of inverse functions and inverse trig functions\n• Higher-order (second and beyond) derivatives\n\n▶️ Add a video for this unit. Practice: ' + KA_CALC + '\nSource: College Board AP Course & Exam Description.',
    },
    {
      title: 'Unit 4 — Contextual Applications of Differentiation',
      duration_minutes: 55,
      video_url: '',
      content:
        'Exam weight: 10–15%.\n\nKey ideas:\n• Interpreting the derivative in context (rates)\n• Straight-line motion: position, velocity, acceleration\n• Related rates problems\n• Local linearity and linear approximation\n• L\'Hôpital\'s Rule for indeterminate forms\n\n▶️ Add a video for this unit. Practice: ' + KA_CALC + '\nSource: College Board AP Course & Exam Description.',
    },
    {
      title: 'Unit 5 — Analytical Applications of Differentiation',
      duration_minutes: 65,
      video_url: '',
      content:
        'Exam weight: 15–18%.\n\nKey ideas:\n• Mean Value Theorem and Extreme Value Theorem\n• Increasing/decreasing intervals from f′\n• First and second derivative tests for extrema\n• Concavity and points of inflection\n• Optimization problems\n• Connecting graphs of f, f′, and f″; curve sketching\n\n▶️ Add a video for this unit. Practice: ' + KA_CALC + '\nSource: College Board AP Course & Exam Description.',
    },
    {
      title: 'Unit 6 — Integration and Accumulation of Change',
      duration_minutes: 65,
      video_url: '',
      content:
        'Exam weight: 17–20%.\n\nKey ideas:\n• Riemann sums (left, right, midpoint) and trapezoidal sums\n• The definite integral as a limit / as accumulation\n• The Fundamental Theorem of Calculus (both parts)\n• Antiderivatives and indefinite integrals\n• u-substitution\n• Accumulation functions and their derivatives\n\n▶️ Add a video for this unit. Practice: ' + KA_CALC + '\nSource: College Board AP Course & Exam Description.',
    },
    {
      title: 'Unit 7 — Differential Equations',
      duration_minutes: 50,
      video_url: '',
      content:
        'Exam weight: 6–12%.\n\nKey ideas:\n• Modeling situations with differential equations\n• Slope fields and interpreting solutions\n• Separation of variables\n• Exponential growth and decay models\n\n▶️ Add a video for this unit. Practice: ' + KA_CALC + '\nSource: College Board AP Course & Exam Description.',
    },
    {
      title: 'Unit 8 — Applications of Integration',
      duration_minutes: 60,
      video_url: '',
      content:
        'Exam weight: 10–15%.\n\nKey ideas:\n• Average value of a function\n• Net change and motion via integration\n• Area between curves\n• Volumes with cross-sections\n• Volumes of revolution (disc & washer methods)\n\n▶️ Add a video for this unit. Practice: ' + KA_CALC + '\nSource: College Board AP Course & Exam Description.',
    },
  ],
}

// Generic structured skill course (Khan-style: short concept lessons).
const skillCourse: CourseTemplate = {
  id: 'skill-course',
  name: 'Skill Course (concept-by-concept)',
  emoji: '🎯',
  blurb: 'A clean scaffold of short concept lessons. Great for any school subject.',
  course: {
    title: '',
    description: 'A step-by-step course that builds one concept at a time, with a video and practice for each.',
    category: 'math',
    subject: 'Mathematics',
    difficulty: 'beginner',
    estimated_hours: 6,
    thumbnail_emoji: '🎯',
    source: '',
  },
  lessons: [
    { title: 'Lesson 1 — Foundations', duration_minutes: 20, video_url: '', content: 'Introduce the core idea. Define key terms, show one worked example, and link a short video.\n\n▶️ Paste an embeddable video URL above.' },
    { title: 'Lesson 2 — Core technique', duration_minutes: 25, video_url: '', content: 'Teach the main method. Walk through 2–3 examples of increasing difficulty.' },
    { title: 'Lesson 3 — Practice & apply', duration_minutes: 25, video_url: '', content: 'Apply the skill to real problems. End with the AI practice questions so learners can self-check.' },
  ],
}

// Generic hobby / project course.
const hobbyProject: CourseTemplate = {
  id: 'hobby-project',
  name: 'Hobby / Project Course',
  emoji: '🛠️',
  blurb: 'Project-based scaffold for hobbies — learn by making something.',
  course: {
    title: '',
    description: 'A hands-on, project-based course where learners build something real, step by step.',
    category: 'lifeskills',
    subject: 'Crafts & DIY',
    difficulty: 'beginner',
    estimated_hours: 4,
    thumbnail_emoji: '🛠️',
    source: '',
  },
  lessons: [
    { title: 'Getting started — tools & setup', duration_minutes: 15, video_url: '', content: 'What learners need before starting. List materials/tools and set expectations.\n\n▶️ Paste an embeddable video URL above.' },
    { title: 'Building the basics', duration_minutes: 30, video_url: '', content: 'The first hands-on steps. Show, don\'t just tell — a demo video works great here.' },
    { title: 'Finishing & next steps', duration_minutes: 25, video_url: '', content: 'Complete the project and suggest ways to keep improving.' },
  ],
}

export const COURSE_TEMPLATES: CourseTemplate[] = [apCalcAB, skillCourse, hobbyProject]
