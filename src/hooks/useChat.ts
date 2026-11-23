import { useEffect, useState } from 'react'
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db, requireDb } from '../lib/firebase'
import type { Booking, ChatMessage, UserProfile } from '../types'

const chatKey = (id: string) => `bc-chat-v1:${id}`

export const getLocalMessages = (bookingId: string, booking?: Booking | null): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(chatKey(bookingId))
    if (raw) {
      const parsed = JSON.parse(raw) as ChatMessage[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }

    const workerName = booking?.workerName || 'Worker'
    const customerName = booking?.customerName || 'Customer'
    const workerUid = booking?.workerId || 'worker'
    const customerUid = booking?.customerId || 'customer'
    const site = booking?.site || 'site'
    const note = booking?.note || booking?.requirements

    const initial: ChatMessage[] = []

    // 1. Customer's initial request message if a note was provided
    if (note) {
      initial.push({
        id: 'msg-req-' + bookingId,
        from: customerUid,
        fromName: customerName,
        text: note,
        ts: { seconds: Math.floor(Date.now() / 1000) - 3600 },
      })
    }

    // 2. Initial acknowledgment / greeting from worker
    initial.push({
      id: 'msg-resp-' + bookingId,
      from: workerUid,
      fromName: workerName,
      text: `Hello ${customerName}! I received your booking request for ${site}. When should I arrive at the site?`,
      ts: { seconds: Math.floor(Date.now() / 1000) - 1800 },
    })

    localStorage.setItem(chatKey(bookingId), JSON.stringify(initial))
    return initial
  } catch {
    return []
  }
}

/** One chat thread per booking: chats/{bookingId}/messages. Access is gated by Firestore rules. */
export function useChat(bookingId: string | null, bookingContext?: Booking | null) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (!bookingId) return []
    return getLocalMessages(bookingId, bookingContext)
  })

  useEffect(() => {
    if (!bookingId) {
      setMessages([])
      return
    }

    if (!db) {
      const syncLocal = () => {
        setMessages(getLocalMessages(bookingId, bookingContext))
      }
      syncLocal()
      window.addEventListener('bc-chat-change', syncLocal)
      window.addEventListener('storage', syncLocal)
      return () => {
        window.removeEventListener('bc-chat-change', syncLocal)
        window.removeEventListener('storage', syncLocal)
      }
    }

    // When Firebase Firestore is active
    return onSnapshot(
      query(collection(db, 'chats', bookingId, 'messages'), orderBy('ts', 'asc')),
      (snap) => {
        if (!snap.empty) {
          setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, 'id'>) })))
        } else {
          // If Firestore collection has no documents yet, fall back to local/initial messages
          setMessages(getLocalMessages(bookingId, bookingContext))
        }
      },
      () => {
        // Fallback on network/permission error
        setMessages(getLocalMessages(bookingId, bookingContext))
      },
    )
  }, [bookingId, bookingContext])

  const send = async (user: UserProfile, text: string) => {
    const clean = text.trim()
    if (!bookingId || !clean) return

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      from: user.uid,
      fromName: user.name,
      text: clean.slice(0, 1000),
      ts: { seconds: Math.floor(Date.now() / 1000) },
    }

    // Always update local cache & state for immediate responsive feedback
    const existing = getLocalMessages(bookingId, bookingContext)
    const updated = [...existing, newMsg]
    try {
      localStorage.setItem(chatKey(bookingId), JSON.stringify(updated))
      setMessages(updated)
      window.dispatchEvent(new Event('bc-chat-change'))
    } catch (err) {
      console.error(err)
    }

    if (!db) {
      return
    }

    try {
      await addDoc(collection(requireDb(), 'chats', bookingId, 'messages'), {
        from: user.uid,
        fromName: user.name,
        text: clean.slice(0, 1000),
        ts: serverTimestamp(),
      })
    } catch (err) {
      console.error('Firestore chat error:', err)
      // Local message is already appended and visible
    }
  }

  return { messages, send }
}
