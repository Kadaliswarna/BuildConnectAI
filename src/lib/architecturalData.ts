import {
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db, firebaseReady } from './firebase'
import type {
  ArchitecturalRequest,
  ArchitecturalRequestStatus,
  ArchitectProfile,
  DesignMessage,
  DesignRevision,
  DesignUpload,
  Role,
  StructuralInspection,
  UserProfile,
} from '../types'

export const ARCH_REQUESTS_KEY = 'bc-architectural-requests-v2'
export const ARCH_REQUESTS_EVENT = 'bc-arch-requests-change'

export const DEFAULT_ARCHITECTS: ArchitectProfile[] = [
  {
    id: 'demo-architect',
    name: 'Ar. Priya Sharma',
    email: 'architect@gmail.com',
    phone: '+91 98765 43214',
    city: 'Hyderabad',
    experience: 11,
    coaRegNumber: 'CA/2018/98421',
    qualifications: 'B.Arch (SPA), M.Tech (IIT Structural Engineering)',
    specialization: 'Vaastu Duplexes, Cantilever Villas, Commercial RCC',
    rating: 4.9,
    projectsCount: 85,
    bio: 'Licensed Building Consultant & Structural Designer with over 85+ approved residential and commercial projects in Telangana and AP region.',
  },
  {
    id: 'arch-2',
    name: 'Ar. K. V. S. N. Murthy',
    email: 'murthy.architects@gmail.com',
    phone: '+91 94401 23890',
    city: 'Hyderabad',
    experience: 16,
    coaRegNumber: 'CA/2008/41209',
    qualifications: 'B.Arch (JNAFAU), Master of Urban Planning',
    specialization: 'High-Rise RCC, Gated Communities, Green Buildings',
    rating: 4.8,
    projectsCount: 120,
    bio: 'Specialist in sustainable solar architecture, IGBC Certified Green Architect with extensive commercial design portfolio.',
  },
  {
    id: 'arch-3',
    name: 'Ar. Sneha Kulkarni',
    email: 'sneha.kulkarni@designstudio.in',
    phone: '+91 98230 45678',
    city: 'Bengaluru',
    experience: 9,
    coaRegNumber: 'CA/2015/67890',
    qualifications: 'B.Arch, Certified Interior Architect',
    specialization: 'Contemporary Minimalist Villas, Duplex Renovations',
    rating: 4.9,
    projectsCount: 62,
    bio: 'Renowned for open-plan European minimalism combined with Indian climate-responsive shading and cross-ventilation.',
  },
]

