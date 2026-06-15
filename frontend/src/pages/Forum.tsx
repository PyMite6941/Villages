import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { api } from '../lib/api'
import type { Post } from '../types'
import PostCard from '../components/PostCard'
import { Send } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props { session: Session }

export default function Forum({ session }: Props) {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.posts.list().then(setPosts).finally(() => setLoading(false))
  }, [])

  const submitPost = async () => {
    if (!newPost.trim()) return
    setPosting(true)
    try {
      const p = await api.posts.create({ content: newPost })
      setPosts((prev) => [p, ...prev])
      setNewPost('')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not post')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Global Forum</h1>
        <p className="text-sm text-gray-500 mt-0.5">Open discussion for all Villages students</p>
      </div>

      <div className="card mb-6">
        <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="Start a discussion, ask a question, share a resource..." className="input resize-none mb-2" rows={3} />
        <div className="flex justify-end">
          <button onClick={submitPost} disabled={posting || !newPost.trim()} className="btn-primary text-sm flex items-center gap-2">
            <Send size={14} /> {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-12">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No posts yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}
    </div>
  )
}
