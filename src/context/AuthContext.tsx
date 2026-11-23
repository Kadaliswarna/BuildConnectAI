import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFbProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { auth, db, firebaseReady, requireAuth, requireDb } from '../lib/firebase'
import { isBuilderOrContractor, type Role, type Skill, type UserProfile } from '../types'

export interface RegisterInput {
  name: string
  email: string
  password: string
  role: Role
  city: string
  phone: string
  companyName?: string
  experienceYears?: number
  specialization?: string
  skill?: Skill
  qualifications?: string
  coaReg?: string
  officeAddress?: string
  bio?: string
}

interface AuthApi {
  user: UserProfile | null
  loading: boolean
  register: (i: RegisterInput) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

const Ctx = createContext<AuthApi | null>(null)

const ACTIVE_USER_KEY = 'bc-active-user-v2'
const LOCAL_USERS_KEY = 'bc-local-users-v2'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (firebaseReady) return null
    try {
      const raw = localStorage.getItem(ACTIVE_USER_KEY)
      return raw ? (JSON.parse(raw) as UserProfile) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(firebaseReady)

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false)
      return
    }
    if (!auth || !db) return
    const firestore = db
    return onAuthStateChanged(auth, async (fb) => {
      if (!fb) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const snap = await getDoc(doc(firestore, 'users', fb.uid))
        if (snap.exists()) {
          setUser({ uid: fb.uid, ...(snap.data() as Omit<UserProfile, 'uid'>) })
        } else {
          // Fallback to basic auth info if firestore doc is pending
          setUser({
            uid: fb.uid,
            name: fb.displayName || 'User',
            email: fb.email || '',
            role: 'Customer',
            city: 'Hyderabad',
            phone: fb.phoneNumber || '',
          })
        }
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    })
  }, [])

  const register = useCallback(async (i: RegisterInput) => {
    const emailLower = i.email.trim().toLowerCase()

    if (!firebaseReady) {
      // Local fallback mode when Firebase credentials are not yet configured in .env.local
      let registeredUsers: (UserProfile & { _passwordHash?: string })[] = []
      try {
        const raw = localStorage.getItem(LOCAL_USERS_KEY)
        if (raw) registeredUsers = JSON.parse(raw)
      } catch {
        registeredUsers = []
      }

      if (registeredUsers.some((u) => u.email.toLowerCase() === emailLower)) {
        throw new Error('An account with this email address already exists. Please log in.')
      }

      const profile: UserProfile = {
        uid: 'usr-' + Date.now(),
        name: i.name.trim(),
        email: emailLower,
        role: i.role,
        city: i.city.trim(),
        phone: i.phone.trim(),
        companyName: i.companyName?.trim(),
        experienceYears: i.experienceYears,
        specialization: i.specialization?.trim(),
        skill: i.skill,
        qualifications: i.qualifications?.trim(),
        coaReg: i.coaReg?.trim(),
        officeAddress: i.officeAddress?.trim(),
        bio: i.bio?.trim(),
        verified: Boolean(i.coaReg || (i.experienceYears && i.experienceYears > 5)),
      }

      try {
        localStorage.setItem(
          LOCAL_USERS_KEY,
          JSON.stringify([...registeredUsers, { ...profile, _passwordHash: i.password }])
        )
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(profile))
      } catch {
        // ignore
      }

      setUser(profile)
      return
    }

    // Real Firebase Authentication and Firestore mode
    const a = requireAuth()
    const firestore = requireDb()

    const cred = await createUserWithEmailAndPassword(a, emailLower, i.password)
    await updateFbProfile(cred.user, { displayName: i.name.trim() })

    const profile: Omit<UserProfile, 'uid'> = {
      name: i.name.trim(),
      email: emailLower,
      role: i.role,
      city: i.city.trim(),
      phone: i.phone.trim(),
      companyName: i.companyName?.trim(),
      experienceYears: i.experienceYears,
      specialization: i.specialization?.trim(),
      skill: i.skill,
      qualifications: i.qualifications?.trim(),
      coaReg: i.coaReg?.trim(),
      officeAddress: i.officeAddress?.trim(),
      bio: i.bio?.trim(),
      verified: Boolean(i.coaReg || (i.experienceYears && i.experienceYears > 5)),
    }

    const batch = writeBatch(firestore)
    batch.set(doc(firestore, 'users', cred.user.uid), {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    if (i.role === 'Worker') {
      batch.set(doc(firestore, 'workers', cred.user.uid), {
        id: cred.user.uid,
        name: i.name.trim(),
        skill: i.skill ?? 'Labourer',
        city: i.city.trim(),
        exp: i.experienceYears || 1,
        wage: 800,
        rating: 5.0,
        avail: true,
        ownerUid: cred.user.uid,
      })
    }

    if (isBuilderOrContractor(i.role)) {
      batch.set(doc(firestore, 'builders', cred.user.uid), {
        id: cred.user.uid,
        name: i.companyName || i.name.trim(),
        city: i.city.trim(),
        exp: i.experienceYears || 2,
        rating: 5.0,
        reviews: 1,
        projects: 1,
        rate: 2200,
        quote: { material: 1200000, labour: 600000, extra: 200000, total: 2000000, days: 90 },
        hue: 215,
        ownerUid: cred.user.uid,
        companyName: i.companyName || i.name.trim(),
        phone: i.phone.trim(),
      })
    }

    await batch.commit()
    setUser({ uid: cred.user.uid, ...profile })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const emailLower = email.trim().toLowerCase()

    if (!firebaseReady) {
      // Local mode
      let registeredUsers: (UserProfile & { _passwordHash?: string })[] = []
      try {
        const raw = localStorage.getItem(LOCAL_USERS_KEY)
        if (raw) registeredUsers = JSON.parse(raw)
      } catch {
        registeredUsers = []
      }

      let found = registeredUsers.find((u) => u.email.toLowerCase() === emailLower)
      if (found) {
        if (found._passwordHash && found._passwordHash !== password) {
          throw new Error('Incorrect password. Please verify your credentials and try again.')
        }
      } else {
        // Create personalized profile for this first-time login
        const role: Role = emailLower.includes('builder') || emailLower.includes('contractor')
          ? 'Builder / Contractor'
          : emailLower.includes('worker')
          ? 'Worker'
          : emailLower.includes('architect') || emailLower.includes('engineer')
          ? 'Architect / Engineer'
          : 'Customer'

        const rawName = emailLower.split('@')[0].replace(/[._-]/g, ' ')
        const name = rawName.charAt(0).toUpperCase() + rawName.slice(1) || 'User'

        found = {
          uid: 'usr-' + Date.now(),
          name,
          email: emailLower,
          role,
          city: 'Hyderabad',
          phone: '+91 98765 00000',
          verified: true,
          ...(role === 'Architect / Engineer'
            ? {
                coaReg: 'CA/2021/77102',
                qualifications: 'B.Arch, Structural Consultant',
                experienceYears: 8,
                specialization: 'Residential & Commercial Architecture',
                officeAddress: 'Jubilee Hills, Hyderabad',
                bio: 'Licensed architectural and structural consultant.',
              }
            : {}),
          ...(isBuilderOrContractor(role)
            ? {
                companyName: `${name} Infra Developers & Civil Contractors`,
                specialization: 'Turnkey Construction & Civil Contracting',
                experienceYears: 10,
              }
            : {}),
          ...(role === 'Worker'
            ? {
                skill: 'Mason',
                experienceYears: 5,
              }
            : {}),
        }

        try {
          localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify([...registeredUsers, found]))
        } catch {
          // ignore
        }
      }

      try {
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(found))
      } catch {
        // ignore
      }
      setUser(found)
      return
    }

    // Real Firebase Authentication login
    const cred = await signInWithEmailAndPassword(requireAuth(), emailLower, password)
    const firestore = requireDb()
    const snap = await getDoc(doc(firestore, 'users', cred.user.uid))
    if (snap.exists()) {
      setUser({ uid: cred.user.uid, ...(snap.data() as Omit<UserProfile, 'uid'>) })
    } else {
      setUser({
        uid: cred.user.uid,
        name: cred.user.displayName || 'User',
        email: cred.user.email || emailLower,
        role: 'Customer',
        city: 'Hyderabad',
        phone: cred.user.phoneNumber || '',
      })
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const emailLower = email.trim().toLowerCase()
    if (firebaseReady && auth) {
      await sendPasswordResetEmail(auth, emailLower)
      return
    }
    // Local check
    const raw = localStorage.getItem(LOCAL_USERS_KEY)
    const registered = raw ? (JSON.parse(raw) as UserProfile[]) : []
    const exists = registered.some((u) => u.email.toLowerCase() === emailLower)
    if (!exists && registered.length > 0) {
      throw new Error('No account found with this email address.')
    }
  }, [])

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) return
      const updatedUser: UserProfile = { ...user, ...updates }

      if (!firebaseReady) {
        try {
          localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(updatedUser))
          const raw = localStorage.getItem(LOCAL_USERS_KEY)
          if (raw) {
            const list = JSON.parse(raw) as UserProfile[]
            const nextList = list.map((u) => (u.uid === user.uid ? updatedUser : u))
            localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(nextList))
          }
        } catch {
          // ignore
        }
        setUser(updatedUser)
        return
      }

      const firestore = requireDb()
      const userRef = doc(firestore, 'users', user.uid)
      await updateDoc(userRef, { ...updates, updatedAt: serverTimestamp() })
      setUser(updatedUser)
    },
    [user]
  )

  const logout = useCallback(async () => {
    if (!firebaseReady) {
      try {
        localStorage.removeItem(ACTIVE_USER_KEY)
      } catch {
        // ignore
      }
      setUser(null)
      return
    }
    await signOut(requireAuth())
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, register, login, logout, resetPassword, updateProfile }),
    [user, loading, register, login, logout, resetPassword, updateProfile]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used inside <AuthProvider>')
  return c
}
