import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { EmailOtpType } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { track } from '../lib/analytics'

export default function Callback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const finishSignIn = () => {
      if (cancelled) return
      track('magic_link_completed', { source: 'auth_callback' })
      navigate('/', { replace: true })
    }

    const failSignIn = (message: string) => {
      if (!cancelled) setError(message)
    }

    const completeSignIn = async () => {
      const params = new URLSearchParams(window.location.search)
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const returnedError = params.get('error_description') || hash.get('error_description') || params.get('error') || hash.get('error')
      const tokenHash = params.get('token_hash')
      const type = params.get('type') || 'email'
      const code = params.get('code')
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')

      if (returnedError) {
        failSignIn(returnedError)
        return
      }

      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        })
        if (error) {
          failSignIn(error.message)
          return
        }
        finishSignIn()
        return
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          failSignIn(error.message)
          return
        }
        finishSignIn()
        return
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (error) {
          failSignIn(error.message)
          return
        }
        finishSignIn()
        return
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        failSignIn(sessionError.message)
        return
      }
      if (session) {
        finishSignIn()
        return
      }
    }

    completeSignIn()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (event === 'SIGNED_IN' && session) {
        finishSignIn()
      }
    })

    const timeout = setTimeout(() => {
      failSignIn('Could not verify this login link. It may be expired, already used, or blocked by your email app.')
    }, 15000)

    return () => {
      cancelled = true
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [navigate])

  if (error) {
    return (
      <div className="h-screen bg-amber-50 flex items-center justify-center px-4">
        <div className="card text-center max-w-md">
          <span className="text-4xl">📬</span>
          <h2 className="font-semibold text-gray-900 mt-3 mb-1">Login link did not work</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button onClick={() => navigate('/login', { replace: true })} className="btn-primary">
            Send a new link
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-amber-50 flex items-center justify-center">
      <div className="text-village-600 text-lg font-medium">Completing login...</div>
    </div>
  )
}
