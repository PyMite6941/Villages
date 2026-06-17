import { useEffect, useState } from 'react'
import { Volume2, Square } from 'lucide-react'

/**
 * Text-to-Speech button for AI-generated content (Universal Design for Learning).
 * Uses the browser-native Web Speech API (window.speechSynthesis) — no backend,
 * no API cost. Drop next to any block of text:  <SpeakButton text={explanation} />
 */
export default function SpeakButton({ text, label = 'Listen', className = '' }: {
  text: string
  label?: string
  className?: string
}) {
  const [speaking, setSpeaking] = useState(false)
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Stop any speech if the component unmounts.
  useEffect(() => () => { if (supported) window.speechSynthesis.cancel() }, [supported])

  if (!supported) return null

  const toggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    if (!text.trim()) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(u)
  }

  return (
    <button
      onClick={toggle}
      aria-label={speaking ? 'Stop reading aloud' : 'Read aloud'}
      title={speaking ? 'Stop' : 'Read aloud'}
      className={`inline-flex items-center gap-1 text-xs text-village-600 hover:text-village-700 ${className}`}
    >
      {speaking ? <Square size={13} /> : <Volume2 size={14} />}
      {speaking ? 'Stop' : label}
    </button>
  )
}
