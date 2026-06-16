import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import type { Post } from '../types'
import PostCard from '../components/PostCard'
import { Send, Wifi } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props { session: Session }

export default function Forum({ session: _session }: Props) {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)
  const postIdsRef = useRef(new Set<string>())

  useEffect(() => {
    api.posts.list().then((data) => {
      data.forEach((p) => postIdsRef.current.add(p.id))
      setPosts(data)
    }).finally(() => setLoading(false))

    const channel = supabase
      .channel('global-forum-posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          const incoming = payload.new as Post
          if (incoming.village_id) return  // only global posts here
          if (postIdsRef.current.has(incoming.id)) return
          postIdsRef.current.add(incoming.id)
          setPosts((prev) => [incoming, ...prev])
        },
      )
      .subscribe((status) => setLive(status === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(channel) }
  }, [])

  const submitPost = async () => {
    if (!newPost.trim()) return
    setPosting(true)
    try {
      const p = await api.posts.create({ content: newPost })
      postIdsRef.current.add(p.id)
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Global Forum</h1>
          <p className="text-sm text-gray-500 mt-0.5">Open discussion for all Villages students</p>
        </div>
        {live && (
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
            <Wifi size={12} className="text-green-500" /> Live
          </span>
        )}
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
