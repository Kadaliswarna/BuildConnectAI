import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { inr, Stars } from '../ui'
import { SEED_WORKERS } from '../../data/seed'
import { useBookings } from '../../hooks/useBookings'
import type { Booking, Skill, UserProfile, Worker } from '../../types'
import {
  getStoredAlerts,
  saveAlerts,
  getStoredQuotes,
  saveQuotes,
  getStoredAttendance,
  saveAttendance,
  getStoredTasks,
  saveTasks,
  type EmergencyAlert,
  type BuilderQuotation,
  type AttendanceRecord,
  type ContractorTask,
} from '../../data/multiRoleData'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useI18n } from '../../lib/i18n'

interface BuilderDashboardProps {
  user: UserProfile
}

export type BuilderTab =
  | 'dashboard'
  | 'projects'
  | 'hire_workers'
  | 'workforce'
  | 'tasks'
  | 'attendance'
  | 'progress'
  | 'expenses'
  | 'quotations'
  | 'materials'
  | 'messages'
  | 'profile'

export interface BuilderProject {
  id: string
  name: string
  location: string
  clientName: string
  budget: number
  spent: number
  progress: number
  status: 'In Progress' | 'Foundation' | 'Finishing' | 'Completed'
  deadline: string
  workersCount: number
  stage: string
  imageUrl?: string
}

export interface AssignedWorker {
  id: string
  workerId: string
  name: string
  skill: string
  city: string
  phone: string
  assignedProjectId: string
  assignedProjectName: string
  status: 'On Site' | 'Standby'
  dailyWage: number
  rating: number
  experienceYears: number
}

export interface ExpenseRecord {
  id: string
  date: string
  category: 'Material' | 'Labour' | 'Equipment' | 'Other'
  description: string
  project: string
  amount: number
}

export interface ChatThreadMessage {
  id: string
  sender: string
  role: string
  text: string
  timestamp: string
  isSelf: boolean
}

const INITIAL_PROJECTS: BuilderProject[] = [
  {
    id: 'bp-1',
    name: 'Green Villa Premium Residence',
    location: 'Jubilee Hills, Hyderabad',
    clientName: 'Rajesh Rao (Customer)',
    budget: 4500000,
    spent: 2650000,
    progress: 68,
    status: 'In Progress',
    deadline: '2027-02-28',
    workersCount: 14,
    stage: 'Brickwork (65%)',
    imageUrl: '/hero-house-clean.png',
  },
  {
    id: 'bp-2',
    name: 'Lakeview Gated Apartments',
    location: 'Gachibowli, Hyderabad',
    clientName: 'Amaravati Realties',
    budget: 9200000,
    spent: 3100000,
    progress: 35,
    status: 'Foundation',
    deadline: '2027-08-15',
    workersCount: 22,
    stage: 'Foundation (100%)',
    imageUrl: '/hero-architecture-hd.jpg',
  },
  {
    id: 'bp-3',
    name: 'Madhapur Commercial Complex',
    location: 'Madhapur IT Corridor, Hyderabad',
    clientName: 'Nexus Tech Spaces',
    budget: 14500000,
    spent: 12200000,
    progress: 88,
    status: 'Finishing',
    deadline: '2026-12-30',
    workersCount: 18,
    stage: 'Finishing (80%)',
    imageUrl: '/hero-visual-hd.png',
  },
]

const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-1',
    date: 'Nov 20, 2026',
    category: 'Material',
    description: 'Ultratech Cement (400 Bags)',
    project: 'Green Villa Site',
    amount: 156000,
  },
  {
    id: 'exp-2',
    date: 'Nov 18, 2026',
    category: 'Material',
    description: 'Tata Tiscon Fe550D Steel (3.2 Tonnes)',
    project: 'Green Villa Site',
    amount: 217600,
  },
  {
    id: 'exp-3',
    date: 'Nov 15, 2026',
    category: 'Labour',
    description: 'Mason & Shuttering Weekly Wage',
    project: 'Lakeview Project',
    amount: 72000,
  },
  {
    id: 'exp-4',
    date: 'Nov 12, 2026',
    category: 'Equipment',
    description: 'JCB Excavation & Soil Compaction',
    project: 'Madhapur Site',
    amount: 48000,
  },
  {
    id: 'exp-5',
    date: 'Nov 08, 2026',
    category: 'Material',
    description: 'River Sand (800 cu.ft Delivery)',
    project: 'Green Villa Site',
    amount: 46400,
  },
]

const INITIAL_ASSIGNED_WORKERS: AssignedWorker[] = [
  {
    id: 'asg-1',
    workerId: 'w1',
    name: 'Ramesh K',
    skill: 'Mason',
    city: 'Hyderabad',
    phone: '+91 91234 56789',
    assignedProjectId: 'bp-1',
    assignedProjectName: 'Green Villa Site',
    status: 'On Site',
    dailyWage: 900,
    rating: 4.6,
    experienceYears: 10,
  },
  {
    id: 'asg-2',
    workerId: 'w2',
    name: 'Suresh P',
    skill: 'Mason',
    city: 'Hyderabad',
    phone: '+91 98450 11223',
    assignedProjectId: 'bp-1',
    assignedProjectName: 'Green Villa Site',
    status: 'On Site',
    dailyWage: 800,
    rating: 4.3,
    experienceYears: 7,
  },
  {
    id: 'asg-3',
    workerId: 'w3',
    name: 'Venkat R',
    skill: 'Electrician',
    city: 'Vijayawada',
    phone: '+91 94401 98765',
    assignedProjectId: 'bp-3',
    assignedProjectName: 'Madhapur Site',
    status: 'On Site',
    dailyWage: 1000,
    rating: 4.5,
    experienceYears: 8,
  },
  {
    id: 'asg-4',
    workerId: 'w5',
    name: 'Anwar S',
    skill: 'Plumber',
    city: 'Hyderabad',
    phone: '+91 97000 45678',
    assignedProjectId: 'bp-1',
    assignedProjectName: 'Green Villa Site',
    status: 'On Site',
    dailyWage: 950,
    rating: 4.7,
    experienceYears: 9,
  },
  {
    id: 'asg-5',
    workerId: 'w6',
    name: 'Narayana M',
    skill: 'Carpenter',
    city: 'Warangal',
    phone: '+91 98111 22334',
    assignedProjectId: 'bp-2',
    assignedProjectName: 'Lakeview Project',
    status: 'On Site',
    dailyWage: 1100,
    rating: 4.8,
    experienceYears: 14,
  },
  {
    id: 'asg-6',
    workerId: 'w7',
    name: 'Gopi T',
    skill: 'Labourer',
    city: 'Hyderabad',
    phone: '+91 93456 78901',
    assignedProjectId: 'bp-1',
    assignedProjectName: 'Green Villa Site',
    status: 'On Site',
    dailyWage: 600,
    rating: 4.0,
    experienceYears: 3,
  },
  {
    id: 'asg-7',
    workerId: 'w8',
    name: 'Mahesh B',
    skill: 'Mason',
    city: 'Guntur',
    phone: '+91 95555 44444',
    assignedProjectId: 'bp-2',
    assignedProjectName: 'Lakeview Project',
    status: 'On Site',
    dailyWage: 950,
    rating: 4.5,
    experienceYears: 12,
  },
  {
    id: 'asg-8',
    workerId: 'w9',
    name: 'Kiran V',
    skill: 'Electrician',
    city: 'Hyderabad',
    phone: '+91 98765 12345',
    assignedProjectId: 'bp-3',
    assignedProjectName: 'Madhapur Site',
    status: 'On Site',
    dailyWage: 900,
    rating: 4.2,
    experienceYears: 6,
  },
]

const CONSTRUCTION_STAGES_12 = [
  { name: 'Site Preparation', progress: 100 },
  { name: 'Foundation', progress: 100 },
  { name: 'Plinth Level', progress: 100 },
  { name: 'Structure', progress: 80 },
  { name: 'Brickwork', progress: 70 },
  { name: 'Plumbing', progress: 60 },
  { name: 'Electrical', progress: 50 },
  { name: 'Plastering', progress: 40 },
  { name: 'Flooring', progress: 30 },
  { name: 'Painting', progress: 20 },
  { name: 'Fixtures & Fittings', progress: 10 },
  { name: 'Final Inspection', progress: 0 },
]

