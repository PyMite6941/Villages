import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { api } from '../lib/api'
import type { UserProfile, TeacherVerification } from '../types'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

interface Props { session: Session }

const COMMON_GOALS = [
  'SAT Math', 'SAT Reading', 'ACT', 'AP Calculus', 'AP Biology',
  'AP Chemistry', 'AP Physics', 'AP History', 'AP English', 'College Essays', 'Study Habits',
]

const STUDY_TRACK_OPTIONS = [
  {
    tag: 'high_schooler',
    label: '🎓 High Schooler',
    desc: 'Currently in high school (grades 9-12)',
    unlocks: ['College Prep track', 'Application Essay Workshop', 'College Fit Advisor'],
  },
  {
    tag: 'college_student',
    label: '🏛️ College Student',
    desc: 'Enrolled in a college or university',
    unlocks: ['Research writing tools'],
  },
  {
    tag: 'hobbyist',
    label: '🎨 Hobbyist / Lifelong Learner',
    desc: 'Learning for personal growth or passion projects',
    unlocks: null,
  },
  {
    tag: 'educator',
    label: '📖 Educator / Tutor',
    desc: 'A teacher, tutor, or mentor helping others learn',
    unlocks: ['Village Scholar application'],
  },
]

const ALL_SUBJECTS = [
  'Mathematics', 'Science', 'English', 'History', 'Computer Science', 'Languages',
  'Social Studies', 'Test Prep', 'Physics', 'Chemistry', 'Biology', 'Economics',
  'Music', 'Visual Arts', 'Photography', 'Cooking', 'Creative Writing',
  'Fitness & Sports', 'Film & Video', 'Crafts & DIY', 'Gaming', 'Dance',
  'Gardening', 'Personal Finance',
]

