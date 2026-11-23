import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Pill } from './ui'
import { useToast } from '../context/ToastContext'
import { useChat } from '../hooks/useChat'
import { useI18n } from '../lib/i18n'
import { authMessage } from '../lib/errors'
import type { Booking, BookingStatus, UserProfile } from '../types'

const tone: Record<BookingStatus, 'amber' | 'green' | 'red'> = {
  pending: 'amber',
  accepted: 'green',
  rejected: 'red',
}

interface ChatPanelProps {
  booking: Booking
  user: UserProfile
  onClose?: () => void
}

export default function ChatPanel({ booking, user, onClose }: ChatPanelProps) {
  const { t } = useI18n()
  const toast = useToast()
  const { messages, send } = useChat(booking.id, booking)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof endRef.current?.scrollIntoView === 'function') {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages.length])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const clean = text.trim()
    if (!clean || sending) return
    setSending(true)
    setText('')
    try {
      await send(user, clean)
    } catch (err) {
      setText(clean)
      toast(authMessage(err), 'err')
    } finally {
      setSending(false)
    }
  }

  const isWorker = user.role === 'Worker'
  const isBuilderBooking = booking.bookingType === 'builder' || booking.skill === 'Builder'

  // The other party's information
  const otherName = isWorker
    ? booking.customerName || 'Customer'
    : booking.builderName || booking.workerName || 'Service Provider'

  const otherRole = isWorker
    ? t('Customer')
    : isBuilderBooking
    ? t('Builder')
    : t('Worker')

  const otherPhone = isWorker
    ? booking.customerPhone
    : (booking as any).workerPhone || (booking as any).phone || '+91 98480 12345'

  // Quick contextual suggestions for construction messaging
  const suggestions = isWorker
    ? [
        'I received your request and will reach on time.',
        'Please confirm the site location and supervisor contact.',
        'Could you please share more details about the work required?',
      ]
    : [
        'When can you arrive at the site tomorrow?',
        'Please confirm site address: ' + (booking.site || 'our construction site') + '.',
        'Booking confirmed. Looking forward to your visit.',
      ]

  const formatTime = (ts?: { seconds: number }) => {
    if (!ts?.seconds) return 'Just now'
    try {
      const d = new Date(ts.seconds * 1000)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'BC'
  }

  return (
    <div className="card flex h-[32rem] flex-col overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c1b38] shadow-sm rounded-2xl transition-colors duration-200">
      {/* 1. Chat Header */}
      <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-[#07132b] px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar circle */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm shadow-xs">
            {getInitials(otherName)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight truncate">
                {otherName}
              </h3>
              <span className="font-mono text-[0.7rem] font-bold text-blue-700 bg-blue-50 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 px-1.5 py-0.2 rounded shrink-0">
                {booking.id}
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {isWorker ? '👤 ' + otherRole : isBuilderBooking ? '🏗️ ' + otherRole : '👷 ' + (t(booking.skill) || booking.skill)}
              </span>
              <span>·</span>
              <span className="truncate max-w-[14rem]">📍 {booking.site}</span>
            </div>
          </div>
        </div>

        {/* Right side controls & badges */}
        <div className="flex items-center gap-2 shrink-0">
          {otherPhone && (
            <a
              href={`tel:${otherPhone}`}
              className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition"
              title="Call Contact"
            >
              📞 <span>Call</span>
            </a>
          )}
          <Pill tone={tone[booking.status]}>{t(booking.status)}</Pill>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 rounded"
              title="Close Chat"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. Messages Feed */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 bg-slate-50/50 dark:bg-[#07132b]/50">
        {/* Site info badge at top of conversation */}
        <div className="text-center my-1">
          <span className="inline-block rounded-full bg-slate-200/70 dark:bg-slate-800 px-3 py-1 text-[0.7rem] font-bold text-slate-600 dark:text-slate-400 border border-slate-300/50 dark:border-slate-700">
            {isBuilderBooking ? '🏗️ ' + t('Builder Consultation') : '👷 ' + t(booking.skill) + ' Booking'} · {booking.date || booking.meetingDate}
          </span>
        </div>

        {messages.length === 0 && (
          <div className="my-8 text-center space-y-2 p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <span className="text-3xl">💬</span>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {t('No messages yet.')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Send a message below to coordinate site timings, scope of work, and daily wages.
            </p>
          </div>
        )}

        {messages.map((m) => {
          const mine = m.from === user.uid
          return (
            <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-xs transition-colors duration-150 ${
                  mine
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 rounded-tl-xs'
                }`}
              >
                {!mine && (
                  <div className="font-extrabold text-[0.7rem] text-blue-600 dark:text-blue-400 mb-0.5">
                    {m.fromName || otherName}
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words leading-relaxed font-normal">
                  {m.text}
                </div>
                <div
                  className={`mt-1 text-[0.65rem] font-medium flex items-center justify-end gap-1 ${
                    mine ? 'text-blue-100' : 'text-slate-400 dark:text-slate-400'
                  }`}
                >
                  <span>{formatTime(m.ts)}</span>
                  {mine && <span>✓✓</span>}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* 3. Quick Suggestions */}
      <div className="border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-100/70 dark:bg-[#07132b]/80 px-3 py-1.5 flex gap-1.5 overflow-x-auto text-[0.72rem]">
        {suggestions.map((sug, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setText(sug)}
            className="shrink-0 rounded-lg bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-300 transition"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* 4. Chat Input & Send Form */}
      <form
        onSubmit={submit}
        className="flex items-center gap-2 border-t border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-[#0c1b38]"
      >
        <input
          className="inp flex-1 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 py-2.5 px-3.5 text-sm rounded-xl focus:border-blue-600 focus:ring-blue-600/20"
          value={text}
          maxLength={1000}
          placeholder={t('Type a message…')}
          onChange={(e) => setText(e.target.value)}
          aria-label={t('Type a message…')}
          disabled={sending}
        />
        <button
          type="submit"
          className="btn2 !bg-blue-600 hover:!bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs flex items-center gap-1.5 transition shrink-0"
          disabled={!text.trim() || sending}
        >
          <span>{t('Send') || 'Send'}</span>
          <span>➤</span>
        </button>
      </form>
    </div>
  )
}
