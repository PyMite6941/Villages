import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BookOpen, Plus, X, Users, Clock, Sparkles, BadgeCheck } from 'lucide-react'
import { api } from '../lib/api'
import type { Course, CourseCreate, UserProfile } from '../types'
import { COURSE_TEMPLATES, isApprovedSource, type CourseTemplate, type TemplateLesson } from '../lib/courseTemplates'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

interface Props { session: Session }

// Top-level course domains. `key` is stored on the course as `category`;
// each domain owns a list of subjects shown as filter chips / the create dropdown.
type CategoryDef = { key: string; label: string; emoji: string; subjects: string[] }

const CATEGORIES: CategoryDef[] = [
  { key: 'math', label: 'Math', emoji: '🔢',
    subjects: ['Mathematics', 'Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics'] },
  { key: 'science', label: 'Science', emoji: '🔬',
    subjects: ['Science', 'Physics', 'Chemistry', 'Biology', 'Environmental Science', 'Astronomy', 'Earth Science'] },
  { key: 'tech', label: 'Technology', emoji: '💻',
    subjects: ['Computer Science', 'Web Development', 'Data Science', 'AI & Machine Learning', 'Cybersecurity', 'Game Development', 'Engineering', 'Robotics'] },
  { key: 'language', label: 'Language & Writing', emoji: '📖',
    subjects: ['English', 'Literature', 'Writing', 'Creative Writing', 'Languages', 'Public Speaking'] },
  { key: 'humanities', label: 'Humanities', emoji: '📜',
    subjects: ['History', 'Geography', 'Social Studies', 'Philosophy', 'Religious Studies', 'Political Science', 'Psychology', 'Sociology', 'Law'] },
  { key: 'business', label: 'Business & Finance', emoji: '💼',
    subjects: ['Economics', 'Business Studies', 'Accounting', 'Marketing', 'Personal Finance', 'Investing', 'Entrepreneurship'] },
  { key: 'arts', label: 'Arts & Design', emoji: '🎨',
    subjects: ['Visual Arts', 'Drawing', 'Painting', 'Photography', 'Graphic Design', 'Animation', '3D Modeling', 'Film & Video'] },
  { key: 'music', label: 'Music', emoji: '🎵',
    subjects: ['Music', 'Music Theory', 'Singing', 'Guitar', 'Piano', 'Music Production'] },
  { key: 'health', label: 'Health & Fitness', emoji: '💪',
    subjects: ['Health', 'Nutrition', 'Physical Education', 'Fitness & Sports', 'Yoga', 'Martial Arts', 'Dance'] },
  { key: 'lifeskills', label: 'Life Skills', emoji: '🛠️',
    subjects: ['Cooking', 'Baking', 'Mixology', 'Crafts & DIY', 'Woodworking', 'Pottery', 'Knitting & Sewing', 'Calligraphy', 'Gardening', 'Pet Care', 'Travel'] },
  { key: 'games', label: 'Games & Play', emoji: '🎮',
    subjects: ['Gaming', 'Chess', 'Board Games'] },
  { key: 'testprep', label: 'Test Prep', emoji: '📝',
    subjects: ['Test Prep', 'SAT / ACT', 'AP Exams', 'College Prep'] },
]

const CATEGORY_BY_KEY: Record<string, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c]),
)

