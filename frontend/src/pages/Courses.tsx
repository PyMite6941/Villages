import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BookOpen, Plus, X, Users, Clock, GraduationCap, Palette } from 'lucide-react'
import { api } from '../lib/api'
import type { Course, CourseCreate, UserProfile } from '../types'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

interface Props { session: Session }

const SCHOOL_SUBJECTS = [
  'Mathematics', 'Science', 'English', 'History', 'Computer Science',
  'Languages', 'Social Studies', 'Test Prep', 'Physics', 'Chemistry',
  'Biology', 'Economics',
]

const HOBBY_SUBJECTS = [
  'Music', 'Visual Arts', 'Photography', 'Cooking', 'Creative Writing',
  'Fitness & Sports', 'Film & Video', 'Crafts & DIY', 'Gaming', 'Dance',
  'Gardening', 'Personal Finance',
]

const SUBJECT_EMOJIS: Record<string, string> = {
  Mathematics: '🔢', Science: '🔬', English: '📖', History: '📜',
  'Computer Science': '💻', Languages: '🌍', 'Social Studies': '🗺️',
  'Test Prep': '📝', Physics: '⚡', Chemistry: '🧪', Biology: '🧬',
  Economics: '📊', Music: '🎵', 'Visual Arts': '🎨', Photography: '📸',
  Cooking: '🍳', 'Creative Writing': '✍️', 'Fitness & Sports': '💪',
  'Film & Video': '🎬', 'Crafts & DIY': '🔨', Gaming: '🎮', Dance: '💃',
  Gardening: '🌱', 'Personal Finance': '💰',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-village-100 text-village-700',
  advanced: 'bg-rose-100 text-rose-700',
}

const emptyForm = (): CourseCreate => ({
  title: '',
  description: '',
  category: 'school',
  subject: 'Mathematics',
  difficulty: 'beginner',
  estimated_hours: 2,
  thumbnail_emoji: '📚',
})

