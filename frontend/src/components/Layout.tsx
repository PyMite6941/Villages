import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { Home, Users, MessageSquare, User, LogOut, Lightbulb, Info, BookOpen, Brain, Settings as SettingsIcon, HelpCircle, X, MoreHorizontal } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Props {
  session: Session
}

const desktopCommunity = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/study', label: 'Study', icon: Lightbulb },
  { to: '/villages', label: 'Villages', icon: Users },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/forum', label: 'Forum', icon: MessageSquare },
]

const desktopPersonal = [
  { to: '/study-hub', label: 'Study Hub', icon: Brain },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
  { to: '/help', label: 'Help', icon: HelpCircle },
  { to: '/about', label: 'About', icon: Info },
]

const mobileBottom = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/study', label: 'Study', icon: Lightbulb },
  { to: '/villages', label: 'Villages', icon: Users },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/profile', label: 'Profile', icon: User },
]

const mobileMore = [
  { to: '/forum', label: 'Forum', icon: MessageSquare },
  { to: '/study-hub', label: 'Study Hub', icon: Brain },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
  { to: '/help', label: 'Help', icon: HelpCircle },
  { to: '/about', label: 'About', icon: Info },
]

export default function Layout({ session }: Props) {
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  const linkClass = (to: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      pathname === to || (to !== '/' && pathname.startsWith(to))
        ? 'bg-village-100 text-village-700 dark:bg-village-900/40 dark:text-village-300'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
    }`

  const bottomLinkClass = (to: string) =>
    `flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg text-[10px] font-medium transition-colors min-w-0 flex-1 ${
      pathname === to || (to !== '/' && pathname.startsWith(to))
        ? 'text-village-700 dark:text-village-300'
        : 'text-gray-500 dark:text-gray-400'
    }`

  return (
    <div className="min-h-screen flex flex-col sm:flex-col">
      {/* Header */}
      <header className="bg-village-700 text-white px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between shadow-md shrink-0 z-30">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl">🏘️</span>
          <span className="font-bold text-base sm:text-lg tracking-tight">Villages</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm text-village-200 hidden sm:block truncate max-w-[200px]">{session.user.email}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="p-1.5 rounded-lg hover:bg-village-600 transition-colors"
            title="Sign out"
          >
            <LogOut size={16} className="sm:size-[18px]" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 pb-14 sm:pb-0">
        {/* Desktop sidebar — hidden on mobile */}
        <nav className="hidden sm:flex w-48 bg-white border-r border-amber-100 flex-col py-4 px-2 shrink-0 dark:bg-gray-950 dark:border-gray-800">
          <div className="px-3 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest dark:text-gray-500">
            Community
          </div>
          <div className="flex flex-col gap-1 mb-3">
            {desktopCommunity.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={linkClass(to)}>
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          <div className="border-t border-amber-100 mx-2 mb-3 dark:border-gray-800" />

          <div className="px-3 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest dark:text-gray-500">
            Personal
          </div>
          <div className="flex flex-col gap-1">
            {desktopPersonal.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={linkClass(to)}>
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-3 sm:p-6 overflow-auto"><Outlet /></main>
      </div>

      {/* Mobile bottom nav — hidden on sm+ */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-amber-100 flex items-center px-1 py-0.5 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] sm:hidden dark:bg-gray-950 dark:border-gray-800">
        {mobileBottom.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={bottomLinkClass(to)}>
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
        <button onClick={() => setMoreOpen(true)} className={bottomLinkClass('') + ' relative'}>
          <MoreHorizontal size={20} />
          <span>More</span>
          {moreOpen && (
            <>
              <div className="fixed inset-0" onClick={() => setMoreOpen(false)} />
              <div className="absolute bottom-full right-0 mb-2 w-44 bg-white rounded-xl border border-amber-100 shadow-lg py-2 dark:bg-gray-900 dark:border-gray-700">
                <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest dark:text-gray-500">
                  <span>More</span>
                  <button onClick={() => setMoreOpen(false)} className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                    <X size={14} />
                  </button>
                </div>
                {mobileMore.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                      pathname === to || (to !== '/' && pathname.startsWith(to))
                        ? 'text-village-700 bg-village-50 dark:text-village-300 dark:bg-village-900/20'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </button>
      </nav>
    </div>
  )
}
