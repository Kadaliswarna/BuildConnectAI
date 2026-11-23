export const ROLES = ['Customer', 'Builder / Contractor', 'Architect / Engineer', 'Worker'] as const
export type Role = (typeof ROLES)[number] | 'Builder' | 'Contractor'

export function isBuilderOrContractor(role?: string | null): boolean {
  return role === 'Builder / Contractor' || role === 'Builder' || role === 'Contractor'
}

export const SKILLS = ['Mason', 'Electrician', 'Plumber', 'Painter', 'Carpenter', 'Labourer'] as const
export type Skill = (typeof SKILLS)[number]

export interface Quote { material: number; labour: number; extra: number; total: number; days: number }

export interface Builder {
  id: string; name: string; city: string; exp: number; rating: number
  reviews: number; projects: number; rate: number; quote: Quote; hue: number; phone?: string; companyName?: string
}

export interface Worker {
  id: string; name: string; skill: Skill; city: string; exp: number
  wage: number; rating: number; avail: boolean
}

export interface UserProfile {
  uid: string
  name: string
  email: string
  role: Role
  city: string
  phone: string
  photoURL?: string
  companyName?: string
  experienceYears?: number
  specialization?: string
  skill?: Skill
  qualifications?: string
  coaReg?: string
  officeAddress?: string
  bio?: string
  verified?: boolean
}

export type BookingStatus = 'pending' | 'accepted' | 'rejected'
export type BookingType = 'worker' | 'builder'

export interface Booking {
  id: string
  bookingType?: BookingType
  workerId: string
  workerName: string
  builderId?: string
  builderName?: string
  skill: string
  customerId: string
  customerName: string
  customerRole: Role
  customerPhone?: string
  customerEmail?: string
  date: string
  meetingDate?: string
  timeSlot?: string
  site: string
  budget?: number
  requirements?: string
  note: string
  status: BookingStatus
  createdAt?: { seconds: number }
}

export interface ChatMessage { id: string; from: string; fromName: string; text: string; ts?: { seconds: number } }

// =================== CUSTOMER - ARCHITECT INTEGRATION TYPES ===================

export type ArchitecturalRequestStatus =
  | 'Pending'
  | 'Under Review'
  | 'Accepted'
  | 'Declined'
  | 'More Info Needed'
  | 'In Progress'
  | 'Design Uploaded'
  | 'Approved'
  | 'Revision Requested'
  | 'Completed'

export type DesignType = '2D Floor Plan' | '3D Elevation' | 'Structural Drawing' | 'Electrical / Plumbing'

export interface DesignUpload {
  id: string
  title: string
  type: DesignType
  previewUrl: string
  fileUrl?: string
  dimensions?: string
  floors?: string
  rooms?: string
  concreteMix?: string
  steelTonnes?: number
  structuralNotes: string
  version: number
  uploadedAt: string
  status: 'Draft' | 'Submitted' | 'Approved' | 'Revision Requested'
}

export interface DesignRevision {
  id: string
  revisionNumber: number
  requestedBy: string
  requestedAt: string
  notes: string
  status: 'Open' | 'Addressed' | 'Closed'
  architectResponse?: string
  respondedAt?: string
}

export interface DesignMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: Role
  text: string
  timestamp: string
}

export interface StructuralInspection {
  id: string
  title: string
  stage: string
  date: string
  status: 'Passed' | 'Action Required' | 'Scheduled'
  rebarSpacing: string
  concreteSlump: string
  coverBlocks: string
  curingPeriod: string
  findings: string
  certifiedBy: string
}

export interface ArchitecturalRequest {
  id: string
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
  status: ArchitecturalRequestStatus
  statusMessage?: string
  designs: DesignUpload[]
  revisions: DesignRevision[]
  messages: DesignMessage[]
  inspections: StructuralInspection[]
  createdAt: string
  updatedAt: string
}

export interface ArchitectProfile {
  id: string
  name: string
  email: string
  phone: string
  city: string
  experience: number
  coaRegNumber: string
  qualifications: string
  specialization: string
  rating: number
  projectsCount: number
  bio: string
}
