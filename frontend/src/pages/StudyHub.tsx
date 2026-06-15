import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Brain, PenLine, CalendarDays, Send, RotateCcw, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react'
import { api } from '../lib/api'
import type { UserProfile } from '../types'
import toast from 'react-hot-toast'

interface Props { session: Session }

type Tab = 'buddy' | 'essay' | 'plan'

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

  const tabs: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'buddy', label: 'Study Buddy', icon: <Brain size={15} />, desc: 'Socratic AI tutor' },
    { id: 'essay', label: 'Essay Coach', icon: <PenLine size={15} />, desc: 'Application critique' },
    { id: 'plan',  label: 'Study Plan',  icon: <CalendarDays size={15} />, desc: 'Weekly schedule' },
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
      <div className="flex gap-1 mb-6 p-1 bg-amber-50 rounded-xl border border-amber-100">
        {tabs.map(({ id, label, icon, desc }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === id
                ? 'bg-white shadow-sm text-village-700 border border-amber-100'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1.5">{icon}{label}</span>
            <span className="text-xs font-normal opacity-60 hidden sm:block">{desc}</span>
          </button>
        ))}
      </div>

      {tab === 'buddy' && <StudyBuddy />}
      {tab === 'essay' && <EssayCoach profile={profile} />}
      {tab === 'plan'  && <StudyPlan  profile={profile} />}
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

// ── Study Plan ────────────────────────────────────────────────────────────────

function StudyPlan({ profile }: { profile: UserProfile | null }) {
  const [weeklyHours, setWeeklyHours] = useState(10)
  const [plan, setPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    if (!profile) {
      toast.error('Could not load your profile — try refreshing')
      return
    }
    if (profile.goals.length === 0) {
      toast.error('Add some goals to your profile first so the planner can personalize your schedule')
      return
    }
    setLoading(true)
    setPlan(null)
    try {
      const result = await api.ai.studyPlan({
        goals: profile.goals,
        strengths: profile.strengths,
        weaknesses: profile.weaknesses,
        academic_level: profile.academic_level,
        weekly_hours: weeklyHours,
      })
      setPlan(result.plan)
    } catch {
      toast.error('Study Planner is unavailable right now')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card space-y-5">
      <div>
        <h2 className="font-semibold text-gray-900 mb-1">Personalized Weekly Study Plan</h2>
        <p className="text-sm text-gray-500">
          Generated from your profile goals, strengths, and areas to improve. Add or update goals
          in your <a href="/profile" className="text-village-600 underline">profile</a> to get a better plan.
        </p>
      </div>

      {/* Profile context preview */}
      {profile && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm space-y-1.5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Planning based on</div>
          <div className="flex flex-wrap gap-1.5">
            <span className="badge bg-village-100 text-village-700 text-xs">{profile.academic_level}</span>
            {profile.goals.slice(0, 6).map((g) => (
              <span key={g} className="badge bg-gray-100 text-gray-600 text-xs">{g}</span>
            ))}
            {profile.goals.length > 6 && (
              <span className="badge bg-gray-100 text-gray-400 text-xs">+{profile.goals.length - 6} more</span>
            )}
          </div>
          {profile.weaknesses.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Prioritizing: {profile.weaknesses.join(', ')}
            </div>
          )}
        </div>
      )}

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
          <span>3h (light)</span>
          <span>20h (moderate)</span>
          <span>40h (intensive)</span>
        </div>
      </div>

      <button onClick={generate} disabled={loading || !profile} className="btn-primary text-sm w-full">
        {loading ? 'Building your plan...' : '📅 Generate My Weekly Plan →'}
      </button>

      {plan && (
        <div className="border border-amber-100 rounded-xl overflow-hidden">
          <div className="bg-village-700 text-white px-4 py-2.5 text-sm font-medium flex items-center gap-2">
            <CalendarDays size={14} /> Your {weeklyHours}h/week Study Plan
          </div>
          <div className="p-4 bg-amber-50 text-sm text-gray-700 whitespace-pre-line leading-relaxed font-mono">
            {plan}
          </div>
          <div className="px-4 py-2.5 bg-white border-t border-amber-100 text-xs text-gray-400">
            Regenerate anytime — adjust your hours slider or update your profile goals first.
          </div>
        </div>
      )}
    </div>
  )
}
