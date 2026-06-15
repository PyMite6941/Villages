import { supabase } from './supabase'
import type { UserProfile, Village, Post, Comment } from '../types'

const BASE = '/api'

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    ...(session?.user?.id ? { 'x-user-id': session.user.id } : {}),
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
  ai: {
    villageElderPrompt: (villageId: string) =>
      req<{ prompt: string; post_id: string }>('POST', `/ai/village-elder/${villageId}/prompt`),
    generateChallenge: (villageId: string, subject: string, difficulty: string) =>
      req<unknown>('POST', `/ai/village-elder/${villageId}/challenge?subject=${subject}&difficulty=${difficulty}`),
  },
}
