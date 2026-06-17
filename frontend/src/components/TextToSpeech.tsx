import { useState, useCallback, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

interface Props {
  text: string
  className?: string
  label?: string
}

let speechSynth: SpeechSynthesis | null = null
if (typeof window !== 'undefined') {
  speechSynth = window.speechSynthesis
}

export default function TextToSpeech({ text, className = '', label = 'Listen' }: Props) {
  const [speaking, setSpeaking] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    setSupported(!!speechSynth)
  }, [])

  const speak = useCallback(() => {
    if (!speechSynth || !text) return

    if (speaking) {
      speechSynth.cancel()
      setSpeaking(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.92
    utterance.pitch = 1.0
    utterance.volume = 1.0

    const preferredVoice = localStorage.getItem('village-tts-voice')
    if (preferredVoice) {
      const voices = speechSynth.getVoices()
      const match = voices.find(v => v.name === preferredVoice)
      if (match) utterance.voice = match
    }

    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    setSpeaking(true)
    speechSynth.speak(utterance)
  }, [text, speaking])

  useEffect(() => {
    return () => {
      if (speechSynth && speaking) {
        speechSynth.cancel()
      }
    }
  }, [speaking])

  if (!supported) return null

  return (
    <button
      onClick={speak}
      className={`tts-btn ${speaking ? 'bg-village-100 text-village-700 dark:bg-village-900/40 dark:text-village-300' : 'text-gray-500 hover:text-village-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-village-300 dark:hover:bg-gray-800'} ${className}`}
      title={speaking ? 'Stop' : label}
      aria-label={speaking ? 'Stop reading aloud' : 'Read this text aloud'}
    >
      {speaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
      <span className="hidden sm:inline">{speaking ? 'Stop' : label}</span>
    </button>
  )
}
