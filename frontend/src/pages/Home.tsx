import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { api } from '../lib/api'
import type { UserProfile, Village, Post } from '../types'
import PostCard from '../components/PostCard'
import { Sparkles, Users, ArrowRight, Lightbulb, CheckSquare, ListChecks } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props { session: Session }

export default function Home({ session }: Props) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [village, setVillage] = useState<Village | null>(null)
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [matchResult, setMatchResult] = useState<{ recommended_village_id: string; reasoning: string } | null>(null)
  const [matching, setMatching] = useState(false)
  const [loading, setLoading] = useState(true)

  const [topicInput, setTopicInput] = useState('')
  const [topicResult, setTopicResult] = useState<{
    plain_language: string
    key_points: string[]
    checklist: { title: string; done: boolean }[]
    next_steps: { title: string; description: string }[]
    _audience: string[]
  } | null>(null)
  const [topicLoading, setTopicLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const p = await api.users.getProfile(session.user.id)
        setProfile(p)
        if (p.village_id) {
          const v = await api.villages.get(p.village_id)
          setVillage(v)
          const posts = await api.posts.list(p.village_id)
          setRecentPosts(posts.slice(0, 3))
        }
      } catch {
        // New user — send to onboarding
        navigate('/onboarding')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [session.user.id, navigate])

  const handleAIMatch = async () => {
    setMatching(true)
    try {
      const result = await api.villages.aiMatch()
      setMatchResult(result)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Matching failed')
    } finally {
      setMatching(false)
    }
  }

  const handleTopicExplain = async () => {
    if (!topicInput.trim()) return
    setTopicLoading(true)
    setTopicResult(null)
    try {
      const result = await api.ai.explainTopic(topicInput.trim(), village?.id)
      setTopicResult(result)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not explain topic')
    } finally {
      setTopicLoading(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading your village...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.display_name} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">{profile?.academic_level} · {profile?.goals.join(', ')}</p>
      </div>

      {/* Village status */}
      {village ? (
        <div className="card border-village-200 bg-gradient-to-br from-village-50 to-amber-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏘️</span>
              <h2 className="font-semibold text-village-800">{village.name}</h2>
            </div>
            <Link to={`/villages/${village.id}`} className="text-sm text-village-600 hover:underline flex items-center gap-1">
              View <ArrowRight size={14} />
            </Link>
          </div>
          <p className="text-sm text-gray-600 mb-1">{village.description}</p>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Users size={12} className="text-gray-400" />{village.member_count} members</span>
            <span className="badge bg-village-100 text-village-700">{village.focus_area}</span>
          </div>
        </div>
      ) : (
        <div className="card text-center py-8">
          <span className="text-4xl">🔍</span>
          <h2 className="font-semibold mt-3 mb-1">You're not in a Village yet</h2>
          <p className="text-sm text-gray-500 mb-4">Let our AI find the perfect study cohort for you</p>
          <button onClick={handleAIMatch} disabled={matching} className="btn-primary mx-auto">
            <Sparkles size={14} className="inline mr-1.5" />
            {matching ? 'Finding your village...' : 'AI Match me'}
          </button>
          {matchResult && (
            <div className="mt-4 p-4 bg-village-50 rounded-lg text-left">
              <p className="text-sm font-medium text-village-800 mb-1">We found a match!</p>
              <p className="text-sm text-gray-600 mb-3">{matchResult.reasoning}</p>
              <Link to={`/villages/${matchResult.recommended_village_id}`} className="btn-primary text-sm">
                View recommended Village →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Recent village activity */}
      {recentPosts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Village activity</h2>
            <Link to={`/villages/${village?.id}`} className="text-sm text-village-600 hover:underline">See all</Link>
          </div>
          <div className="space-y-3">
            {recentPosts.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </div>
      )}

      {/* Topic Explorer — AI plain-language explainer */}
      <div className="card border-amber-200">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={18} className="text-amber-500" />
          <h2 className="font-semibold text-gray-900">Topic Explorer</h2>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Turn confusing topics into plain language, a checklist, and clear next steps — for you or your group.
        </p>
        <div className="flex gap-2">
          <input
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTopicExplain()}
            className="input flex-1 text-sm"
            placeholder="e.g. State education standards, AP Physics, career change..."
          />
          <button onClick={handleTopicExplain} disabled={topicLoading || !topicInput.trim()}
            className="btn-primary text-sm whitespace-nowrap">
            {topicLoading ? 'Explaining...' : 'Explain'}
          </button>
        </div>

        {topicResult && (
          <div className="mt-4 space-y-4 border-t border-amber-100 pt-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Plain language summary</p>
              <div className="p-3 bg-amber-50 rounded-lg text-sm text-gray-700">
                {topicResult.plain_language}
              </div>
            </div>
            {topicResult.key_points.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Key points</p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {topicResult.key_points.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {topicResult.checklist.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <CheckSquare size={14} /> Checklist
                </p>
                <div className="space-y-1">
                  {topicResult.checklist.map((item, i) => (
                    <label key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="checkbox" className="rounded" />
                      {item.title}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {topicResult.next_steps.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <ListChecks size={14} /> Next steps
                </p>
                <div className="space-y-2">
                  {topicResult.next_steps.map((step, i) => (
                    <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                      <span className="font-medium">{step.title}</span>
                      <p className="text-gray-500">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {topicResult._audience.length > 0 && (
              <p className="text-xs text-gray-400">
                Tailored for: {topicResult._audience.join(', ')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
