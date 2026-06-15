import { Link, useLocation } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { Home, Users, MessageSquare, User, LogOut, BookOpen, Brain } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Props {
  children: React.ReactNode
  session: Session
}

const communityNav = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/villages', label: 'Villages', icon: Users },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/forum', label: 'Forum', icon: MessageSquare },
]

const personalNav = [
  { to: '/study-hub', label: 'Study Hub', icon: Brain },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function Layout({ children, session }: Props) {
  const { pathname } = useLocation()

  const linkClass = (to: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      pathname === to || (to !== '/' && pathname.startsWith(to))
        ? 'bg-village-100 text-village-700'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-village-700 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🏘️</span>
          <span className="font-bold text-lg tracking-tight">Villages</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-village-200 hidden sm:block">{session.user.email}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="p-1.5 rounded-lg hover:bg-village-600 transition-colors"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar nav */}
        <nav className="w-16 sm:w-48 bg-white border-r border-amber-100 flex flex-col py-4 px-2 shrink-0">
          {/* Community section */}
          <div className="hidden sm:block px-3 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            Community
          </div>
          <div className="flex flex-col gap-1 mb-3">
            {communityNav.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={linkClass(to)}>
                <Icon size={18} />
                <span className="hidden sm:block">{label}</span>
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-amber-100 mx-2 mb-3" />

          {/* Personal section */}
          <div className="hidden sm:block px-3 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            Personal
          </div>
          <div className="flex flex-col gap-1">
            {personalNav.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={linkClass(to)}>
                <Icon size={18} />
                <span className="hidden sm:block">{label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
