import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import type { Village, Post, Challenge } from '../types'
import PostCard from '../components/PostCard'
import VillageChat from '../components/VillageChat'
import VillageVoice from '../components/VillageVoice'
import { Sparkles, Zap, Users, BookOpen, Send, Wifi, MessageCircle, Trophy, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props { session: Session }

export default function VillageDetail({ session: _session }: Props) {
  const { id } = useParams<{ id: string }>()
  const [village, setVillage] = useState<Village | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [members, setMembers] = useState<unknown[]>([])
  const [displayName, setDisplayName] = useState('')
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [elderLoading, setElderLoading] = useState(false)
  const [challengeSubject, setChallengeSubject] = useState('')
  const [challengeLoading, setChallengeLoading] = useState(false)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [tab, setTab] = useState<'discussion' | 'chat' | 'members'>('discussion')
  const [live, setLive] = useState(false)
  const postIdsRef = useRef(new Set<string>())

  const sessionId = _session.user.id
  const sessionEmail = _session.user.email

  useEffect(() => {
    api.users.getProfile(sessionId)
      .then((p) => setDisplayName(p.display_name))
      .catch(() => setDisplayName(sessionEmail?.split('@')[0] ?? 'Villager'))
  }, [sessionId, sessionEmail])

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.villages.get(id).then(setVillage),
      api.posts.list(id).then((data) => {
        data.forEach((p) => postIdsRef.current.add(p.id))
        setPosts(data)
      }),
      api.villages.getMembers(id).then(setMembers),
      api.villages.listChallenges(id).then(setChallenges).catch(() => null),
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
      const refreshed = await api.villages.listChallenges(id)
      setChallenges(refreshed)
    } catch {
      toast.error('Could not generate challenge')
    } finally {
      setChallengeLoading(false)
    }
  }

  const completeChallenge = async (challengeId: string) => {
    if (!id) return
    setCompletingId(challengeId)
    try {
      const res = await api.villages.completeChallenge(id, challengeId)
      setChallenges((prev) => prev.map((c) => (c.id === challengeId ? { ...c, completed_by: res.completed_by } : c)))
      toast.success('Challenge completed! 🎉')
    } catch {
      toast.error('Could not mark complete')
    } finally {
      setCompletingId(null)
    }
  }

  if (!village) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading village...</div>

  return (
    <div className="max-w-3xl mx-auto">
      {/* Village header */}
      <div className="card mb-6 bg-gradient-to-br from-village-50 to-amber-50 border-village-200 dark:from-village-950/40 dark:to-amber-950/30 dark:border-village-800">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🏘️</span>
              <h1 className="text-xl font-bold text-village-800 dark:text-village-300">{village.name}</h1>
              {live && (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
            <Wifi size={12} className="text-green-500" /> Live
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{village.description}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="badge bg-village-100 text-village-700 dark:bg-village-900/40 dark:text-village-300">{village.focus_area}</span>
              <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400"><Users size={12} className="text-gray-400 dark:text-gray-500" />{village.member_count}/{village.max_members} members</span>
            </div>
          </div>
        </div>
        {village.resources.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <BookOpen size={12} className="text-gray-400 dark:text-gray-500" />
            {village.resources.map((r) => (
              <span key={r} className="badge bg-white dark:bg-gray-800 border border-village-200 dark:border-village-800 text-village-700 dark:text-village-300">{r}</span>
            ))}
          </div>
        )}
      </div>

      {/* Group AI tools */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">👥 Group Tools</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">— shared with everyone in this village</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={callVillageElder} disabled={elderLoading} className="btn-secondary flex items-center gap-2 text-sm">
            <Sparkles size={14} className="text-village-600 dark:text-village-300" />
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

      {/* Village Fire — live voice channel */}
      {id && <VillageVoice villageId={id} />}

      {/* Collaborative challenges */}
      {challenges.length > 0 && (
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={14} className="text-village-600 dark:text-village-300" />
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Challenges</span>
          </div>
          {challenges.map((ch) => {
            const done = ch.completed_by?.includes(_session.user.id)
            return (
              <div key={ch.id} className="card py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{ch.title}</span>
                      <span className="badge bg-village-100 text-village-700 dark:bg-village-900/40 dark:text-village-300">{ch.subject}</span>
                      <span className="badge bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">{ch.difficulty}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{ch.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                      {(ch.completed_by?.length ?? 0)} member{(ch.completed_by?.length ?? 0) === 1 ? '' : 's'} completed
                    </p>
                  </div>
                  {done ? (
                    <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 self-center shrink-0 flex items-center gap-1">
                      <CheckCircle2 size={13} /> Done
                    </span>
                  ) : (
                    <button
                      onClick={() => completeChallenge(ch.id)}
                      disabled={completingId === ch.id}
                      className="btn-secondary text-xs shrink-0 self-center"
                    >
                      {completingId === ch.id ? '...' : 'Mark done'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Personal tools nudge */}
      <div className="flex items-center gap-2 mb-6 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-xs text-gray-500 dark:text-gray-400">
        <span>👤</span>
        <span>Need solo AI tutoring, essay coaching, or a personal study plan?</span>
        <Link to="/study-hub" className="text-village-600 dark:text-village-300 font-medium hover:underline shrink-0">Study Hub →</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        {(['discussion', 'chat', 'members'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-village-600 text-village-700 dark:text-village-300' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
            {t === 'chat' ? '💬 Chat' : t}
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

      {tab === 'chat' && id && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle size={16} className="text-village-600" />
            <span className="font-semibold text-gray-900 dark:text-gray-100">Village Chat</span>
            <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-xs">Live</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">Share code, links, or ask quick questions</span>
          </div>
          <VillageChat
            villageId={id}
            session={_session}
            authorName={displayName || _session.user.email?.split('@')[0] || 'Villager'}
          />
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
                <div className="text-xs text-gray-500 dark:text-gray-400">{m.profiles?.academic_level}</div>
              </div>
              {m.role !== 'member' && (
                <span className="badge bg-village-100 text-village-700 dark:bg-village-900/40 dark:text-village-300 ml-auto capitalize">{m.role}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
