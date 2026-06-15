import { useState } from 'react'
import { ThumbsUp, MessageSquare, Bot } from 'lucide-react'
import type { Post, Comment } from '../types'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

interface Props {
  post: Post
  showComments?: boolean
}

export default function PostCard({ post, showComments = false }: Props) {
  const [upvotes, setUpvotes] = useState(post.upvotes)
  const [comments, setComments] = useState<Comment[]>([])
  const [showingComments, setShowingComments] = useState(showComments)
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)

  const handleUpvote = async () => {
    try {
      const res = await api.posts.upvote(post.id)
      setUpvotes(res.upvotes)
    } catch {
      toast.error('Could not upvote')
    }
  }

  const loadComments = async () => {
    if (showingComments) { setShowingComments(false); return }
    setLoadingComments(true)
    try {
      const data = await api.posts.getComments(post.id)
      setComments(data)
      setShowingComments(true)
    } catch {
      toast.error('Could not load comments')
    } finally {
      setLoadingComments(false)
    }
  }

  const submitComment = async () => {
    if (!newComment.trim()) return
    try {
      const c = await api.posts.addComment(post.id, newComment)
      setComments((prev) => [...prev, c])
      setNewComment('')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not post comment')
    }
  }

  return (
    <div className={`card ${post.is_ai_generated ? 'border-village-200 bg-village-50' : ''}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${post.is_ai_generated ? 'bg-village-600' : 'bg-amber-500'}`}>
          {post.is_ai_generated ? <Bot size={16} /> : post.author_name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{post.author_name}</span>
            {post.is_ai_generated && (
              <span className="badge bg-village-100 text-village-700">Village Elder</span>
            )}
            <span className="text-xs text-gray-400 ml-auto">
              {post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}
            </span>
          </div>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <button onClick={handleUpvote} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-village-600 transition-colors">
          <ThumbsUp size={14} />
          <span>{upvotes}</span>
        </button>
        <button onClick={loadComments} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-village-600 transition-colors">
          <MessageSquare size={14} />
          <span>{loadingComments ? '...' : 'Comments'}</span>
        </button>
      </div>

      {showingComments && (
        <div className="mt-3 space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 pl-3 border-l-2 border-amber-100">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold shrink-0">
                {c.author_name[0].toUpperCase()}
              </div>
              <div>
                <span className="text-xs font-medium text-gray-700">{c.author_name}</span>
                <p className="text-xs text-gray-600 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="input text-sm"
              onKeyDown={(e) => e.key === 'Enter' && submitComment()}
            />
            <button onClick={submitComment} className="btn-primary text-sm px-3">Post</button>
          </div>
        </div>
      )}
    </div>
  )
}
