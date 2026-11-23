import type { Skill } from '../types'

export interface EmergencyAlert {
  id: string
  workerId: string
  workerName: string
  skill: Skill
  site: string
  date: string
  reason: string
  status: 'active' | 'resolved'
  replacementWorkerId?: string
  replacementWorkerName?: string
  reportedAt: string
}

export interface AttendanceRecord {
  id: string
  workerId: string
  workerName: string
  skill: Skill
  site: string
  date: string
  status: 'Present' | 'Absent' | 'Half Day' | 'On Leave'
  inTime?: string
  outTime?: string
  dailyWage: number
  paid: boolean
}

export interface ContractorTask {
  id: string
  projectId: string
  projectName: string
  title: string
  trade: Skill
  assignedTo: string
  deadline: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'High' | 'Medium' | 'Low'
}

export interface ArchitecturalPlan {
  id: string
  title: string
  clientName: string
  type: '2D Floor Plan' | '3D Elevation' | 'Structural Layout' | 'Electrical Blueprint'
  plotSize: string
  floors: string
  rooms: string
  status: 'Approved' | 'Under Review' | 'Revision Requested'
  previewUrl: string
  inspectionDate?: string
  structuralNotes: string
  approvedBy: string
  estimatedConcreteMix: string
  estimatedSteelTonnes: number
}

export interface BuilderQuotation {
  id: string
  clientName: string
  projectName: string
  date: string
  totalAmount: number
  materialCost: number
  labourCost: number
  equipmentCost: number
  status: 'Draft' | 'Sent' | 'Approved' | 'Declined'
  validUntil: string
}

export interface WorkerJob {
  id: string
  title: string
  siteLocation: string
  city: string
  dailyWage: number
  duration: string
  postedBy: string
  postedDate: string
  requiredSkill: Skill
  urgency: 'Immediate' | 'This Week' | 'Next Week'
}

export interface WorkerPayment {
  id: string
  date: string
  site: string
  amount: number
  status: 'Paid' | 'Pending'
  paymentMethod: 'UPI' | 'Direct Cash' | 'Bank Transfer'
  refNo: string
}

// ---------------- LOCAL STORAGE KEYS ----------------
export const KEYS = {
  ALERTS: 'bc-emergency-alerts-v1',
  ATTENDANCE: 'bc-attendance-v1',
  TASKS: 'bc-contractor-tasks-v1',
  PLANS: 'bc-architect-plans-v1',
  QUOTES: 'bc-builder-quotes-v1',
  JOBS: 'bc-worker-jobs-v1',
  PAYMENTS: 'bc-worker-payments-v1',
}

// ---------------- SEED DATA ----------------
const SEED_ALERTS: EmergencyAlert[] = [
  {
    id: 'alt-1',
    workerId: 'w1',
    workerName: 'Ramesh K',
    skill: 'Mason',
    site: 'Green Villa, Jubilee Hills Site',
    date: new Date().toISOString().slice(0, 10),
    reason: 'Sudden fever and medical emergency',
    status: 'active',
    reportedAt: 'Today, 07:45 AM',
  },
]

const SEED_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att-1', workerId: 'w1', workerName: 'Ramesh K', skill: 'Mason', site: 'Jubilee Hills Villa', date: new Date().toISOString().slice(0, 10), status: 'Absent', dailyWage: 900, paid: false },
  { id: 'att-2', workerId: 'w2', workerName: 'Suresh P', skill: 'Mason', site: 'Jubilee Hills Villa', date: new Date().toISOString().slice(0, 10), status: 'Present', inTime: '08:15 AM', outTime: '05:30 PM', dailyWage: 800, paid: true },
  { id: 'att-3', workerId: 'w3', workerName: 'Venkat R', skill: 'Electrician', site: 'Madhapur Commercial', date: new Date().toISOString().slice(0, 10), status: 'Present', inTime: '08:30 AM', dailyWage: 1000, paid: true },
  { id: 'att-4', workerId: 'w5', workerName: 'Anwar S', skill: 'Plumber', site: 'Jubilee Hills Villa', date: new Date().toISOString().slice(0, 10), status: 'Present', inTime: '08:00 AM', dailyWage: 950, paid: false },
  { id: 'att-5', workerId: 'w6', workerName: 'Narayana M', skill: 'Carpenter', site: 'Gachibowli Heights', date: new Date().toISOString().slice(0, 10), status: 'Present', inTime: '08:10 AM', dailyWage: 1100, paid: true },
  { id: 'att-6', workerId: 'w7', workerName: 'Gopi T', skill: 'Labourer', site: 'Jubilee Hills Villa', date: new Date().toISOString().slice(0, 10), status: 'Present', inTime: '07:50 AM', dailyWage: 600, paid: true },
  { id: 'att-7', workerId: 'w8', workerName: 'Mahesh B', skill: 'Mason', site: 'Guntur Heights', date: new Date().toISOString().slice(0, 10), status: 'Present', inTime: '08:05 AM', dailyWage: 950, paid: true },
  { id: 'att-8', workerId: 'w9', workerName: 'Kiran V', skill: 'Electrician', site: 'Madhapur Commercial', date: new Date().toISOString().slice(0, 10), status: 'Half Day', inTime: '08:30 AM', outTime: '01:00 PM', dailyWage: 450, paid: false },
]

