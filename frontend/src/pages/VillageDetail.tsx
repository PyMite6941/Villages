import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import type { Village, VillageMember, VillageBan, Post, Challenge } from '../types'
import PostCard from '../components/PostCard'
import VillageChat from '../components/VillageChat'
import VillageVoice from '../components/VillageVoice'
import { Sparkles, Zap, Users, BookOpen, Send, Wifi, MessageCircle, Trophy, CheckCircle2, Shield, VolumeX, XCircle, Settings as SettingsIcon, Ban } from 'lucide-react'

type Tab = 'discussion' | 'chat' | 'members' | 'settings'
const ALL_TABS: Tab[] = ['discussion', 'chat', 'members', 'settings']
const BASE_TABS: Tab[] = ['discussion', 'chat', 'members']
import toast from 'react-hot-toast'

interface Props { session: Session }

export default function VillageDetail({ session: _session }: Props) {
  const { id } = useParams<{ id: string }>()
  const [village, setVillage] = useState<Village | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [members, setMembers] = useState<VillageMember[]>([])
  const [displayName, setDisplayName] = useState('')
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [elderLoading, setElderLoading] = useState(false)
  const [challengeSubject, setChallengeSubject] = useState('')
  const [challengeLoading, setChallengeLoading] = useState(false)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [tab, setTab] = useState<'discussion' | 'chat' | 'members' | 'settings'>('discussion')
  const [live, setLive] = useState(false)
  const [isChief, setIsChief] = useState(false)
  const [bans, setBans] = useState<VillageBan[]>([])
  // Settings form
  const [maxMembers, setMaxMembers] = useState<number>(10)
  const [aiModeration, setAiModeration] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
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
      api.villages.get(id).then((v) => {
        setVillage(v)
        setMaxMembers(v.max_members)
        setAiModeration(v.ai_moderation)
        setIsChief(v.created_by === sessionId)
      }),
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
  }, [id, sessionId])

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
      toast.success('Challenge completed!')
    } catch {
      toast.error('Could not mark complete')
    } finally {
      setCompletingId(null)
    }
  }

  // ── Moderation actions (chief only) ───────────────────────────────────────

  const saveSettings = async () => {
    if (!id) return
    setSavingSettings(true)
    try {
      const updated = await api.villages.updateSettings(id, { max_members: maxMembers, ai_moderation: aiModeration })
      setVillage(updated)
      toast.success('Settings saved')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleMute = async (targetId: string, name: string) => {
    if (!id) return
    try {
      const res = await api.villages.muteMember(id, targetId)
      setMembers((prev) => prev.map((m) => m.user_id === targetId ? { ...m, muted_until: res.muted_until } : m))
      toast.success(`${name} muted for 24h`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not mute')
    }
  }

  const handleUnmute = async (targetId: string, name: string) => {
    if (!id) return
    try {
      await api.villages.unmuteMember(id, targetId)
      setMembers((prev) => prev.map((m) => m.user_id === targetId ? { ...m, muted_until: null } : m))
      toast.success(`${name} unmuted`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not unmute')
    }
  }

  const handleKick = async (targetId: string, name: string) => {
    if (!id) return
    try {
      await api.villages.kickMember(id, targetId)
      setMembers((prev) => prev.filter((m) => m.user_id !== targetId))
      if (village) setVillage({ ...village, member_count: village.member_count - 1 })
      toast.success(`${name} kicked from village`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not kick')
    }
  }

  const handleBan = async (targetId: string, name: string) => {
    if (!id) return
    try {
      await api.villages.banUser(id, targetId)
      setMembers((prev) => prev.filter((m) => m.user_id !== targetId))
      if (village) setVillage({ ...village, member_count: village.member_count - 1 })
      const refreshed = await api.villages.listBans(id)
      setBans(refreshed)
      toast.success(`${name} banned from village`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not ban')
    }
  }

  const loadBans = async () => {
    if (!id) return
    try {
      const data = await api.villages.listBans(id)
      setBans(data)
    } catch { /* ignore */ }
  }

  const handleLiftBan = async (banId: string) => {
    if (!id) return
    try {
      await api.villages.liftBan(id, banId)
      setBans((prev) => prev.filter((b) => b.id !== banId))
      toast.success('Ban lifted')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not lift ban')
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
      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700 flex-wrap">
        {(isChief ? ALL_TABS : BASE_TABS).map((t) => (
          <button key={t} onClick={() => { if (t === 'settings') loadBans(); setTab(t) }}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-village-600 text-village-700 dark:text-village-300' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
            {t === 'chat' ? '💬 Chat' : t === 'settings' ? '⚙️ Settings' : t}
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
          {members.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No members found</p>
          )}
          {members.map((m) => {
            const name = m.profiles?.display_name || 'Unknown'
            const isMuted = m.muted_until && new Date(m.muted_until) > new Date()
            const isSelf = m.user_id === sessionId
            return (
              <div key={m.user_id} className="card flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-village-500 text-white flex items-center justify-center font-bold shrink-0">
                  {name[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{name}</span>
                    {isMuted && <VolumeX size={12} className="text-orange-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{m.profiles?.academic_level}</span>
                    {isMuted && <span className="text-xs text-orange-500">Muted until {new Date(m.muted_until!).toLocaleTimeString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {m.role !== 'member' && (
                    <span className="badge bg-village-100 text-village-700 dark:bg-village-900/40 dark:text-village-300 capitalize">{m.role}</span>
                  )}
                  {isChief && !isSelf && m.role !== 'chief' && (
                    <div className="flex gap-1">
                      {isMuted ? (
                        <button onClick={() => handleUnmute(m.user_id, name)} className="p-1.5 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 text-orange-600" title="Unmute">
                          <VolumeX size={14} />
                        </button>
                      ) : (
                        <button onClick={() => handleMute(m.user_id, name)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title="Mute for 24h">
                          <VolumeX size={14} />
                        </button>
                      )}
                      <button onClick={() => handleKick(m.user_id, name)} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500" title="Kick">
                        <XCircle size={14} />
                      </button>
                      <button onClick={() => handleBan(m.user_id, name)} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600" title="Ban">
                        <Ban size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'settings' && isChief && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <SettingsIcon size={16} className="text-village-600" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Village Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Max Members</label>
                <input type="number" min={Math.max(village?.member_count ?? 1, 1)} max={500} value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                  className="input text-sm w-32" />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Cannot go below current member count ({village?.member_count ?? 0}).</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="label mb-0">AI Auto-Moderation</label>
                <button onClick={() => setAiModeration(!aiModeration)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${aiModeration ? 'bg-village-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${aiModeration ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">{aiModeration ? 'On' : 'Off'}</span>
              </div>
              <button onClick={saveSettings} disabled={savingSettings} className="btn-primary text-sm">
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-village-600" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Banned Users</h3>
            </div>
            {bans.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">No banned users.</p>
            ) : (
              <div className="space-y-2">
                {bans.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{b.user_id}</span>
                      {b.reason && <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">— {b.reason}</span>}
                    </div>
                    <button onClick={() => handleLiftBan(b.id)} className="text-xs text-village-600 dark:text-village-300 hover:underline">Lift ban</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
