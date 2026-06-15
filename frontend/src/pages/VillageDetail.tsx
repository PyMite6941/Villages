import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import type { Village, Post } from '../types'
import PostCard from '../components/PostCard'
import { Sparkles, Zap, Users, BookOpen, Send, Wifi, Lightbulb, ListChecks, CheckSquare } from 'lucide-react'
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
  const [tab, setTab] = useState<'discussion' | 'members' | 'learning'>('discussion')
  const [live, setLive] = useState(false)
  const [learningPath, setLearningPath] = useState<{
    title: string
    description: string
    steps: { title: string; description: string; estimated_minutes: number }[]
    learning_path_id: string
  } | null>(null)
  const [learningPathLoading, setLearningPathLoading] = useState(false)
  const [topicInput, setTopicInput] = useState('')
  const [topicResult, setTopicResult] = useState<{
    plain_language: string
    key_points: string[]
    checklist: { title: string; done: boolean }[]
    next_steps: { title: string; description: string }[]
  } | null>(null)
  const [topicLoading, setTopicLoading] = useState(false)
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

  const generateLearningPath = async () => {
    if (!id) return
    setLearningPathLoading(true)
    try {
      const result = await api.ai.generateLearningPath(id)
      setLearningPath(result)
      toast.success('Learning path created!')
      setTab('learning')
    } catch {
      toast.error('Could not generate learning path')
    } finally {
      setLearningPathLoading(false)
    }
  }

  const handleTopicExplain = async () => {
    if (!id || !topicInput.trim()) return
    setTopicLoading(true)
    setTopicResult(null)
    try {
      const result = await api.ai.explainTopic(topicInput.trim(), id)
      setTopicResult(result)
    } catch {
      toast.error('Could not explain topic')
    } finally {
      setTopicLoading(false)
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
                  <Wifi size={11} /> Live
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">{village.description}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="badge bg-village-100 text-village-700">{village.focus_area}</span>
              <span className="flex items-center gap-1 text-sm text-gray-500"><Users size={13} />{village.member_count}/{village.max_members} members</span>
            </div>
          </div>
        </div>
        {village.resources.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <BookOpen size={13} className="text-gray-400" />
            {village.resources.map((r) => (
              <span key={r} className="badge bg-white border border-village-200 text-village-700">{r}</span>
            ))}
          </div>
        )}
      </div>

      {/* AI tools */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <button onClick={callVillageElder} disabled={elderLoading} className="btn-secondary flex items-center gap-2 text-sm">
          <Sparkles size={15} className="text-village-600" />
          {elderLoading ? 'Summoning...' : 'Ask Village Elder'}
        </button>
        <div className="flex gap-2 flex-1 min-w-48">
          <input value={challengeSubject} onChange={(e) => setChallengeSubject(e.target.value)} className="input text-sm" placeholder="Subject for AI challenge..." />
          <button onClick={generateChallenge} disabled={challengeLoading || !challengeSubject} className="btn-primary text-sm flex items-center gap-1.5 whitespace-nowrap">
            <Zap size={14} /> {challengeLoading ? 'Generating...' : 'Challenge'}
          </button>
        </div>
        <button onClick={generateLearningPath} disabled={learningPathLoading} className="btn-secondary flex items-center gap-2 text-sm">
          <ListChecks size={15} className="text-village-600" />
          {learningPathLoading ? 'Generating...' : 'Learning Path'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {(['discussion', 'members', 'learning'] as const).map((t) => (
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

      {tab === 'learning' && (
        <div className="space-y-4">
          {/* Topic explainer */}
          <div className="card border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={16} className="text-amber-500" />
              <h3 className="font-medium text-sm text-gray-800">Topic Explorer</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Turn confusing information into plain language, a checklist, and next steps for your group.
            </p>
            <div className="flex gap-2">
              <input value={topicInput} onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTopicExplain()}
                className="input flex-1 text-sm" placeholder="Any topic..." />
              <button onClick={handleTopicExplain} disabled={topicLoading || !topicInput.trim()}
                className="btn-primary text-sm">
                {topicLoading ? '...' : 'Explain'}
              </button>
            </div>
            {topicResult && (
              <div className="mt-3 space-y-3 border-t border-amber-100 pt-3">
                <div className="p-3 bg-amber-50 rounded text-sm text-gray-700">
                  {topicResult.plain_language}
                </div>
                {topicResult.checklist.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <CheckSquare size={12} /> Checklist
                    </p>
                    {topicResult.checklist.map((item, i) => (
                      <label key={i} className="flex items-center gap-2 text-xs text-gray-600 py-0.5">
                        <input type="checkbox" className="rounded" /> {item.title}
                      </label>
                    ))}
                  </div>
                )}
                {topicResult.next_steps.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <ListChecks size={12} /> Next steps
                    </p>
                    {topicResult.next_steps.map((step, i) => (
                      <div key={i} className="p-2 bg-gray-50 rounded text-xs mb-1">
                        <span className="font-medium">{step.title}</span>
                        <p className="text-gray-500">{step.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Learning path */}
          {learningPath ? (
            <div className="card border-village-200">
              <div className="flex items-center gap-2 mb-1">
                <ListChecks size={16} className="text-village-600" />
                <h3 className="font-semibold text-village-800">{learningPath.title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">{learningPath.description}</p>
              <div className="space-y-2">
                {learningPath.steps.map((step, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-village-50 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-village-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-800">{step.title}</p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                      {step.estimated_minutes && (
                        <span className="text-xs text-village-600 mt-1 inline-block">{step.estimated_minutes} min</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card text-center py-6">
              <p className="text-sm text-gray-500">Click <strong>Learning Path</strong> above to generate an AI-curated study plan for your village.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