const SEED_TASKS: ContractorTask[] = [
  { id: 'tsk-1', projectId: 'demo-proj-1', projectName: 'Green Villa Construction', title: 'Tie column rebar and erect plywood shuttering for 1st floor', trade: 'Mason', assignedTo: 'Suresh P', deadline: 'Today, 5:00 PM', status: 'in_progress', priority: 'High' },
  { id: 'tsk-2', projectId: 'demo-proj-1', projectName: 'Green Villa Construction', title: 'Lay 1-inch CPVC drainage lines in ground floor master bathroom', trade: 'Plumber', assignedTo: 'Anwar S', deadline: 'Tomorrow', status: 'pending', priority: 'High' },
  { id: 'tsk-3', projectId: 'demo-proj-1', projectName: 'Green Villa Construction', title: 'Route heavy concealed electrical conduits in ceiling slab', trade: 'Electrician', assignedTo: 'Venkat R', deadline: 'In 3 days', status: 'pending', priority: 'Medium' },
  { id: 'tsk-4', projectId: 'demo-proj-2', projectName: 'Madhapur Commercial Hub', title: 'Level sand mortar bed and lay AAC blocks for exterior walls', trade: 'Mason', assignedTo: 'Mahesh B', deadline: 'Today, 6:00 PM', status: 'in_progress', priority: 'High' },
  { id: 'tsk-5', projectId: 'demo-proj-1', projectName: 'Green Villa Construction', title: 'Foundation soil excavation and PCC curing check', trade: 'Labourer', assignedTo: 'Gopi T', deadline: 'Yesterday', status: 'completed', priority: 'Medium' },
]

const SEED_PLANS: ArchitecturalPlan[] = [
  {
    id: 'pln-1',
    title: '30x40 East-Facing 3BHK Duplex Villa Plan',
    clientName: 'Demo Customer (Mr. Rajesh Rao)',
    type: '2D Floor Plan',
    plotSize: '30 ft × 40 ft (1,200 sq.ft)',
    floors: 'G + 1 Floor + Terrace',
    rooms: '3 BHK, Puja Room, Home Theatre, Car Parking',
    status: 'Approved',
    previewUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    inspectionDate: '2026-11-18',
    structuralNotes: 'M25 grade RCC columns with 16mm Fe550D TMT main bars. Plinth beam at +2 ft above road level with damp proof course (DPC).',
    approvedBy: 'Ar. Priya Sharma (CA/2018/98421)',
    estimatedConcreteMix: 'M25 (1 : 1 : 2)',
    estimatedSteelTonnes: 4.8,
  },
  {
    id: 'pln-2',
    title: '40x60 Contemporary Luxury Villa 3D Elevation',
    clientName: 'Sri Sai Constructions',
    type: '3D Elevation',
    plotSize: '40 ft × 60 ft (2,400 sq.ft)',
    floors: 'G + 2 Floors',
    rooms: '4 BHK Duplex, Double Height Living, Infinity Balcony',
    status: 'Under Review',
    previewUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    structuralNotes: 'Cantilever balcony overhang 5 ft requires 20mm rebar embedment in main tie beam. Soil bearing capacity tested at 180 kN/m².',
    approvedBy: 'Ar. Priya Sharma (CA/2018/98421)',
    estimatedConcreteMix: 'M30 (1 : 0.75 : 1.5)',
    estimatedSteelTonnes: 9.2,
  },
  {
    id: 'pln-3',
    title: 'Madhapur Commercial Office Structural Blueprint',
    clientName: 'BuildCraft Infra',
    type: 'Structural Layout',
    plotSize: '60 ft × 80 ft (4,800 sq.ft)',
    floors: 'Basement + G + 4 Floors',
    rooms: 'Open Commercial Floor Plates, Lift Shaft, Stairwell',
    status: 'Approved',
    previewUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    inspectionDate: '2026-11-10',
    structuralNotes: 'Raft foundation with 300mm slab thickness. Dual rebar mat with 12mm TMT @ 150mm c/c spacing both ways. Strict 21-day pond curing required.',
    approvedBy: 'Ar. Priya Sharma (CA/2018/98421)',
    estimatedConcreteMix: 'M35 Ready Mix Concrete',
    estimatedSteelTonnes: 26.5,
  },
]

