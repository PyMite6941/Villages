import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import Layout from './components/Layout'
import Home from './pages/Home'
import Study from './pages/Study'
import Villages from './pages/Villages'
import VillageDetail from './pages/VillageDetail'
import Forum from './pages/Forum'
import Profile from './pages/Profile'
import About from './pages/About'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

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
      <div className="h-screen flex items-center justify-center bg-amber-50">
        <div className="text-village-600 text-lg font-medium">Loading Villages...</div>
      </div>
    )
  }

  if (!session && location.pathname !== '/login') {
    return <Navigate to="/login" />
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
      <Route path="/onboarding" element={session ? <Onboarding session={session} /> : <Navigate to="/login" />} />
      <Route element={<Layout session={session!} />}>
        <Route path="/" element={<Home session={session!} />} />
        <Route path="/study" element={<Study session={session!} />} />
        <Route path="/villages" element={<Villages />} />
        <Route path="/villages/:id" element={<VillageDetail session={session!} />} />
        <Route path="/forum" element={<Forum session={session!} />} />
        <Route path="/profile" element={<Profile session={session!} />} />
        <Route path="/about" element={<About />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
