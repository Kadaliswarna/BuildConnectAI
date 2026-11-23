import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db, firebaseReady } from '../lib/firebase'

/**
 * Live-subscribes to a public Firestore collection (builders / workers).
 * Falls back to the bundled demo data when Firebase isn't configured or the collection is empty,
 * so the UI is usable before the database has been seeded.
 */
export function useCatalog<T extends { id: string }>(name: 'builders' | 'workers', seed: T[]) {
  const [data, setData] = useState<T[]>(seed)
  const [loading, setLoading] = useState(firebaseReady)
  const [isDemo, setIsDemo] = useState(true)

  useEffect(() => {
    if (!db) return
    return onSnapshot(
      collection(db, name),
      (snap) => {
        if (snap.empty) { setData(seed); setIsDemo(true) }
        else { setData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<T, 'id'>) }) as T)); setIsDemo(false) }
        setLoading(false)
      },
      () => { setData(seed); setIsDemo(true); setLoading(false) },
    )
    // seed is a module-level constant
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  return { data, loading, isDemo }
}
