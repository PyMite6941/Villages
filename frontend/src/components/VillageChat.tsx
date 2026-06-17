import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import type { Message } from '../types'
import { Send, CornerDownLeft, Pin, X, Hash } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  villageId: string
  session: Session
  authorName: string
}

type MsgType = 'text' | 'code' | 'link'

export default function VillageChat({ villageId, session, authorName }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [msgType, setMsgType] = useState<MsgType>('text')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const msgIdsRef = useRef(new Set<string>())

  useEffect(() => {
    supabase
      .from('messages')
      .select('*')
      .eq('village_id', villageId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data, error }) => {
        if (error) { toast.error('Could not load chat history'); return }
        const msgs = (data ?? []) as Message[]
        msgs.forEach((m) => msgIdsRef.current.add(m.id))
        setMessages(msgs)
        setLoading(false)
      })

    const channel = supabase
      .channel(`village-chat-${villageId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `village_id=eq.${villageId}` },
        (payload) => {
          const incoming = payload.new as Message
          if (msgIdsRef.current.has(incoming.id)) return
          msgIdsRef.current.add(incoming.id)
          setMessages((prev) => [...prev, incoming])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `village_id=eq.${villageId}` },
        (payload) => {
          const updated = payload.new as Message
          setMessages((prev) => prev.map((m) => m.id === updated.id ? updated : m))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [villageId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    try {
      const { error } = await supabase.from('messages').insert({
        village_id: villageId,
        user_id: session.user.id,
        author_name: authorName,
        content: text,
        message_type: msgType,
        reply_to_id: replyTo?.id ?? null,
        reply_preview: replyTo ? replyTo.content.slice(0, 120) : null,
      })
      if (error) throw error
      setInput('')
      setReplyTo(null)
      setMsgType('text')
    } catch {
      toast.error('Could not send message')
    } finally {
      setSending(false)
    }
  }

  const togglePin = async (msg: Message) => {
    const { error } = await supabase
      .from('messages')
      .update({ is_pinned: !msg.is_pinned })
      .eq('id', msg.id)
    if (error) toast.error('Could not update pin')
  }

  const pinned = messages.filter((m) => m.is_pinned)
  const regular = messages.filter((m) => !m.is_pinned)

  if (loading) return <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">Loading chat...</div>

  return (
    <div className="flex flex-col">
      {/* Pinned messages */}
      {pinned.length > 0 && (
        <div className="mb-3 space-y-1">
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-1">
            <Pin size={11} className="text-amber-500" /> Pinned
          </div>
          {pinned.map((m) => (
            <div key={m.id} className="flex items-start gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-xs">
              <div className="flex-1 min-w-0">
                <span className="font-medium text-amber-800 dark:text-amber-300">{m.author_name}:</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1 line-clamp-1">{m.content}</span>
              </div>
              <button
                onClick={() => togglePin(m)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 shrink-0"
                title="Unpin"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message area */}
      <div className="min-h-80 max-h-[480px] overflow-y-auto space-y-1 pr-1 mb-3">
        {regular.length === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
            <Hash size={22} className="mx-auto mb-2 text-gray-200 dark:text-gray-600" />
            No messages yet — say hello to your village!
          </div>
        )}

        {regular.map((m) => {
          const isOwn = m.user_id === session.user.id
          const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

          return (
            <div
              key={m.id}
              className={`group flex gap-2 px-1 py-0.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 ${isOwn ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1 ${isOwn ? 'bg-village-600' : 'bg-amber-500'}`}>
                {m.author_name[0]?.toUpperCase() ?? '?'}
              </div>

              <div className={`flex-1 min-w-0 flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center gap-1.5 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{isOwn ? 'You' : m.author_name}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{time}</span>
                  {m.is_pinned && <Pin size={10} className="text-amber-500" />}
                </div>

                {m.reply_preview && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded px-2 py-0.5 mb-1 line-clamp-1 border-l-2 border-gray-300 dark:border-gray-600 max-w-[85%]">
                    ↩ {m.reply_preview}
                  </div>
                )}

                {m.message_type === 'code' ? (
                  <pre className="text-xs font-mono bg-gray-900 text-green-400 rounded-lg px-3 py-2 max-w-[85%] overflow-x-auto whitespace-pre-wrap">
                    {m.content}
                  </pre>
                ) : m.message_type === 'link' ? (
                  <a
                    href={m.content.startsWith('http') ? m.content : `https://${m.content}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-village-600 dark:text-village-300 underline break-all max-w-[85%]"
                  >
                    {m.content}
                  </a>
                ) : (
                  <div className={`max-w-[85%] rounded-xl px-3 py-1.5 text-sm leading-snug ${isOwn ? 'bg-village-600 text-white' : 'bg-white border border-gray-100 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200'}`}>
                    {m.content}
                  </div>
                )}
              </div>

              {/* Hover actions */}
              <div className={`flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity self-start mt-1 ${isOwn ? 'order-first' : ''}`}>
                <button
                  onClick={() => setReplyTo(m)}
                  title="Reply"
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700 rounded"
                >
                  <CornerDownLeft size={12} />
                </button>
                <button
                  onClick={() => togglePin(m)}
                  title={m.is_pinned ? 'Unpin' : 'Pin'}
                  className={`p-1 rounded ${m.is_pinned ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700'}`}
                >
                  <Pin size={12} />
                </button>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg mb-2 text-xs">
          <CornerDownLeft size={12} className="text-amber-600 shrink-0" />
          <span className="text-amber-700 dark:text-amber-400 font-medium">{replyTo.author_name}:</span>
          <span className="text-gray-600 dark:text-gray-400 line-clamp-1 flex-1">{replyTo.content}</span>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 shrink-0">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden text-xs shrink-0">
          {([['text', '💬', 'Text'], ['code', '{ }', 'Code'], ['link', '🔗', 'Link']] as [MsgType, string, string][]).map(([t, icon, label]) => (
            <button
              key={t}
              onClick={() => setMsgType(t)}
              title={label}
              className={`px-2.5 py-1.5 font-medium transition-colors ${msgType === t ? 'bg-village-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:bg-gray-700'}`}
            >
              {icon}
            </button>
          ))}
        </div>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={
            msgType === 'code' ? 'Paste a code snippet...' :
            msgType === 'link' ? 'Paste a URL to share...' :
            'Message your village...'
          }
          className={`input flex-1 text-sm ${msgType === 'code' ? 'font-mono' : ''}`}
          disabled={sending}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="btn-primary px-4 flex items-center"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
