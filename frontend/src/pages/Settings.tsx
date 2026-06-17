import { useEffect, useState } from 'react'
import { Moon, Sun, Monitor, Gauge, Eye, ArrowLeft, Type, Volume2 } from 'lucide-react'
import { Link } from 'react-router-dom'

type Theme = 'dark' | 'light' | 'system'

export default function Settings() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('village-theme') as Theme) || 'system'
  })
  const [reduceAnimations, setReduceAnimations] = useState(() => {
    return localStorage.getItem('village-reduce-animations') === 'true'
  })
  const [dyslexicFont, setDyslexicFont] = useState(() => {
    return localStorage.getItem('village-dyslexic-font') === 'true'
  })
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    return localStorage.getItem('village-tts-enabled') !== 'false'
  })
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState(() => {
    return localStorage.getItem('village-tts-voice') || ''
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        const allVoices = window.speechSynthesis.getVoices()
        if (allVoices.length > 0) {
          const englishVoices = allVoices.filter(v => v.lang.startsWith('en'))
          setVoices(englishVoices.length > 0 ? englishVoices : allVoices)
        }
      }
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
      return () => { window.speechSynthesis.onvoiceschanged = null }
    }
  }, [])

  const applyTheme = (t: Theme) => {
    const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
  }

  const updateTheme = (t: Theme) => {
    setTheme(t)
    localStorage.setItem('village-theme', t)
    applyTheme(t)
  }

  useEffect(() => {
    applyTheme(theme)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => { if (theme === 'system') applyTheme('system') }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('village-reduce-animations', String(reduceAnimations))
    document.documentElement.classList.toggle('reduce-motion', reduceAnimations)
  }, [reduceAnimations])

  useEffect(() => {
    localStorage.setItem('village-dyslexic-font', String(dyslexicFont))
    document.documentElement.classList.toggle('font-dyslexic', dyslexicFont)
  }, [dyslexicFont])

  useEffect(() => {
    localStorage.setItem('village-tts-enabled', String(ttsEnabled))
  }, [ttsEnabled])

  const updateVoice = (name: string) => {
    setSelectedVoice(name)
    localStorage.setItem('village-tts-voice', name)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link to="/" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
      </div>

      {/* Appearance */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Moon size={16} className="text-village-600" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">Theme</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'light' as Theme, label: 'Light', icon: Sun },
              { id: 'dark' as Theme, label: 'Dark', icon: Moon },
              { id: 'system' as Theme, label: 'System', icon: Monitor },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => updateTheme(id)}
                className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  theme === id
                    ? 'bg-village-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accessibility */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Eye size={16} className="text-village-600" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Accessibility</h2>
        </div>

        <div className="space-y-5">
          {/* Dyslexia-friendly font */}
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-start gap-3">
              <Type size={16} className="text-gray-400 mt-0.5 shrink-0 dark:text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Dyslexia-friendly font</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Use Lexend font with extra letter spacing for easier reading</div>
              </div>
            </div>
            <div
              onClick={() => setDyslexicFont(!dyslexicFont)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${
                dyslexicFont ? 'bg-village-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform dark:bg-gray-200 ${
                dyslexicFont ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </div>
          </label>

          {/* Reduce animations */}
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-start gap-3">
              <Gauge size={16} className="text-gray-400 mt-0.5 shrink-0 dark:text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Reduce animations</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Minimize transitions and motion effects for smoother experience</div>
              </div>
            </div>
            <div
              onClick={() => setReduceAnimations(!reduceAnimations)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${
                reduceAnimations ? 'bg-village-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform dark:bg-gray-200 ${
                reduceAnimations ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </div>
          </label>

          {/* Text-to-Speech */}
          <div className="border-t border-amber-100 dark:border-gray-800 pt-4">
            <label className="flex items-center justify-between cursor-pointer mb-3">
              <div className="flex items-start gap-3">
                <Volume2 size={16} className="text-gray-400 mt-0.5 shrink-0 dark:text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Text-to-Speech</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Show listen buttons on AI-generated content to read it aloud</div>
                </div>
              </div>
              <div
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${
                  ttsEnabled ? 'bg-village-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform dark:bg-gray-200 ${
                  ttsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </div>
            </label>

            {ttsEnabled && voices.length > 0 && (
              <div className="ml-9">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  Voice
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => updateVoice(e.target.value)}
                  className="input text-sm"
                >
                  <option value="">Default voice</option>
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-400 dark:text-gray-600 text-center space-y-1">
        <p>Settings are saved locally on this device.</p>
        <p>Dark mode uses your system preference by default.</p>
      </div>
    </div>
  )
}
