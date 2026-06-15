import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { api } from '../lib/api'
import type { UserProfile } from '../types'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

interface Props { session: Session }

const COMMON_GOALS = ['SAT Math', 'SAT Reading', 'ACT', 'AP Calculus', 'AP Biology', 'AP Chemistry', 'AP Physics', 'AP History', 'AP English', 'College Essays', 'Study Habits']
const ACADEMIC_LEVELS = [
  '6th Grade', '7th Grade', '8th Grade',
  '9th Grade', '10th Grade', '11th Grade', '12th Grade',
  'College Freshman', 'College Sophomore', 'College Junior', 'College Senior',
  'Graduate Student', 'Doctoral Student',
  'Law School', 'Medical School', 'Trade School', 'Vocational Program',
  'Adult Learner', 'Parent', 'Lifelong Learner', 'Career Changer', 'Hobbyist',
]
const COMMON_INTERESTS = ['Science', 'Technology', 'Math', 'History', 'Literature', 'Art', 'Music', 'Programming', 'Language Learning', 'Career Development', 'Parenting', 'Health & Wellness', 'Finance', 'Philosophy', 'Civics']
const LEARNING_STYLES = ['visual', 'auditory', 'reading', 'kinesthetic']

export default function Profile({ session }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ display_name: '', academic_level: '', goals: [] as string[], strengths: [] as string[], weaknesses: [] as string[], interests: [] as string[], learning_style: 'visual' })
  const [saving, setSaving] = useState(false)
  const [customGoal, setCustomGoal] = useState('')

  useEffect(() => {
    api.users.getProfile(session.user.id).then((p) => {
      setProfile(p)
      setForm({ display_name: p.display_name, academic_level: p.academic_level, goals: p.goals, strengths: p.strengths, weaknesses: p.weaknesses, interests: p.interests || [], learning_style: p.learning_style || 'visual' })
    })
  }, [session.user.id])

  const toggleItem = (field: 'goals' | 'strengths' | 'weaknesses' | 'interests', item: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item) ? prev[field].filter((x) => x !== item) : [...prev[field], item],
    }))
  }

  const addCustomGoal = () => {
    const g = customGoal.trim()
    if (!g || form.goals.includes(g)) return
    setForm((prev) => ({ ...prev, goals: [...prev.goals, g] }))
    setCustomGoal('')
  }

  const save = async () => {
    setSaving(true)
    try {
      const updated = await api.users.updateProfile(form)
      setProfile(updated)
      setEditing(false)
      toast.success('Profile updated!')
    } catch {
      toast.error('Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return <div className="text-center py-12 text-gray-500">Loading profile...</div>

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>

      <div className="card mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-village-600 text-white flex items-center justify-center text-2xl font-bold">
            {profile.display_name[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-lg">{profile.display_name}</div>
            <div className="text-sm text-gray-500">{session.user.email}</div>
            <div className="text-sm text-village-700 font-medium">{profile.academic_level}</div>
          </div>
        </div>

        {!editing ? (
          <>
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700 mb-1">Goals</div>
              <div className="flex flex-wrap gap-1.5">
                {profile.goals.map((g) => <span key={g} className="badge bg-village-100 text-village-700">{g}</span>)}
              </div>
            </div>
            {profile.interests && profile.interests.length > 0 && (
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-700 mb-1">Interests</div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((g) => <span key={g} className="badge bg-amber-100 text-amber-800">{g}</span>)}
                </div>
              </div>
            )}
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700 mb-1">Learning style</div>
              <span className="badge bg-village-100 text-village-700 capitalize">{profile.learning_style || 'visual'}</span>
            </div>
            <button onClick={() => setEditing(true)} className="btn-secondary text-sm">Edit profile</button>
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Display name</label>
              <input value={form.display_name} onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Academic level</label>
              <select value={form.academic_level} onChange={(e) => setForm((p) => ({ ...p, academic_level: e.target.value }))} className="input">
                {ACADEMIC_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Goals</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {COMMON_GOALS.map((g) => (
                  <button key={g} onClick={() => toggleItem('goals', g)}
                    className={`badge cursor-pointer py-1 px-3 ${form.goals.includes(g) ? 'bg-village-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {g}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={customGoal} onChange={(e) => setCustomGoal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomGoal()}
                  className="input flex-1 text-sm" placeholder="Subject you're studying..." />
                <button onClick={addCustomGoal} disabled={!customGoal.trim()}
                  className="btn-secondary text-sm">Add</button>
              </div>
              {form.goals.filter((g) => !COMMON_GOALS.includes(g)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.goals.filter((g) => !COMMON_GOALS.includes(g)).map((g) => (
                    <span key={g} className="badge bg-village-600 text-white flex items-center gap-1 py-1 px-3">
                      {g}
                      <button onClick={() => toggleItem('goals', g)} className="text-white/70 hover:text-white ml-0.5">&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Strengths</p>
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
              <p className="text-sm font-medium text-gray-700 mb-2">Areas to improve</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_GOALS.map((g) => (
                  <button key={g} onClick={() => toggleItem('weaknesses', g)}
                    className={`badge cursor-pointer py-1 px-3 ${form.weaknesses.includes(g) ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Interests</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_INTERESTS.map((g) => (
                  <button key={g} onClick={() => toggleItem('interests', g)}
                    className={`badge cursor-pointer py-1 px-3 ${form.interests.includes(g) ? 'bg-village-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Learning style</p>
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
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        )}
      </div>

      <button onClick={() => supabase.auth.signOut()} className="btn-secondary text-sm text-red-600 hover:bg-red-50 border-red-200">
        Sign out
      </button>
    </div>
  )
}
