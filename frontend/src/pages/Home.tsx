import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { api } from '../lib/api'
import type { UserProfile, Village, Post } from '../types'
import PostCard from '../components/PostCard'
import { Sparkles, Users, ArrowRight } from 'lucide-react'
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
            <span className="flex items-center gap-1"><Users size={13} />{village.member_count} members</span>
            <span className="badge bg-village-100 text-village-700">{village.focus_area}</span>
          </div>
        </div>
      ) : (
        <div className="card text-center py-8">
          <span className="text-4xl">🔍</span>
          <h2 className="font-semibold mt-3 mb-1">You're not in a Village yet</h2>
          <p className="text-sm text-gray-500 mb-4">Let our AI find the perfect study cohort for you</p>
          <button onClick={handleAIMatch} disabled={matching} className="btn-primary mx-auto">
            <Sparkles size={16} className="inline mr-1.5" />
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
    </div>
  )
}