export default function BuilderDashboard({ user }: BuilderDashboardProps) {
  const { t } = useI18n()
  const { updateProfile } = useAuth()
  const toast = useToast()

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<BuilderTab>('dashboard')

  // Projects State
  const [projects, setProjects] = useState<BuilderProject[]>(INITIAL_PROJECTS)
  const [projectFilter, setProjectFilter] = useState<'all' | 'in_progress' | 'completed' | 'foundation' | 'finishing'>('all')
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<BuilderProject | null>(null)

  // Workforce Management State
  const [assignedWorkers, setAssignedWorkers] = useState<AssignedWorker[]>(INITIAL_ASSIGNED_WORKERS)
  const [workforceProjectFilter, setWorkforceProjectFilter] = useState<string>('all')
  const [workforceSkillFilter, setWorkforceSkillFilter] = useState<string>('All')
  const [showAssignWorkerModal, setShowAssignWorkerModal] = useState(false)
  const [workerToAssignId, setWorkerToAssignId] = useState<string>('w10')
  const [projectToAssignId, setProjectToAssignId] = useState<string>('bp-1')

  // Find & Hire Workers State
  const [hireSearchQuery, setHireSearchQuery] = useState('')
  const [hireSkillFilter, setHireSkillFilter] = useState<string>('All')
  const [hireCityFilter, setHireCityFilter] = useState<string>('All')
  const [selectedWorkerToHire, setSelectedWorkerToHire] = useState<Worker | null>(null)
  const [hireTargetProjectId, setHireTargetProjectId] = useState<string>('bp-1')

  // Emergency Alerts State
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([])

  // Quotations State
  const [quotes, setQuotes] = useState<BuilderQuotation[]>([])
  const [quoteFilter, setQuoteFilter] = useState<'all' | 'Approved' | 'Sent'>('all')

  // Expenses State
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES)
  const [showRecordExpenseModal, setShowRecordExpenseModal] = useState(false)
  const [newExpenseDate, setNewExpenseDate] = useState<string>('Nov 21, 2026')
  const [newExpenseCategory, setNewExpenseCategory] = useState<'Material' | 'Labour' | 'Equipment' | 'Other'>('Material')
  const [newExpenseDesc, setNewExpenseDesc] = useState<string>('')
  const [newExpenseProject, setNewExpenseProject] = useState<string>('Green Villa Site')
  const [newExpenseAmount, setNewExpenseAmount] = useState<string>('50000')

  // New Project Modal State
  const [showNewProjModal, setShowNewProjModal] = useState(false)
  const [newProjName, setNewProjName] = useState('')
  const [newProjLocation, setNewProjLocation] = useState('Hyderabad')
  const [newProjClient, setNewProjClient] = useState('')
  const [newProjBudget, setNewProjBudget] = useState('5000000')

  // New Quote Modal State
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false)
  const [quoteClient, setQuoteClient] = useState('')
  const [quoteProj, setQuoteProj] = useState('')
  const [quoteMaterial, setQuoteMaterial] = useState('2400000')
  const [quoteLabour, setQuoteLabour] = useState('1400000')
  const [quoteEquipment, setQuoteEquipment] = useState('520000')

  // Daily Tasks & Scheduling State (Contractor Module)
  const [tasks, setTasks] = useState<ContractorTask[]>([])
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskTrade, setTaskTrade] = useState<Skill>('Mason')
  const [taskAssignee, setTaskAssignee] = useState('Suresh P')
  const [taskPriority, setTaskPriority] = useState<'High' | 'Medium' | 'Low'>('High')
  const [taskDeadline, setTaskDeadline] = useState('Tomorrow, 5:00 PM')
  const [taskTargetProjectId, setTaskTargetProjectId] = useState('bp-1')

  // Attendance Tracking State (Contractor Module)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])

  // Project Progress Tracking State (12 Stages & Site Photos)
  const [stagesProgress, setStagesProgress] = useState(CONSTRUCTION_STAGES_12)
  const [photos, setPhotos] = useState<{ id: string; url: string; caption: string; date: string; site: string }[]>([
    {
      id: 'p1',
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=800&q=80',
      caption: 'Pillars casting & reinforcement check passed',
      date: 'Today, 10:45 AM',
      site: 'Green Villa Site',
    },
    {
      id: 'p2',
      url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
      caption: 'AAC block brickwork 1st floor North-East elevation',
      date: 'Yesterday, 03:20 PM',
      site: 'Green Villa Site',
    },
  ])
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [newPhotoCaption, setNewPhotoCaption] = useState('')
  const [newPhotoUrl, setNewPhotoUrl] = useState('')

  // Messages State
  const [activeMessageThread, setActiveMessageThread] = useState<'client' | 'architect' | 'foreman'>('client')
  const [messagesLog, setMessagesLog] = useState<Record<string, ChatThreadMessage[]>>({
    client: [
      {
        id: 'm1',
        sender: 'Rajesh Rao (Customer)',
        role: 'Client',
        text: 'Hi BuildCraft, could you share the updated schedule for the 1st floor slab casting?',
        timestamp: '10:15 AM',
        isSelf: false,
      },
      {
        id: 'm2',
        sender: 'You',
        role: 'Builder / Contractor',
        text: 'Hello Mr. Rao! Shuttering and rebar binding are 90% completed. We have scheduled casting for this Thursday morning.',
        timestamp: '10:30 AM',
        isSelf: true,
      },
      {
        id: 'm3',
        sender: 'Rajesh Rao (Customer)',
        role: 'Client',
        text: 'Great, thanks for the quick update! Will the architect be inspecting the rebar clearances beforehand?',
        timestamp: '10:42 AM',
        isSelf: false,
      },
    ],
    architect: [
      {
        id: 'a1',
        sender: 'Ar. Priya Sharma',
        role: 'Consulting Architect',
        text: 'Uploaded the revised structural drawing for the cantilever balcony. Please check rebar spacing in Section B.',
        timestamp: 'Yesterday',
        isSelf: false,
      },
      {
        id: 'a2',
        sender: 'You',
        role: 'Builder / Contractor',
        text: 'Reviewed and confirmed Ar. Priya. Fe550D rebar is placed at 125mm c/c as instructed. Ready for your site audit.',
        timestamp: 'Yesterday',
        isSelf: true,
      },
    ],
    foreman: [
      {
        id: 'f1',
        sender: 'Suresh P',
        role: 'Site Foreman & Mason Lead',
        text: 'Sir, 400 bags of Ultratech cement and river sand consignment arrived at Jubilee Hills site.',
        timestamp: '08:00 AM',
        isSelf: false,
      },
      {
        id: 'f2',
        sender: 'You',
        role: 'Builder / Contractor',
        text: 'Noted Suresh. Store the cement bags on wooden pallets off the ground and begin column compaction vibrator checks.',
        timestamp: '08:15 AM',
        isSelf: true,
      },
    ],
  })
  const [newMessageText, setNewMessageText] = useState('')

  // Profile Fields State
  const [profName, setProfName] = useState(user.name || 'Builder')
  const [profCompany, setProfCompany] = useState(user.companyName || `${user.name} Infra Developers`)
  const [profCity, setProfCity] = useState(user.city || 'Hyderabad')
  const [profPhone, setProfPhone] = useState(user.phone || '+91 98765 00000')
  const [profExp, setProfExp] = useState(user.experienceYears || 10)
  const [profSpec, setProfSpec] = useState(user.specialization || 'Turnkey Construction & Civil Contracting')
  const [profBio, setProfBio] = useState(
    user.bio || 'General contractor and builder specializing in premium residential and commercial construction.'
  )
  const [savingProfile, setSavingProfile] = useState(false)

  // Incoming builder bookings from Customers (Find Builder)
  const { bookings: allBookings } = useBookings(user)
  const incomingBookings = allBookings.filter(
    (b) =>
      b.bookingType === 'builder' ||
      b.builderId === user.uid ||
      b.builderName?.toLowerCase().includes((user.name || '').toLowerCase()) ||
      b.workerName?.toLowerCase().includes((user.name || '').toLowerCase()) ||
      b.builderId === 'b1'
  )

  const handleDecideBooking = (bookingId: string, status: 'accepted' | 'rejected') => {
    try {
      const stored = (JSON.parse(localStorage.getItem('bc-bookings-v1') ?? '[]') as Booking[]).map((x) =>
        x.id === bookingId ? { ...x, status } : x
      )
      localStorage.setItem('bc-bookings-v1', JSON.stringify(stored))
      window.dispatchEvent(new Event('bc-bookings-change'))
      toast(status === 'accepted' ? 'Booking consultation accepted!' : 'Booking request declined')
    } catch {
      toast('Failed to update booking status', 'err')
    }
  }

  // Load and subscribe to real-time events across the multi-role platform
  useEffect(() => {
    const syncData = () => {
      setAlerts(getStoredAlerts())
      setQuotes(getStoredQuotes())
      setTasks(getStoredTasks())
      setAttendance(getStoredAttendance())
    }
    syncData()
    window.addEventListener('bc-emergency-alert', syncData)
    window.addEventListener('bc-quotes-change', syncData)
    window.addEventListener('bc-tasks-change', syncData)
    window.addEventListener('bc-attendance-change', syncData)
    return () => {
      window.removeEventListener('bc-emergency-alert', syncData)
      window.removeEventListener('bc-quotes-change', syncData)
      window.removeEventListener('bc-tasks-change', syncData)
      window.removeEventListener('bc-attendance-change', syncData)
    }
  }, [])

  // Emergency AI Replacement Action
  const handleDispatchReplacement = (alertId: string, replacement: Worker) => {
    const updated = alerts.map((a) => {
      if (a.id === alertId) {
        return {
          ...a,
          status: 'resolved' as const,
          replacementWorkerId: replacement.id,
          replacementWorkerName: replacement.name,
        }
      }
      return a
    })
    saveAlerts(updated)
    setAlerts(updated)

    const absentAlert = alerts.find((a) => a.id === alertId)
    const newAsg: AssignedWorker = {
      id: 'asg-' + Date.now(),
      workerId: replacement.id,
      name: replacement.name,
      skill: replacement.skill,
      city: replacement.city,
      phone: '+91 94411 ' + Math.floor(10000 + Math.random() * 90000),
      assignedProjectId: 'bp-1',
      assignedProjectName: absentAlert?.site || 'Green Villa Site',
      status: 'On Site',
      dailyWage: replacement.wage,
      rating: replacement.rating,
      experienceYears: replacement.exp,
    }
    setAssignedWorkers((prev) => [newAsg, ...prev.filter((w) => w.workerId !== absentAlert?.workerId)])
    toast(`Emergency Replacement Dispatched: ${replacement.name} assigned to site!`)
  }

  // Handle Add Project
  const handleCreateProject = (e: FormEvent) => {
    e.preventDefault()
    if (!newProjName.trim()) return
    const p: BuilderProject = {
      id: 'bp-' + Date.now(),
      name: newProjName.trim(),
      location: newProjLocation,
      clientName: newProjClient.trim() || 'Direct Client',
      budget: Number(newProjBudget) || 3000000,
      spent: 0,
      progress: 5,
      status: 'Foundation',
      deadline: '2027-06-30',
      workersCount: 8,
      stage: 'Foundation (5%)',
      imageUrl: '/hero-architecture-hd.jpg',
    }
    setProjects([p, ...projects])
    setShowNewProjModal(false)
    setNewProjName('')
    setNewProjClient('')
    toast(`Project "${p.name}" created successfully!`)
  }

  // Handle Add Quotation
  const handleCreateQuote = (e: FormEvent) => {
    e.preventDefault()
    const m = Number(quoteMaterial) || 0
    const l = Number(quoteLabour) || 0
    const eq = Number(quoteEquipment) || 0
    const q: BuilderQuotation = {
      id: 'quo-' + Date.now().toString().slice(-4),
      clientName: quoteClient.trim() || 'New Homeowner',
      projectName: quoteProj.trim() || 'Residential Construction',
      date: new Date().toISOString().slice(0, 10),
      materialCost: m,
      labourCost: l,
      equipmentCost: eq,
      totalAmount: m + l + eq,
      status: 'Sent',
      validUntil: '2026-12-31',
    }
    const nextQuotes = [q, ...quotes]
    saveQuotes(nextQuotes)
    setQuotes(nextQuotes)
    setShowNewQuoteModal(false)
    setQuoteClient('')
    setQuoteProj('')
    toast(`Quotation for "${q.projectName}" created & sent!`)
  }

  // Handle Record Expense
  const handleRecordExpense = (e: FormEvent) => {
    e.preventDefault()
    const amt = Number(newExpenseAmount) || 0
    if (!newExpenseDesc.trim() || amt <= 0) return

    const record: ExpenseRecord = {
      id: 'exp-' + Date.now(),
      date: newExpenseDate,
      category: newExpenseCategory,
      description: newExpenseDesc.trim(),
      project: newExpenseProject,
      amount: amt,
    }
    setExpenses([record, ...expenses])
    setShowRecordExpenseModal(false)
    setNewExpenseDesc('')
    toast(`Expense of ${inr(amt)} recorded for ${record.project}!`)
  }

  // Handle Worker Assignment from Workforce Management modal
  const handleAssignWorkerSubmit = (e: FormEvent) => {
    e.preventDefault()
    const worker = SEED_WORKERS.find((w) => w.id === workerToAssignId)
    const targetProj = projects.find((p) => p.id === projectToAssignId)
    if (!worker || !targetProj) return

    const already = assignedWorkers.find((a) => a.workerId === worker.id)
    if (already) {
      setAssignedWorkers((prev) =>
        prev.map((a) =>
          a.workerId === worker.id
            ? { ...a, assignedProjectId: targetProj.id, assignedProjectName: targetProj.name }
            : a
        )
      )
      toast(`Worker ${worker.name} reassigned to ${targetProj.name}!`)
    } else {
      const newAsg: AssignedWorker = {
        id: 'asg-' + Date.now(),
        workerId: worker.id,
        name: worker.name,
        skill: worker.skill,
        city: worker.city,
        phone: '+91 98450 ' + Math.floor(10000 + Math.random() * 90000),
        assignedProjectId: targetProj.id,
        assignedProjectName: targetProj.name,
        status: 'On Site',
        dailyWage: worker.wage,
        rating: worker.rating,
        experienceYears: worker.exp,
      }
      setAssignedWorkers([newAsg, ...assignedWorkers])
      toast(`Worker ${worker.name} assigned to ${targetProj.name}!`)
    }
    setShowAssignWorkerModal(false)
  }

  // Direct Hiring from "Find & Hire Workers" module
  const handleConfirmHireWorker = () => {
    if (!selectedWorkerToHire) return
    const targetProj = projects.find((p) => p.id === hireTargetProjectId) || projects[0]
    const already = assignedWorkers.find((a) => a.workerId === selectedWorkerToHire.id)

    if (already) {
      setAssignedWorkers((prev) =>
        prev.map((a) =>
          a.workerId === selectedWorkerToHire.id
            ? { ...a, assignedProjectId: targetProj.id, assignedProjectName: targetProj.name, status: 'On Site' }
            : a
        )
      )
      toast(`Worker ${selectedWorkerToHire.name} successfully booked and assigned to ${targetProj.name}!`)
    } else {
      const newAsg: AssignedWorker = {
        id: 'asg-' + Date.now(),
        workerId: selectedWorkerToHire.id,
        name: selectedWorkerToHire.name,
        skill: selectedWorkerToHire.skill,
        city: selectedWorkerToHire.city,
        phone: '+91 98' + Math.floor(10000000 + Math.random() * 90000000),
        assignedProjectId: targetProj.id,
        assignedProjectName: targetProj.name,
        status: 'On Site',
        dailyWage: selectedWorkerToHire.wage,
        rating: selectedWorkerToHire.rating,
        experienceYears: selectedWorkerToHire.exp,
      }
      setAssignedWorkers([newAsg, ...assignedWorkers])
      toast(`Hired ${selectedWorkerToHire.name} (${selectedWorkerToHire.skill}) for ${targetProj.name}!`)
    }
    setSelectedWorkerToHire(null)
  }

  const handleUnassignWorker = (asgId: string) => {
    const target = assignedWorkers.find((a) => a.id === asgId)
    setAssignedWorkers((prev) => prev.filter((a) => a.id !== asgId))
    if (target) {
      toast(`Worker ${target.name} released from ${target.assignedProjectName}.`)
    }
  }

  // Toggle Attendance Status
  const handleToggleAttendance = (id: string, newStatus: AttendanceRecord['status']) => {
    const updated = attendance.map((a) => {
      if (a.id === id) {
        if (newStatus === 'Absent' && a.status !== 'Absent') {
          const newAlert: EmergencyAlert = {
            id: 'alt-' + Date.now(),
            workerId: a.workerId,
            workerName: a.workerName,
            skill: a.skill,
            site: a.site,
            date: new Date().toISOString().slice(0, 10),
            reason: 'Marked absent during morning roll call',
            status: 'active',
            reportedAt: 'Today, 08:30 AM',
          }
          const nextAlerts = [newAlert, ...alerts]
          saveAlerts(nextAlerts)
          setAlerts(nextAlerts)
          toast(`Absence recorded: Emergency replacement broadcast created for ${a.workerName}!`)
        }
        return { ...a, status: newStatus }
      }
      return a
    })
    saveAttendance(updated)
    setAttendance(updated)
  }

  // Settle Wage Payment
  const handleMarkWagePaid = (id: string) => {
    const updated = attendance.map((a) => (a.id === id ? { ...a, paid: true } : a))
    saveAttendance(updated)
    setAttendance(updated)
    toast('Wage payment settled successfully!')
  }

  // Contractor Task Creation
  const handleCreateTask = (e: FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return
    const targetProj = projects.find((p) => p.id === taskTargetProjectId) || projects[0]
    const t: ContractorTask = {
      id: 'tsk-' + Date.now(),
      projectId: targetProj.id,
      projectName: targetProj.name,
      title: taskTitle.trim(),
      trade: taskTrade,
      assignedTo: taskAssignee,
      deadline: taskDeadline || 'Tomorrow, 5:00 PM',
      status: 'pending',
      priority: taskPriority,
    }
    const next = [t, ...tasks]
    saveTasks(next)
    setTasks(next)
    setShowTaskModal(false)
    setTaskTitle('')
    toast(`Task "${t.title}" assigned to ${t.assignedTo}!`)
  }

  // Toggle Task Status
  const handleToggleTaskStatus = (id: string) => {
    const next = tasks.map((t) => {
      if (t.id === id) {
        const nextStatus = t.status === 'completed' ? 'in_progress' : 'completed'
        return { ...t, status: nextStatus as ContractorTask['status'] }
      }
      return t
    })
    saveTasks(next)
    setTasks(next)
    toast('Task status updated!')
  }

  // Send Message in Active Thread
  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault()
    if (!newMessageText.trim()) return
    const msg: ChatThreadMessage = {
      id: 'm-' + Date.now(),
      sender: 'You',
      role: 'Builder / Contractor',
      text: newMessageText.trim(),
      timestamp: 'Just now',
      isSelf: true,
    }
    setMessagesLog((prev) => ({
      ...prev,
      [activeMessageThread]: [...(prev[activeMessageThread] || []), msg],
    }))
    setNewMessageText('')
    toast('Message sent!')
  }

  // Profile Update
  const handleUpdateBuilderProfile = async (e: FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await updateProfile({
        name: profName.trim(),
        companyName: profCompany.trim(),
        city: profCity.trim(),
        phone: profPhone.trim(),
        experienceYears: Number(profExp) || 0,
        specialization: profSpec.trim(),
        bio: profBio.trim(),
      })
      toast('Builder / Contractor profile & company credentials saved successfully!')
    } catch (err: any) {
      toast(err?.message || 'Failed to update profile', 'err')
    } finally {
      setSavingProfile(false)
    }
  }

  // Active alerts count
  const activeAlerts = alerts.filter((a) => a.status === 'active')

  // Attendance metrics
  const presentCount = attendance.filter((a) => a.status === 'Present').length
  const absentCount = attendance.filter((a) => a.status === 'Absent').length
  const halfDayCount = attendance.filter((a) => a.status === 'Half Day').length
  const pendingPayTotal = attendance.filter((a) => !a.paid && a.status === 'Present').reduce((s, a) => s + a.dailyWage, 0)

  // Filtered projects
  const filteredProjects = useMemo(() => {
    if (projectFilter === 'all') return projects
    if (projectFilter === 'in_progress') return projects.filter((p) => p.status === 'In Progress')
    if (projectFilter === 'completed') return projects.filter((p) => p.status === 'Completed')
    if (projectFilter === 'foundation') return projects.filter((p) => p.status === 'Foundation')
    if (projectFilter === 'finishing') return projects.filter((p) => p.status === 'Finishing')
    return projects
  }, [projects, projectFilter])

  // Filtered quotes
  const filteredQuotes = useMemo(() => {
    if (quoteFilter === 'all') return quotes
    return quotes.filter((q) => q.status === quoteFilter)
  }, [quotes, quoteFilter])

  // Filtered assigned workers
  const filteredAssignedWorkers = useMemo(() => {
    return assignedWorkers.filter((w) => {
      const matchProj = workforceProjectFilter === 'all' || w.assignedProjectId === workforceProjectFilter
      const matchSkill = workforceSkillFilter === 'All' || w.skill === workforceSkillFilter
      return matchProj && matchSkill
    })
  }, [assignedWorkers, workforceProjectFilter, workforceSkillFilter])

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    if (taskFilter === 'all') return tasks
    return tasks.filter((t) => t.status === taskFilter)
  }, [tasks, taskFilter])

  // Filtered workers to hire
  const hireableWorkers = useMemo(() => {
    return SEED_WORKERS.filter((w) => {
      const matchSkill = hireSkillFilter === 'All' || w.skill === hireSkillFilter
      const matchCity = hireCityFilter === 'All' || w.city === hireCityFilter
      const matchSearch =
        !hireSearchQuery ||
        w.name.toLowerCase().includes(hireSearchQuery.toLowerCase()) ||
        w.skill.toLowerCase().includes(hireSearchQuery.toLowerCase())
      return matchSkill && matchCity && matchSearch
    })
  }, [hireSkillFilter, hireCityFilter, hireSearchQuery])

  // Calculations for Expenses
  const totalMaterialExpenses = 3450000
  const totalLabourWages = 1420000
  const totalEquipmentExpenses = 480000

  return (
    <div className="space-y-5">
      {/* 2-COLUMN MAIN LAYOUT: SIDEBAR (col-span-3) + CONTENT (col-span-9) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full">
        {/* SIDEBAR NAVIGATION (col-span-3 / col-span-2 on 2xl) */}
        <aside className="lg:col-span-3 xl:col-span-3 2xl:col-span-2 w-full lg:sticky lg:top-20 z-20">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-xs flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 scrollbar-none">
            {/* 1. Overview Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition whitespace-nowrap shrink-0 lg:w-full ${
                activeTab === 'dashboard'
                  ? 'bg-[#1554C8] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </button>

            {/* 2. My Projects */}
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition whitespace-nowrap shrink-0 lg:w-full ${
                activeTab === 'projects'
                  ? 'bg-[#1554C8] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Projects</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'projects' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {projects.length}
              </span>
            </button>

            {/* 3. Find & Hire Workers */}
            <button
              onClick={() => setActiveTab('hire_workers')}
              className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition whitespace-nowrap shrink-0 lg:w-full ${
                activeTab === 'hire_workers'
                  ? 'bg-[#1554C8] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Find & Hire Workers</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'hire_workers' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
              }`}>
                {SEED_WORKERS.length}
              </span>
            </button>

            {/* 4. Worker Management */}
            <button
              onClick={() => setActiveTab('workforce')}
              className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition whitespace-nowrap shrink-0 lg:w-full ${
                activeTab === 'workforce'
                  ? 'bg-[#1554C8] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Workforce Management</span>
              </div>
              {activeAlerts.length > 0 && (
                <span className="rounded-full bg-red-500 text-white px-1.5 py-0.2 text-[9px] font-extrabold animate-pulse">
                  !
                </span>
              )}
            </button>

            {/* 5. Daily Tasks & Scheduling */}
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition whitespace-nowrap shrink-0 lg:w-full ${
                activeTab === 'tasks'
                  ? 'bg-[#1554C8] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Tasks & Scheduling</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'tasks' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {tasks.length}
              </span>
            </button>

            {/* 6. Attendance Tracking */}
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition whitespace-nowrap shrink-0 lg:w-full ${
                activeTab === 'attendance'
                  ? 'bg-[#1554C8] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Attendance Tracking</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'attendance' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {presentCount}P
              </span>
            </button>

            {/* 7. Project Progress Tracking */}
            <button
              onClick={() => setActiveTab('progress')}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition whitespace-nowrap shrink-0 lg:w-full ${
                activeTab === 'progress'
                  ? 'bg-[#1554C8] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Progress Tracking</span>
            </button>

            {/* 8. Budget & Expenses */}
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition whitespace-nowrap shrink-0 lg:w-full ${
                activeTab === 'expenses'
                  ? 'bg-[#1554C8] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Expenses</span>
            </button>

            {/* Quotations (Kept for quick access and test compatibility) */}
            <button
              onClick={() => setActiveTab('quotations')}
              className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition whitespace-nowrap shrink-0 lg:w-full ${
                activeTab === 'quotations'
                  ? 'bg-[#1554C8] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Quotations</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'quotations' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {quotes.length}
              </span>
            </button>

            {/* 9. Material Management */}
            <button
              onClick={() => setActiveTab('materials')}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition whitespace-nowrap shrink-0 lg:w-full ${
                activeTab === 'materials'
                  ? 'bg-[#1554C8] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Materials</span>
            </button>

            {/* 10. Messages */}
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition whitespace-nowrap shrink-0 lg:w-full ${
                activeTab === 'messages'
                  ? 'bg-[#1554C8] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Messages</span>
              </div>
              {incomingBookings.length > 0 && (
                <span className="rounded-full bg-orange-500 text-white px-2 py-0.5 text-[10px] font-bold">
                  {incomingBookings.length}
                </span>
              )}
            </button>

            {/* 11. Company Profile */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition whitespace-nowrap shrink-0 lg:w-full ${
                activeTab === 'profile'
                  ? 'bg-[#1554C8] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profile</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT PANE (col-span-9 / col-span-10 on 2xl) */}
        <main className="lg:col-span-9 xl:col-span-9 2xl:col-span-10 space-y-5 w-full min-w-0">
          {/* ======================================================== */}
          {/* MODULE 1: DASHBOARD (OVERVIEW)                           */}
          {/* ======================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              {/* Welcome Banner - Clean Light Mode, Navy in Dark Mode */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/90 via-slate-50 to-white border border-blue-200/80 text-slate-900 shadow-sm dark:bg-gradient-to-r dark:from-[#0a2558] dark:via-[#0d347c] dark:to-[#1554c8] dark:border-transparent dark:text-white p-6 transition-colors duration-200">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1 z-10">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-orange-100 text-[#FF7900] border border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        {t('Builder / Contractor Operations Console')}
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {t('Welcome back,')} {user.name || t('Builder')}!
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-blue-100 font-medium">
                      Build, Manage and Track your Construction Projects.
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-blue-200 opacity-90 pt-1">
                      {user.companyName || 'Builder Infra Developers'} · {user.city || 'Hyderabad'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 z-10">
                    <button
                      onClick={() => setShowNewProjModal(true)}
                      className="rounded-xl bg-[#ff7900] hover:bg-[#e66d00] active:scale-[0.99] px-4 py-2 text-xs font-bold text-white shadow-md transition"
                    >
                      {t('+ Create New Project')}
                    </button>
                    <button
                      onClick={() => setShowTaskModal(true)}
                      className="rounded-xl bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/20 border border-slate-300 dark:border-white/20 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-white shadow-xs transition"
                    >
                      {t('+ Assign Task')}
                    </button>
                    <button
                      onClick={() => setActiveTab('attendance')}
                      className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 text-xs font-bold text-white transition"
                    >
                      Roll Call ({presentCount}P)
                    </button>
                  </div>
                </div>

                {/* Decorative background blueprint pattern */}
                <div className="pointer-events-none absolute -right-6 -bottom-8 opacity-10">
                  <svg width="220" height="220" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M3 21h18M5 21V7l8-4 6 3v15M9 9h2m-2 4h2m-2 4h2m4-8h2m-4 4h2m-4 4h2" />
                  </svg>
                </div>
              </div>

              {/* 5 KPI Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Projects</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <div className="text-2xl font-black text-slate-900">{projects.length}</div>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">All Active</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Workforce</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <div className="text-2xl font-black text-slate-900">{assignedWorkers.length}</div>
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Assigned</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Expenses</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <div className="text-xl font-black text-slate-900">₹1,79,50,000</div>
                    <span className="text-[10px] font-bold text-slate-500">YTD</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Quotations</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <div className="text-2xl font-black text-slate-900">{quotes.length || 2}</div>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Client Sent</span>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Material Alerts</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <div className="text-2xl font-black text-orange-600">1</div>
                    <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">Cement Bulk</span>
                  </div>
                </div>
              </div>

              {/* Emergency Alert Banner if any workers are absent */}
              {activeAlerts.length > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 font-bold text-lg">
                        ⚠️
                      </span>
                      <div>
                        <h4 className="font-extrabold text-red-900 text-sm">
                          Labour Absence Alert: {activeAlerts[0].workerName} ({activeAlerts[0].skill})
                        </h4>
                        <p className="text-xs text-red-700">
                          Site: {activeAlerts[0].site} · Reason: {activeAlerts[0].reason}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const match = SEED_WORKERS.find(
                          (w) => w.skill === activeAlerts[0].skill && w.id !== activeAlerts[0].workerId
                        ) || SEED_WORKERS[1]
                        handleDispatchReplacement(activeAlerts[0].id, match)
                      }}
                      className="rounded-xl bg-red-600 hover:bg-red-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs"
                    >
                      Dispatch AI Replacement
                    </button>
                  </div>
                </div>
              )}

              {/* Construction Projects Overview List */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">Construction Projects</h3>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className="text-xs font-bold text-[#1554c8] hover:underline"
                  >
                    View All →
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {projects.map((proj) => (
                    <div key={proj.id} className="py-3 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={proj.imageUrl || '/hero-house-clean.png'}
                          alt={proj.name}
                          className="h-10 w-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">{proj.name}</h4>
                          <p className="text-[11px] text-slate-500">{proj.location} · {proj.stage}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="w-36 sm:w-44">
                          <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                            <span>Progress</span>
                            <span>{proj.progress}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-blue-600"
                              style={{ width: `${proj.progress}%` }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedProjectForDetail(proj)}
                          className="text-slate-400 hover:text-slate-800 text-sm font-bold px-2 py-1"
                          title="Project Details"
                        >
                          •••
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 2: MY PROJECTS                                    */}
          {/* ======================================================== */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Project Management</h2>
                  <p className="text-xs text-slate-500">Create, track and manage your construction projects.</p>
                </div>
                <button
                  onClick={() => setShowNewProjModal(true)}
                  className="rounded-xl bg-[#ff7900] hover:bg-[#e66d00] px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  + Add Project
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 text-xs">
                {(['all', 'in_progress', 'foundation', 'finishing', 'completed'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setProjectFilter(f)}
                    className={`rounded-xl px-3 py-1.5 font-bold transition ${
                      projectFilter === f
                        ? 'bg-[#1554c8] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {f === 'all' && `All Projects (${projects.length})`}
                    {f === 'in_progress' && `In Progress (${projects.filter((p) => p.status === 'In Progress').length})`}
                    {f === 'foundation' && `Foundation (${projects.filter((p) => p.status === 'Foundation').length})`}
                    {f === 'finishing' && `Finishing (${projects.filter((p) => p.status === 'Finishing').length})`}
                    {f === 'completed' && `Completed (${projects.filter((p) => p.status === 'Completed').length})`}
                  </button>
                ))}
              </div>

              {/* Projects Grid */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs flex flex-col justify-between"
                  >
                    <div className="relative h-44 w-full bg-slate-100">
                      <img
                        src={p.imageUrl || '/hero-house-clean.png'}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute top-3 right-3 rounded-full bg-white/95 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-black text-slate-800 shadow-xs">
                        {p.status}
                      </span>
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{p.name}</h3>
                        <p className="text-[11px] text-slate-500">{p.location}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Client: {p.clientName}</p>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex justify-between text-[11px] font-bold text-slate-700">
                          <span>Stage: {p.stage}</span>
                          <span className="text-[#1554c8]">{p.progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#ff7900] to-[#1554c8]"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                          <span>Budget: <strong>{inr(p.budget)}</strong></span>
                          <span>Spent: <strong>{inr(p.spent)}</strong></span>
                        </div>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          onClick={() => setSelectedProjectForDetail(p)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-1.5 text-xs font-bold text-slate-700"
                        >
                          View Details & Stages
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 3: FIND & HIRE WORKERS                             */}
          {/* ======================================================== */}
          {activeTab === 'hire_workers' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Find & Hire Skilled Workers</h2>
                  <p className="text-xs text-slate-500">
                    Source verified masons, electricians, plumbers, carpenters, and labourers for your construction sites.
                  </p>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold">
                <div>
                  <label className="block text-slate-500 mb-1">Search by Name or Craft</label>
                  <input
                    className="inp text-xs"
                    placeholder="Search by Name or Craft (e.g. Ramesh, Mason)..."
                    value={hireSearchQuery}
                    onChange={(e) => setHireSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Filter by Skill / Craft</label>
                  <select
                    className="inp text-xs"
                    value={hireSkillFilter}
                    onChange={(e) => setHireSkillFilter(e.target.value)}
                  >
                    <option value="All">All Crafts ({SEED_WORKERS.length})</option>
                    <option value="Mason">Mason</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Labourer">Labourer</option>
                    <option value="Painter">Painter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Location / City</label>
                  <select
                    className="inp text-xs"
                    value={hireCityFilter}
                    onChange={(e) => setHireCityFilter(e.target.value)}
                  >
                    <option value="All">All Cities</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Vijayawada">Vijayawada</option>
                    <option value="Guntur">Guntur</option>
                    <option value="Warangal">Warangal</option>
                  </select>
                </div>
              </div>

              {/* Workers Available Grid */}
              <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                {hireableWorkers.map((w) => {
                  const isAssigned = assignedWorkers.some((a) => a.workerId === w.id)
                  return (
                    <div
                      key={w.id}
                      className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-black text-slate-900">{w.name}</h3>
                            <p className="text-xs text-slate-500">{w.skill} · {w.city}</p>
                          </div>
                          {w.avail ? (
                            <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                              Available
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-semibold">
                              Busy
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                          <Stars value={w.rating} />
                          <span>{w.exp} yrs experience</span>
                        </div>

                        <div className="mt-2 text-sm">
                          <span className="font-black text-slate-900">{inr(w.wage)}</span>
                          <span className="text-slate-500 text-xs"> / daily wage</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        {isAssigned ? (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-emerald-700 font-bold">✓ Already on your site</span>
                            <button
                              onClick={() => {
                                setSelectedWorkerToHire(w)
                              }}
                              className="text-xs text-blue-600 hover:underline font-bold"
                            >
                              Reassign
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedWorkerToHire(w)}
                            className="w-full rounded-xl bg-[#1554c8] hover:bg-blue-700 text-white py-1.5 text-xs font-bold shadow-xs transition"
                          >
                            + Hire / Assign to Project
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 4: WORKFORCE MANAGEMENT                            */}
          {/* ======================================================== */}
          {activeTab === 'workforce' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Workforce Management</h2>
                  <p className="text-xs text-slate-500">
                    Assign, monitor and manage skilled trades across your active construction sites.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAssignWorkerModal(true)}
                    className="rounded-xl bg-[#ff7900] hover:bg-[#e66d00] px-4 py-2 text-xs font-bold text-white shadow-xs"
                  >
                    + Assign Worker
                  </button>
                  <button
                    onClick={() => setActiveTab('hire_workers')}
                    className="rounded-xl bg-blue-50 border border-blue-200 text-blue-700 px-3.5 py-2 text-xs font-bold hover:bg-blue-100"
                  >
                    Find More Workers →
                  </button>
                </div>
              </div>

              {/* Workforce Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <span className="text-slate-400 block font-bold">Assigned Fleet</span>
                  <span className="text-xl font-black text-slate-900">{assignedWorkers.length} Workers</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <span className="text-slate-400 block font-bold">On Site Today</span>
                  <span className="text-xl font-black text-emerald-600">
                    {assignedWorkers.filter((w) => w.status === 'On Site').length} Active
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <span className="text-slate-400 block font-bold">Daily Wage Commitment</span>
                  <span className="text-xl font-black text-slate-900">
                    {inr(assignedWorkers.reduce((sum, w) => sum + w.dailyWage, 0))}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <span className="text-slate-400 block font-bold">Replacement Alerts</span>
                  <span className="text-xl font-black text-red-600">{activeAlerts.length} Pending</span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="font-bold text-slate-700">Project:</label>
                  <select
                    className="inp py-1 text-xs"
                    value={workforceProjectFilter}
                    onChange={(e) => setWorkforceProjectFilter(e.target.value)}
                  >
                    <option value="all">All Projects</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <label className="font-bold text-slate-700 ml-2">Skill:</label>
                  <select
                    className="inp py-1 text-xs"
                    value={workforceSkillFilter}
                    onChange={(e) => setWorkforceSkillFilter(e.target.value)}
                  >
                    <option value="All">All Skills</option>
                    <option value="Mason">Mason</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Labourer">Labourer</option>
                  </select>
                </div>

                <span className="text-slate-400 font-medium">Assigned Workers by Project</span>
              </div>

              {/* Workers Table */}
              <div className="rounded-2xl border border-slate-200/90 bg-white overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Worker Name</th>
                      <th className="p-3">Trade / Skill</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Assigned Site</th>
                      <th className="p-3">Daily Wage</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAssignedWorkers.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-extrabold text-slate-900">
                          <div>{w.name}</div>
                          <div className="text-[10px] text-slate-400">{w.phone}</div>
                        </td>
                        <td className="p-3">
                          <span className="rounded-lg bg-blue-50 text-blue-700 px-2 py-0.5 font-bold">
                            {w.skill}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{w.city}</td>
                        <td className="p-3 font-semibold text-slate-800">{w.assignedProjectName}</td>
                        <td className="p-3 font-bold text-slate-900">{inr(w.dailyWage)}</td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              w.status === 'On Site'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {w.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleUnassignWorker(w.id)}
                            className="text-xs text-red-600 hover:underline font-semibold"
                          >
                            Release
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 5: DAILY TASKS & SCHEDULING (CONTRACTOR MODULE)   */}
          {/* ======================================================== */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Daily Tasks & Scheduling</h2>
                  <p className="text-xs text-slate-500">
                    Supervise site milestones, delegate work to trade crews, and monitor completion deadlines.
                  </p>
                </div>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="rounded-xl bg-[#ff7900] hover:bg-[#e66d00] px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  + Add Task
                </button>
              </div>

              {/* Task Counters & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  {(['all', 'pending', 'in_progress', 'completed'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setTaskFilter(st)}
                      className={`rounded-xl px-3 py-1.5 font-bold transition ${
                        taskFilter === st
                          ? 'bg-[#1554c8] text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {st === 'all' && `All Tasks (${tasks.length})`}
                      {st === 'pending' && `Pending (${tasks.filter((t) => t.status === 'pending').length})`}
                      {st === 'in_progress' && `In Progress (${tasks.filter((t) => t.status === 'in_progress').length})`}
                      {st === 'completed' && `Completed (${tasks.filter((t) => t.status === 'completed').length})`}
                    </button>
                  ))}
                </div>

                <span className="text-xs text-slate-500">
                  Showing {filteredTasks.length} assigned task items
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5">
                {filteredTasks.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={t.status === 'completed'}
                        onChange={() => handleToggleTaskStatus(t.id)}
                        className="h-5 w-5 rounded text-[#1554c8] focus:ring-blue-500 cursor-pointer"
                      />
                      <div>
                        <h4 className={`text-xs sm:text-sm font-extrabold ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {t.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">{t.projectName}</span>
                          <span>•</span>
                          <span className="rounded bg-blue-50 text-blue-700 font-bold px-1.5 py-0.2">
                            {t.trade}
                          </span>
                          <span>•</span>
                          <span>Assigned to: <strong>{t.assignedTo}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500">Deadline: {t.deadline}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          t.priority === 'High'
                            ? 'bg-red-100 text-red-800'
                            : t.priority === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {t.priority}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          t.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.status === 'completed' ? 'Completed' : t.status === 'in_progress' ? 'In Progress' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 6: ATTENDANCE TRACKING (CONTRACTOR MODULE)        */}
          {/* ======================================================== */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Worker Attendance & Roll Call</h2>
                  <p className="text-xs text-slate-500">
                    Track daily morning muster, punch-in times, and settle daily wages directly.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold">
                    {presentCount} Present
                  </span>
                  <span className="rounded-lg bg-red-100 text-red-800 px-3 py-1 text-xs font-bold">
                    {absentCount} Absent
                  </span>
                  <span className="rounded-lg bg-amber-100 text-amber-800 px-3 py-1 text-xs font-bold">
                    {halfDayCount} Half Day
                  </span>
                </div>
              </div>

              {/* Wage Settlement Callout */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Today's Pending Wage Settlement</span>
                  <span className="text-xl font-black text-slate-900">{inr(pendingPayTotal)}</span>
                  <span className="text-slate-500 ml-2">Unsettled daily wages for present crew</span>
                </div>
                <button
                  onClick={() => {
                    const updated = attendance.map((a) => (a.status === 'Present' ? { ...a, paid: true } : a))
                    saveAttendance(updated)
                    setAttendance(updated)
                    toast('All present workers wages marked as settled!')
                  }}
                  className="rounded-xl bg-[#1554c8] hover:bg-blue-700 text-white px-4 py-2 font-bold shadow-xs"
                >
                  Settle All Present Wages
                </button>
              </div>

              {/* Attendance Table */}
              <div className="rounded-2xl border border-slate-200/90 bg-white overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Worker Name</th>
                      <th className="p-3">Trade</th>
                      <th className="p-3">Assigned Site</th>
                      <th className="p-3">In-Time</th>
                      <th className="p-3">Daily Wage</th>
                      <th className="p-3">Roll Call Status</th>
                      <th className="p-3 text-right">Settlement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendance.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-extrabold text-slate-900">{rec.workerName}</td>
                        <td className="p-3 text-slate-600">{rec.skill}</td>
                        <td className="p-3 text-slate-500">{rec.site}</td>
                        <td className="p-3 text-slate-600">{rec.inTime || '—'}</td>
                        <td className="p-3 font-bold text-slate-900">{inr(rec.dailyWage)}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleToggleAttendance(rec.id, 'Present')}
                              className={`rounded px-2 py-1 font-bold text-[10px] transition ${
                                rec.status === 'Present'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleToggleAttendance(rec.id, 'Absent')}
                              className={`rounded px-2 py-1 font-bold text-[10px] transition ${
                                rec.status === 'Absent'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => handleToggleAttendance(rec.id, 'Half Day')}
                              className={`rounded px-2 py-1 font-bold text-[10px] transition ${
                                rec.status === 'Half Day'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Half Day
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          {rec.paid ? (
                            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                              Paid ✓
                            </span>
                          ) : (
                            <button
                              onClick={() => handleMarkWagePaid(rec.id)}
                              className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 text-[10px] font-bold"
                            >
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 7: PROJECT PROGRESS TRACKING (12 STAGES & PHOTOS) */}
          {/* ======================================================== */}
          {activeTab === 'progress' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Project Progress Tracking</h2>
                  <p className="text-xs text-slate-500">
                    Track the 12 construction stages, upload daily inspection photos, and monitor milestone quality.
                  </p>
                </div>
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="rounded-xl bg-[#ff7900] hover:bg-[#e66d00] px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  + Upload Site Photo
                </button>
              </div>

              {/* 12 Construction Stages Progress Section */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Construction Stages (12) — Green Villa Residence</h3>
                    <p className="text-[11px] text-slate-500">Active Stage: Brickwork (70%) · Target Milestone: Plastering</p>
                  </div>
                  <span className="text-sm font-black text-[#1554c8]">Overall: 68%</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stagesProgress.map((st, idx) => (
                    <div
                      key={st.name}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1.5"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-800">
                          {idx + 1}. {st.name}
                        </span>
                        <span className={`font-bold ${st.progress === 100 ? 'text-emerald-600' : 'text-[#1554c8]'}`}>
                          {st.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            st.progress === 100 ? 'bg-emerald-500' : 'bg-[#1554c8]'
                          }`}
                          style={{ width: `${st.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => {
                            const newProg = Math.min(100, st.progress + 10)
                            setStagesProgress((prev) =>
                              prev.map((s, i) => (i === idx ? { ...s, progress: newProg } : s))
                            )
                            toast(`Updated ${st.name} progress to ${newProg}%`)
                          }}
                          className="text-[10px] text-blue-600 hover:underline font-bold"
                        >
                          +10% Progress
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Site Photos & Quality Inspection Gallery */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900">Daily Site Photos & Quality Inspection</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {photos.map((p) => (
                    <div key={p.id} className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                      <img src={p.url} alt={p.caption} className="h-44 w-full object-cover" />
                      <div className="p-3 text-xs space-y-1 bg-white">
                        <div className="font-bold text-slate-900">{p.caption}</div>
                        <div className="text-slate-400 text-[11px]">{p.site} · {p.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 8: BUDGET & EXPENSES                              */}
          {/* ======================================================== */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Construction Expense Management</h2>
                  <p className="text-xs text-slate-500">Track material procurement, labour payments and equipment rentals.</p>
                </div>
                <button
                  onClick={() => setShowRecordExpenseModal(true)}
                  className="rounded-xl bg-[#ff7900] hover:bg-[#e66d00] px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  + Record Expense
                </button>
              </div>

              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Material Expenses</div>
                  <div className="mt-1 text-2xl font-black text-slate-900">{inr(totalMaterialExpenses)}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Cement, steel, aggregates, bricks</p>
                </div>
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Labour Wages</div>
                  <div className="mt-1 text-2xl font-black text-slate-900">{inr(totalLabourWages)}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Direct wages, masons, shuttering</p>
                </div>
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Equipment</div>
                  <div className="mt-1 text-2xl font-black text-slate-900">{inr(totalEquipmentExpenses)}</div>
                  <p className="text-[11px] text-slate-400 mt-1">JCB, mixer, vibrators, scaffolding</p>
                </div>
              </div>

              {/* Recent Expenses Table */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">Recent Expenses</h3>
                  <span className="text-xs text-slate-400">{expenses.length} Records</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold uppercase text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Project</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-600">{exp.date}</td>
                          <td className="p-3">
                            <span className="rounded-lg bg-slate-100 text-slate-700 font-bold px-2 py-0.5 text-[10px]">
                              {exp.category}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-800">{exp.description}</td>
                          <td className="p-3 text-slate-500">{exp.project}</td>
                          <td className="p-3 text-right font-black text-slate-900">{inr(exp.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 8 SUB-MODULE: CLIENT QUOTATIONS & ESTIMATES       */}
          {/* ======================================================== */}
          {activeTab === 'quotations' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Client Quotations & Estimates</h2>
                  <p className="text-xs text-slate-500">Create, send and manage formal price estimates.</p>
                </div>
                <button
                  onClick={() => setShowNewQuoteModal(true)}
                  className="rounded-xl bg-[#ff7900] hover:bg-[#e66d00] px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  + Create Quotation
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-2 text-xs">
                {(['all', 'Approved', 'Sent'] as const).map((qf) => (
                  <button
                    key={qf}
                    onClick={() => setQuoteFilter(qf)}
                    className={`rounded-xl px-3 py-1.5 font-bold transition ${
                      quoteFilter === qf
                        ? 'bg-[#1554c8] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {qf === 'all' && `All (${quotes.length})`}
                    {qf === 'Approved' && `Approved (${quotes.filter((q) => q.status === 'Approved').length})`}
                    {qf === 'Sent' && `Sent (${quotes.filter((q) => q.status === 'Sent').length})`}
                  </button>
                ))}
              </div>

              {/* Quotations List */}
              <div className="space-y-3">
                {filteredQuotes.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">{q.projectName}</h4>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            q.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Client: {q.clientName} · Valid Until: {q.validUntil}
                      </p>
                      <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-slate-600">
                        <span>Material: <strong>{inr(q.materialCost)}</strong></span>
                        <span>Labour: <strong>{inr(q.labourCost)}</strong></span>
                        <span>Equipment: <strong>{inr(q.equipmentCost)}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Total Estimated Cost</div>
                        <div className="text-lg font-black text-slate-900">{inr(q.totalAmount)}</div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => toast(`Downloading quotation PDF for ${q.projectName}...`)}
                          className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          Download PDF
                        </button>
                        <button
                          onClick={() => toast(`Quotation sent to client ${q.clientName} via email/SMS!`)}
                          className="rounded-xl bg-[#1554c8] hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs"
                        >
                          Send to Client
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 9: MATERIAL MANAGEMENT                            */}
          {/* ======================================================== */}
          {activeTab === 'materials' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">AI Construction Material Price Intelligence</h2>
                  <p className="text-xs text-slate-500">
                    Predict price trends, benchmark regional suppliers and get the best buying advice.
                  </p>
                </div>
                <Link
                  to="/materials"
                  className="rounded-xl bg-[#1554c8] hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-bold shadow-xs"
                >
                  Full Insights Page →
                </Link>
              </div>

              {/* 4 AI Material Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Cement */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Cement (50 kg bag)</h4>
                      <p className="text-[11px] text-slate-400">OPC 53 / PPC Grade · Hyderabad</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                      Buy in Bulk
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">₹390 / bag</span>
                    <span className="text-xs text-slate-500">7-Day Forecast: ₹395</span>
                  </div>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-xs text-emerald-800 flex items-center justify-between">
                    <span>Expected price rise due to coal tariff.</span>
                    <span className="font-extrabold">Save ~₹3,000 / 100 bags</span>
                  </div>
                </div>

                {/* 2. Steel */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Steel (Fe550D TMT / kg)</h4>
                      <p className="text-[11px] text-slate-400">Primary Mills (Tata / JSW) · Hyderabad</p>
                    </div>
                    <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[10px] font-bold">
                      Buy Normal
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">₹68 / kg</span>
                    <span className="text-xs text-slate-500">15-Day Forecast: ₹69</span>
                  </div>
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-2 text-xs text-blue-800 flex items-center justify-between">
                    <span>Steel rebar market is steady. Order as needed.</span>
                    <span className="font-extrabold">Market Stable</span>
                  </div>
                </div>

                {/* 3. Sand */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Sand (River Sand / cu.ft)</h4>
                      <p className="text-[11px] text-slate-400">Government Reach Stockyard</p>
                    </div>
                    <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[10px] font-bold">
                      Wait
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">₹58 / cu.ft</span>
                    <span className="text-xs text-slate-500">30-Day Forecast: ₹55</span>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800 flex items-center justify-between">
                    <span>New river de-siltation permits opening soon.</span>
                    <span className="font-extrabold">Prices Cooling</span>
                  </div>
                </div>

                {/* 4. Bricks */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Red Clay Bricks (per brick)</h4>
                      <p className="text-[11px] text-slate-400">Standard 9x4x3 Kiln Burnt</p>
                    </div>
                    <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[10px] font-bold">
                      Buy Normal
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">₹9.50 / brick</span>
                    <span className="text-xs text-slate-500">15-Day Forecast: ₹9.60</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-2 text-xs text-slate-700 flex items-center justify-between">
                    <span>Kiln capacity adequate for local demand.</span>
                    <span className="font-extrabold">Normal Requirements</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 10: MESSAGES & DIRECT COORDINATION                */}
          {/* ======================================================== */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Messages & Coordination</h2>
                  <p className="text-xs text-slate-500">
                    Communicate with customers, structural architects, and site foremen.
                  </p>
                </div>
              </div>

              {/* Consultation Bookings from Customers */}
              {incomingBookings.length > 0 && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider">
                      Customer Consultation & Booking Requests ({incomingBookings.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {incomingBookings.map((b) => (
                      <div
                        key={b.id}
                        className="rounded-xl border border-blue-100 bg-white p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-extrabold text-slate-900">{b.customerName}</div>
                          <div className="text-[11px] text-slate-500">{b.site} · Meeting: {b.meetingDate || b.date}</div>
                          <div className="text-[11px] text-slate-700 mt-0.5">Budget: {inr(b.budget || 2000000)} · {b.note}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {b.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleDecideBooking(b.id, 'accepted')}
                                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-xs font-bold shadow-xs"
                              >
                                Accept Consultation
                              </button>
                              <button
                                onClick={() => handleDecideBooking(b.id, 'rejected')}
                                className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1 text-xs font-semibold"
                              >
                                Decline
                              </button>
                            </>
                          ) : (
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                b.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {b.status === 'accepted' ? 'Accepted' : 'Declined'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Interface */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[420px]">
                {/* Thread List */}
                <div className="border-r border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="text-[11px] font-bold uppercase text-slate-400 px-2 py-1">Conversations</div>
                  <button
                    onClick={() => setActiveMessageThread('client')}
                    className={`w-full text-left p-2.5 rounded-xl transition text-xs ${
                      activeMessageThread === 'client' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-extrabold">Rajesh Rao</div>
                    <div className={`text-[10px] ${activeMessageThread === 'client' ? 'text-blue-100' : 'text-slate-500'}`}>
                      Client · Green Villa Residence
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveMessageThread('architect')}
                    className={`w-full text-left p-2.5 rounded-xl transition text-xs ${
                      activeMessageThread === 'architect' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-extrabold">Ar. Priya Sharma</div>
                    <div className={`text-[10px] ${activeMessageThread === 'architect' ? 'text-blue-100' : 'text-slate-500'}`}>
                      Consulting Architect · Blueprints
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveMessageThread('foreman')}
                    className={`w-full text-left p-2.5 rounded-xl transition text-xs ${
                      activeMessageThread === 'foreman' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-extrabold">Suresh P</div>
                    <div className={`text-[10px] ${activeMessageThread === 'foreman' ? 'text-blue-100' : 'text-slate-500'}`}>
                      Site Foreman · Mason Lead
                    </div>
                  </button>
                </div>

                {/* Chat Messages Log */}
                <div className="md:col-span-2 flex flex-col justify-between p-4 space-y-3">
                  <div className="space-y-3 overflow-y-auto max-h-[320px] p-2">
                    {(messagesLog[activeMessageThread] || []).map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.isSelf ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-3 text-xs shadow-xs ${
                            m.isSelf
                              ? 'bg-[#1554c8] text-white rounded-tr-none'
                              : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                          }`}
                        >
                          <div className={`font-bold text-[10px] ${m.isSelf ? 'text-blue-200' : 'text-slate-500'}`}>
                            {m.sender} ({m.role}) · {m.timestamp}
                          </div>
                          <div className="mt-1">{m.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-100">
                    <input
                      className="inp text-xs flex-1"
                      placeholder={`Type message to ${activeMessageThread}...`}
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-[#1554c8] hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-xs"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODULE 11: COMPANY PROFILE                               */}
          {/* ======================================================== */}
          {activeTab === 'profile' && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
              <div>
                <h2 className="text-lg font-black text-slate-900">Builder Profile & Company Credentials</h2>
                <p className="text-xs text-slate-500">Manage your construction company profile and contact details.</p>
              </div>

              <form onSubmit={handleUpdateBuilderProfile} className="space-y-4 text-xs font-semibold">
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    Contact / Representative Name
                    <input
                      className="inp mt-1 text-xs"
                      value={profName}
                      onChange={(e) => setProfName(e.target.value)}
                      required
                    />
                  </label>

                  <label className="block">
                    Company Name
                    <input
                      className="inp mt-1 text-xs"
                      value={profCompany}
                      onChange={(e) => setProfCompany(e.target.value)}
                      required
                    />
                  </label>

                  <label className="block">
                    Location / City
                    <input
                      className="inp mt-1 text-xs"
                      value={profCity}
                      onChange={(e) => setProfCity(e.target.value)}
                      required
                    />
                  </label>

                  <label className="block">
                    Phone / Mobile
                    <input
                      className="inp mt-1 text-xs"
                      value={profPhone}
                      onChange={(e) => setProfPhone(e.target.value)}
                      required
                    />
                  </label>

                  <label className="block">
                    Years of Industry Experience
                    <input
                      type="number"
                      className="inp mt-1 text-xs"
                      value={profExp}
                      onChange={(e) => setProfExp(Number(e.target.value))}
                    />
                  </label>

                  <label className="block">
                    Trade Specialization / Contracting Scope
                    <input
                      className="inp mt-1 text-xs"
                      value={profSpec}
                      onChange={(e) => setProfSpec(e.target.value)}
                    />
                  </label>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="font-bold">Account Status: </span>
                  <span>✓ ISO 9001:2015 Verified General Contractor</span>
                </div>

                <label className="block">
                  Company Overview & Portfolio Description
                  <textarea
                    rows={4}
                    className="inp mt-1 text-xs"
                    value={profBio}
                    onChange={(e) => setProfBio(e.target.value)}
                  />
                </label>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-xl bg-[#ff7900] hover:bg-[#e66d00] active:scale-[0.99] px-6 py-2.5 text-xs font-bold text-white shadow-xs"
                  >
                    {savingProfile ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* MODALS SECTION                                           */}
      {/* ======================================================== */}

      {/* Modal 1: Add New Project */}
      {showNewProjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl bg-white w-full max-w-md p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Create Construction Project</h3>
              <button
                onClick={() => setShowNewProjModal(false)}
                className="text-slate-400 hover:text-slate-800 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-3 text-xs font-semibold">
              <label className="block">
                Project Name
                <input
                  required
                  className="inp mt-1 text-xs"
                  placeholder="e.g. Hyderabad Luxury Villa"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                />
              </label>
              <label className="block">
                Location / Address
                <input
                  required
                  className="inp mt-1 text-xs"
                  placeholder="e.g. Jubilee Hills, Hyderabad"
                  value={newProjLocation}
                  onChange={(e) => setNewProjLocation(e.target.value)}
                />
              </label>
              <label className="block">
                Client Name
                <input
                  className="inp mt-1 text-xs"
                  placeholder="e.g. K. V. Sharma (Homeowner)"
                  value={newProjClient}
                  onChange={(e) => setNewProjClient(e.target.value)}
                />
              </label>
              <label className="block">
                Estimated Budget (₹)
                <input
                  type="number"
                  required
                  className="inp mt-1 text-xs"
                  value={newProjBudget}
                  onChange={(e) => setNewProjBudget(e.target.value)}
                />
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#ff7900] hover:bg-[#e66d00] py-2 text-xs font-bold text-white shadow-xs"
                >
                  Create Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewProjModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Quotation */}
      {showNewQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl bg-white w-full max-w-md p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Create New Quotation</h3>
              <button
                onClick={() => setShowNewQuoteModal(false)}
                className="text-slate-400 hover:text-slate-800 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateQuote} className="space-y-3 text-xs font-semibold">
              <label className="block">
                Client Name
                <input
                  required
                  className="inp mt-1 text-xs"
                  placeholder="e.g. S. Srinivas"
                  value={quoteClient}
                  onChange={(e) => setQuoteClient(e.target.value)}
                />
              </label>
              <label className="block">
                Project Name
                <input
                  required
                  className="inp mt-1 text-xs"
                  placeholder="e.g. 2BHK Renovation"
                  value={quoteProj}
                  onChange={(e) => setQuoteProj(e.target.value)}
                />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  Material (₹)
                  <input
                    type="number"
                    className="inp mt-1 text-xs"
                    value={quoteMaterial}
                    onChange={(e) => setQuoteMaterial(e.target.value)}
                  />
                </label>
                <label className="block">
                  Labour (₹)
                  <input
                    type="number"
                    className="inp mt-1 text-xs"
                    value={quoteLabour}
                    onChange={(e) => setQuoteLabour(e.target.value)}
                  />
                </label>
                <label className="block">
                  Equipment (₹)
                  <input
                    type="number"
                    className="inp mt-1 text-xs"
                    value={quoteEquipment}
                    onChange={(e) => setQuoteEquipment(e.target.value)}
                  />
                </label>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">Total Estimate:</span>
                <span className="text-base font-black text-slate-900">
                  {inr(
                    (Number(quoteMaterial) || 0) +
                      (Number(quoteLabour) || 0) +
                      (Number(quoteEquipment) || 0)
                  )}
                </span>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#1554c8] hover:bg-blue-700 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Generate & Send
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewQuoteModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Record Expense */}
      {showRecordExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl bg-white w-full max-w-md p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Record Site Expense</h3>
              <button
                onClick={() => setShowRecordExpenseModal(false)}
                className="text-slate-400 hover:text-slate-800 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleRecordExpense} className="space-y-3 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  Date
                  <input
                    required
                    className="inp mt-1 text-xs"
                    value={newExpenseDate}
                    onChange={(e) => setNewExpenseDate(e.target.value)}
                  />
                </label>
                <label className="block">
                  Category
                  <select
                    className="inp mt-1 text-xs"
                    value={newExpenseCategory}
                    onChange={(e: any) => setNewExpenseCategory(e.target.value)}
                  >
                    <option value="Material">Material</option>
                    <option value="Labour">Labour</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
              </div>
              <label className="block">
                Description
                <input
                  required
                  className="inp mt-1 text-xs"
                  placeholder="e.g. 500 Bags of Ultratech Cement"
                  value={newExpenseDesc}
                  onChange={(e) => setNewExpenseDesc(e.target.value)}
                />
              </label>
              <label className="block">
                Project Site
                <select
                  className="inp mt-1 text-xs"
                  value={newExpenseProject}
                  onChange={(e) => setNewExpenseProject(e.target.value)}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                Amount (₹)
                <input
                  type="number"
                  required
                  className="inp mt-1 text-xs"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                />
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#ff7900] hover:bg-[#e66d00] py-2 text-xs font-bold text-white shadow-xs"
                >
                  Save Expense
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecordExpenseModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Assign Worker to Project */}
      {showAssignWorkerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl bg-white w-full max-w-md p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Assign Worker to Project</h3>
              <button
                onClick={() => setShowAssignWorkerModal(false)}
                className="text-slate-400 hover:text-slate-800 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAssignWorkerSubmit} className="space-y-3 text-xs font-semibold">
              <label className="block">
                Select Worker
                <select
                  className="inp mt-1 text-xs"
                  value={workerToAssignId}
                  onChange={(e) => setWorkerToAssignId(e.target.value)}
                >
                  {SEED_WORKERS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} — {w.skill} ({w.city}) · {inr(w.wage)}/day
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                Target Project Site
                <select
                  className="inp mt-1 text-xs"
                  value={projectToAssignId}
                  onChange={(e) => setProjectToAssignId(e.target.value)}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.location})
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#ff7900] hover:bg-[#e66d00] py-2 text-xs font-bold text-white shadow-xs"
                >
                  Assign to Site
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignWorkerModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Hire Worker Direct Assignment Modal */}
      {selectedWorkerToHire && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl bg-white w-full max-w-md p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Hire Worker: {selectedWorkerToHire.name}</h3>
                <p className="text-[11px] text-slate-500">{selectedWorkerToHire.skill} · {selectedWorkerToHire.city}</p>
              </div>
              <button
                onClick={() => setSelectedWorkerToHire(null)}
                className="text-slate-400 hover:text-slate-800 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs font-semibold">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span>Daily Wage:</span>
                <span className="font-extrabold text-slate-900">{inr(selectedWorkerToHire.wage)} / day</span>
              </div>
              <label className="block">
                Assign to Construction Project:
                <select
                  className="inp mt-1 text-xs"
                  value={hireTargetProjectId}
                  onChange={(e) => setHireTargetProjectId(e.target.value)}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.location})
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleConfirmHireWorker}
                  className="flex-1 rounded-xl bg-[#1554c8] hover:bg-blue-700 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Confirm Hiring & Assign
                </button>
                <button
                  onClick={() => setSelectedWorkerToHire(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Assign Daily Task */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl bg-white w-full max-w-md p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Assign Construction Task</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-800 text-lg leading-none">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-3 text-xs font-semibold">
              <label className="block">
                Project Site
                <select
                  className="inp mt-1 text-xs"
                  value={taskTargetProjectId}
                  onChange={(e) => setTaskTargetProjectId(e.target.value)}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                Task Description
                <input
                  required
                  className="inp mt-1 text-xs"
                  placeholder="e.g. Shuttering and rebar binding for 1st floor beam"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  Trade Craft
                  <select
                    className="inp mt-1 text-xs"
                    value={taskTrade}
                    onChange={(e) => setTaskTrade(e.target.value as Skill)}
                  >
                    <option value="Mason">Mason</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Labourer">Labourer</option>
                  </select>
                </label>
                <label className="block">
                  Assign To
                  <select
                    className="inp mt-1 text-xs"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                  >
                    {assignedWorkers.map((w) => (
                      <option key={w.id} value={w.name}>{w.name} ({w.skill})</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  Priority
                  <select
                    className="inp mt-1 text-xs"
                    value={taskPriority}
                    onChange={(e: any) => setTaskPriority(e.target.value)}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </label>
                <label className="block">
                  Deadline
                  <input
                    className="inp mt-1 text-xs"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                  />
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#ff7900] hover:bg-[#e66d00] py-2 text-xs font-bold text-white shadow-xs"
                >
                  Assign Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 7: Upload Site Photo */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl bg-white w-full max-w-md p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Upload Site Inspection Photo</h3>
              <button onClick={() => setShowPhotoModal(false)} className="text-slate-400 hover:text-slate-800 text-lg leading-none">
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!newPhotoCaption.trim()) return
                const newP = {
                  id: 'p-' + Date.now(),
                  url: newPhotoUrl.trim() || 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=800&q=80',
                  caption: newPhotoCaption.trim(),
                  date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  site: 'Green Villa Site',
                }
                setPhotos([newP, ...photos])
                setShowPhotoModal(false)
                setNewPhotoCaption('')
                setNewPhotoUrl('')
                toast('Inspection photo uploaded successfully!')
              }}
              className="space-y-3 text-xs font-semibold"
            >
              <label className="block">
                Inspection Caption / Milestone
                <input
                  required
                  className="inp mt-1 text-xs"
                  placeholder="e.g. First floor slab reinforcement inspection passed"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                />
              </label>
              <label className="block">
                Image URL (optional)
                <input
                  className="inp mt-1 text-xs"
                  placeholder="Paste image URL or leave empty for site camera default"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                />
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#ff7900] hover:bg-[#e66d00] py-2 text-xs font-bold text-white shadow-xs"
                >
                  Upload Photo
                </button>
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 8: Project Details & Milestones */}
      {selectedProjectForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl bg-white w-full max-w-lg p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">{selectedProjectForDetail.name}</h3>
                <p className="text-[11px] text-slate-500">
                  {selectedProjectForDetail.location} · Client: {selectedProjectForDetail.clientName}
                </p>
              </div>
              <button
                onClick={() => setSelectedProjectForDetail(null)}
                className="text-slate-400 hover:text-slate-800 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Financial Progress */}
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Expenses vs Budget:</span>
                  <span className="text-slate-900">
                    {inr(selectedProjectForDetail.spent)} / {inr(selectedProjectForDetail.budget)}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-blue-600"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((selectedProjectForDetail.spent / selectedProjectForDetail.budget) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Progress Slider */}
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Completion Milestone:</span>
                  <span className="text-blue-700">{selectedProjectForDetail.progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedProjectForDetail.progress}
                  onChange={(e) => {
                    const newProg = Number(e.target.value)
                    const updated = { ...selectedProjectForDetail, progress: newProg }
                    setSelectedProjectForDetail(updated)
                    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                  }}
                  className="w-full cursor-pointer accent-[#ff7900]"
                />
              </div>

              {/* Stage Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Construction Stage:</label>
                <select
                  className="inp text-xs font-semibold"
                  value={selectedProjectForDetail.status}
                  onChange={(e: any) => {
                    const updated = { ...selectedProjectForDetail, status: e.target.value }
                    setSelectedProjectForDetail(updated)
                    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                  }}
                >
                  <option value="Foundation">Foundation</option>
                  <option value="In Progress">In Progress (Brickwork & Structure)</option>
                  <option value="Finishing">Finishing (Plastering & Electrical)</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-slate-500">
                <span>Target Deadline: <strong>{selectedProjectForDetail.deadline}</strong></span>
                <span>Workers on Site: <strong>{selectedProjectForDetail.workersCount}</strong></span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  toast(`Project updates saved for ${selectedProjectForDetail.name}!`)
                  setSelectedProjectForDetail(null)
                }}
                className="rounded-xl bg-[#1554C8] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs"
              >
                Close & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