export default function Profile({ session }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ display_name: '', academic_level: '', goals: [] as string[], bio: '', interests: [] as string[], learning_style: 'visual', strengths: [] as string[], weaknesses: [] as string[] })
  const [saving, setSaving] = useState(false)
  const [studyTags, setStudyTags] = useState<string[]>([])
  const [savingTags, setSavingTags] = useState(false)

  const [verification, setVerification] = useState<TeacherVerification | null | undefined>(undefined)
  const [showScholarForm, setShowScholarForm] = useState(false)
  const [scholarForm, setScholarForm] = useState({ degree_title: '', institution: '', subject_area: 'Mathematics' })
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    api.users.getProfile(session.user.id).then((p) => {
      setProfile(p)
      setForm({ display_name: p.display_name, academic_level: p.academic_level, goals: p.goals, bio: p.bio ?? '', interests: p.interests ?? [], learning_style: p.learning_style ?? 'visual', strengths: p.strengths ?? [], weaknesses: p.weaknesses ?? [] })
      setStudyTags(p.study_tags ?? [])
    })
    api.teacher.getVerification().then((v) => setVerification(v)).catch(() => setVerification(null))
  }, [session.user.id])

  const toggleTag = async (tag: string) => {
    const next = studyTags.includes(tag)
      ? studyTags.filter((t) => t !== tag)
      : [...studyTags, tag]
    setStudyTags(next)
    setSavingTags(true)
    try {
      await api.users.updateProfile({ study_tags: next })
      setProfile((p) => p ? { ...p, study_tags: next } : p)
    } catch {
      toast.error('Could not save track preference')
      setStudyTags(studyTags)
    } finally {
      setSavingTags(false)
    }
  }

  const toggleGoal = (g: string) => {
    setForm((prev) => ({
      ...prev,
      goals: prev.goals.includes(g) ? prev.goals.filter((x) => x !== g) : [...prev.goals, g],
    }))
  }

  const LEARNING_STYLES = ['visual', 'auditory', 'reading', 'kinesthetic']

  const save = async () => {
    setSaving(true)
    try {
      const updated = await api.users.updateProfile({
        display_name: form.display_name,
        academic_level: form.academic_level,
        goals: form.goals,
        bio: form.bio || undefined,
        interests: form.interests,
        learning_style: form.learning_style,
        strengths: form.strengths,
        weaknesses: form.weaknesses,
      })
      setProfile(updated)
      setEditing(false)
      toast.success('Profile updated!')
    } catch {
      toast.error('Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  const applyScholar = async () => {
    if (!scholarForm.degree_title.trim() || !scholarForm.institution.trim()) {
      toast.error('All fields are required')
      return
    }
    setApplying(true)
    try {
      const result = await api.teacher.apply(scholarForm)
      setVerification(result)
      setProfile((p) => p ? { ...p, is_verified_teacher: true, teacher_subjects: [scholarForm.subject_area] } : p)
      setShowScholarForm(false)
      toast.success('Welcome, Village Scholar! Your badge is now active.')
    } catch {
      toast.error('Could not submit application')
    } finally {
      setApplying(false)
    }
  }

  if (!profile) return <div className="text-center py-12 text-gray-500">Loading profile...</div>

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>

      {/* Main profile card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-village-600 text-white flex items-center justify-center text-2xl font-bold shrink-0">
            {profile.display_name[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-lg flex items-center gap-2">
              {profile.display_name}
              {profile.is_verified_teacher && (
                <span className="badge bg-amber-100 text-amber-700 text-xs flex items-center gap-1">
                  <span>📜</span> Village Scholar
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">{session.user.email}</div>
            <div className="text-sm text-village-700 font-medium">{profile.academic_level}</div>
          </div>
        </div>

        {profile.bio && !editing && (
          <p className="text-sm text-gray-600 mb-3 italic">"{profile.bio}"</p>
        )}

        {!editing ? (
          <>
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700 mb-1">Goals</div>
              <div className="flex flex-wrap gap-1.5">
                {profile.goals.map((g) => (
                  <span key={g} className="badge bg-village-100 text-village-700">{g}</span>
                ))}
              </div>
            </div>
            <button onClick={() => setEditing(true)} className="btn-secondary text-sm">Edit profile</button>
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Display name</label>
              <input
                value={form.display_name}
                onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Bio (optional)</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="A short description about yourself..."
                rows={2}
                className="input resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Goals</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_GOALS.map((g) => (
                  <button
                    key={g}
                    onClick={() => toggleGoal(g)}
                    className={`badge cursor-pointer py-1 px-3 ${
                      form.goals.includes(g) ? 'bg-village-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Strengths <span className="text-gray-400 font-normal">(what you're good at)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_GOALS.map((g) => (
                  <button key={g} onClick={() => setForm((p) => ({ ...p, strengths: p.strengths.includes(g) ? p.strengths.filter((x) => x !== g) : [...p.strengths, g] }))}
                    className={`badge cursor-pointer py-1 px-3 text-sm ${form.strengths.includes(g) ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{g}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Weaknesses <span className="text-gray-400 font-normal">(areas you need help with)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_GOALS.map((g) => (
                  <button key={g} onClick={() => setForm((p) => ({ ...p, weaknesses: p.weaknesses.includes(g) ? p.weaknesses.filter((x) => x !== g) : [...p.weaknesses, g] }))}
                    className={`badge cursor-pointer py-1 px-3 text-sm ${form.weaknesses.includes(g) ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{g}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Interests</label>
              <div className="flex flex-wrap gap-2">
                {['Science','Technology','Math','History','Literature','Art','Music','Programming','Language Learning','Career Development','Parenting','Health & Wellness','Finance','Philosophy','Civics'].map((i) => (
                  <button key={i} onClick={() => setForm((p) => ({ ...p, interests: p.interests.includes(i) ? p.interests.filter((x) => x !== i) : [...p.interests, i] }))}
                    className={`badge cursor-pointer py-1 px-3 text-sm ${form.interests.includes(i) ? 'bg-village-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{i}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Learning Style</label>
              <div className="flex gap-2">
                {LEARNING_STYLES.map((s) => (
                  <button key={s} onClick={() => setForm((p) => ({ ...p, learning_style: s }))}
                    className={`badge cursor-pointer py-1 px-3 text-sm capitalize ${form.learning_style === s ? 'bg-village-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Village Scholar section */}
      <div className="card">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">📜</span>
          <h2 className="font-semibold text-gray-900">Village Scholar</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Verified educators get a Scholar badge on their profile and courses.
          Apply if you hold a degree or recognized credential in any field.
        </p>

        {verification === undefined && (
          <div className="text-sm text-gray-400">Checking status...</div>
        )}

        {verification !== undefined && verification !== null && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📜</span>
              <span className="font-semibold text-amber-800">Village Scholar — Verified</span>
            </div>
            <div className="text-sm text-amber-700 space-y-1">
              <div><span className="font-medium">Degree:</span> {verification.degree_title}</div>
              <div><span className="font-medium">Institution:</span> {verification.institution}</div>
              <div><span className="font-medium">Subject:</span> {verification.subject_area}</div>
            </div>
            {profile.teacher_subjects && profile.teacher_subjects.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.teacher_subjects.map((s) => (
                  <span key={s} className="badge bg-amber-100 text-amber-700 text-xs">{s}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {verification !== undefined && verification === null && !showScholarForm && (
          <button
            onClick={() => setShowScholarForm(true)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <span>📜</span> Apply to become a Village Scholar
          </button>
        )}

        {showScholarForm && (
          <div className="border border-amber-200 rounded-lg p-4 space-y-3 bg-amber-50">
            <h3 className="text-sm font-medium text-amber-900">Scholar Application</h3>
            <p className="text-xs text-amber-700">
              This uses the honor system — please only apply if you genuinely hold the credential you list.
            </p>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Degree / Credential Title</label>
              <input
                value={scholarForm.degree_title}
                onChange={(e) => setScholarForm((f) => ({ ...f, degree_title: e.target.value }))}
                placeholder="e.g. BSc Mathematics, ABRSM Grade 8 Piano"
                className="input text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Institution</label>
              <input
                value={scholarForm.institution}
                onChange={(e) => setScholarForm((f) => ({ ...f, institution: e.target.value }))}
                placeholder="e.g. MIT, Royal College of Music"
                className="input text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Subject Area</label>
              <select
                value={scholarForm.subject_area}
                onChange={(e) => setScholarForm((f) => ({ ...f, subject_area: e.target.value }))}
                className="input text-sm"
              >
                {ALL_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowScholarForm(false)} className="btn-secondary flex-1 text-sm">
                Cancel
              </button>
              <button onClick={applyScholar} disabled={applying} className="btn-primary flex-1 text-sm">
                {applying ? 'Applying...' : 'Submit Application →'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Study Tracks */}
      <div className="card">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🎯</span>
          <h2 className="font-semibold text-gray-900">Study Tracks</h2>
          {savingTags && <span className="text-xs text-gray-400 ml-auto">Saving...</span>}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Select tags that describe you. Active tags unlock relevant tools and tracks in your Study Hub.
        </p>
        <div className="space-y-2">
          {STUDY_TRACK_OPTIONS.map(({ tag, label, desc, unlocks }) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                studyTags.includes(tag)
                  ? 'bg-village-50 border-village-400 ring-1 ring-village-300'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                studyTags.includes(tag) ? 'bg-village-600 border-village-600' : 'border-gray-300'
              }`}>
                {studyTags.includes(tag) && <span className="text-white text-xs font-bold leading-none">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                {unlocks && studyTags.includes(tag) && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {unlocks.map((u) => (
                      <span key={u} className="badge bg-village-100 text-village-700 text-xs">🔓 {u}</span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => supabase.auth.signOut()}
        className="btn-secondary text-sm text-red-600 hover:bg-red-50 border-red-200 w-full"
      >
        Sign out
      </button>
    </div>
  )
}