const SUBJECT_EMOJIS: Record<string, string> = {
  // Math
  Mathematics: '🔢', Algebra: '➗', Geometry: '📐', Trigonometry: '📏', Calculus: '∫', Statistics: '📈',
  // Science
  Science: '🔬', Physics: '⚡', Chemistry: '🧪', Biology: '🧬',
  'Environmental Science': '🌎', Astronomy: '🔭', 'Earth Science': '🪨',
  // Tech
  'Computer Science': '💻', 'Web Development': '🌐', 'Data Science': '📊',
  'AI & Machine Learning': '🤖', Cybersecurity: '🔒', 'Game Development': '🕹️',
  Engineering: '⚙️', Robotics: '🦾',
  // Language & Writing
  English: '📖', Literature: '📚', Writing: '✒️', 'Creative Writing': '✍️',
  Languages: '🌍', 'Public Speaking': '🗣️',
  // Humanities
  History: '📜', Geography: '🗺️', 'Social Studies': '🏛️', Philosophy: '🤔',
  'Religious Studies': '🕊️', 'Political Science': '🗳️', Psychology: '🧠', Sociology: '👥', Law: '⚖️',
  // Business & Finance
  Economics: '💹', 'Business Studies': '💼', Accounting: '🧾', Marketing: '📣',
  'Personal Finance': '💰', Investing: '📉', Entrepreneurship: '🚀',
  // Arts & Design
  'Visual Arts': '🎨', Drawing: '✏️', Painting: '🖌️', Photography: '📸',
  'Graphic Design': '🖼️', Animation: '🎞️', '3D Modeling': '🧊', 'Film & Video': '🎬',
  // Music
  Music: '🎵', 'Music Theory': '🎼', Singing: '🎤', Guitar: '🎸', Piano: '🎹', 'Music Production': '🎚️',
  // Health & Fitness
  Health: '🩺', Nutrition: '🥗', 'Physical Education': '🏃', 'Fitness & Sports': '💪',
  Yoga: '🧘', 'Martial Arts': '🥋', Dance: '💃',
  // Life Skills
  Cooking: '🍳', Baking: '🧁', Mixology: '🍹', 'Crafts & DIY': '🔨', Woodworking: '🪵',
  Pottery: '🏺', 'Knitting & Sewing': '🧶', Calligraphy: '🖋️', Gardening: '🌱', 'Pet Care': '🐾', Travel: '✈️',
  // Games & Play
  Gaming: '🎮', Chess: '♟️', 'Board Games': '🎲',
  // Test Prep
  'Test Prep': '📝', 'SAT / ACT': '🎯', 'AP Exams': '🏅', 'College Prep': '🎓',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  intermediate: 'bg-village-100 dark:bg-village-900/40 text-village-700 dark:text-village-300',
  advanced: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
}

const emptyForm = (): CourseCreate => ({
  title: '',
  description: '',
  category: CATEGORIES[0].key,
  subject: CATEGORIES[0].subjects[0],
  difficulty: 'beginner',
  estimated_hours: 2,
  thumbnail_emoji: '📚',
  is_private: false,
  tags: [],
})

