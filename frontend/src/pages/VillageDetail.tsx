import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import type { Village, Post } from '../types'
import PostCard from '../components/PostCard'
import { Sparkles, Zap, Users, BookOpen, Send, Wifi } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props { session: Session }

export default function VillageDetail({ session: _session }: Props) {
  const { id } = useParams<{ id: string }>()
  const [village, setVillage] = useState<Village | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [members, setMembers] = useState<unknown[]>([])
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [elderLoading, setElderLoading] = useState(false)
  const [challengeSubject, setChallengeSubject] = useState('')
  const [challengeLoading, setChallengeLoading] = useState(false)
  const [tab, setTab] = useState<'discussion' | 'members'>('discussion')
  const [live, setLive] = useState(false)
  const postIdsRef = useRef(new Set<string>())

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.villages.get(id).then(setVillage),
      api.posts.list(id).then((data) => {
        data.forEach((p) => postIdsRef.current.add(p.id))
        setPosts(data)
      }),
      api.villages.getMembers(id).then(setMembers),
    ])

    const channel = supabase
      .channel(`village-posts-${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts', filter: `village_id=eq.${id}` },
        (payload) => {
          const incoming = payload.new as Post
          if (postIdsRef.current.has(incoming.id)) return
          postIdsRef.current.add(incoming.id)
          setPosts((prev) => [incoming, ...prev])
        },
      )
      .subscribe((status) => setLive(status === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(channel) }
  }, [id])

  const submitPost = async () => {
    if (!newPost.trim() || !id) return
    setPosting(true)
    try {
      const p = await api.posts.create({ content: newPost, village_id: id })
      postIdsRef.current.add(p.id)
      setPosts((prev) => [p, ...prev])
      setNewPost('')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not post')
    } finally {
      setPosting(false)
    }
  }

  const callVillageElder = async () => {
    if (!id) return
    setElderLoading(true)
    try {
      const result = await api.ai.villageElderPrompt(id)
      const elderPost: Post = {
        id: result.post_id,
        content: result.prompt,
        author_id: 'village-elder-ai',
        author_name: 'Village Elder',
        village_id: id,
        is_ai_generated: true,
        upvotes: 0,
      }
      postIdsRef.current.add(result.post_id)
      setPosts((prev) => [elderPost, ...prev])
      toast.success('Village Elder has spoken!')
    } catch {
      toast.error('Could not summon Village Elder')
    } finally {
      setElderLoading(false)
    }
  }

  const generateChallenge = async () => {
    if (!id || !challengeSubject) return
    setChallengeLoading(true)
    try {
      await api.ai.generateChallenge(id, challengeSubject, 'medium')
      toast.success('New challenge created!')
      setChallengeSubject('')
    } catch {
      toast.error('Could not generate challenge')
    } finally {
      setChallengeLoading(false)
    }
  }

  if (!village) return <div className="text-center py-12 text-gray-500">Loading village...</div>

  return (
    <div className="max-w-3xl mx-auto">
      {/* Village header */}
      <div className="card mb-6 bg-gradient-to-br from-village-50 to-amber-50 border-village-200">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🏘️</span>
              <h1 className="text-xl font-bold text-village-800">{village.name}</h1>
              {live && (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            <Wifi size={12} className="text-green-500" /> Live
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">{village.description}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="badge bg-village-100 text-village-700">{village.focus_area}</span>
              <span className="flex items-center gap-1 text-sm text-gray-500"><Users size={12} className="text-gray-400" />{village.member_count}/{village.max_members} members</span>
            </div>
          </div>
        </div>
        {village.resources.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <BookOpen size={12} className="text-gray-400" />
            {village.resources.map((r) => (
              <span key={r} className="badge bg-white border border-village-200 text-village-700">{r}</span>
            ))}
          </div>
        )}
      </div>

      {/* Group AI tools */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">👥 Group Tools</span>
          <span className="text-xs text-gray-400">— shared with everyone in this village</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={callVillageElder} disabled={elderLoading} className="btn-secondary flex items-center gap-2 text-sm">
            <Sparkles size={14} className="text-village-600" />
            {elderLoading ? 'Summoning...' : 'Ask Village Elder'}
          </button>
          <div className="flex gap-2 flex-1 min-w-48">
            <input value={challengeSubject} onChange={(e) => setChallengeSubject(e.target.value)} className="input text-sm" placeholder="Subject for AI challenge..." />
            <button onClick={generateChallenge} disabled={challengeLoading || !challengeSubject} className="btn-primary text-sm flex items-center gap-1.5 whitespace-nowrap">
              <Zap size={14} /> {challengeLoading ? 'Generating...' : 'Challenge'}
            </button>
          </div>
        </div>
      </div>

      {/* Personal tools nudge */}
      <div className="flex items-center gap-2 mb-6 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-500">
        <span>👤</span>
        <span>Need solo AI tutoring, essay coaching, or a personal study plan?</span>
        <Link to="/study-hub" className="text-village-600 font-medium hover:underline shrink-0">Study Hub →</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {(['discussion', 'members'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t as typeof tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-village-600 text-village-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'discussion' && (
        <div className="space-y-4">
          {/* New post */}
          <div className="card">
            <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="Share something with your village..." className="input resize-none mb-2" rows={3} />
            <div className="flex justify-end">
              <button onClick={submitPost} disabled={posting || !newPost.trim()} className="btn-primary text-sm flex items-center gap-2">
                <Send size={14} /> {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-2">
          {(members as Array<{user_id: string; role: string; profiles?: {display_name: string; academic_level: string}}>).map((m) => (
            <div key={m.user_id} className="card flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-village-500 text-white flex items-center justify-center font-bold">
                {(m.profiles?.display_name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-sm">{m.profiles?.display_name || 'Unknown'}</div>
                <div className="text-xs text-gray-500">{m.profiles?.academic_level}</div>
              </div>
              {m.role !== 'member' && (
                <span className="badge bg-village-100 text-village-700 ml-auto capitalize">{m.role}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
