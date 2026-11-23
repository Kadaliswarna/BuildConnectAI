import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { isBuilderOrContractor, type Booking, type UserProfile } from '../types'

const BOOKINGS_KEY = 'bc-bookings-v1'

export function getLocalBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY)
    if (raw) return JSON.parse(raw) as Booking[]
    const initial: Booking[] = [
      {
        id: 'BK-BLD-84210',
        bookingType: 'builder',
        builderId: 'b1',
        builderName: 'Sri Sai Constructions',
        workerId: 'b1',
        workerName: 'Sri Sai Constructions',
        skill: 'Builder',
        customerId: 'demo-customer',
        customerName: 'Demo Customer',
        customerRole: 'Customer',
        customerPhone: '+91 98765 43210',
        customerEmail: 'customer@gmail.com',
        date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
        meetingDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
        site: 'Plot 42, Jubilee Hills, Hyderabad',
        budget: 1650000,
        requirements: 'Turnkey construction for G+2 residential duplex with structural inspection',
        note: 'Turnkey construction for G+2 residential duplex with structural inspection',
        status: 'pending',
        createdAt: { seconds: Math.floor(Date.now() / 1000) - 1800 },
      },
      {
        id: 'bk-demo-1',
        bookingType: 'worker',
        workerId: 'w1',
        workerName: 'Raju Sharma',
        skill: 'Mason',
        customerId: 'demo-customer',
        customerName: 'Demo Customer',
        customerRole: 'Customer',
        date: new Date().toISOString().slice(0, 10),
        site: 'Sector 4, Green Valley',
        note: 'Brickwork and foundation leveling',
        status: 'pending',
        createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600 },
      },
      {
        id: 'bk-demo-2',
        bookingType: 'worker',
        workerId: 'demo-worker',
        workerName: 'Ramesh Kumar',
        skill: 'Mason',
        customerId: 'demo-customer-2',
        customerName: 'Anil Rao',
        customerRole: 'Customer',
        date: new Date().toISOString().slice(0, 10),
        site: 'Plot 18, Lakeview Residency',
        note: 'Exterior wall plastering and finishing',
        status: 'accepted',
        createdAt: { seconds: Math.floor(Date.now() / 1000) - 7200 },
      },
    ]
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(initial))
    return initial
  } catch {
    return []
  }
}

/** Workers see requests addressed to them; everyone else sees bookings they created. */
export function useBookings(user: UserProfile | null) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { setBookings([]); setLoading(false); return }

    if (!db) {
      const syncLocal = () => {
        const all = getLocalBookings()
        const filtered = all.filter((b) =>
          user.role === 'Worker'
            ? b.workerId === user.uid ||
              b.workerId === 'demo-worker' ||
              b.workerName?.toLowerCase().includes(user.name.toLowerCase()) ||
              b.workerId?.startsWith('w')
            : isBuilderOrContractor(user.role)
            ? b.builderId === user.uid ||
              b.workerId === user.uid ||
              b.builderName?.toLowerCase().includes(user.name.toLowerCase()) ||
              b.workerName?.toLowerCase().includes(user.name.toLowerCase()) ||
              b.customerId === user.uid ||
              b.customerId === 'demo-customer'
            : b.customerId === user.uid ||
              b.customerId === 'demo-customer' ||
              !b.customerId ||
              b.customerId?.startsWith('guest-')
        )
        filtered.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
        setBookings(filtered)
        setLoading(false)
        setError(null)
      }
      syncLocal()
      window.addEventListener('bc-bookings-change', syncLocal)
      return () => window.removeEventListener('bc-bookings-change', syncLocal)
    }

    const field = user.role === 'Worker' ? 'workerId' : isBuilderOrContractor(user.role) ? 'builderId' : 'customerId'
    return onSnapshot(
      query(collection(db, 'bookings'), where(field, '==', user.uid)),
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, 'id'>) }))
        rows.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
        setBookings(rows); setLoading(false); setError(null)
      },
      (e) => { setError(e.message); setLoading(false) },
    )
  }, [user])

  return { bookings, loading, error }
}