const SEED_QUOTES: BuilderQuotation[] = [
  {
    id: 'quo-101',
    clientName: 'Demo Customer (Rajesh Rao)',
    projectName: '3BHK Duplex Construction (2,400 sq.ft)',
    date: new Date().toISOString().slice(0, 10),
    totalAmount: 4320000,
    materialCost: 2650000,
    labourCost: 1280000,
    equipmentCost: 390000,
    status: 'Approved',
    validUntil: '2026-12-15',
  },
  {
    id: 'quo-102',
    clientName: 'Anil Kumar Reddy',
    projectName: 'Independent House Renovation & 2nd Floor',
    date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
    totalAmount: 1850000,
    materialCost: 1100000,
    labourCost: 550000,
    equipmentCost: 200000,
    status: 'Sent',
    validUntil: '2026-12-05',
  },
]

const SEED_JOBS: WorkerJob[] = [
  { id: 'job-1', title: 'Urgent Mason Required for Column Casting', siteLocation: 'Green Villa, Jubilee Hills Rd #36', city: 'Hyderabad', dailyWage: 950, duration: '4 Days', postedBy: 'BuildCraft Infra', postedDate: 'Today', requiredSkill: 'Mason', urgency: 'Immediate' },
  { id: 'job-2', title: 'Experienced Electrician for Concealed Piping', siteLocation: 'Sector 4, Gachibowli', city: 'Hyderabad', dailyWage: 1050, duration: '6 Days', postedBy: 'Venkateshwara Contractors', postedDate: 'Yesterday', requiredSkill: 'Electrician', urgency: 'Immediate' },
  { id: 'job-3', title: 'Plumbing Team for 3-Floor Drainage Setup', siteLocation: 'Near Metro Pillar 42, Miyapur', city: 'Hyderabad', dailyWage: 950, duration: '1 Week', postedBy: 'Sri Sai Constructions', postedDate: '2 days ago', requiredSkill: 'Plumber', urgency: 'This Week' },
  { id: 'job-4', title: 'Carpentry & Shuttering Framework Specialists', siteLocation: 'Hanamkonda Main Road', city: 'Warangal', dailyWage: 1100, duration: '10 Days', postedBy: 'Kakatiya Developers', postedDate: '3 days ago', requiredSkill: 'Carpenter', urgency: 'This Week' },
  { id: 'job-5', title: 'Site Labourers for Sand Shifting & Concrete Mix', siteLocation: 'Banjara Hills Rd #10', city: 'Hyderabad', dailyWage: 650, duration: 'Daily', postedBy: 'Deccan Builders', postedDate: 'Today', requiredSkill: 'Labourer', urgency: 'Immediate' },
]