export const SEED_ARCH_REQUESTS: ArchitecturalRequest[] = [
  {
    id: 'ar-101',
    customerId: 'demo-customer',
    customerName: 'Demo Customer',
    customerEmail: 'customer@gmail.com',
    customerPhone: '+91 98765 43210',
    architectId: 'demo-architect',
    architectName: 'Ar. Priya Sharma',
    projectName: 'Lotus Villa 3BHK Duplex',
    plotDimensions: '30 ft × 40 ft (1,200 sq.ft)',
    location: 'Jubilee Hills, Hyderabad',
    budget: 5500000,
    floors: 2,
    bedrooms: '3 BHK Duplex',
    designStyle: 'Modern Contemporary Vaastu',
    requirements:
      'East-facing main entrance with Vaastu compliance. Need spacious ground-floor master suite with garden view, double-height living room, 1st floor home theatre, and cantilever balcony.',
    status: 'Design Uploaded',
    statusMessage: 'Initial 2D floor plans and 3D elevation drawings uploaded. Awaiting your approval or revision feedback.',
    designs: [
      {
        id: 'des-1',
        title: '30x40 G+1 Detailed AutoCAD Floor Plan & Column Layout',
        type: '2D Floor Plan',
        previewUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        dimensions: '30 ft × 40 ft (Built-up: 2,150 sq.ft)',
        floors: 'Ground + 1st Floor',
        rooms: '3 BHK, Puja Room, Double Height Dining, Open Terrace',
        concreteMix: 'M25 Grade (1 : 1 : 2)',
        steelTonnes: 5.6,
        structuralNotes:
          '12 RCC columns (300×450mm) with 16mm Fe550D TMT bars. Plinth beam positioned 2 ft above road level with damp proof course.',
        version: 1,
        uploadedAt: '2026-11-19 14:30',
        status: 'Submitted',
      },
      {
        id: 'des-2',
        title: 'Lotus Villa Photorealistic 3D Exterior Elevation',
        type: '3D Elevation',
        previewUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        dimensions: 'Isometric North-East Facade',
        floors: '2 Levels',
        rooms: 'Exterior Cantilever Balcony & Pergola',
        concreteMix: 'M25 Grade RCC',
        steelTonnes: 1.2,
        structuralNotes: 'Cantilever balcony slab reinforced with 12mm rebar tie-backs embedded 1,500mm into main floor slab.',
        version: 1,
        uploadedAt: '2026-11-20 11:15',
        status: 'Submitted',
      },
    ],
    revisions: [
      {
        id: 'rev-1',
        revisionNumber: 1,
        requestedBy: 'Demo Customer',
        requestedAt: '2026-11-20 16:00',
        notes: 'Can we widen the kitchen utility area by 2 feet and shift the puja room slightly north-east?',
        status: 'Addressed',
        architectResponse: 'Adjusted in Revision v1.1. Expanded utility area and aligned puja strictly with Ishanya corner.',
        respondedAt: '2026-11-21 09:30',
      },
    ],
    messages: [
      {
        id: 'msg-1',
        senderId: 'demo-customer',
        senderName: 'Demo Customer',
        senderRole: 'Customer',
        text: 'Hello Ar. Priya, I submitted my design request for our 30x40 plot in Jubilee Hills. Excited to collaborate!',
        timestamp: '2026-11-19 10:15',
      },
      {
        id: 'msg-2',
        senderId: 'demo-architect',
        senderName: 'Ar. Priya Sharma',
        senderRole: 'Architect / Engineer',
        text: 'Hello! I reviewed your plot orientation and requirements. The East-facing aspect is ideal for natural morning lighting. I have uploaded the draft 2D layout and 3D elevation.',
        timestamp: '2026-11-19 14:45',
      },
    ],
    inspections: [
      {
        id: 'insp-1',
        title: 'Foundation Footing & Plinth Rebar Verification',
        stage: 'Foundation & Plinth',
        date: '2026-11-18',
        status: 'Passed',
        rebarSpacing: '150 mm c/c (Compliant with IS 456)',
        concreteSlump: '100 mm (Optimal workability)',
        coverBlocks: '40 mm Clear Cover Verified',
        curingPeriod: '14 Days Pond Curing Mandated',
        findings: 'Soil bearing capacity confirmed. Column starter ties verified with 135-degree seismic hooks.',
        certifiedBy: 'Ar. Priya Sharma (COA Reg: CA/2018/98421)',
      },
    ],
    createdAt: '2026-11-19 09:00',
    updatedAt: '2026-11-21 11:30',
  },
  {
    id: 'ar-102',
    customerId: 'cust-madhavi',
    customerName: 'Dr. Madhavi Rao',
    customerEmail: 'madhavi.rao@gmail.com',
    customerPhone: '+91 98490 11223',
    architectId: 'demo-architect',
    architectName: 'Ar. Priya Sharma',
    projectName: 'Contemporary Villa G+2',
    plotDimensions: '40 ft × 60 ft (2,400 sq.ft)',
    location: 'Gachibowli, Hyderabad',
    budget: 9500000,
    floors: 3,
    bedrooms: '4 BHK Luxury',
    designStyle: 'Luxury Villa',
    requirements:
      'Contemporary luxury villa with cantilever glass balcony, home theatre on 2nd floor, rainwater harvesting pit and solar roof structure.',
    status: 'Pending',
    statusMessage: 'New request submitted. Awaiting architect acceptance.',
    designs: [],
    revisions: [],
    messages: [
      {
        id: 'msg-3',
        senderId: 'cust-madhavi',
        senderName: 'Dr. Madhavi Rao',
        senderRole: 'Customer',
        text: 'Looking forward to your modern design approach for our 40x60 plot!',
        timestamp: '2026-11-20 17:00',
      },
    ],
    inspections: [],
    createdAt: '2026-11-20 16:55',
    updatedAt: '2026-11-20 17:00',
  },
]

// ---------------- LOCAL STORAGE SYNC HELPERS ----------------

