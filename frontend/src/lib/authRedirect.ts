const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export function getAuthRedirectTo(path = '/auth/callback') {
  const configuredSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined
  const origin = configuredSiteUrl?.trim() || window.location.origin
  return `${trimTrailingSlash(origin)}${path}`
}
