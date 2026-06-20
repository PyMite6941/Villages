type AnalyticsValue = string | number | boolean | null | undefined

type AnalyticsProperties = Record<string, AnalyticsValue>

type AnalyticsEvent =
  | 'landing_viewed'
  | 'join_page_viewed'
  | 'pricing_page_viewed'
  | 'comparison_page_viewed'
  | 'signup_email_submitted'
  | 'magic_link_requested'
  | 'magic_link_completed'
  | 'profile_created'
  | 'onboarding_completed'
  | 'village_created'
  | 'village_joined'

const managedPosthogKey = 'phc_s8RvokJNvYbbFVXTXSuUkY7TKWY5dqQWpMNcbpvnyxJe'
const managedPosthogHost = 'https://us.i.posthog.com'

const configuredPosthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined
const configuredPosthogHost = (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined)?.replace(/\/$/, '')

// The managed PostHog key is a public ingestion key. Keep local dev opt-in so test traffic
// does not pollute the funnel unless a developer sets the Vite env values explicitly.
const posthogKey = configuredPosthogKey || (import.meta.env.PROD ? managedPosthogKey : undefined)
const posthogHost = configuredPosthogHost || (import.meta.env.PROD ? managedPosthogHost : undefined)

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