export function getStoredArchitecturalRequests(): ArchitecturalRequest[] {
  try {
    const raw = localStorage.getItem(ARCH_REQUESTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
    localStorage.setItem(ARCH_REQUESTS_KEY, JSON.stringify(SEED_ARCH_REQUESTS))
    return SEED_ARCH_REQUESTS
  } catch {
    return SEED_ARCH_REQUESTS
  }
}

export function saveStoredArchitecturalRequests(requests: ArchitecturalRequest[]) {
  try {
    localStorage.setItem(ARCH_REQUESTS_KEY, JSON.stringify(requests))
    window.dispatchEvent(new Event(ARCH_REQUESTS_EVENT))
  } catch {
    // ignore
  }
}

// ---------------- ARCHITECT LISTING PROVIDER ----------------

export async function fetchAvailableArchitects(): Promise<ArchitectProfile[]> {
  const result: ArchitectProfile[] = [...DEFAULT_ARCHITECTS]
  if (firebaseReady && db) {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'Architect / Engineer'))
      const snap = await getDocs(q)
      snap.forEach((d) => {
        const u = d.data() as UserProfile
        if (!result.some((a) => a.id === d.id || a.email === u.email)) {
          result.push({
            id: d.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            city: u.city,
            experience: u.experienceYears || 5,
            coaRegNumber: u.coaReg || 'CA/REGISTERED',
            qualifications: u.qualifications || 'B.Arch, Structural Consultant',
            specialization: u.specialization || 'Residential & Commercial Design',
            rating: 4.8,
            projectsCount: 15,
            bio: u.bio || 'Registered architectural and engineering consultant.',
          })
        }
      })
    } catch {
      // fallback to defaults
    }
  } else {
    try {
      const raw = localStorage.getItem('bc-local-users-v1')
      if (raw) {
        const users = JSON.parse(raw) as UserProfile[]
        users
          .filter((u) => u.role === 'Architect / Engineer')
          .forEach((u) => {
            if (!result.some((a) => a.email === u.email)) {
              result.push({
                id: u.uid,
                name: u.name,
                email: u.email,
                phone: u.phone,
                city: u.city,
                experience: u.experienceYears || 5,
                coaRegNumber: u.coaReg || 'CA/REGISTERED',
                qualifications: u.qualifications || 'B.Arch, Structural Consultant',
                specialization: u.specialization || 'Residential & Commercial Architecture',
                rating: 4.8,
                projectsCount: 12,
                bio: u.bio || 'Registered architectural consultant.',
              })
            }
          })
      }
    } catch {
      // ignore
    }
  }
  return result
}

// ---------------- MUTATION ACTIONS (REAL-TIME BOTH IN FIRESTORE & LOCAL) ----------------

export interface NewRequestInput {
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  architectId: string
  architectName: string
  projectName: string
  plotDimensions: string
  location: string
  budget: number
  floors: number
  bedrooms: string
  designStyle: string
  requirements: string
}

export async function createArchitecturalRequest(input: NewRequestInput): Promise<ArchitecturalRequest> {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
  const newReq: ArchitecturalRequest = {
    id: 'ar-' + Date.now(),
    ...input,
    status: 'Pending',
    statusMessage: 'Design request submitted. Waiting for architect review.',
    designs: [],
    revisions: [],
    messages: [
      {
        id: 'msg-' + Date.now(),
        senderId: input.customerId,
        senderName: input.customerName,
        senderRole: 'Customer',
        text: `Submitted design request for "${input.projectName}" (${input.plotDimensions}, ${input.bedrooms}, ${input.designStyle}).`,
        timestamp: now,
      },
    ],
    inspections: [],
    createdAt: now,
    updatedAt: now,
  }

  if (firebaseReady && db) {
    try {
      const docRef = await addDoc(collection(db, 'architecturalRequests'), {
        ...newReq,
        createdAtServer: serverTimestamp(),
        updatedAtServer: serverTimestamp(),
      })
      newReq.id = docRef.id
    } catch (err) {
      console.warn('Firestore write failed, falling back to local storage sync', err)
    }
  }

  // Always update local sync storage as well
  const list = getStoredArchitecturalRequests()
  const updated = [newReq, ...list]
  saveStoredArchitecturalRequests(updated)
  return newReq
}

