import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { ArrowLeft, Clock, Users, ChevronDown, ChevronUp, Sparkles, Plus, CheckCircle, Circle, HelpCircle, BadgeCheck, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import type { CourseWithLessons, EnrollmentStatus, LessonCreate, QuizQuestion } from '../types'
import { isApprovedSource } from '../lib/courseTemplates'
import toast from 'react-hot-toast'

interface Props { session: Session }

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  intermediate: 'bg-village-100 dark:bg-village-900/40 text-village-700 dark:text-village-300',
  advanced: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
}

// Convert a video URL into an embeddable iframe src.
// SECURITY: only YouTube and Vimeo are allowed. Arbitrary URLs are rejected so a
// course creator can't embed a phishing/clickjacking page in the lesson view.
function toEmbedUrl(url: string): string | null {
  const u = url.trim()
  if (!u) return null
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`
  const vimeo = u.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
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
  const [lessonForm, setLessonForm] = useState<LessonCreate>({ title: '', content: '', order_index: 0, duration_minutes: 15, video_url: '' })
  const [addingLesson, setAddingLesson] = useState(false)
  const [aiTips, setAiTips] = useState<string | null>(null)
  const [loadingTips, setLoadingTips] = useState(false)
  const [showAddOfficeHour, setShowAddOfficeHour] = useState(false)
  const [officeHourForm, setOfficeHourForm] = useState({ day_of_week: 1, start_time: '09:00', end_time: '10:00', location: '' })
  const [addingOfficeHour, setAddingOfficeHour] = useState(false)

  const isTeacher = course?.teacher_id === session.user.id
  const completedIds = new Set(enrollment?.completed_lesson_ids ?? [])
  const lessonCount = course?.lessons.length ?? 0
  const completedCount = [...completedIds].filter((lid) =>
    course?.lessons.some((l) => l.id === lid)
  ).length
  const progress = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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

  const handleAddOfficeHour = async () => {
    if (!id) return
    setAddingOfficeHour(true)
    try {
      const oh = await api.courses.addOfficeHour(id, officeHourForm)
      setCourse((c) => c ? { ...c, office_hours: [...(c.office_hours ?? []), oh] } : c)
      setShowAddOfficeHour(false)
      setOfficeHourForm({ day_of_week: 1, start_time: '09:00', end_time: '10:00', location: '' })
      toast.success('Office hours added')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not add office hours')
    } finally {
      setAddingOfficeHour(false)
    }
  }

  const handleDeleteOfficeHour = async (ohId: string) => {
    if (!id) return
    try {
      await api.courses.deleteOfficeHour(id, ohId)
      setCourse((c) => c ? { ...c, office_hours: (c.office_hours ?? []).filter((oh) => oh.id !== ohId) } : c)
      toast.success('Office hours removed')
    } catch {
      toast.error('Could not remove office hours')
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
      setLessonForm({ title: '', content: '', order_index: (course?.lessons.length ?? 0) + 1, duration_minutes: 15, video_url: '' })
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
    return <div className="text-center py-16 text-gray-400 dark:text-gray-500">Loading course...</div>
  }

  if (!course) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-500 dark:text-gray-400">Course not found.</div>
        <Link to="/courses" className="text-village-600 dark:text-village-300 text-sm mt-2 inline-block">← Back to courses</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-5">
        <ArrowLeft size={14} /> Back to Knowledge Grove
      </Link>

      {/* Course header */}
      <div className="card mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="text-5xl">{course.thumbnail_emoji}</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{course.title}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{course.description}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`badge ${DIFFICULTY_COLORS[course.difficulty] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                  {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
                </span>
                <span className="badge bg-village-100 dark:bg-village-900/40 text-village-700 dark:text-village-300">
                  {course.subject}
                </span>
                <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                  <Clock size={12} className="text-gray-400 dark:text-gray-500" /> {course.estimated_hours}h
                </span>
                <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                  <Users size={12} className="text-gray-400 dark:text-gray-500" /> {course.enrollment_count} enrolled
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {isTeacher ? (
              <span className="badge bg-village-100 dark:bg-village-900/40 text-village-700 dark:text-village-300 text-xs">Your course</span>
            ) : enrollment?.enrolled ? (
              <span className="badge bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs">✓ Enrolled</span>
            ) : (
              <button onClick={handleEnroll} disabled={enrolling} className="btn-primary text-sm">
                {enrolling ? 'Enrolling...' : 'Enroll →'}
              </button>
            )}
          </div>
        </div>

        {/* Teacher info */}
        <div className="mt-4 pt-4 border-t border-amber-50 dark:border-gray-800 flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full bg-village-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {course.teacher_name[0]?.toUpperCase()}
          </div>
          <span className="text-gray-600 dark:text-gray-400">Taught by</span>
          {course.teacher_is_verified ? (
            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
              <span>📜</span>
              {course.teacher_name}
              <span className="badge bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs">Village Scholar</span>
            </span>
          ) : (
            <span className="font-medium text-gray-800 dark:text-gray-200">{course.teacher_name}</span>
          )}
        </div>

        {course.source && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span>Content source: <span className="font-medium text-gray-700 dark:text-gray-300">{course.source}</span></span>
            {isApprovedSource(course.source) && (
              <span className="inline-flex items-center gap-1 badge bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                <BadgeCheck size={12} /> Approved source
              </span>
            )}
          </div>
        )}

        {/* Private badge + invite code */}
        {course.is_private && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="badge bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">🔒 Private course</span>
            {isTeacher && course.invite_code && (
              <span className="text-gray-500 dark:text-gray-400">
                Invite code: <span className="font-mono font-bold text-village-700 dark:text-village-300 tracking-wider bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded">{course.invite_code}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(course.invite_code!); toast.success('Copied!') }}
                  className="ml-1 text-village-600 dark:text-village-300 underline hover:text-village-700 dark:hover:text-village-300"
                >
                  Copy
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Office Hours */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5">
            <Clock size={15} className="text-village-600 dark:text-village-300" /> Office Hours
          </h2>
          {isTeacher && (
            <button
              onClick={() => setShowAddOfficeHour(!showAddOfficeHour)}
              className="btn-secondary text-xs flex items-center gap-1"
            >
              <Plus size={13} /> {showAddOfficeHour ? 'Cancel' : 'Add'}
            </button>
          )}
        </div>

        {showAddOfficeHour && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Day</label>
                <select
                  value={officeHourForm.day_of_week}
                  onChange={(e) => setOfficeHourForm((f) => ({ ...f, day_of_week: parseInt(e.target.value) }))}
                  className="input text-xs"
                >
                  {DAY_NAMES.map((name, i) => (
                    <option key={i} value={i}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Start</label>
                <input
                  type="time"
                  value={officeHourForm.start_time}
                  onChange={(e) => setOfficeHourForm((f) => ({ ...f, start_time: e.target.value }))}
                  className="input text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">End</label>
                <input
                  type="time"
                  value={officeHourForm.end_time}
                  onChange={(e) => setOfficeHourForm((f) => ({ ...f, end_time: e.target.value }))}
                  className="input text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Location / Link</label>
              <input
                value={officeHourForm.location}
                onChange={(e) => setOfficeHourForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Zoom link or Room 201"
                className="input text-xs"
              />
            </div>
            <button onClick={handleAddOfficeHour} disabled={addingOfficeHour} className="btn-primary text-xs">
              {addingOfficeHour ? 'Adding...' : 'Add Office Hours'}
            </button>
          </div>
        )}

        {course.office_hours && course.office_hours.length > 0 ? (
          <div className="space-y-2">
            {course.office_hours.map((oh) => (
              <div key={oh.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-800 dark:text-gray-200 w-24">{DAY_NAMES[oh.day_of_week]}</span>
                  <span className="text-gray-600 dark:text-gray-400">{oh.start_time.slice(0, 5)} – {oh.end_time.slice(0, 5)}</span>
                  {oh.location && <span className="text-gray-400 dark:text-gray-500 text-xs">{oh.location}</span>}
                </div>
                {isTeacher && (
                  <button onClick={() => handleDeleteOfficeHour(oh.id)} className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500">{isTeacher ? 'Add your office hours so students know when you\'re available.' : 'No office hours set yet.'}</p>
        )}
      </div>

      {/* Progress bar (enrolled users) */}
      {enrollment?.enrolled && lessonCount > 0 && (
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Your progress</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{completedCount}/{lessonCount} lessons · {progress}%</span>
          </div>
          <div className="h-2 bg-amber-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-village-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 && (
            <div className="mt-2 text-center text-sm text-emerald-700 dark:text-emerald-400 font-medium">🎉 Course complete!</div>
          )}
        </div>
      )}

      {/* AI Study Tips */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Village Elder Study Tips</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">AI-generated advice from your community guide</p>
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
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
            {aiTips}
          </div>
        )}
      </div>

      {/* Lessons */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Lessons <span className="text-gray-400 dark:text-gray-500 font-normal text-sm">({lessonCount})</span>
        </h2>

        {course.lessons.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
            {isTeacher ? 'Add your first lesson below.' : 'No lessons yet — check back soon!'}
          </div>
        ) : (
          <div className="space-y-2">
            {course.lessons.map((lesson, idx) => {
              const isDone = completedIds.has(lesson.id)
              const isExpanded = expandedLesson === lesson.id
              const canComplete = enrollment?.enrolled && !isDone

              return (
                <div key={lesson.id} className="border border-amber-100 dark:border-gray-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-amber-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {isDone ? (
                      <CheckCircle size={16} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Circle size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500 w-5 shrink-0 font-mono">{idx + 1}</span>
                    <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{lesson.title}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 shrink-0">
                      <Clock size={12} className="text-gray-400 dark:text-gray-500" /> {lesson.duration_minutes}m
                    </span>
                    {isExpanded ? <ChevronUp size={14} className="text-gray-400 dark:text-gray-500 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-amber-50 dark:border-gray-800">
                      {lesson.video_url && toEmbedUrl(lesson.video_url) && (
                        <div className="pt-3 mb-3 aspect-video w-full overflow-hidden rounded-lg bg-black">
                          <iframe
                            src={toEmbedUrl(lesson.video_url)!}
                            title={lesson.title}
                            className="w-full h-full"
                            referrerPolicy="strict-origin-when-cross-origin"
                            sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}
                      <div className="pt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed mb-3">
                        {lesson.content}
                      </div>

                      {/* AI practice questions */}
                      {id && <LessonQuiz courseId={id} lessonId={lesson.id} />}

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
                        <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-1">
                          <CheckCircle size={14} /> Completed
                        </span>
                      )}
                      {!enrollment?.enrolled && !isTeacher && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">Enroll to track your progress</p>
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
          <div className="mt-5 pt-4 border-t border-amber-100 dark:border-gray-800">
            {!showAddLesson ? (
              <button
                onClick={() => setShowAddLesson(true)}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Plus size={14} /> Add Lesson
              </button>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">New Lesson</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Title</label>
                    <input
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Introduction to Limits"
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Duration (min)</label>
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
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                    Video URL                     <span className="text-gray-400 dark:text-gray-500 font-normal">(optional — YouTube / Vimeo, embeds automatically)</span>
                  </label>
                  <input
                    value={lessonForm.video_url ?? ''}
                    onChange={(e) => setLessonForm((f) => ({ ...f, video_url: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Lesson Content</label>
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

function LessonQuiz({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [revealed, setRevealed] = useState(false)

  const generate = async () => {
    setLoading(true)
    setRevealed(false)
    setAnswers({})
    try {
      const res = await api.ai.lessonQuiz(courseId, lessonId)
      setQuestions(res.questions ?? [])
    } catch {
      toast.error('Could not generate questions')
    } finally {
      setLoading(false)
    }
  }

  const score = questions
    ? questions.filter((q, i) => answers[i] === q.correct_index).length
    : 0
  const allAnswered = questions ? questions.every((_, i) => answers[i] !== undefined) : false

  return (
    <div className="mb-3 rounded-lg border border-amber-100 dark:border-gray-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <HelpCircle size={15} className="text-village-600 dark:text-village-300" /> Practice Questions
          <span className="text-xs font-normal text-gray-400 dark:text-gray-500">AI-generated from this lesson</span>
        </span>
        <button onClick={generate} disabled={loading} className="btn-secondary text-xs flex items-center gap-1.5">
          <Sparkles size={13} />
          {loading ? 'Generating...' : questions ? 'New set' : 'Generate'}
        </button>
      </div>

      {questions && questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((q, qi) => (
            <div key={qi} className="text-sm">
              <p className="font-medium text-gray-800 dark:text-gray-200 mb-1.5">{qi + 1}. {q.question}</p>
              <div className="space-y-1">
                {q.options.map((opt, oi) => {
                  const selected = answers[qi] === oi
                  const isCorrect = q.correct_index === oi
                  let cls = 'border-gray-200 dark:border-gray-700 hover:border-village-300 dark:hover:border-village-600'
                  if (revealed) {
                    if (isCorrect) cls = 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'
                    else if (selected) cls = 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/30'
                    else cls = 'border-gray-200 dark:border-gray-700 opacity-70'
                  } else if (selected) {
                    cls = 'border-village-500 dark:border-village-600 bg-village-50 dark:bg-village-900/30'
                  }
                  return (
                    <button
                      key={oi}
                      disabled={revealed}
                      onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                      className={`w-full text-left px-3 py-1.5 rounded-md border text-sm transition-colors ${cls}`}
                    >
                      <span className="font-mono text-xs text-gray-400 dark:text-gray-500 mr-2">{String.fromCharCode(65 + oi)}</span>
                      {opt}
                      {revealed && isCorrect && <span className="ml-1.5 text-emerald-600 dark:text-emerald-400">✓</span>}
                    </button>
                  )
                })}
              </div>
              {revealed && (
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-amber-100 dark:border-gray-800 rounded p-2">
                  {q.explanation}
                </p>
              )}
            </div>
          ))}

          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              disabled={!allAnswered}
              className="btn-primary text-sm w-full disabled:opacity-50"
            >
              {allAnswered ? 'Check answers' : 'Answer all questions to check'}
            </button>
          ) : (
            <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">
              You scored {score}/{questions.length} {score === questions.length ? '🎉' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
