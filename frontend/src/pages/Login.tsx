import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [state, setState] = useState<'form' | 'sent' | 'link'>('form')
  const [isNew, setIsNew] = useState(false)
  const [magicLink, setMagicLink] = useState('')
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

  const sendMagicLink = async () => {
    setLoading(true)
    try {
      const { exists } = await api.auth.checkEmail(email)
      setIsNew(!exists)
      const result = await api.auth.sendMagicLink(email)
      if (result.link) {
        setMagicLink(result.link)
        setState('link')
      } else {
        setState('sent')
        startCooldown(55)
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not connect'
      if (msg.toLowerCase().includes('wait')) {
        toast.error(msg)
        const match = msg.match(/(\d+)s/)
        if (match) startCooldown(parseInt(match[1]) + 1)
        else startCooldown(55)
      } else {
        toast.error(msg)
      }
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
          {state === 'sent' && (
            <div className="text-center py-4">
              <span className="text-4xl">📬</span>
              <h2 className="font-semibold text-gray-900 mt-3 mb-1">Check your inbox</h2>
              <p className="text-sm text-gray-600">
                {isNew
                  ? "We're creating your account. Click the magic link sent to "
                  : "Click the magic link sent to "}
                <strong>{email}</strong>
              </p>
              <p className="text-xs text-gray-400 mt-2">No email? Check spam folder.</p>
              {cooldown > 0 ? (
                <p className="text-xs text-gray-400 mt-3">Resend available in {cooldown}s</p>
              ) : (
                <button onClick={sendMagicLink} disabled={loading}
                  className="text-sm text-village-600 hover:underline mt-3">
                  {loading ? 'Sending...' : 'Resend email'}
                </button>
              )}
            </div>
          )}

          {state === 'link' && (
            <div className="text-center py-4">
              <span className="text-4xl">🔗</span>
              <h2 className="font-semibold text-gray-900 mt-3 mb-1">Click to log in</h2>
              <p className="text-sm text-gray-600 mb-3">
                No email needed — click the link below to log in instantly:
              </p>
              <a href={magicLink} className="btn-primary inline-block text-sm break-all">
                Click to log in
              </a>
              <p className="text-xs text-gray-400 mt-4">
                Or copy this link into your browser:
              </p>
              <input readOnly value={magicLink} className="input text-xs mt-1"
                onClick={(e) => { (e.target as HTMLInputElement).select(); navigator.clipboard?.writeText(magicLink); toast.success('Link copied') }} />
            </div>
          )}

          {state === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" required className="input" />
              </div>
              <button type="submit" disabled={loading || cooldown > 0} className="btn-primary w-full">
                {loading ? 'Sending...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Continue with email'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
