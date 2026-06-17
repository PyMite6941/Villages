import { useEffect, useState } from 'react'
import { Moon, Sun, Monitor, Gauge, Eye, ArrowLeft, Accessibility, Type, Contrast } from 'lucide-react'
import { Link } from 'react-router-dom'
import SpeakButton from '../components/SpeakButton'

type Theme = 'dark' | 'light' | 'system'

export default function Settings() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('village-theme') as Theme) || 'system'
  })
  const [reduceAnimations, setReduceAnimations] = useState(() => {
    return localStorage.getItem('village-reduce-animations') === 'true'
  })
  const [readableFont, setReadableFont] = useState(() => {
    return localStorage.getItem('village-readable-font') === 'true'
  })
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('village-high-contrast') === 'true'
  })

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
    localStorage.setItem('village-readable-font', String(readableFont))
    document.documentElement.classList.toggle('readable-font', readableFont)
  }, [readableFont])

  useEffect(() => {
    localStorage.setItem('village-high-contrast', String(highContrast))
    document.documentElement.classList.toggle('high-contrast', highContrast)
  }, [highContrast])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link to="/" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft size={18} className="text-gray-500" />
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

      {/* Performance */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Gauge size={16} className="text-village-600" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Performance</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-start gap-3">
              <Eye size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Reduce animations</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Minimize transitions and motion effects for smoother performance</div>
              </div>
            </div>
            <div
              onClick={() => setReduceAnimations(!reduceAnimations)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${
                reduceAnimations ? 'bg-village-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                reduceAnimations ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </div>
          </label>
        </div>
      </div>

      {/* Accessibility */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Accessibility size={16} className="text-village-600" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Accessibility</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-start gap-3">
              <Type size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Readable font (dyslexia-friendly)</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">High-legibility font + extra letter/line spacing</div>
              </div>
            </div>
            <div
              onClick={() => setReadableFont(!readableFont)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${
                readableFont ? 'bg-village-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                readableFont ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-start gap-3">
              <Contrast size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">High contrast</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Stronger borders and underlined links</div>
              </div>
            </div>
            <div
              onClick={() => setHighContrast(!highContrast)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${
                highContrast ? 'bg-village-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                highContrast ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </div>
          </label>

          <div className="flex items-center justify-between border-t border-amber-50 dark:border-gray-800 pt-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Text-to-speech — AI content has a <span className="font-medium">Listen</span> button.
            </div>
            <SpeakButton
              text="Hi! Text to speech is enabled. The Village Elder and topic explanations can be read aloud."
              label="Test audio"
              className="shrink-0"
            />
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
