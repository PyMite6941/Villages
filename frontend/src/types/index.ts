export interface UserProfile {
  id: string
  email: string
  display_name: string
  academic_level: string
  goals: string[]
  strengths: string[]
  weaknesses: string[]
  village_id?: string
  avatar_url?: string
  created_at?: string
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
