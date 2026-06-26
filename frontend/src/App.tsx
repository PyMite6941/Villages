import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import Layout from './components/Layout'
import Home from './pages/Home'
import Study from './pages/Study'
import Villages from './pages/Villages'
import Forum from './pages/Forum'
import Profile from './pages/Profile'
import About from './pages/About'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Callback from './pages/Callback'
import Settings from './pages/Settings'
import Help from './pages/Help'
import PublicHome from './pages/PublicHome'
import Join from './pages/Join'
import SlackComparison from './pages/SlackComparison'
import DiscordComparison from './pages/DiscordComparison'
import Pricing from './pages/Pricing'
import GuidesIndex from './pages/GuidesIndex'
import ScatteredChatGuide from './pages/ScatteredChatGuide'
import FollowThroughGuide from './pages/FollowThroughGuide'
import LearningCircleDiscoveryGuide from './pages/LearningCircleDiscoveryGuide'

const VillageDetail = lazy(() => import('./pages/VillageDetail'))
const Courses = lazy(() => import('./pages/Courses'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const StudyHub = lazy(() => import('./pages/StudyHub'))

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const publicPaths = [
    '/',
    '/login',
    '/auth/callback',
    '/join',
    '/pricing',
    '/compare/slack-vs-villages',
    '/compare/discord-vs-villages',
    '/guides',
    '/guides/learning-groups-scattered-chat',
    '/guides/keep-learning-group-active',
    '/guides/find-right-learning-circle',
  ]

  useEffect(() => {
    const stored = localStorage.getItem('village-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (stored === 'dark' || (stored !== 'light' && prefersDark)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-amber-50 dark:bg-gray-900">
        <div className="text-village-600 text-lg font-medium">Loading Villages...</div>
      </div>
    )
  }

  if (!session && !publicPaths.includes(location.pathname)) {
    return <Navigate to="/login" />
  }

  const fallback = (
    <div className="flex items-center justify-center py-12 text-gray-400 dark:text-gray-500 text-sm">
      Loading...
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
      <Route path="/auth/callback" element={<Callback />} />
      <Route path="/join" element={session ? <Navigate to="/villages" /> : <Join />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/compare/slack-vs-villages" element={<SlackComparison />} />
      <Route path="/compare/discord-vs-villages" element={<DiscordComparison />} />
      <Route path="/guides" element={<GuidesIndex />} />
      <Route path="/guides/learning-groups-scattered-chat" element={<ScatteredChatGuide />} />
      <Route path="/guides/keep-learning-group-active" element={<FollowThroughGuide />} />
      <Route path="/guides/find-right-learning-circle" element={<LearningCircleDiscoveryGuide />} />
      <Route
        path="/onboarding"
        element={session ? <Onboarding session={session} /> : <Navigate to="/login" />}
      />
      {session ? (
        <Route element={<Layout session={session} />}>
          <Route path="/" element={<Home session={session} />} />
          <Route path="/study" element={<Study session={session} />} />
          <Route path="/villages" element={<Villages />} />
          <Route
            path="/villages/:id"
            element={
              <Suspense fallback={fallback}>
                <VillageDetail session={session} />
              </Suspense>
            }
          />
          <Route path="/forum" element={<Forum session={session} />} />
          <Route
            path="/courses"
            element={
              <Suspense fallback={fallback}>
                <Courses session={session} />
              </Suspense>
            }
          />
          <Route
            path="/courses/:id"
            element={
              <Suspense fallback={fallback}>
                <CourseDetail session={session} />
              </Suspense>
            }
          />
          <Route
            path="/study-hub"
            element={
              <Suspense fallback={fallback}>
                <StudyHub session={session} />
              </Suspense>
            }
          />
          <Route path="/profile" element={<Profile session={session} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
          <Route path="/about" element={<About />} />
        </Route>
      ) : (
        <Route path="/" element={<PublicHome />} />
      )}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
