type AnalyticsValue = string | number | boolean | null | undefined

type AnalyticsProperties = Record<string, AnalyticsValue>

type AnalyticsEvent =
  | 'landing_viewed'
  | 'join_page_viewed'
  | 'comparison_page_viewed'
  | 'signup_email_submitted'
  | 'magic_link_requested'
  | 'magic_link_completed'
  | 'profile_created'
  | 'onboarding_completed'
  | 'village_created'
  | 'village_joined'

const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined
const posthogHost = (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined)?.replace(/\/$/, '')

function getAnonymousId() {
  const storageKey = 'villages-anonymous-id'
  const existing = window.localStorage.getItem(storageKey)
  if (existing) return existing

  const next =
    window.crypto?.randomUUID?.() ??
    `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`
  window.localStorage.setItem(storageKey, next)
  return next
}

export function analyticsReady() {
  return Boolean(posthogKey && posthogHost)
}

export function track(event: AnalyticsEvent, properties: AnalyticsProperties = {}) {
  if (!analyticsReady()) return

  const payload = {
    api_key: posthogKey,
    event,
    distinct_id: getAnonymousId(),
    properties: {
      app: 'villages',
      path: window.location.pathname,
      referrer: document.referrer || null,
      ...properties,
    },
  }

  fetch(`${posthogHost}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    if (import.meta.env.DEV) {
      console.warn(`Analytics event failed: ${event}`)
    }
  })
}
