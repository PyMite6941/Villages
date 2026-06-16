export interface UserProfile {
  id: string
  email: string
  display_name: string
  academic_level: string
  goals: string[]
  strengths: string[]
  weaknesses: string[]
  interests: string[]
  learning_style: string
  village_id?: string
  avatar_url?: string
  is_verified_teacher?: boolean
  teacher_subjects?: string[]
  bio?: string
  study_tags?: string[]
  created_at?: string
}

export interface Message {
  id: string
  village_id: string
  user_id: string
  author_name: string
  content: string
  message_type: 'text' | 'code' | 'link'
  reply_to_id: string | null
  reply_preview: string | null
  is_pinned: boolean
  created_at: string
}

export interface Village {
  id: string
  name: string
  description: string
  focus_area: string
  resources: string[]
  max_members: number
  member_count: number
  is_active: boolean
  created_by: string
  created_at?: string
}

export interface Post {
  id: string
  content: string
  author_id: string
  author_name: string
  village_id?: string
  is_ai_generated: boolean
  upvotes: number
  created_at?: string
}

export interface Comment {
  id: string
  post_id: string
  content: string
  author_id: string
  author_name: string
  is_ai_generated: boolean
  created_at?: string
}

export interface Challenge {
  id: string
  village_id: string
  title: string
  description: string
  subject: string
  difficulty: string
  is_collaborative: boolean
  generated_by_ai: boolean
  completed_by: string[]
  created_at?: string
}

export interface TeacherVerification {
  id: string
  user_id: string
  degree_title: string
  institution: string
  subject_area: string
  status: 'pending' | 'verified' | 'rejected'
  created_at?: string
}

export interface Course {
  id: string
  title: string
  description: string
  category: 'school' | 'hobby'
  subject: string
  teacher_id?: string
  teacher_name: string
  teacher_is_verified: boolean
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimated_hours: number
  thumbnail_emoji: string
  enrollment_count: number
  is_published: boolean
  created_at?: string
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  content: string
  order_index: number
  duration_minutes: number
  created_at?: string
}

export interface CourseWithLessons extends Course {
  lessons: Lesson[]
}

export interface EnrollmentStatus {
  enrolled: boolean
  user_id?: string
  course_id?: string
  completed_lesson_ids?: string[]
  enrolled_at?: string
}

export interface CourseCreate {
  title: string
  description: string
  category: 'school' | 'hobby'
  subject: string
  difficulty: string
  estimated_hours: number
  thumbnail_emoji: string
}

export interface LessonCreate {
  title: string
  content: string
  order_index: number
  duration_minutes: number
}
