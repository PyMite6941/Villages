import { useEffect, useRef, useState } from 'react'
import DailyIframe, { type DailyCall } from '@daily-co/daily-js'
import { Mic, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

/**
 * Per-village live voice channel (the "Village Fire").
 * Uses Daily.co — the backend get-or-creates a room for the village and returns
 * its URL; we mount Daily's prebuilt call (audio-first) into a container.
 */
export default function VillageVoice({ villageId }: { villageId: string }) {
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(false)
  const callRef = useRef<DailyCall | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const leave = () => {
    if (callRef.current) {
      callRef.current.destroy()
      callRef.current = null
    }
    setJoined(false)
  }

  // Clean up the call frame if the user navigates away.
  useEffect(() => () => { if (callRef.current) callRef.current.destroy() }, [])

  const join = async () => {
    if (callRef.current) return
    setLoading(true)
    try {
      const { url } = await api.villages.voiceRoom(villageId)
      const frame = DailyIframe.createFrame(containerRef.current!, {
        showLeaveButton: true,
        iframeStyle: { width: '100%', height: '420px', border: '0', borderRadius: '12px' },
      })
      callRef.current = frame
      frame.on('left-meeting', leave)
      await frame.join({ url, startVideoOff: true, startAudioOff: false })
      setJoined(true)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not join voice channel')
      leave()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Village Fire — Voice Channel</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">Hop in and study out loud together</p>
          </div>
        </div>
        {!joined && (
          <button onClick={join} disabled={loading} className="btn-primary text-sm flex items-center gap-1.5 shrink-0">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Mic size={14} />}
            {loading ? 'Joining...' : 'Join Voice'}
          </button>
        )}
      </div>
      {/* Daily call frame mounts here when joined */}
      <div ref={containerRef} className={joined ? 'mt-3' : ''} />
    </div>
  )
}
