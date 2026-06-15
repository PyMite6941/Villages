import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { api } from '../lib/api'
import { Lightbulb, CheckSquare, ListChecks, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props { session: Session }

export default function Study({ session: _session }: Props) {
  const [topicInput, setTopicInput] = useState('')
  const [topicLoading, setTopicLoading] = useState(false)
  const [history, setHistory] = useState<{
    plain_language: string
    key_points: string[]
    checklist: { title: string; done: boolean }[]
    next_steps: { title: string; description: string }[]
    _audience: string[]
  } | null>(null)

  const handleExplain = async () => {
    if (!topicInput.trim()) return
    setTopicLoading(true)
    setHistory(null)
    try {
      const result = await api.ai.explainTopic(topicInput.trim())
      setHistory(result)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not explain topic')
    } finally {
      setTopicLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Lightbulb size={28} className="text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Topic Explorer</h1>
          <p className="text-sm text-gray-500">
            Turn confusing topics into plain language, a checklist, and clear next steps.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="card border-amber-200">
        <div className="flex gap-2">
          <input
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
            className="input flex-1"
            placeholder="e.g. State education standards, AP Physics, mortgage rates, how vaccines work..."
          />
          <button
            onClick={handleExplain}
            disabled={topicLoading || !topicInput.trim()}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <Sparkles size={16} />
            {topicLoading ? 'Explaining...' : 'Explain'}
          </button>
        </div>
      </div>

      {/* Result */}
      {history && (
        <div className="space-y-4">
          {/* Plain language */}
          <div className="card border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <h2 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Lightbulb size={18} className="text-amber-500" />
              Plain language summary
            </h2>
            <p className="text-gray-700 leading-relaxed">{history.plain_language}</p>
          </div>

          {/* Key points */}
          {history.key_points.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-2">Key points</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {history.key_points.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Checklist */}
          {history.checklist.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                <CheckSquare size={16} className="text-village-600" />
                Checklist
              </h3>
              <div className="space-y-2">
                {history.checklist.map((item, i) => (
                  <label key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-village-600 focus:ring-village-500" />
                    <span className="text-sm text-gray-700">{item.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Next steps */}
          {history.next_steps.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                <ListChecks size={16} className="text-village-600" />
                Next steps
              </h3>
              <div className="space-y-3">
                {history.next_steps.map((step, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-village-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-800">{step.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audience */}
          {history._audience && history._audience.length > 0 && (
            <p className="text-xs text-gray-400 text-center">
              Tailored for: {history._audience.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!history && !topicLoading && (
        <div className="card text-center py-12">
          <span className="text-5xl">🔍</span>
          <h2 className="font-semibold text-gray-700 mt-4 mb-1">Type any topic to get started</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Whether it's a school subject, a confusing policy, or something you've always wondered about — our AI breaks it down so everyone can understand.
          </p>
        </div>
      )}
    </div>
  )
}
