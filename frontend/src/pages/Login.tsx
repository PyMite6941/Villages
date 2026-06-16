import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [isNew, setIsNew] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const { exists } = await api.auth.checkEmail(email)
      setIsNew(!exists)
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
      if (error) { toast.error(error.message); setLoading(false); return }
      setSent(true)
    } catch {
      toast.error('Could not verify email')
    } finally {
      setLoading(false)
    }
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
                {isNew
                  ? "We're creating your account. Click the magic link sent to "
                  : "Click the magic link sent to "}
                <strong>{email}</strong>
              </p>
              <p className="text-xs text-gray-400 mt-2">No email? Check spam or try again.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" required className="input" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Checking...' : 'Continue with email'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
