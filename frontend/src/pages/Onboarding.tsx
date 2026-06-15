import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

interface Props { session: Session }

const ACADEMIC_LEVELS = ['Middle School', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'SAT Prep', 'ACT Prep', 'AP Student', 'College Freshman']
const COMMON_GOALS = ['SAT Math', 'SAT Reading', 'ACT', 'AP Calculus', 'AP Biology', 'AP Chemistry', 'AP Physics', 'AP History', 'AP English', 'College Essays', 'Study Habits']

export default function Onboarding({ session }: Props) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    display_name: '',
    academic_level: '',
    goals: [] as string[],
    strengths: [] as string[],
    weaknesses: [] as string[],
  })
  const [loading, setLoading] = useState(false)

  const toggleItem = (field: 'goals' | 'strengths' | 'weaknesses', item: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item) ? prev[field].filter((i) => i !== item) : [...prev[field], item],
    }))
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
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <span className="text-4xl">🏘️</span>
          <h1 className="text-2xl font-bold text-village-800 mt-2">Set up your profile</h1>
          <p className="text-sm text-gray-500 mt-1">Step {step} of 3 — our AI will match you to the perfect Village</p>
        </div>

        <div className="card">
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
              <h2 className="font-semibold">Your goals</h2>
              <p className="text-sm text-gray-500">What are you studying for? (select all that apply)</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_GOALS.map((g) => (
                  <button key={g} onClick={() => toggleItem('goals', g)}
                    className={`badge cursor-pointer py-1 px-3 ${form.goals.includes(g) ? 'bg-village-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {g}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                <button onClick={() => setStep(3)} disabled={form.goals.length === 0} className="btn-primary flex-1">Next</button>
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
