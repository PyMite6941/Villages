import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import Layout from './components/Layout'
import Home from './pages/Home'
import Villages from './pages/Villages'
import VillageDetail from './pages/VillageDetail'
import Forum from './pages/Forum'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-village-600 text-lg font-medium">Loading Villages...</div>
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <Layout session={session}>
      <Routes>
        <Route path="/" element={<Home session={session} />} />
        <Route path="/villages" element={<Villages />} />
        <Route path="/villages/:id" element={<VillageDetail session={session} />} />
        <Route path="/forum" element={<Forum session={session} />} />
        <Route path="/profile" element={<Profile session={session} />} />
        <Route path="/onboarding" element={<Onboarding session={session} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}
