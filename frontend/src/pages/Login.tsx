import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const startCooldown = (seconds: number) => {
    setCooldown(seconds)
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); timerRef.current = null; return 0 }
        return c - 1
      })
    }, 1000)
  }

  // Standard, secure Supabase magic-link: emails the user a one-time link.
  // The link lands on /auth/callback, which establishes the session.
  const sendMagicLink = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        },
      })
      if (error) {
        toast.error(error.message)
      } else {
        setSent(true)
        startCooldown(55)
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not connect')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    await sendMagicLink()
  }

  return (
    <div className="h-screen bg-amber-50 flex items-center justify-center px-4 overflow-hidden">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-6xl">🏘️</span>
          <h1 className="text-3xl font-bold text-village-800 mt-3">Villages</h1>
          <p className="text-gray-600 mt-2">AI-powered community learning</p>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center py-4">
              <span className="text-4xl">📬</span>
              <h2 className="font-semibold text-gray-900 mt-3 mb-1">Check your inbox</h2>
              <p className="text-sm text-gray-600">
                We sent a magic sign-in link to <strong>{email}</strong>. Click it to log in.
              </p>
              <p className="text-xs text-gray-400 mt-2">No email? Check your spam folder.</p>
              {cooldown > 0 ? (
                <p className="text-xs text-gray-400 mt-3">Resend available in {cooldown}s</p>
              ) : (
                <button onClick={sendMagicLink} disabled={loading}
                  className="text-sm text-village-600 hover:underline mt-3">
                  {loading ? 'Sending...' : 'Resend email'}
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" required className="input" />
              </div>
              <button type="submit" disabled={loading || cooldown > 0} className="btn-primary w-full">
                {loading ? 'Sending...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Continue with email'}
              </button>
              <p className="text-xs text-center text-gray-400">
                We'll email you a one-time login link — no password needed.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
