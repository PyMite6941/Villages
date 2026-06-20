import { FormEvent, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { track } from '../lib/analytics'
import { getAuthRedirectTo } from '../lib/authRedirect'

interface Props {
  source: string
  buttonLabel?: string
  helperText?: string
  compact?: boolean
}

export default function MagicLinkSignup({
  source,
  buttonLabel = 'Join with email',
  helperText = "We'll send a one-time login link. No password needed.",
  compact = false,
}: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startCooldown = (seconds: number) => {
    setCooldown(seconds)
    timerRef.current = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          timerRef.current = null
          return 0
        }
        return current - 1
      })
    }, 1000)
  }

  const sendMagicLink = async () => {
    const cleanEmail = email.trim()
    if (!cleanEmail) return

    setLoading(true)
    track('signup_email_submitted', { source })
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: getAuthRedirectTo(),
          shouldCreateUser: true,
        },
      })
      if (error) {
        toast.error(error.message)
      } else {
        track('magic_link_requested', { source })
        setSent(true)
        startCooldown(55)
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not connect')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await sendMagicLink()
  }

  if (sent) {
    return (
      <div className={compact ? 'space-y-3 text-sm' : 'space-y-3 text-center'}>
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Check your inbox</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          We sent a magic sign-in link to <strong>{email}</strong>.
        </p>
        {cooldown > 0 ? (
          <p className="text-xs text-gray-400">Resend available in {cooldown}s</p>
        ) : (
          <button onClick={sendMagicLink} disabled={loading} className="text-sm font-medium text-village-700 hover:underline dark:text-village-300">
            {loading ? 'Sending...' : 'Resend email'}
          </button>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className={compact ? 'flex flex-col gap-2 sm:flex-row' : 'space-y-2'}>
        <input
          id={`email-${source}`}
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          className="input"
        />
        <button type="submit" disabled={loading || cooldown > 0} className="btn-primary whitespace-nowrap">
          {loading ? 'Sending...' : cooldown > 0 ? `Wait ${cooldown}s` : buttonLabel}
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
    </form>
  )
}