const SEED_PAYMENTS: WorkerPayment[] = [
  { id: 'pay-1', date: new Date().toISOString().slice(0, 10), site: 'Jubilee Hills Villa', amount: 950, status: 'Paid', paymentMethod: 'UPI', refNo: 'UPI-TXN-882910' },
  { id: 'pay-2', date: new Date(Date.now() - 86400000 * 1).toISOString().slice(0, 10), site: 'Jubilee Hills Villa', amount: 950, status: 'Paid', paymentMethod: 'UPI', refNo: 'UPI-TXN-881023' },
  { id: 'pay-3', date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10), site: 'Jubilee Hills Villa', amount: 950, status: 'Paid', paymentMethod: 'Direct Cash', refNo: 'CASH-REC-1049' },
  { id: 'pay-4', date: new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10), site: 'Gachibowli Heights', amount: 950, status: 'Paid', paymentMethod: 'Bank Transfer', refNo: 'NEFT-559124' },
  { id: 'pay-5', date: new Date(Date.now() - 86400000 * 4).toISOString().slice(0, 10), site: 'Gachibowli Heights', amount: 950, status: 'Paid', paymentMethod: 'UPI', refNo: 'UPI-TXN-876100' },
  { id: 'pay-6', date: new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10), site: 'Jubilee Hills Villa', amount: 950, status: 'Pending', paymentMethod: 'UPI', refNo: 'PENDING-APPROVAL' },
]

// ---------------- GETTERS & SETTERS WITH LOCAL PERSISTENCE ----------------
export function getStoredAlerts(): EmergencyAlert[] {
  try {
    const raw = localStorage.getItem(KEYS.ALERTS)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(KEYS.ALERTS, JSON.stringify(SEED_ALERTS))
    return SEED_ALERTS
  } catch {
    return SEED_ALERTS
  }
}

export function saveAlerts(alerts: EmergencyAlert[]) {
  try {
    localStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts))
    window.dispatchEvent(new Event('bc-emergency-alert'))
  } catch {
    // ignore
  }
}

export function getStoredAttendance(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.ATTENDANCE)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(SEED_ATTENDANCE))
    return SEED_ATTENDANCE
  } catch {
    return SEED_ATTENDANCE
  }
}

export function saveAttendance(list: AttendanceRecord[]) {
  try {
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(list))
    window.dispatchEvent(new Event('bc-attendance-change'))
  } catch {
    // ignore
  }
}

export function getStoredTasks(): ContractorTask[] {
  try {
    const raw = localStorage.getItem(KEYS.TASKS)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(KEYS.TASKS, JSON.stringify(SEED_TASKS))
    return SEED_TASKS
  } catch {
    return SEED_TASKS
  }
}

export function saveTasks(tasks: ContractorTask[]) {
  try {
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks))
    window.dispatchEvent(new Event('bc-tasks-change'))
  } catch {
    // ignore
  }
}

export function getStoredPlans(): ArchitecturalPlan[] {
  try {
    const raw = localStorage.getItem(KEYS.PLANS)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(KEYS.PLANS, JSON.stringify(SEED_PLANS))
    return SEED_PLANS
  } catch {
    return SEED_PLANS
  }
}

export function savePlans(plans: ArchitecturalPlan[]) {
  try {
    localStorage.setItem(KEYS.PLANS, JSON.stringify(plans))
    window.dispatchEvent(new Event('bc-plans-change'))
  } catch {
    // ignore
  }
}

export function getStoredQuotes(): BuilderQuotation[] {
  try {
    const raw = localStorage.getItem(KEYS.QUOTES)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(KEYS.QUOTES, JSON.stringify(SEED_QUOTES))
    return SEED_QUOTES
  } catch {
    return SEED_QUOTES
  }
}

export function saveQuotes(quotes: BuilderQuotation[]) {
  try {
    localStorage.setItem(KEYS.QUOTES, JSON.stringify(quotes))
    window.dispatchEvent(new Event('bc-quotes-change'))
  } catch {
    // ignore
  }
}

export function getStoredJobs(): WorkerJob[] {
  try {
    const raw = localStorage.getItem(KEYS.JOBS)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(KEYS.JOBS, JSON.stringify(SEED_JOBS))
    return SEED_JOBS
  } catch {
    return SEED_JOBS
  }
}

export function getStoredPayments(): WorkerPayment[] {
  try {
    const raw = localStorage.getItem(KEYS.PAYMENTS)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(SEED_PAYMENTS))
    return SEED_PAYMENTS
  } catch {
    return SEED_PAYMENTS
  }
}
