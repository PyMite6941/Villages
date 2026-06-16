import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Callback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session) {
        navigate('/', { replace: true })
        return
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (event === 'SIGNED_IN' && session) {
        navigate('/', { replace: true })
      }
    })

    const timeout = setTimeout(() => {
      if (!cancelled) setError('Could not verify login link. It may be expired.')
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
          <h2 className="font-semibold text-gray-900 mt-3 mb-1">Login link expired</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button onClick={() => navigate('/login', { replace: true })} className="btn-primary">
            Try again
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
