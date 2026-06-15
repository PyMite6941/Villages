import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { ArrowLeft, Clock, Users, ChevronDown, ChevronUp, Sparkles, Plus, CheckCircle, Circle } from 'lucide-react'
import { api } from '../lib/api'
import type { CourseWithLessons, EnrollmentStatus, LessonCreate } from '../types'
import toast from 'react-hot-toast'

interface Props { session: Session }

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-village-100 text-village-700',
  advanced: 'bg-rose-100 text-rose-700',
}

export default function CourseDetail({ session }: Props) {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<CourseWithLessons | null>(null)
  const [enrollment, setEnrollment] = useState<EnrollmentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)
  const [completingLesson, setCompletingLesson] = useState<string | null>(null)
  const [showAddLesson, setShowAddLesson] = useState(false)
  const [lessonForm, setLessonForm] = useState<LessonCreate>({ title: '', content: '', order_index: 0, duration_minutes: 15 })
  const [addingLesson, setAddingLesson] = useState(false)
  const [aiTips, setAiTips] = useState<string | null>(null)
  const [loadingTips, setLoadingTips] = useState(false)

  const isTeacher = course?.teacher_id === session.user.id
  const completedIds = new Set(enrollment?.completed_lesson_ids ?? [])
  const lessonCount = course?.lessons.length ?? 0
  const completedCount = [...completedIds].filter((lid) =>
    course?.lessons.some((l) => l.id === lid)
  ).length
  const progress = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.courses.get(id),
      api.courses.getEnrollment(id),
    ]).then(([c, e]) => {
      setCourse(c)
      setEnrollment(e)
      setLessonForm((f) => ({ ...f, order_index: c.lessons.length }))
    }).catch(() => toast.error('Could not load course')).finally(() => setLoading(false))
  }, [id])

  const handleEnroll = async () => {
    if (!id) return
    setEnrolling(true)
    try {
      const e = await api.courses.enroll(id)
      setEnrollment(e)
      setCourse((c) => c ? { ...c, enrollment_count: c.enrollment_count + 1 } : c)
      toast.success('You\'re enrolled! Start your first lesson below.')
    } catch {
      toast.error('Could not enroll')
    } finally {
      setEnrolling(false)
    }
  }

  const handleCompleteLesson = async (lessonId: string) => {
    if (!id || !enrollment?.enrolled) return
    setCompletingLesson(lessonId)
    try {
      const result = await api.courses.completeLesson(id, lessonId)
      setEnrollment((e) => e ? { ...e, completed_lesson_ids: result.completed_lesson_ids } : e)
      toast.success('Lesson complete!')
    } catch {
      toast.error('Could not mark lesson complete')
    } finally {
      setCompletingLesson(null)
    }
  }

  const handleAddLesson = async () => {
    if (!id || !lessonForm.title.trim() || !lessonForm.content.trim()) {
      toast.error('Title and content are required')
      return
    }
    setAddingLesson(true)
    try {
      const lesson = await api.courses.addLesson(id, lessonForm)
      setCourse((c) => c ? { ...c, lessons: [...c.lessons, lesson] } : c)
      setLessonForm({ title: '', content: '', order_index: (course?.lessons.length ?? 0) + 1, duration_minutes: 15 })
      setShowAddLesson(false)
      toast.success('Lesson added!')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not add lesson')
    } finally {
      setAddingLesson(false)
    }
  }

  const handleGetTips = async () => {
    if (!id) return
    setLoadingTips(true)
    try {
      const result = await api.ai.courseStudyTips(id)
      setAiTips(result.tips)
    } catch {
      toast.error('Could not get study tips')
    } finally {
      setLoadingTips(false)
    }
  }

  if (loading) {
    return <div className="text-center py-16 text-gray-400">Loading course...</div>
  }

  if (!course) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-500">Course not found.</div>
        <Link to="/courses" className="text-village-600 text-sm mt-2 inline-block">← Back to courses</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <ArrowLeft size={14} /> Back to Knowledge Grove
      </Link>

      {/* Course header */}
      <div className="card mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="text-5xl">{course.thumbnail_emoji}</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">{course.title}</h1>
              <p className="text-gray-500 text-sm mb-3">{course.description}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`badge ${DIFFICULTY_COLORS[course.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
                  {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
                </span>
                <span className={`badge ${course.category === 'school' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                  {course.subject}
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <Clock size={12} className="text-gray-400" /> {course.estimated_hours}h
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <Users size={12} className="text-gray-400" /> {course.enrollment_count} enrolled
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {isTeacher ? (
              <span className="badge bg-village-100 text-village-700 text-xs">Your course</span>
            ) : enrollment?.enrolled ? (
              <span className="badge bg-emerald-100 text-emerald-700 text-xs">✓ Enrolled</span>
            ) : (
              <button onClick={handleEnroll} disabled={enrolling} className="btn-primary text-sm">
                {enrolling ? 'Enrolling...' : 'Enroll →'}
              </button>
            )}
          </div>
        </div>

        {/* Teacher info */}
        <div className="mt-4 pt-4 border-t border-amber-50 flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full bg-village-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {course.teacher_name[0]?.toUpperCase()}
          </div>
          <span className="text-gray-600">Taught by</span>
          {course.teacher_is_verified ? (
            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
              <span>📜</span>
              {course.teacher_name}
              <span className="badge bg-amber-100 text-amber-700 text-xs">Village Scholar</span>
            </span>
          ) : (
            <span className="font-medium text-gray-800">{course.teacher_name}</span>
          )}
        </div>
      </div>

      {/* Progress bar (enrolled users) */}
      {enrollment?.enrolled && lessonCount > 0 && (
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Your progress</span>
            <span className="text-sm text-gray-500">{completedCount}/{lessonCount} lessons · {progress}%</span>
          </div>
          <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-village-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 && (
            <div className="mt-2 text-center text-sm text-emerald-700 font-medium">🎉 Course complete!</div>
          )}
        </div>
      )}

      {/* AI Study Tips */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Village Elder Study Tips</h2>
            <p className="text-xs text-gray-400">AI-generated advice from your community guide</p>
          </div>
          <button
            onClick={handleGetTips}
            disabled={loadingTips}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            {loadingTips ? 'Thinking...' : 'Get Tips'}
          </button>
        </div>
        {aiTips && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
            {aiTips}
          </div>
        )}
      </div>

      {/* Lessons */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">
          Lessons <span className="text-gray-400 font-normal text-sm">({lessonCount})</span>
        </h2>

        {course.lessons.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            {isTeacher ? 'Add your first lesson below.' : 'No lessons yet — check back soon!'}
          </div>
        ) : (
          <div className="space-y-2">
            {course.lessons.map((lesson, idx) => {
              const isDone = completedIds.has(lesson.id)
              const isExpanded = expandedLesson === lesson.id
              const canComplete = enrollment?.enrolled && !isDone

              return (
                <div key={lesson.id} className="border border-amber-100 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-amber-50 transition-colors"
                  >
                    {isDone ? (
                      <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                    ) : (
                      <Circle size={16} className="text-gray-300 shrink-0" />
                    )}
                    <span className="text-xs text-gray-400 w-5 shrink-0 font-mono">{idx + 1}</span>
                    <span className="flex-1 text-sm font-medium text-gray-800">{lesson.title}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                      <Clock size={12} className="text-gray-400" /> {lesson.duration_minutes}m
                    </span>
                    {isExpanded ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-amber-50">
                      <div className="pt-3 text-sm text-gray-700 whitespace-pre-line leading-relaxed mb-3">
                        {lesson.content}
                      </div>
                      {canComplete && (
                        <button
                          onClick={() => handleCompleteLesson(lesson.id)}
                          disabled={completingLesson === lesson.id}
                          className="btn-primary text-sm"
                        >
                          {completingLesson === lesson.id ? 'Marking...' : '✓ Mark as complete'}
                        </button>
                      )}
                      {isDone && (
                        <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
                          <CheckCircle size={14} /> Completed
                        </span>
                      )}
                      {!enrollment?.enrolled && !isTeacher && (
                        <p className="text-xs text-gray-400">Enroll to track your progress</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Add lesson (teacher only) */}
        {isTeacher && (
          <div className="mt-5 pt-4 border-t border-amber-100">
            {!showAddLesson ? (
              <button
                onClick={() => setShowAddLesson(true)}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Plus size={14} /> Add Lesson
              </button>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">New Lesson</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Title</label>
                    <input
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Introduction to Limits"
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Duration (min)</label>
                    <input
                      type="number"
                      min={1}
                      value={lessonForm.duration_minutes}
                      onChange={(e) => setLessonForm((f) => ({ ...f, duration_minutes: parseInt(e.target.value) || 15 }))}
                      className="input text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Lesson Content</label>
                  <textarea
                    value={lessonForm.content}
                    onChange={(e) => setLessonForm((f) => ({ ...f, content: e.target.value }))}
                    placeholder="Write the lesson material here..."
                    rows={6}
                    className="input text-sm resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddLesson(false)} className="btn-secondary text-sm flex-1">
                    Cancel
                  </button>
                  <button onClick={handleAddLesson} disabled={addingLesson} className="btn-primary text-sm flex-1">
                    {addingLesson ? 'Adding...' : 'Add Lesson'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