export async function updateArchitecturalRequestStatus(
  requestId: string,
  status: ArchitecturalRequestStatus,
  statusMessage?: string,
  actor?: { id: string; name: string; role: Role }
): Promise<void> {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16)

  if (firebaseReady && db) {
    try {
      await updateDoc(doc(db, 'architecturalRequests', requestId), {
        status,
        ...(statusMessage ? { statusMessage } : {}),
        updatedAt: now,
        updatedAtServer: serverTimestamp(),
      })
    } catch (err) {
      console.warn('Firestore update failed, syncing local', err)
    }
  }

  const list = getStoredArchitecturalRequests()
  const updated = list.map((r): ArchitecturalRequest => {
    if (r.id === requestId) {
      const nextMessages: DesignMessage[] = [...r.messages]
      if (actor && statusMessage) {
        nextMessages.push({
          id: 'msg-' + Date.now(),
          senderId: actor.id,
          senderName: actor.name,
          senderRole: actor.role,
          text: `[Status changed to ${status}]: ${statusMessage}`,
          timestamp: now,
        })
      }
      return {
        ...r,
        status,
        statusMessage: statusMessage ?? r.statusMessage,
        messages: nextMessages,
        updatedAt: now,
      }
    }
    return r
  })
  saveStoredArchitecturalRequests(updated)
}

export async function uploadDesignToRequest(
  requestId: string,
  design: Omit<DesignUpload, 'id' | 'uploadedAt' | 'version' | 'status'>
): Promise<void> {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
  const list = getStoredArchitecturalRequests()
  const target = list.find((r) => r.id === requestId)
  const currentVersion = (target?.designs?.length || 0) + 1

  const newDesign: DesignUpload = {
    ...design,
    id: 'des-' + Date.now(),
    version: currentVersion,
    uploadedAt: now,
    status: 'Submitted',
  }

  const updated = list.map((r): ArchitecturalRequest => {
    if (r.id === requestId) {
      const nextDesigns = [newDesign, ...(r.designs || [])]
      const nextMsg: DesignMessage = {
        id: 'msg-' + Date.now(),
        senderId: r.architectId,
        senderName: r.architectName,
        senderRole: 'Architect / Engineer',
        text: `Uploaded new design drawing: "${newDesign.title}" (${newDesign.type}). Concrete Grade: ${newDesign.concreteMix || 'M25'}, Steel: ~${newDesign.steelTonnes || 4.5}T.`,
        timestamp: now,
      }
      return {
        ...r,
        status: 'Design Uploaded' as ArchitecturalRequestStatus,
        statusMessage: `New design "${newDesign.title}" (v${newDesign.version}) uploaded by architect.`,
        designs: nextDesigns,
        updatedAt: now,
        messages: [...r.messages, nextMsg],
      }
    }
    return r
  })

  if (firebaseReady && db) {
    try {
      const t = updated.find((r) => r.id === requestId)
      if (t) {
        await updateDoc(doc(db, 'architecturalRequests', requestId), {
          designs: t.designs,
          status: 'Design Uploaded',
          statusMessage: t.statusMessage,
          messages: t.messages,
          updatedAt: now,
          updatedAtServer: serverTimestamp(),
        })
      }
    } catch (err) {
      console.warn('Firestore design upload sync', err)
    }
  }

  saveStoredArchitecturalRequests(updated)
}

export async function submitDesignRevision(
  requestId: string,
  customer: UserProfile,
  revisionNotes: string
): Promise<void> {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
  const list = getStoredArchitecturalRequests()
  const target = list.find((r) => r.id === requestId)
  const nextRevNumber = (target?.revisions?.length || 0) + 1

  const newRevision: DesignRevision = {
    id: 'rev-' + Date.now(),
    revisionNumber: nextRevNumber,
    requestedBy: customer.name,
    requestedAt: now,
    notes: revisionNotes.trim(),
    status: 'Open',
  }

  const updated = list.map((r): ArchitecturalRequest => {
    if (r.id === requestId) {
      const nextMsg: DesignMessage = {
        id: 'msg-' + Date.now(),
        senderId: customer.uid,
        senderName: customer.name,
        senderRole: 'Customer',
        text: `[Revision Request #${nextRevNumber}]: "${revisionNotes.trim()}"`,
        timestamp: now,
      }
      return {
        ...r,
        status: 'Revision Requested' as ArchitecturalRequestStatus,
        statusMessage: `Revision #${nextRevNumber} requested by ${customer.name}.`,
        revisions: [newRevision, ...(r.revisions || [])],
        messages: [...r.messages, nextMsg],
        updatedAt: now,
      }
    }
    return r
  })

  if (firebaseReady && db) {
    try {
      const t = updated.find((r) => r.id === requestId)
      if (t) {
        await updateDoc(doc(db, 'architecturalRequests', requestId), {
          revisions: t.revisions,
          status: 'Revision Requested',
          statusMessage: t.statusMessage,
          messages: t.messages,
          updatedAt: now,
          updatedAtServer: serverTimestamp(),
        })
      }
    } catch (err) {
      console.warn('Firestore revision sync', err)
    }
  }

  saveStoredArchitecturalRequests(updated)
}

