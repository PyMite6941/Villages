import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

interface Props { session: Session }

const ACADEMIC_LEVELS = [
  '6th Grade', '7th Grade', '8th Grade',
  '9th Grade', '10th Grade', '11th Grade', '12th Grade',
  'College Freshman', 'College Sophomore', 'College Junior', 'College Senior',
  'Graduate Student', 'Doctoral Student',
  'Law School', 'Medical School', 'Trade School', 'Vocational Program',
  'Adult Learner', 'Parent', 'Lifelong Learner', 'Career Changer', 'Hobbyist',
]
const COMMON_GOALS = ['SAT Math', 'SAT Reading', 'ACT', 'AP Calculus', 'AP Biology', 'AP Chemistry', 'AP Physics', 'AP History', 'AP English', 'College Essays', 'Study Habits']
const COMMON_INTERESTS = ['Science', 'Technology', 'Math', 'History', 'Literature', 'Art', 'Music', 'Programming', 'Language Learning', 'Career Development', 'Parenting', 'Health & Wellness', 'Finance', 'Philosophy', 'Civics']
const LEARNING_STYLES = ['visual', 'auditory', 'reading', 'kinesthetic']

export default function Onboarding({ session: _session }: Props) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    display_name: '',
    academic_level: '',
    goals: [] as string[],
    strengths: [] as string[],
    weaknesses: [] as string[],
    interests: [] as string[],
    learning_style: 'visual',
  })
  const [loading, setLoading] = useState(false)
  const [customGoal, setCustomGoal] = useState('')

  const toggleItem = (field: 'goals' | 'strengths' | 'weaknesses' | 'interests', item: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item) ? prev[field].filter((i) => i !== item) : [...prev[field], item],
    }))
  }

  const addCustomGoal = () => {
    const g = customGoal.trim()
    if (!g || form.goals.includes(g)) return
    setForm((prev) => ({ ...prev, goals: [...prev.goals, g] }))
    setCustomGoal('')
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await api.users.createProfile(form)
      toast.success('Welcome to Villages!')
      navigate('/villages')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-amber-50 flex items-center justify-center px-4 overflow-hidden">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <span className="text-4xl">🏘️</span>
          <h1 className="text-2xl font-bold text-village-800 mt-2">Set up your profile</h1>
          <p className="text-sm text-gray-500 mt-1">Step {step} of 4 — our AI will match you to the perfect Village</p>
        </div>

        <div className="card overflow-y-auto max-h-[65vh]">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold">Basic info</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
                <input value={form.display_name} onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))} className="input" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic level</label>
                <select value={form.academic_level} onChange={(e) => setForm((p) => ({ ...p, academic_level: e.target.value }))} className="input">
                  <option value="">Select level...</option>
                  {ACADEMIC_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <button onClick={() => setStep(2)} disabled={!form.display_name || !form.academic_level} className="btn-primary w-full">Next</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold">What are you studying for?</h2>
              <p className="text-sm text-gray-500">Select common goals, type your own, or skip — not everyone is studying for a test.</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_GOALS.map((g) => (
                  <button key={g} onClick={() => toggleItem('goals', g)}
                    className={`badge cursor-pointer py-1 px-3 ${form.goals.includes(g) ? 'bg-village-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {g}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomGoal()}
                  className="input flex-1 text-sm"
                  placeholder="Subject you're studying..."
                />
                <button onClick={addCustomGoal} disabled={!customGoal.trim()}
                  className="btn-secondary text-sm">Add</button>
              </div>
              {form.goals.filter((g) => !COMMON_GOALS.includes(g)).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.goals.filter((g) => !COMMON_GOALS.includes(g)).map((g) => (
                    <span key={g} className="badge bg-village-600 text-white flex items-center gap-1 py-1 px-3">
                      {g}
                      <button onClick={() => toggleItem('goals', g)} className="text-white/70 hover:text-white ml-0.5">&times;</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1">Next</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold">Strengths & areas to improve</h2>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">I'm strong at:</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_GOALS.map((g) => (
                    <button key={g} onClick={() => toggleItem('strengths', g)}
                      className={`badge cursor-pointer py-1 px-3 ${form.strengths.includes(g) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">I need help with:</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_GOALS.map((g) => (
                    <button key={g} onClick={() => toggleItem('weaknesses', g)}
                      className={`badge cursor-pointer py-1 px-3 ${form.weaknesses.includes(g) ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
                <button onClick={() => setStep(4)} className="btn-primary flex-1">Next</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-semibold">Your interests & learning style</h2>
              <p className="text-sm text-gray-500">What topics are you curious about? (select all that apply)</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_INTERESTS.map((g) => (
                  <button key={g} onClick={() => toggleItem('interests', g)}
                    className={`badge cursor-pointer py-1 px-3 ${form.interests.includes(g) ? 'bg-village-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {g}
                  </button>
                ))}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">How do you learn best?</p>
                <div className="flex gap-2">
                  {LEARNING_STYLES.map((s) => (
                    <button key={s} onClick={() => setForm((p) => ({ ...p, learning_style: s }))}
                      className={`badge cursor-pointer py-2 px-4 capitalize ${form.learning_style === s ? 'bg-village-600 text-white ring-2 ring-village-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(3)} className="btn-secondary flex-1">Back</button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Creating...' : 'Find my Village →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