export default function Courses({ session }: Props) {
  const [activeTab, setActiveTab] = useState<string>(CATEGORIES[0].key)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<CourseCreate>(emptyForm())
  const [templateLessons, setTemplateLessons] = useState<TemplateLesson[]>([])
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [enrollingId, setEnrollingId] = useState<string | null>(null)
  const [showJoinCode, setShowJoinCode] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joiningCode, setJoiningCode] = useState(false)

  const activeCategory = CATEGORY_BY_KEY[activeTab] ?? CATEGORIES[0]
  const subjects = activeCategory.subjects
  const formCategory = CATEGORY_BY_KEY[form.category] ?? CATEGORIES[0]

  useEffect(() => {
    api.users.getProfile(session.user.id).then(setProfile).catch(() => null)
  }, [session.user.id])

  const loadCourses = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.courses.list(activeTab, selectedSubject ?? undefined)
      setCourses(data)
    } catch {
      toast.error('Could not load courses')
    } finally {
      setLoading(false)
    }
  }, [activeTab, selectedSubject])

  useEffect(() => {
    setSelectedSubject(null)
    loadCourses()
  }, [activeTab, loadCourses])

  useEffect(() => {
    loadCourses()
  }, [selectedSubject, loadCourses])

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
      const emoji = SUBJECT_EMOJIS[form.subject] ?? formCategory.emoji
      const course = await api.courses.create({ ...form, thumbnail_emoji: emoji })
      // If a template was applied, seed its lessons in order.
      if (templateLessons.length > 0) {
        for (let i = 0; i < templateLessons.length; i++) {
          await api.courses.addLesson(course.id, { ...templateLessons[i], order_index: i })
        }
      }
      setCourses((prev) => [course, ...prev])
      setShowModal(false)
      setForm(emptyForm())
      setTemplateLessons([])
      setAppliedTemplate(null)
      toast.success(
        templateLessons.length > 0
          ? `Course + ${templateLessons.length} lessons created!`
          : 'Course created! Add lessons from the course page.',
      )
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not create course')
    } finally {
      setCreating(false)
    }
  }

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return
    setJoiningCode(true)
    try {
      const result = await api.courses.joinByCode(joinCode.trim())
      setShowJoinCode(false)
      setJoinCode('')
      toast.success(result.message)
      loadCourses()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Invalid code')
    } finally {
      setJoiningCode(false)
    }
  }

  const onTabChange = (key: string) => {
    setActiveTab(key)
    const cat = CATEGORY_BY_KEY[key] ?? CATEGORIES[0]
    setForm((f) => ({ ...f, category: cat.key, subject: cat.subjects[0] }))
  }

  const applyTemplate = (t: CourseTemplate) => {
    setForm({ ...t.course })
    setTemplateLessons(t.lessons)
    setAppliedTemplate(t.id)
    if (CATEGORY_BY_KEY[t.course.category]) setActiveTab(t.course.category)
  }

  const clearTemplate = () => {
    setTemplateLessons([])
    setAppliedTemplate(null)
    setForm(emptyForm())
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BookOpen className="text-village-600 dark:text-village-300" size={22} />
            Knowledge Grove
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Courses taught by your community — from AP Calculus to guitar basics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowJoinCode(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <span className="text-xs">🔑</span> Join with Code
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={14} />
            Teach a Course
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-x-1 gap-y-1.5 mb-5 border-b border-amber-100 dark:border-gray-800 pb-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onTabChange(cat.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === cat.key
                ? 'border-village-600 text-village-700 dark:text-village-300'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses by title or subject..."
          className="input"
        />
        {selectedTag && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Filtered by tag:</span>
            <button
              onClick={() => setSelectedTag(null)}
              className="badge bg-village-600 text-white px-2.5 py-1 flex items-center gap-1"
            >
              #{selectedTag} <span className="font-bold">×</span>
            </button>
          </div>
        )}
      </div>

      {/* Subject filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedSubject(null)}
          className={`badge py-1 px-3 cursor-pointer ${
            selectedSubject === null ? 'bg-village-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All {activeCategory.label}
        </button>
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedSubject(s === selectedSubject ? null : s)}
            className={`badge py-1 px-3 cursor-pointer ${
              selectedSubject === s ? 'bg-village-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {SUBJECT_EMOJIS[s]} {s}
          </button>
        ))}
      </div>

      {/* Course grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="text-4xl mb-3">{activeCategory.emoji}</div>
          <div className="text-gray-600 dark:text-gray-400 font-medium mb-1">No {activeCategory.label} courses yet</div>
          <div className="text-gray-400 dark:text-gray-500 text-sm">Be the first to teach one!</div>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 text-sm">
            + Teach a Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses
            .filter((course) => {
              const q = search.trim().toLowerCase()
              const matchesSearch = !q || course.title.toLowerCase().includes(q) || course.subject.toLowerCase().includes(q)
              const matchesTag = !selectedTag || (course.tags ?? []).includes(selectedTag)
              return matchesSearch && matchesTag
            })
            .map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isEnrolled={enrolledIds.has(course.id)}
              isEnrolling={enrollingId === course.id}
              isOwn={course.teacher_id === session.user.id}
              onEnroll={() => handleEnroll(course.id)}
              onTagClick={setSelectedTag}
            />
          ))}
        </div>
      )}

      {/* Create course modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Teach a Course in the Village</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {profile?.is_verified_teacher && (
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                  <span>📜</span>
                  <span>Your Village Scholar badge will appear on this course</span>
                </div>
              )}

              {/* Templates — available to verified Village Scholars */}
              {profile?.is_verified_teacher ? (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block flex items-center gap-1.5">
                    <Sparkles size={14} className="text-village-600 dark:text-village-300" /> Start from a template
                  </label>
                  {appliedTemplate ? (
                    <div className="flex items-center justify-between bg-village-50 dark:bg-village-900/30 border border-village-200 dark:border-village-800 rounded-lg px-3 py-2 text-sm">
                      <span className="text-village-800 dark:text-village-300">
                        ✓ {COURSE_TEMPLATES.find((t) => t.id === appliedTemplate)?.name} · {templateLessons.length} lessons
                      </span>
                      <button onClick={clearTemplate} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline">Clear</button>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {COURSE_TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => applyTemplate(t)}
                          className="text-left border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 hover:border-village-300 dark:hover:border-village-600 transition-colors"
                        >
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                            <span>{t.emoji}</span> {t.name}
                            <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs">{t.lessons.length} lessons</span>
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t.blurb}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2">
                  💡 Become a <Link to="/profile" className="text-village-600 dark:text-village-300 underline">Village Scholar</Link> to unlock ready-made course templates (incl. AP courses).
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => onTabChange(e.target.value)}
                  className="input"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Topic</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="input"
                >
                  {formCategory.subjects.map((s) => (
                    <option key={s} value={s}>{SUBJECT_EMOJIS[s]} {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Course Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Calculus Fundamentals"
                  className="input"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What will students learn?"
                  rows={3}
                  className="input resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Content source <span className="text-gray-400 dark:text-gray-500 font-normal">(optional — credit your source)</span>
                </label>
                <input
                  value={form.source ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                  placeholder="e.g. College Board AP, Khan Academy"
                  className="input"
                />
                {isApprovedSource(form.source) && (
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <BadgeCheck size={12} /> Approved source — auto-trusted for AP / verified content
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Tags <span className="text-gray-400 font-normal">(comma-separated — helps learners filter)</span>
                </label>
                <input
                  value={(form.tags ?? []).join(', ')}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) }))}
                  placeholder="e.g. Math, AP, Calculus, Limits"
                  className="input"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_private ?? false}
                    onChange={(e) => setForm((f) => ({ ...f, is_private: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600 text-village-600 dark:text-village-300 focus:ring-village-400"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Private course (invite only)</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Difficulty</label>
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
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Est. hours</label>
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

      {/* Join by code modal */}
      {showJoinCode && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Join a Private Course</h2>
              <button onClick={() => setShowJoinCode(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Enter the invite code shared by your teacher.</p>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC12345"
                className="input text-center text-lg tracking-widest font-mono"
                maxLength={8}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
              />
              <div className="flex gap-2">
                <button onClick={() => setShowJoinCode(false)} className="btn-secondary flex-1 text-sm">
                  Cancel
                </button>
                <button onClick={handleJoinByCode} disabled={joiningCode || joinCode.trim().length < 4} className="btn-primary flex-1 text-sm">
                  {joiningCode ? 'Joining...' : 'Join Course'}
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
  onTagClick,
}: {
  course: Course
  isEnrolled: boolean
  isEnrolling: boolean
  isOwn: boolean
  onEnroll: () => void
  onTagClick: (tag: string) => void
}) {
  return (
    <div className="card flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{course.thumbnail_emoji}</span>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <span className={`badge text-xs ${DIFFICULTY_COLORS[course.difficulty] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
            {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
          </span>
          {course.is_private && (
            <span className="badge text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">🔒 Private</span>
          )}
          <span className="badge text-xs bg-village-100 dark:bg-village-900/40 text-village-700 dark:text-village-300">
            {SUBJECT_EMOJIS[course.subject] ?? ''} {course.subject}
          </span>
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 leading-snug">{course.title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2 flex-1">{course.description}</p>

      {course.tags && course.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {course.tags.slice(0, 6).map((t) => (
            <button
              key={t}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTagClick(t) }}
              className="badge text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-village-100 hover:text-village-700 dark:hover:bg-village-900/40 dark:hover:text-village-300 cursor-pointer"
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mb-3">
        {course.teacher_is_verified ? (
          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
            <span>📜</span>
            {course.teacher_name}
            <span className="badge bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 ml-0.5">Village Scholar</span>
          </span>
        ) : (
          <span>{course.teacher_name}</span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-4">
        <span className="flex items-center gap-1"><Clock size={12} className="text-gray-400 dark:text-gray-500" />{course.estimated_hours}h</span>
        <span className="flex items-center gap-1"><Users size={12} className="text-gray-400 dark:text-gray-500" />{course.enrollment_count} enrolled</span>
      </div>

      <div className="flex gap-2 mt-auto">
        <Link
          to={`/courses/${course.id}`}
          className="btn-secondary text-sm flex-1 text-center"
        >
          View
        </Link>
        {isOwn ? (
          <span className="badge bg-village-100 dark:bg-village-900/40 text-village-700 dark:text-village-300 self-center text-xs px-3">Your course</span>
        ) : isEnrolled ? (
          <span className="badge bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 self-center text-xs px-3">✓ Enrolled</span>
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