export async function respondToDesignRevision(
  requestId: string,
  revisionId: string,
  architect: UserProfile,
  responseNotes: string
): Promise<void> {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
  const list = getStoredArchitecturalRequests()

  const updated = list.map((r): ArchitecturalRequest => {
    if (r.id === requestId) {
      const nextRevisions = (r.revisions || []).map((rev) => {
        if (rev.id === revisionId) {
          return {
            ...rev,
            status: 'Addressed' as const,
            architectResponse: responseNotes.trim(),
            respondedAt: now,
          }
        }
        return rev
      })

      const nextMsg: DesignMessage = {
        id: 'msg-' + Date.now(),
        senderId: architect.uid,
        senderName: architect.name,
        senderRole: 'Architect / Engineer',
        text: `[Revision Response]: "${responseNotes.trim()}"`,
        timestamp: now,
      }

      return {
        ...r,
        status: 'In Progress' as ArchitecturalRequestStatus,
        statusMessage: `Architect responded to revision: "${responseNotes.trim()}"`,
        revisions: nextRevisions,
        messages: [...r.messages, nextMsg],
        updatedAt: now,
      }
    }
    return r
  })

  if (firebaseReady && db) {
    try {
      const t = updated.find((r) => r.id === requestId)
      if (t) {
        await updateDoc(doc(db, 'architecturalRequests', requestId), {
          revisions: t.revisions,
          status: t.status,
          statusMessage: t.statusMessage,
          messages: t.messages,
          updatedAt: now,
          updatedAtServer: serverTimestamp(),
        })
      }
    } catch (err) {
      console.warn('Firestore respond to revision sync', err)
    }
  }

  saveStoredArchitecturalRequests(updated)
}

export async function sendRequestMessage(
  requestId: string,
  sender: UserProfile,
  text: string
): Promise<void> {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
  const list = getStoredArchitecturalRequests()

  const newMsg: DesignMessage = {
    id: 'msg-' + Date.now(),
    senderId: sender.uid,
    senderName: sender.name,
    senderRole: sender.role,
    text: text.trim(),
    timestamp: now,
  }

  const updated = list.map((r): ArchitecturalRequest => {
    if (r.id === requestId) {
      return {
        ...r,
        messages: [...r.messages, newMsg],
        updatedAt: now,
      }
    }
    return r
  })

  if (firebaseReady && db) {
    try {
      const t = updated.find((r) => r.id === requestId)
      if (t) {
        await updateDoc(doc(db, 'architecturalRequests', requestId), {
          messages: t.messages,
          updatedAt: now,
          updatedAtServer: serverTimestamp(),
        })
      }
    } catch (err) {
      console.warn('Firestore message sync', err)
    }
  }

  saveStoredArchitecturalRequests(updated)
}

export async function addInspectionRecord(
  requestId: string,
  inspection: Omit<StructuralInspection, 'id'>
): Promise<void> {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16)
  const list = getStoredArchitecturalRequests()

  const newInsp: StructuralInspection = {
    ...inspection,
    id: 'insp-' + Date.now(),
  }

  const updated = list.map((r): ArchitecturalRequest => {
    if (r.id === requestId) {
      const nextMsg: DesignMessage = {
        id: 'msg-' + Date.now(),
        senderId: r.architectId,
        senderName: r.architectName,
        senderRole: 'Architect / Engineer',
        text: `[Site Inspection Audit Added]: "${newInsp.title}" (${newInsp.stage}) - Status: ${newInsp.status}.`,
        timestamp: now,
      }
      return {
        ...r,
        inspections: [newInsp, ...(r.inspections || [])],
        messages: [...r.messages, nextMsg],
        updatedAt: now,
      }
    }
    return r
  })

  if (firebaseReady && db) {
    try {
      const t = updated.find((r) => r.id === requestId)
      if (t) {
        await updateDoc(doc(db, 'architecturalRequests', requestId), {
          inspections: t.inspections,
          messages: t.messages,
          updatedAt: now,
          updatedAtServer: serverTimestamp(),
        })
      }
    } catch (err) {
      console.warn('Firestore inspection sync', err)
    }
  }

  saveStoredArchitecturalRequests(updated)
}
