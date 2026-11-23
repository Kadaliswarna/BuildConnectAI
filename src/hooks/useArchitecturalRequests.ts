import { useEffect, useState, useCallback, useMemo } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db, firebaseReady } from '../lib/firebase'
import type {
  ArchitecturalRequest,
  ArchitecturalRequestStatus,
  ArchitectProfile,
  DesignUpload,
  StructuralInspection,
  UserProfile,
} from '../types'
import {
  ARCH_REQUESTS_EVENT,
  getStoredArchitecturalRequests,
  createArchitecturalRequest,
  updateArchitecturalRequestStatus,
  uploadDesignToRequest,
  submitDesignRevision,
  respondToDesignRevision,
  sendRequestMessage,
  addInspectionRecord,
  fetchAvailableArchitects,
  DEFAULT_ARCHITECTS,
  type NewRequestInput,
} from '../lib/architecturalData'

export function useArchitecturalRequests(user: UserProfile | null) {
  const [allRequests, setAllRequests] = useState<ArchitecturalRequest[]>([])
  const [architects, setArchitects] = useState<ArchitectProfile[]>(DEFAULT_ARCHITECTS)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Load available architects list
  useEffect(() => {
    let active = true
    fetchAvailableArchitects().then((list) => {
      if (active) setArchitects(list)
    })
    return () => {
      active = false
    }
  }, [])

  // Sync architectural requests
  useEffect(() => {
    if (!user) {
      setAllRequests([])
      setLoading(false)
      return
    }

    if (firebaseReady && db) {
      setLoading(true)
      const q =
        user.role === 'Architect / Engineer'
          ? query(collection(db, 'architecturalRequests'), where('architectId', '==', user.uid))
          : user.role === 'Customer'
          ? query(collection(db, 'architecturalRequests'), where('customerId', '==', user.uid))
          : collection(db, 'architecturalRequests')

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            // If empty in Firestore, fall back to stored seed requests for demo ease
            const local = getStoredArchitecturalRequests()
            setAllRequests(local)
          } else {
            const list: ArchitecturalRequest[] = []
            snapshot.forEach((doc) => {
              list.push({ id: doc.id, ...(doc.data() as Omit<ArchitecturalRequest, 'id'>) })
            })
            setAllRequests(list)
          }
          setLoading(false)
        },
        (err) => {
          console.warn('Firestore subscription error, using local data', err)
          setAllRequests(getStoredArchitecturalRequests())
          setLoading(false)
        }
      )
      return () => unsubscribe()
    } else {
      // Local sync mode
      const syncLocal = () => {
        try {
          const list = getStoredArchitecturalRequests()
          setAllRequests(list)
        } catch (err: any) {
          setError(err?.message || 'Error loading requests')
        } finally {
          setLoading(false)
        }
      }

      syncLocal()
      window.addEventListener(ARCH_REQUESTS_EVENT, syncLocal)
      window.addEventListener('storage', syncLocal)
      return () => {
        window.removeEventListener(ARCH_REQUESTS_EVENT, syncLocal)
        window.removeEventListener('storage', syncLocal)
      }
    }
  }, [user?.uid, user?.role])

  // Filter requests for currently logged-in user
  const userRequests = useMemo(() => {
    if (!user) return []
    if (user.role === 'Customer') {
      return allRequests.filter(
        (r) => r.customerId === user.uid || (user.uid === 'demo-customer' && r.customerId === 'demo-customer')
      )
    }
    if (user.role === 'Architect / Engineer') {
      return allRequests.filter(
        (r) =>
          r.architectId === user.uid ||
          (user.uid === 'demo-architect' && (r.architectId === 'demo-architect' || !r.architectId))
      )
    }
    return allRequests
  }, [allRequests, user])

  // Actions
  const handleCreateRequest = useCallback(
    async (input: Omit<NewRequestInput, 'customerId' | 'customerName' | 'customerEmail' | 'customerPhone'>) => {
      if (!user) throw new Error('Must be signed in as Customer')
      return createArchitecturalRequest({
        ...input,
        customerId: user.uid,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone || '+91 98765 00000',
      })
    },
    [user]
  )

  const handleUpdateStatus = useCallback(
    async (requestId: string, status: ArchitecturalRequestStatus, statusMessage?: string) => {
      if (!user) return
      await updateArchitecturalRequestStatus(requestId, status, statusMessage, {
        id: user.uid,
        name: user.name,
        role: user.role,
      })
    },
    [user]
  )

  const handleUploadDesign = useCallback(
    async (
      requestId: string,
      design: Omit<DesignUpload, 'id' | 'uploadedAt' | 'version' | 'status'>
    ) => {
      await uploadDesignToRequest(requestId, design)
    },
    []
  )

  const handleRequestRevision = useCallback(
    async (requestId: string, revisionNotes: string) => {
      if (!user) return
      await submitDesignRevision(requestId, user, revisionNotes)
    },
    [user]
  )

  const handleRespondRevision = useCallback(
    async (requestId: string, revisionId: string, responseNotes: string) => {
      if (!user) return
      await respondToDesignRevision(requestId, revisionId, user, responseNotes)
    },
    [user]
  )

  const handleSendMessage = useCallback(
    async (requestId: string, text: string) => {
      if (!user) return
      await sendRequestMessage(requestId, user, text)
    },
    [user]
  )

  const handleAddInspection = useCallback(
    async (requestId: string, inspection: Omit<StructuralInspection, 'id'>) => {
      await addInspectionRecord(requestId, inspection)
    },
    []
  )

  return {
    requests: userRequests,
    allRequests,
    architects,
    loading,
    error,
    createRequest: handleCreateRequest,
    updateStatus: handleUpdateStatus,
    uploadDesign: handleUploadDesign,
    requestRevision: handleRequestRevision,
    respondRevision: handleRespondRevision,
    sendMessage: handleSendMessage,
    addInspection: handleAddInspection,
  }
}