export default function Courses({ session }: Props) {
  const [activeTab, setActiveTab] = useState<'school' | 'hobby'>('school')
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<CourseCreate>(emptyForm())
  const [creating, setCreating] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [enrollingId, setEnrollingId] = useState<string | null>(null)

  const subjects = activeTab === 'school' ? SCHOOL_SUBJECTS : HOBBY_SUBJECTS

  useEffect(() => {
    api.users.getProfile(session.user.id).then(setProfile).catch(() => null)
  }, [session.user.id])

  useEffect(() => {
    setSelectedSubject(null)
    loadCourses()
  }, [activeTab])

  useEffect(() => {
    loadCourses()
  }, [selectedSubject])

  const loadCourses = async () => {
    setLoading(true)
    try {
      const data = await api.courses.list(activeTab, selectedSubject ?? undefined)
      setCourses(data)
    } catch {
      toast.error('Could not load courses')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId)
    try {
      await api.courses.enroll(courseId)
      setEnrolledIds((prev) => new Set([...prev, courseId]))
      toast.success('Enrolled! Head to the course to start learning.')
    } catch {
      toast.error('Could not enroll')
    } finally {
      setEnrollingId(null)
    }
  }

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required')
      return
    }
    setCreating(true)
    try {
      const emoji = SUBJECT_EMOJIS[form.subject] ?? '📚'
      const course = await api.courses.create({ ...form, thumbnail_emoji: emoji })
      setCourses((prev) => [course, ...prev])
      setShowModal(false)
      setForm(emptyForm())
      toast.success('Course created! Add lessons from the course page.')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not create course')
    } finally {
      setCreating(false)
    }
  }

  const onTabChange = (tab: 'school' | 'hobby') => {
    setActiveTab(tab)
    setForm((f) => ({
      ...f,
      category: tab,
      subject: tab === 'school' ? 'Mathematics' : 'Music',
    }))
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="text-village-600" size={22} />
            Knowledge Grove
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Courses taught by your community — from AP Calculus to guitar basics
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} />
          Teach a Course
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-amber-100">
        <button
          onClick={() => onTabChange('school')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'school'
              ? 'border-village-600 text-village-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <GraduationCap size={15} />
          School Courses
        </button>
        <button
          onClick={() => onTabChange('hobby')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'hobby'
              ? 'border-village-600 text-village-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Palette size={15} />
          Hobby Courses
        </button>
      </div>

      {/* Subject filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedSubject(null)}
          className={`badge py-1 px-3 cursor-pointer ${
            selectedSubject === null ? 'bg-village-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedSubject(s === selectedSubject ? null : s)}
            className={`badge py-1 px-3 cursor-pointer ${
              selectedSubject === s ? 'bg-village-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {SUBJECT_EMOJIS[s]} {s}
          </button>
        ))}
      </div>

      {/* Course grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="text-4xl mb-3">{activeTab === 'school' ? '🎓' : '🎨'}</div>
          <div className="text-gray-600 font-medium mb-1">No courses yet</div>
          <div className="text-gray-400 text-sm">Be the first to teach one!</div>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 text-sm">
            + Teach a Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isEnrolled={enrolledIds.has(course.id)}
              isEnrolling={enrollingId === course.id}
              isOwn={course.teacher_id === session.user.id}
              onEnroll={() => handleEnroll(course.id)}
            />
          ))}
        </div>
      )}

      {/* Create course modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100">
              <h2 className="font-semibold text-gray-900">Teach a Course in the Village</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {profile?.is_verified_teacher && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
                  <span>📜</span>
                  <span>Your Village Scholar badge will appear on this course</span>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                <div className="flex gap-2">
                  {(['school', 'hobby'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => onTabChange(c)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        form.category === c
                          ? 'bg-village-600 text-white border-village-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-village-300'
                      }`}
                    >
                      {c === 'school' ? '🎓 School' : '🎨 Hobby'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Subject</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="input"
                >
                  {(form.category === 'school' ? SCHOOL_SUBJECTS : HOBBY_SUBJECTS).map((s) => (
                    <option key={s} value={s}>{SUBJECT_EMOJIS[s]} {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Course Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Calculus Fundamentals"
                  className="input"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What will students learn?"
                  rows={3}
                  className="input resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                    className="input"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Est. hours</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={form.estimated_hours}
                    onChange={(e) => setForm((f) => ({ ...f, estimated_hours: parseInt(e.target.value) || 1 }))}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={creating} className="btn-primary flex-1 text-sm">
                  {creating ? 'Creating...' : 'Create Course →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CourseCard({
  course,
  isEnrolled,
  isEnrolling,
  isOwn,
  onEnroll,
}: {
  course: Course
  isEnrolled: boolean
  isEnrolling: boolean
  isOwn: boolean
  onEnroll: () => void
}) {
  return (
    <div className="card flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{course.thumbnail_emoji}</span>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <span className={`badge text-xs ${DIFFICULTY_COLORS[course.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
            {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
          </span>
          <span className={`badge text-xs ${course.category === 'school' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
            {course.subject}
          </span>
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 mb-1 leading-snug">{course.title}</h3>
      <p className="text-sm text-gray-500 mb-3 line-clamp-2 flex-1">{course.description}</p>

      <div className="text-xs text-gray-400 flex items-center gap-1 mb-3">
        {course.teacher_is_verified ? (
          <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
            <span>📜</span>
            {course.teacher_name}
            <span className="badge bg-amber-100 text-amber-700 ml-0.5">Village Scholar</span>
          </span>
        ) : (
          <span>{course.teacher_name}</span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
        <span className="flex items-center gap-1"><Clock size={12} className="text-gray-400" />{course.estimated_hours}h</span>
        <span className="flex items-center gap-1"><Users size={12} className="text-gray-400" />{course.enrollment_count} enrolled</span>
      </div>

      <div className="flex gap-2 mt-auto">
        <Link
          to={`/courses/${course.id}`}
          className="btn-secondary text-sm flex-1 text-center"
        >
          View
        </Link>
        {isOwn ? (
          <span className="badge bg-village-100 text-village-700 self-center text-xs px-3">Your course</span>
        ) : isEnrolled ? (
          <span className="badge bg-emerald-100 text-emerald-700 self-center text-xs px-3">✓ Enrolled</span>
        ) : (
          <button
            onClick={onEnroll}
            disabled={isEnrolling}
            className="btn-primary text-sm flex-1"
          >
            {isEnrolling ? '...' : 'Enroll →'}
          </button>
        )}
      </div>
    </div>
  )
}
