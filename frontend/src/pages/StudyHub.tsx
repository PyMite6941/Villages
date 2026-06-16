import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Brain, PenLine, CalendarDays, Send, RotateCcw, AlertCircle, CheckCircle, ChevronDown, GraduationCap } from 'lucide-react'
import { api } from '../lib/api'
import type { UserProfile } from '../types'
import toast from 'react-hot-toast'

interface Props { session: Session }

type Tab = 'buddy' | 'essay' | 'plan' | 'college'

const SCHOOL_LEVELS = new Set([
  '6th Grade', '7th Grade', '8th Grade',
  '9th Grade', '10th Grade', '11th Grade', '12th Grade',
  'College Freshman', 'College Sophomore', 'College Junior', 'College Senior',
  'Graduate Student', 'Doctoral Student',
  'Law School', 'Medical School', 'Trade School', 'Vocational Program',
])

const COLLEGE_PREP_LEVELS = new Set(['11th Grade', '12th Grade'])

const ALL_SUBJECTS = [
  'Mathematics', 'Science', 'English', 'History', 'Computer Science', 'Languages',
  'Social Studies', 'Test Prep', 'Physics', 'Chemistry', 'Biology', 'Economics',
  'Music', 'Visual Arts', 'Photography', 'Cooking', 'Creative Writing',
  'Fitness & Sports', 'Film & Video', 'Crafts & DIY', 'Gaming', 'Dance',
  'Gardening', 'Personal Finance',
]

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StudyHub({ session }: Props) {
  const [tab, setTab] = useState<Tab>('buddy')
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    api.users.getProfile(session.user.id).then(setProfile).catch(() => null)
  }, [session.user.id])

  const isInSchool = profile ? SCHOOL_LEVELS.has(profile.academic_level) : false
  const isCollegePrep = profile
    ? COLLEGE_PREP_LEVELS.has(profile.academic_level) || profile.study_tags?.some(t => t.toLowerCase().includes('college') || t.toLowerCase().includes('university') || t === 'high_schooler')
    : false

  const tabs: { id: Tab; label: string; icon: React.ReactNode; desc: string; lockReason?: string }[] = [
    { id: 'buddy',   label: 'Study Buddy',  icon: <Brain size={15} />,         desc: 'Socratic AI tutor' },
    { id: 'essay',   label: 'Essay Coach',  icon: <PenLine size={15} />,       desc: 'Application critique',
      lockReason: isInSchool ? undefined : 'Available for students (Grade 6–University)' },
    { id: 'plan',    label: 'Study Plan',   icon: <CalendarDays size={15} />,  desc: 'Weekly schedule' },
    { id: 'college', label: 'College Prep', icon: <GraduationCap size={15} />, desc: 'College advisor + essay',
      lockReason: isCollegePrep ? undefined : 'Enable "High Schooler" in your profile or set grade to 11/12' },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="text-village-600" size={22} />
            Study Hub
          </h1>
          <span className="badge bg-village-100 text-village-700 text-xs">👤 Personal</span>
        </div>
        <p className="text-gray-500 text-sm">
          Your private AI study space — 1-on-1 tools that exist outside your Villages
        </p>
      </div>

      {/* Distinction callout */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm">
        <span className="text-lg mt-0.5">🏘️</span>
        <div>
          <span className="font-medium text-amber-900">Study Hub vs. Villages</span>
          <span className="text-amber-800 ml-1.5">
            Study Hub is for personal work — solo AI tutoring, your own essays, your own schedule.
            For group discussion, peer collaboration, and shared challenges, go to your{' '}
            <a href="/villages" className="underline font-medium">Villages</a>.
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-amber-50 rounded-xl border border-amber-100 flex-wrap">
        {tabs.map(({ id, label, icon, desc, lockReason }) => {
          const isLocked = !!lockReason
          return (
          <button
            key={id}
            onClick={() => !isLocked && setTab(id)}
            title={lockReason}
            className={`flex-1 min-w-[6rem] flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
              isLocked
                ? 'text-gray-300 cursor-not-allowed'
                : tab === id
                ? 'bg-white shadow-sm text-village-700 border border-amber-100'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1.5">{icon}{label}</span>
            <span className="text-xs font-normal opacity-60 hidden sm:block">
              {lockReason ? `🔒 ${lockReason}` : desc}
            </span>
          </button>
          )
        })}
      </div>

      {tab === 'buddy'   && <StudyBuddy />}
      {tab === 'essay'   && !tabs.find(t => t.id === 'essay')?.lockReason && <EssayCoach profile={profile} />}
      {tab === 'plan'    && <StudyPlan  profile={profile} />}
      {tab === 'college' && !tabs.find(t => t.id === 'college')?.lockReason && <CollegePrep profile={profile} />}
    </div>
  )
}

// ── Study Buddy (Socratic chat) ───────────────────────────────────────────────

interface ChatMessage { role: 'user' | 'assistant'; content: string }

function StudyBuddy() {
  const [subject, setSubject] = useState('Mathematics')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const reset = () => {
    setMessages([])
    setInput('')
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const newHistory: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(newHistory)
    setInput('')
    setLoading(true)
    try {
      const { response } = await api.ai.studyBuddy(subject, text, newHistory)
      setMessages([...newHistory, { role: 'assistant', content: response }])
    } catch {
      toast.error('Study Buddy is unavailable right now')
      setMessages(newHistory)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Subject</label>
          <div className="relative">
            <select
              value={subject}
              onChange={(e) => { setSubject(e.target.value); reset() }}
              className="input pr-8 appearance-none text-sm"
            >
              {ALL_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={reset} className="btn-secondary text-xs flex items-center gap-1 mt-5">
            <RotateCcw size={12} /> New chat
          </button>
        )}
      </div>

      {/* Anti-direct-answer notice */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
        <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-500" />
        <span>
          Your Study Buddy uses the <strong>Socratic method</strong> — it guides you to find the
          answer yourself with questions, rather than just telling you. This builds deeper understanding.
        </span>
      </div>

      {/* Chat area */}
      <div className="min-h-56 max-h-96 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <Brain size={24} className="mx-auto mb-2 text-village-300" />
            Ask anything about <strong className="text-gray-600">{subject}</strong> — your Study Buddy will
            guide you with questions.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-village-600 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                🧠
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-village-600 text-white rounded-br-sm'
                  : 'bg-amber-50 text-gray-800 border border-amber-100 rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-village-600 text-white flex items-center justify-center text-xs shrink-0">🧠</div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl rounded-bl-sm px-3.5 py-2.5 text-sm text-gray-400 italic">
              Thinking of a question for you...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={`Ask about ${subject}...`}
          className="input flex-1 text-sm"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="btn-primary px-4 flex items-center gap-1.5"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Essay Coach ───────────────────────────────────────────────────────────────

interface EssayFeedback {
  strengths: string[]
  improvements: string[]
  vulnerabilities: string[]
  overall: string
}

function EssayCoach({ profile }: { profile: UserProfile | null }) {
  const [essay, setEssay] = useState('')
  const [essayPrompt, setEssayPrompt] = useState('')
  const [context, setContext] = useState(
    profile
      ? `Academic level: ${profile.academic_level}. Goals: ${profile.goals.join(', ')}.`
      : ''
  )
  const [feedback, setFeedback] = useState<EssayFeedback | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile && !context) {
      setContext(`Academic level: ${profile.academic_level}. Goals: ${profile.goals.join(', ')}.`)
    }
  }, [profile])

  const analyze = async () => {
    if (essay.trim().length < 50) {
      toast.error('Paste your essay first (minimum 50 characters)')
      return
    }
    setLoading(true)
    setFeedback(null)
    try {
      const result = await api.ai.essayCoach(essay, essayPrompt, context)
      setFeedback(result)
    } catch {
      toast.error('Essay Coach is unavailable right now')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card space-y-4">
      {/* Anti-ghostwriting notice */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
        <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-500" />
        <span>
          <strong>Anti-ghostwriting policy:</strong> This tool only critiques and analyzes your writing.
          It will never generate essay content for you, in compliance with academic integrity standards.
        </span>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Essay Prompt <span className="text-gray-400 font-normal">(optional)</span></label>
        <input
          value={essayPrompt}
          onChange={(e) => setEssayPrompt(e.target.value)}
          placeholder='e.g. "Describe a challenge you overcame and what you learned..."'
          className="input text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Student Context <span className="text-gray-400 font-normal">(optional — helps evaluate achievement in context)</span>
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder='e.g. "Rural Title I school, 3.82 GPA, 4/4 APs offered taken..."'
          rows={2}
          className="input text-sm resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Your Essay</label>
        <textarea
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          placeholder="Paste your college essay here..."
          rows={10}
          className="input text-sm resize-none font-mono leading-relaxed"
        />
        <div className="text-xs text-gray-400 mt-1 text-right">{essay.length} characters</div>
      </div>

      <button onClick={analyze} disabled={loading || essay.trim().length < 50} className="btn-primary text-sm w-full">
        {loading ? 'Analyzing...' : '🔍 Analyze Essay →'}
      </button>

      {/* Feedback output */}
      {feedback && (
        <div className="space-y-4 pt-2 border-t border-amber-100">
          {feedback.overall && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="text-xs font-semibold text-amber-800 mb-1 uppercase tracking-wide">Overall Assessment</div>
              <p className="text-sm text-gray-700 leading-relaxed">{feedback.overall}</p>
            </div>
          )}

          {feedback.strengths.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 mb-2">
                <CheckCircle size={14} /> Key Strengths
              </div>
              <ul className="space-y-1.5">
                {feedback.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.improvements.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-700 mb-2">
                <PenLine size={14} /> Areas to Improve
              </div>
              <ul className="space-y-1.5">
                {feedback.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-400 mt-0.5 shrink-0">→</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.vulnerabilities.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-rose-700 mb-2">
                <AlertCircle size={14} /> Strategic Vulnerabilities
              </div>
              <ul className="space-y-1.5">
                {feedback.vulnerabilities.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-rose-400 mt-0.5 shrink-0">⚠</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Study Plan (Multi-week timeline planner) ──────────────────────────────────

interface PlannerWeek {
  week: number
  dates: string
  focus: string
  tasks: string[]
  milestone: string
}

function StudyPlan({ profile }: { profile: UserProfile | null }) {
  const [subject, setSubject] = useState('Mathematics')
  const [customSubject, setCustomSubject] = useState('')
  const [target, setTarget] = useState('')
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [weeklyHours, setWeeklyHours] = useState(10)
  const [plan, setPlan] = useState<{ weeks: PlannerWeek[]; total_weeks: number; summary: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const effectiveSubject = customSubject || subject

  const generate = async () => {
    if (!profile) {
      toast.error('Could not load your profile — try refreshing')
      return
    }
    if (!effectiveSubject) {
      toast.error('Select or type a subject')
      return
    }
    if (!target) {
      toast.error('Describe your target — e.g. "Final exam", "SAT", "Project deadline"')
      return
    }
    setLoading(true)
    setPlan(null)
    try {
      const result = await api.ai.studyPlanner({
        goals: profile.goals,
        strengths: profile.strengths,
        weaknesses: profile.weaknesses,
        academic_level: profile.academic_level,
        subject: effectiveSubject,
        target,
        target_date: targetDate,
        weekly_hours: weeklyHours,
      })
      setPlan(result)
    } catch {
      toast.error('Study Planner is unavailable right now')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card space-y-5">
      <div>
        <h2 className="font-semibold text-gray-900 mb-1">Multi-Week Study Planner</h2>
        <p className="text-sm text-gray-500">
          Plan from today toward a specific target date — exams, project deadlines,
          or personal milestones. The AI builds a week-by-week timeline.
        </p>
      </div>

      {/* Profile context preview */}
      {profile && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm space-y-1.5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Planning based on</div>
          <div className="flex flex-wrap gap-1.5">
            <span className="badge bg-village-100 text-village-700 text-xs">{profile.academic_level}</span>
            {profile.goals.slice(0, 4).map((g) => (
              <span key={g} className="badge bg-gray-100 text-gray-600 text-xs">{g}</span>
            ))}
          </div>
          {profile.weaknesses.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Prioritizing: {profile.weaknesses.join(', ')}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Subject</label>
          <select
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setCustomSubject('') }}
            className="input text-sm"
          >
            <option value="">— Custom —</option>
            {ALL_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Custom Subject</label>
          <input
            value={customSubject}
            onChange={(e) => { setCustomSubject(e.target.value); setSubject('') }}
            placeholder="e.g. Organic Chemistry, N5 Kanji"
            className="input text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Target / Goal</label>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="e.g. AP Biology exam, Piano recital"
            className="input text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Target Date</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="input text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Available study hours per week: <strong className="text-village-700">{weeklyHours}h</strong>
        </label>
        <input
          type="range"
          min={3}
          max={40}
          step={1}
          value={weeklyHours}
          onChange={(e) => setWeeklyHours(Number(e.target.value))}
          className="w-full accent-village-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>3h</span><span>20h</span><span>40h</span>
        </div>
      </div>

      <button onClick={generate} disabled={loading || !effectiveSubject || !target} className="btn-primary text-sm w-full">
        {loading ? 'Building your timeline...' : '📅 Generate Study Timeline →'}
      </button>

      {plan && (
        <div className="space-y-4">
          <div className="border border-amber-100 rounded-xl overflow-hidden">
            <div className="bg-village-700 text-white px-4 py-2.5 text-sm font-medium flex items-center gap-2">
              <CalendarDays size={14} /> Study Timeline — {effectiveSubject}
            </div>
            <div className="p-4 bg-amber-50 text-sm text-gray-700 leading-relaxed border-b border-amber-100">
              {plan.summary}
            </div>
            <div className="divide-y divide-amber-100">
              {plan.weeks.map((w) => (
                <div key={w.week} className="px-4 py-3 hover:bg-amber-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-village-700 uppercase tracking-wide">
                      Week {w.week}
                    </span>
                    <span className="text-xs text-gray-400">{w.dates}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-1">{w.focus}</div>
                  <ul className="space-y-0.5 mb-2">
                    {w.tasks.map((t, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <span className="text-village-400 mt-0.5 shrink-0">▸</span>{t}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100/50 rounded-md px-2 py-1">
                    <CheckCircle size={11} /> Milestone: {w.milestone}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-gray-400 text-center">
            Regenerate anytime — adjust your hours, subject, or target date.
          </div>
        </div>
      )}
    </div>
  )
}

// ── College Prep track (High Schooler tag required) ───────────────────────────

type CollegeTab = 'essay' | 'advisor'
interface CollegeMessage { role: 'user' | 'assistant'; content: string }

const COMMON_APP_PROMPTS = [
  'Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it.',
  'The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure.',
  'Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?',
  'Reflect on something that someone has done for you that has made you happy or thankful in a surprising way.',
  'Discuss an accomplishment, event, or realization that sparked a period of personal growth.',
  'Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time.',
  'Share an essay on any topic of your choice.',
]

function CollegePrep({ profile }: { profile: UserProfile | null }) {
  const [colTab, setColTab] = useState<CollegeTab>('essay')

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap size={16} className="text-village-600" />
        <h2 className="font-semibold text-gray-900">College Prep</h2>
        <span className="badge bg-blue-100 text-blue-700 text-xs">🎓 High Schooler Track</span>
      </div>

      <div className="flex gap-1 p-1 bg-amber-50 rounded-xl border border-amber-100 mb-5">
        {([
          { id: 'essay' as CollegeTab, label: '✍️ Application Essay', desc: 'College-specific critique' },
          { id: 'advisor' as CollegeTab, label: '🏛️ College Fit Advisor', desc: 'Find the right schools' },
        ]).map(({ id, label, desc }) => (
          <button
            key={id}
            onClick={() => setColTab(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              colTab === id
                ? 'bg-white shadow-sm text-village-700 border border-amber-100'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            <span className="text-xs font-normal opacity-60 hidden sm:block">{desc}</span>
          </button>
        ))}
      </div>

      {colTab === 'essay' && <CollegeEssayWorkshop profile={profile} />}
      {colTab === 'advisor' && <CollegeFitAdvisor profile={profile} />}
    </div>
  )
}

function CollegeEssayWorkshop({ profile }: { profile: UserProfile | null }) {
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [essay, setEssay] = useState('')
  const [context, setContext] = useState(
    profile ? `${profile.academic_level}. Goals: ${profile.goals.join(', ')}.` : ''
  )
  const [feedback, setFeedback] = useState<{ strengths: string[]; improvements: string[]; vulnerabilities: string[]; overall: string } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile && !context) {
      setContext(`${profile.academic_level}. Goals: ${profile.goals.join(', ')}.`)
    }
  }, [profile])

  const analyze = async () => {
    const prompt = selectedPrompt || customPrompt
    if (essay.trim().length < 50) {
      toast.error('Paste your essay first (minimum 50 characters)')
      return
    }
    setLoading(true)
    setFeedback(null)
    try {
      const result = await api.ai.essayCoach(essay, prompt, context)
      setFeedback(result)
    } catch {
      toast.error('Essay Workshop is unavailable right now')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
        <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-500" />
        <span>
          <strong>Anti-ghostwriting:</strong> This workshop critiques and coaches only.
          It will never write or rewrite your essay — your voice must be your own.
        </span>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Common App Prompt</label>
        <div className="space-y-1.5 mb-2">
          {COMMON_APP_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => setSelectedPrompt(selectedPrompt === p ? '' : p)}
              className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors ${
                selectedPrompt === p
                  ? 'border-village-400 bg-village-50 text-village-800'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className="font-medium text-gray-400 mr-2">#{i + 1}</span>{p.slice(0, 90)}…
            </button>
          ))}
        </div>
        <input
          value={customPrompt}
          onChange={(e) => { setCustomPrompt(e.target.value); setSelectedPrompt('') }}
          placeholder="Or paste a custom supplemental essay prompt..."
          className="input text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Student Context <span className="text-gray-400 font-normal">(helps evaluate achievement fairly)</span>
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder='e.g. "First-gen college student, 3.9 GPA, Title I school, 4/4 APs available..."'
          rows={2}
          className="input text-sm resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Your Essay</label>
        <textarea
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          placeholder="Paste your college essay here..."
          rows={10}
          className="input text-sm resize-none font-mono leading-relaxed"
        />
        <div className="text-xs text-gray-400 mt-1 flex justify-between">
          <span>{essay.length} chars</span>
          <span className={essay.length > 650 ? 'text-rose-500 font-medium' : ''}>{essay.split(/\s+/).filter(Boolean).length} words</span>
        </div>
      </div>

      <button onClick={analyze} disabled={loading || essay.trim().length < 50} className="btn-primary text-sm w-full">
        {loading ? 'Analyzing...' : '🔍 Get Essay Feedback →'}
      </button>

      {feedback && (
        <div className="space-y-4 pt-2 border-t border-amber-100">
          {feedback.overall && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="text-xs font-semibold text-amber-800 mb-1 uppercase tracking-wide">Overall Assessment</div>
              <p className="text-sm text-gray-700 leading-relaxed">{feedback.overall}</p>
            </div>
          )}
          {feedback.strengths.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 mb-2">
                <CheckCircle size={14} /> Key Strengths
              </div>
              <ul className="space-y-1.5">
                {feedback.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {feedback.improvements.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-700 mb-2">
                <PenLine size={14} /> Areas to Improve
              </div>
              <ul className="space-y-1.5">
                {feedback.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-400 mt-0.5 shrink-0">→</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {feedback.vulnerabilities.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-rose-700 mb-2">
                <AlertCircle size={14} /> Strategic Vulnerabilities
              </div>
              <ul className="space-y-1.5">
                {feedback.vulnerabilities.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-rose-400 mt-0.5 shrink-0">⚠</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CollegeFitAdvisor({ profile }: { profile: UserProfile | null }) {
  const [gpa, setGpa] = useState('')
  const [testScores, setTestScores] = useState('')
  const [interests, setInterests] = useState(profile?.goals?.slice(0, 3).join(', ') ?? '')
  const [preferences, setPreferences] = useState('')
  const [messages, setMessages] = useState<CollegeMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [profileSet, setProfileSet] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startChat = () => {
    if (!gpa && !interests) {
      toast.error('Add at least your GPA or interests to get started')
      return
    }
    setProfileSet(true)
    setMessages([{
      role: 'assistant',
      content: `Hi! I'm your College Fit Advisor. Based on your profile (GPA: ${gpa || 'not provided'}, interests: ${interests || 'not specified'}, preferences: ${preferences || 'open'}), I'll help you find the right schools.\n\nWhat's most important to you in a college? (size, location, major options, campus vibe, cost, etc.)`,
    }])
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const newHistory: CollegeMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(newHistory)
    setInput('')
    setLoading(true)
    try {
      const { response } = await api.ai.collegeAdvisor({
        message: text,
        gpa,
        test_scores: testScores,
        interests: interests.split(',').map((s) => s.trim()).filter(Boolean),
        preferences,
        history: newHistory,
      })
      setMessages([...newHistory, { role: 'assistant', content: response }])
    } catch {
      toast.error('College Advisor is unavailable right now')
      setMessages(newHistory)
    } finally {
      setLoading(false)
    }
  }

  if (!profileSet) {
    return (
      <div className="card space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">College Fit Advisor</h3>
          <p className="text-sm text-gray-500">Tell me a bit about yourself and I'll suggest schools that fit your profile.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">GPA (unweighted)</label>
            <input value={gpa} onChange={(e) => setGpa(e.target.value)} placeholder="e.g. 3.8" className="input text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Test Scores <span className="text-gray-400">(optional)</span></label>
            <input value={testScores} onChange={(e) => setTestScores(e.target.value)} placeholder="e.g. SAT 1380, ACT 31" className="input text-sm" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Interests / Intended Major</label>
          <input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="e.g. Computer Science, Psychology, pre-med" className="input text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Preferences <span className="text-gray-400">(optional)</span></label>
          <input value={preferences} onChange={(e) => setPreferences(e.target.value)} placeholder="e.g. small liberal arts, Northeast, affordable, STEM research" className="input text-sm" />
        </div>
        <button onClick={startChat} className="btn-primary text-sm w-full">
          🏛️ Find My Fit Schools →
        </button>
      </div>
    )
  }

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">College Fit Advisor</div>
        <button onClick={() => { setProfileSet(false); setMessages([]) }} className="btn-secondary text-xs flex items-center gap-1">
          <RotateCcw size={12} /> Restart
        </button>
      </div>

      <div className="min-h-56 max-h-96 overflow-y-auto space-y-3 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-village-600 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">🏛️</div>
            )}
            <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-village-600 text-white rounded-br-sm'
                : 'bg-amber-50 text-gray-800 border border-amber-100 rounded-bl-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-village-600 text-white flex items-center justify-center text-xs shrink-0">🏛️</div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl rounded-bl-sm px-3.5 py-2.5 text-sm text-gray-400 italic">
              Researching schools for you...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about schools, majors, application strategy..."
          className="input flex-1 text-sm"
          disabled={loading}
        />
        <button onClick={send} disabled={!input.trim() || loading} className="btn-primary px-4 flex items-center">
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
