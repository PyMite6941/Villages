interface PageMeta {
  title: string
  description: string
  canonicalPath?: string
}

function upsertMeta(name: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = name
    document.head.appendChild(meta)
  }
  meta.content = content
}

function upsertCanonical(path: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = `${window.location.origin}${path}`
}

export function setPageMeta({ title, description, canonicalPath }: PageMeta) {
  document.title = title
  upsertMeta('description', description)
  upsertMeta('og:title', title)
  upsertMeta('og:description', description)
  if (canonicalPath) upsertCanonical(canonicalPath)
}

export function setJsonLd(id: string, data: Record<string, unknown>) {
  let script = document.getElementById(id) as HTMLScriptElement | null
  if (!script) {
    script = document.createElement('script')
    script.id = id
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(data)
}
