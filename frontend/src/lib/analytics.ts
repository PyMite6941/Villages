type AnalyticsValue = string | number | boolean | null | undefined

type AnalyticsProperties = Record<string, AnalyticsValue>

type AnalyticsContext = 'public' | 'internal_verification'

type AnalyticsEvent =
  | 'landing_viewed'
  | 'join_page_viewed'
  | 'pricing_page_viewed'
  | 'pain_page_viewed'
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
const configuredPosthogHost = (
  import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined
)?.replace(/\/$/, '')

// The managed PostHog key is a public ingestion key. Keep local dev opt-in so test traffic
// does not pollute the funnel unless a developer sets the Vite env values explicitly.
const posthogKey = configuredPosthogKey || (import.meta.env.PROD ? managedPosthogKey : undefined)
const posthogHost = configuredPosthogHost || (import.meta.env.PROD ? managedPosthogHost : undefined)
const analyticsContextStorageKey = 'villages-analytics-context'
const trafficSourceStorageKey = 'villages-traffic-source'

function normalizeTrafficSource(value: string | null): string | null {
  if (!value) return null

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return normalized || null
}

function normalizeAnalyticsContext(value: string | null): AnalyticsContext | null {
  if (!value) return null
  if (['internal', 'test', 'verification', 'internal_verification'].includes(value)) {
    return 'internal_verification'
  }
  if (value === 'public') return 'public'
  return null
}

function getAnalyticsContext(): AnalyticsContext {
  const params = new URLSearchParams(window.location.search)
  const queryContext = normalizeAnalyticsContext(
    params.get('analytics_context') ?? params.get('traffic_context'),
  )

  if (queryContext === 'public') {
    window.sessionStorage.removeItem(analyticsContextStorageKey)
  } else if (queryContext) {
    window.sessionStorage.setItem(analyticsContextStorageKey, queryContext)
  }

  return (
    normalizeAnalyticsContext(window.sessionStorage.getItem(analyticsContextStorageKey)) ?? 'public'
  )
}

function getTrafficSource(): string | null {
  const params = new URLSearchParams(window.location.search)
  const querySource = normalizeTrafficSource(
    params.get('traffic_source') ?? params.get('utm_source') ?? params.get('source'),
  )

  if (querySource) {
    window.sessionStorage.setItem(trafficSourceStorageKey, querySource)
    return querySource
  }

  return normalizeTrafficSource(window.sessionStorage.getItem(trafficSourceStorageKey))
}

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
  const analyticsContext = getAnalyticsContext()
  if (analyticsContext === 'internal_verification') return

  const trafficSource = getTrafficSource()
  const surface = properties.surface ?? properties.source ?? properties.page ?? null

  const payload = {
    api_key: posthogKey,
    event,
    distinct_id: getAnonymousId(),
    properties: {
      app: 'villages',
      analytics_context: analyticsContext,
      path: window.location.pathname,
      referrer: document.referrer || null,
      traffic_source: trafficSource,
      surface,
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
