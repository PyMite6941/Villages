import { supabase } from './supabase'
import type { UserProfile, Village, Post, Comment, Course, CourseWithLessons, EnrollmentStatus, CourseCreate, LessonCreate, Lesson, TeacherVerification } from '../types'

const BASE = '/api'

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
  }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  auth: {
    checkEmail: (email: string) => req<{ exists: boolean }>('GET', `/auth/check-email?email=${encodeURIComponent(email)}`),
    sendMagicLink: (email: string) => {
      const params = new URLSearchParams({ email })
      return req<{ sent: boolean; link: string | null }>('POST', `/auth/send-magic-link?${params}`)
    },
  },
  users: {
    createProfile: (data: Partial<UserProfile>) => req<UserProfile>('POST', '/users/profile', data),
    getProfile: (id: string) => req<UserProfile>('GET', `/users/profile/${id}`),
    updateProfile: (data: Partial<UserProfile>) => req<UserProfile>('PATCH', '/users/profile', data),
  },
  villages: {
    list: (focusArea?: string) => req<Village[]>('GET', `/villages${focusArea ? `?focus_area=${focusArea}` : ''}`),
    get: (id: string) => req<Village>('GET', `/villages/${id}`),
    create: (data: Partial<Village>) => req<Village>('POST', '/villages', data),
    join: (id: string) => req<{ message: string }>('POST', `/villages/${id}/join`),
    aiMatch: () => req<{ recommended_village_id: string; reasoning: string }>('POST', '/villages/match'),
    getMembers: (id: string) => req<unknown[]>('GET', `/villages/${id}/members`),
  },
  posts: {
    list: (villageId?: string, offset = 0) =>
      req<Post[]>('GET', `/posts?${villageId ? `village_id=${villageId}&` : ''}offset=${offset}`),
    create: (data: { content: string; village_id?: string }) => req<Post>('POST', '/posts', data),
    upvote: (id: string) => req<{ upvotes: number }>('POST', `/posts/${id}/upvote`),
    getComments: (postId: string) => req<Comment[]>('GET', `/posts/${postId}/comments`),
    addComment: (postId: string, content: string) =>
      req<Comment>('POST', `/posts/${postId}/comments`, { post_id: postId, content }),
  },
  courses: {
    list: (category?: string, subject?: string) => {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (subject) params.set('subject', subject)
      const qs = params.toString()
      return req<Course[]>('GET', `/courses${qs ? `?${qs}` : ''}`)
    },
    get: (id: string) => req<CourseWithLessons>('GET', `/courses/${id}`),
    create: (data: CourseCreate) => req<Course>('POST', '/courses', data),
    enroll: (id: string) => req<EnrollmentStatus>('POST', `/courses/${id}/enroll`),
    getEnrollment: (id: string) => req<EnrollmentStatus>('GET', `/courses/${id}/enrollment`),
    completeLesson: (courseId: string, lessonId: string) =>
      req<{ completed_lesson_ids: string[] }>('POST', `/courses/${courseId}/lessons/${lessonId}/complete`),
    addLesson: (courseId: string, data: LessonCreate) =>
      req<Lesson>('POST', `/courses/${courseId}/lessons`, data),
  },
  teacher: {
    apply: (data: { degree_title: string; institution: string; subject_area: string }) =>
      req<TeacherVerification>('POST', '/teacher/apply', data),
    getVerification: () => req<TeacherVerification | null>('GET', '/teacher/verification'),
  },
  ai: {
    villageElderPrompt: (villageId: string) =>
      req<{ prompt: string; post_id: string }>('POST', `/ai/village-elder/${villageId}/prompt`),
    generateChallenge: (villageId: string, subject: string, difficulty: string) => {
      const params = new URLSearchParams({ subject, difficulty })
      return req<unknown>('POST', `/ai/village-elder/${villageId}/challenge?${params}`)
    },
    explainTopic: (topic: string, villageId?: string) => {
      const params = new URLSearchParams({ topic })
      if (villageId) params.set('village_id', villageId)
      return req<{
        plain_language: string
        key_points: string[]
        checklist: { title: string; done: boolean }[]
        next_steps: { title: string; description: string }[]
        _audience: string[]
        _guardrail: { safe: boolean; concerns: string[]; ethical_notes: string[] }
        explanation_id?: string
      }>('POST', `/ai/topic/explain?${params}`)
    },
    generateLearningPath: (villageId: string) =>
      req<{
        title: string
        description: string
        steps: { title: string; description: string; estimated_minutes: number }[]
        learning_path_id: string
      }>('POST', `/ai/village/${villageId}/learning-path`),
    getTopicExplanations: (villageId: string) =>
      req<unknown[]>('GET', `/ai/topic/explanations/${villageId}`),
    getLearningPaths: (villageId: string) =>
      req<unknown[]>('GET', `/ai/village/${villageId}/learning-paths`),
    courseStudyTips: (courseId: string) =>
      req<{ tips: string }>('POST', `/ai/courses/${courseId}/study-tips`),
    studyBuddy: (subject: string, message: string, history: { role: string; content: string }[]) =>
      req<{ response: string }>('POST', '/ai/study-buddy', { subject, message, history }),
    essayCoach: (essay: string, essay_prompt: string, student_context: string) =>
      req<{ strengths: string[]; improvements: string[]; vulnerabilities: string[]; overall: string }>(
        'POST', '/ai/essay-coach', { essay, essay_prompt, student_context }
      ),
    studyPlan: (data: { goals: string[]; strengths: string[]; weaknesses: string[]; academic_level: string; weekly_hours: number }) =>
      req<{ plan: string }>('POST', '/ai/study-plan', data),
    collegeAdvisor: (data: {
      message: string
      gpa?: string
      test_scores?: string
      interests?: string[]
      preferences?: string
      history?: { role: string; content: string }[]
    }) => req<{ response: string }>('POST', '/ai/college-advisor', data),
  },
}
