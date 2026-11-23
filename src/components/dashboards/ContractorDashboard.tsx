import { useEffect, useState, type FormEvent } from 'react'
import { inr, Pill } from '../ui'
import { SEED_WORKERS } from '../../data/seed'
import {
  getStoredAttendance,
  saveAttendance,
  getStoredTasks,
  saveTasks,
  getStoredAlerts,
  saveAlerts,
  type AttendanceRecord,
  type ContractorTask,
  type EmergencyAlert,
} from '../../data/multiRoleData'
import type { UserProfile, Skill } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useI18n } from '../../lib/i18n'

interface ContractorDashboardProps {
  user: UserProfile
}

type ContractorTab =
  | 'projects'
  | 'activities'
  | 'attendance'
  | 'tasks'
  | 'absences'
  | 'payments'
  | 'photos'
  | 'messages'
  | 'profile'

export default function ContractorDashboard({ user }: ContractorDashboardProps) {
  const { t } = useI18n()
  const { updateProfile } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<ContractorTab>('projects')
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [tasks, setTasks] = useState<ContractorTask[]>([])
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([])

  // Profile fields state
  const [profName, setProfName] = useState(user.name)
  const [profSpec, setProfSpec] = useState(user.specialization || 'Civil & Structural Sub-Contractor')
  const [profCity, setProfCity] = useState(user.city || 'Hyderabad')
  const [profPhone, setProfPhone] = useState(user.phone || '+91 98480 11223')
  const [profExp, setProfExp] = useState(user.experienceYears || 12)
  const [profBio, setProfBio] = useState(user.bio || 'Managing skilled labour fleets across residential and commercial construction in Hyderabad.')
  const [savingProfile, setSavingProfile] = useState(false)

  const handleUpdateContractorProfile = async (e: FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await updateProfile({
        name: profName.trim(),
        specialization: profSpec.trim(),
        city: profCity.trim(),
        phone: profPhone.trim(),
        experienceYears: Number(profExp) || 0,
        bio: profBio.trim(),
      })
      toast('Contractor profile updated successfully!')
    } catch (err: any) {
      toast(err?.message || 'Failed to update profile', 'err')
    } finally {
      setSavingProfile(false)
    }
  }

  // Modal / form states
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskTrade, setTaskTrade] = useState<Skill>('Mason')
  const [taskAssignee, setTaskAssignee] = useState('Suresh P')
  const [taskPriority, setTaskPriority] = useState<'High' | 'Medium' | 'Low'>('High')

  // Photo uploads
  const [photos, setPhotos] = useState<{ id: string; url: string; caption: string; date: string }[]>([
    {
      id: 'p1',
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=800&q=80',
      caption: 'Pillars casting & reinforcement check passed',
      date: 'Today, 10:45 AM',
    },
    {
      id: 'p2',
      url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
      caption: 'AAC block brickwork 1st floor North-East elevation',
      date: 'Yesterday, 03:20 PM',
    },
  ])
  const [newCaption, setNewCaption] = useState('')

  // Sync real-time attendance and task data
  useEffect(() => {
    const sync = () => {
      setAttendance(getStoredAttendance())
      setTasks(getStoredTasks())
      setAlerts(getStoredAlerts())
    }
    sync()
    window.addEventListener('bc-attendance-change', sync)
    window.addEventListener('bc-tasks-change', sync)
    window.addEventListener('bc-emergency-alert', sync)
    return () => {
      window.removeEventListener('bc-attendance-change', sync)
      window.removeEventListener('bc-tasks-change', sync)
      window.removeEventListener('bc-emergency-alert', sync)
    }
  }, [])

  // Toggle Attendance Status
  const handleToggleAttendance = (id: string, newStatus: AttendanceRecord['status']) => {
    const updated = attendance.map((a) => {
      if (a.id === id) {
        // If changing to Absent, also trigger Emergency Alert if not already present
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
        }
        return { ...a, status: newStatus }
      }
      return a
    })
    saveAttendance(updated)
    setAttendance(updated)
  }

  // Mark Wage Paid
  const handleMarkWagePaid = (id: string) => {
    const updated = attendance.map((a) => (a.id === id ? { ...a, paid: true } : a))
    saveAttendance(updated)
    setAttendance(updated)
  }

  // Task creation
  const handleCreateTask = (e: FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return
    const t: ContractorTask = {
      id: 'tsk-' + Date.now(),
      projectId: 'demo-proj-1',
      projectName: 'Green Villa Construction',
      title: taskTitle.trim(),
      trade: taskTrade,
      assignedTo: taskAssignee,
      deadline: 'Tomorrow, 5:00 PM',
      status: 'pending',
      priority: taskPriority,
    }
    const next = [t, ...tasks]
    saveTasks(next)
    setTasks(next)
    setShowTaskModal(false)
    setTaskTitle('')
  }

  // Toggle Task Completion
  const handleToggleTaskStatus = (id: string) => {
    const next = tasks.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          status: (t.status === 'completed' ? 'in_progress' : 'completed') as ContractorTask['status'],
        }
      }
      return t
    })
    saveTasks(next)
    setTasks(next)
  }

  // Request Replacement Worker for an Absent Worker
  const handleRequestReplacement = (workerName: string, skill: Skill, site: string) => {
    const newAlert: EmergencyAlert = {
      id: 'alt-' + Date.now(),
      workerId: 'w-rep-' + Date.now(),
      workerName,
      skill,
      site,
      date: new Date().toISOString().slice(0, 10),
      reason: 'Contractor requested urgent on-site replacement',
      status: 'active',
      reportedAt: 'Just now',
    }
    const nextAlerts = [newAlert, ...alerts]
    saveAlerts(nextAlerts)
    setAlerts(nextAlerts)
    alert(`Emergency replacement request broadcasted to primary builder for ${workerName} (${skill})!`)
  }

  const presentCount = attendance.filter((a) => a.status === 'Present').length
  const absentCount = attendance.filter((a) => a.status === 'Absent').length
  const pendingPayTotal = attendance.filter((a) => !a.paid && a.status === 'Present').reduce((s, a) => s + a.dailyWage, 0)

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-slate-50 to-white border border-blue-200/80 text-slate-900 shadow-sm dark:bg-gradient-to-r dark:from-navy dark:via-navy-700 dark:to-blue-900 dark:border-transparent dark:text-white p-6 transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
              {t('Contractor Operations Console')}
            </span>
            <span className="text-xs text-slate-500 dark:text-blue-200">{t('Site Supervision & Labour Fleet')}</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {t('Welcome back,')} <span>{user.name}</span>!
          </h1>
          <p className="text-sm text-slate-600 dark:text-blue-100">
            {t('You are logged in as a')} <span className="font-semibold text-slate-900 dark:text-white">{t(user.role)}</span> · {user.specialization || 'Civil & Structural Sub-Contractor'} · {user.city} · {user.phone}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTaskModal(true)}
            className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-orange-600"
          >
            {t('+ Assign Task')}
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className="rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:border-white/20 px-4 py-2.5 text-sm font-bold transition"
          >
            {t('Daily Attendance')} ({presentCount}/{attendance.length})
          </button>
        </div>
      </div>

      {/* Main Layout: Sidebar Navigation + Content */}
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <aside className="space-y-1">
          <nav className="card p-2 shadow-sm space-y-1">
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                activeTab === 'projects' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>📋 Assigned Projects</span>
              <span className="rounded-full bg-slate-200/60 px-2 py-0.5 text-xs font-bold text-slate-800">2</span>
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                activeTab === 'activities' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>🔨 Construction Activities</span>
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                activeTab === 'attendance' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>👥 Worker Attendance</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {presentCount} Present
              </span>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                activeTab === 'tasks' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>📌 Task Delegation</span>
              <span className="rounded-full bg-slate-200/60 px-2 py-0.5 text-xs font-bold text-slate-800">
                {tasks.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('absences')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                activeTab === 'absences' ? 'bg-red-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>⚠️ Absence & Replacements</span>
              {absentCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-extrabold text-red-700">
                  {absentCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                activeTab === 'payments' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>💵 Labour Payment Ledger</span>
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                activeTab === 'photos' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>📷 Site Photos & Inspection</span>
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                activeTab === 'messages' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>💬 Builder Coordination</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>👤 Contractor Profile</span>
            </button>
          </nav>

          <div className="card p-4 text-xs space-y-2 border border-slate-100">
            <div className="font-bold uppercase tracking-wider text-slate-400">Today's Wage Pool</div>
            <div className="text-xl font-extrabold text-slate-900">{inr(pendingPayTotal)}</div>
            <div className="text-slate-500">Unsettled daily wages for present crew</div>
          </div>
        </aside>

        <main className="space-y-6">
          {/* TAB 1: ASSIGNED PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="card p-5 border-l-4 border-l-blue-600 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">Green Villa Premium Residence</h3>
                      <p className="text-xs text-slate-500">Jubilee Hills Rd #36 · Primary Builder: BuildCraft Infra</p>
                    </div>
                    <Pill tone="blue">Contract: ₹18.5L</Pill>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Sub-Contract Scope: Structural & Masonry</span>
                      <span>68%</span>
                    </div>
                    <div className="bar"><i style={{ width: '68%' }} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block">Crew On Site</span>
                      <span className="font-bold text-slate-800">12 Workers</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Deadline</span>
                      <span className="font-bold text-slate-800">15 Dec 2026</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Status</span>
                      <span className="font-bold text-emerald-600">On Track</span>
                    </div>
                  </div>
                </div>

                <div className="card p-5 border-l-4 border-l-orange-500 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">Madhapur Commercial Hub</h3>
                      <p className="text-xs text-slate-500">HITEC City · Primary Builder: Sri Sai Constructions</p>
                    </div>
                    <Pill tone="amber">Contract: ₹32L</Pill>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Sub-Contract Scope: Plumbing & Conduits</span>
                      <span>85%</span>
                    </div>
                    <div className="bar"><i style={{ width: '85%' }} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block">Crew On Site</span>
                      <span className="font-bold text-slate-800">6 Workers</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Deadline</span>
                      <span className="font-bold text-slate-800">30 Nov 2026</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Status</span>
                      <span className="font-bold text-blue-600">Finishing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONSTRUCTION ACTIVITIES */}
          {activeTab === 'activities' && (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">Site Construction Activities Schedule</h2>
              <div className="grid gap-3">
                <div className="card p-4 flex items-center justify-between border border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 text-lg">🧱</span>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">First Floor Column Concrete Pouring</h4>
                      <p className="text-xs text-slate-500">M25 mix · Vibrator compaction · 6 Masons + 8 Labourers</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    In Progress Today
                  </span>
                </div>

                <div className="card p-4 flex items-center justify-between border border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700 text-lg">🔧</span>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Underground Drainage Manhole Connections</h4>
                      <p className="text-xs text-slate-500">4-inch PVC pipes · Slope verification · 2 Plumbers</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                    Quality Inspected
                  </span>
                </div>

                <div className="card p-4 flex items-center justify-between border border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 text-lg">⚡</span>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Ceiling Slab Conduit Loop Laying</h4>
                      <p className="text-xs text-slate-500">Heavy-duty 25mm conduits · Fan box anchors · 2 Electricians</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    Scheduled Tomorrow
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WORKER ATTENDANCE TRACKING */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Worker Attendance & Roll Call</h2>
                  <p className="text-sm text-slate-500">Track daily punch-in, absences, and settle daily wages.</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="rounded-lg bg-emerald-100 px-2.5 py-1 font-bold text-emerald-800">
                    {presentCount} Present
                  </span>
                  <span className="rounded-lg bg-red-100 px-2.5 py-1 font-bold text-red-800">
                    {absentCount} Absent
                  </span>
                </div>
              </div>

              <div className="card overflow-x-auto border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Worker Name</th>
                      <th className="p-3">Trade</th>
                      <th className="p-3">Assigned Site</th>
                      <th className="p-3">In-Time</th>
                      <th className="p-3">Wage</th>
                      <th className="p-3">Attendance Status</th>
                      <th className="p-3">Payment</th>
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
                              className={`rounded px-2 py-1 font-bold ${
                                rec.status === 'Present' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleToggleAttendance(rec.id, 'Absent')}
                              className={`rounded px-2 py-1 font-bold ${
                                rec.status === 'Absent' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => handleToggleAttendance(rec.id, 'Half Day')}
                              className={`rounded px-2 py-1 font-bold ${
                                rec.status === 'Half Day' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              Half
                            </button>
                          </div>
                        </td>
                        <td className="p-3">
                          {rec.paid ? (
                            <span className="font-bold text-emerald-600">✓ Settled</span>
                          ) : (
                            <button
                              onClick={() => handleMarkWagePaid(rec.id)}
                              className="rounded bg-blue-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-blue-700"
                            >
                              Pay UPI
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

          {/* TAB 4: TASK DELEGATION */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Task Delegation & Trade Assignments</h2>
                  <p className="text-sm text-slate-500">Assign specific work packages directly to skilled tradesmen.</p>
                </div>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 shadow-sm"
                >
                  + Add Site Task
                </button>
              </div>

              <div className="grid gap-3">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className={`card p-4 flex flex-wrap items-center justify-between gap-3 border ${
                      t.status === 'completed' ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={t.status === 'completed'}
                        onChange={() => handleToggleTaskStatus(t.id)}
                        className="mt-1 h-4 w-4 rounded text-blue-600"
                      />
                      <div>
                        <h4
                          className={`font-extrabold text-sm ${
                            t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {t.title}
                        </h4>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>Trade: <strong className="text-slate-700">{t.trade}</strong></span>
                          <span>·</span>
                          <span>Assigned: <strong className="text-slate-700">{t.assignedTo}</strong></span>
                          <span>·</span>
                          <span>Due: {t.deadline}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill tone={t.priority === 'High' ? 'red' : t.priority === 'Medium' ? 'amber' : 'slate'}>
                        {t.priority} Priority
                      </Pill>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ABSENCE NOTIFICATIONS & REPLACEMENTS */}
          {activeTab === 'absences' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                <h2 className="text-xl font-extrabold text-slate-900">Worker Absence Log & Replacement Requests</h2>
              </div>
              <p className="text-sm text-slate-500">
                When a worker is absent or unable to attend, quickly broadcast a replacement request to maintain daily construction pace.
              </p>

              {attendance
                .filter((a) => a.status === 'Absent')
                .map((a) => (
                  <div key={a.id} className="card p-5 border-2 border-red-300 bg-red-50/40 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-red-900 text-base">{a.workerName}</span>
                          <Pill tone="red">ABSENT TODAY</Pill>
                        </div>
                        <p className="text-xs text-red-700 mt-1">
                          Trade: <strong>{a.skill}</strong> · Site: <strong>{a.site}</strong> · Wage Rate: {inr(a.dailyWage)}/day
                        </p>
                      </div>
                      <button
                        onClick={() => handleRequestReplacement(a.workerName, a.skill, a.site)}
                        className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600 shadow-sm"
                      >
                        ⚡ Request AI Replacement Worker
                      </button>
                    </div>
                    <div className="rounded-lg bg-white p-3 text-xs text-slate-600 border border-red-200">
                      <strong>AI Suggestion:</strong> Found 3 available {a.skill}s in {user.city} ready for same-day dispatch.
                    </div>
                  </div>
                ))}

              {attendance.filter((a) => a.status === 'Absent').length === 0 && (
                <div className="card p-8 text-center text-slate-500">
                  No worker absences recorded today. Full workforce is present on site!
                </div>
              )}
            </div>
          )}

          {/* TAB 6: LABOUR PAYMENT LEDGER */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Labour Payment & Wage Settlement</h2>
                  <p className="text-sm text-slate-500">Instant UPI payout and receipt verification for daily wages.</p>
                </div>
              </div>

              <div className="card p-4 border border-slate-200 divide-y divide-slate-100 text-xs">
                {attendance.map((rec) => (
                  <div key={rec.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">{rec.workerName}</div>
                      <div className="text-slate-500">{rec.skill} · {rec.site} · Status: {rec.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900 text-sm">{inr(rec.dailyWage)}</div>
                      {rec.paid ? (
                        <span className="text-[0.7rem] font-bold text-emerald-600">✓ Paid via UPI (Txn: 88201)</span>
                      ) : (
                        <button
                          onClick={() => handleMarkWagePaid(rec.id)}
                          className="mt-1 rounded bg-blue-600 px-3 py-1 font-bold text-white hover:bg-blue-700"
                        >
                          Disburse Wage (UPI)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: SITE PHOTOS & INSPECTION */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Site Work Photos & Inspection Records</h2>
                  <p className="text-sm text-slate-500">Upload time-stamped images for builder and client audit.</p>
                </div>
              </div>

              <div className="card p-4 border border-slate-200">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    className="inp flex-1 text-xs"
                    placeholder="Photo caption (e.g. Ground floor beam shuttering verified)..."
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                  />
                  <label className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={() => {
                        if (!newCaption.trim()) return
                        setPhotos([
                          {
                            id: 'p-' + Date.now(),
                            url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=800&q=80',
                            caption: newCaption.trim(),
                            date: 'Just now',
                          },
                          ...photos,
                        ])
                        setNewCaption('')
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {photos.map((p) => (
                  <div key={p.id} className="card overflow-hidden border border-slate-200 shadow-sm">
                    <img src={p.url} alt={p.caption} className="h-48 w-full object-cover" />
                    <div className="p-3 text-xs">
                      <div className="font-bold text-slate-800">{p.caption}</div>
                      <div className="text-slate-400 mt-1">Uploaded: {p.date} · Site: Green Villa</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: BUILDER COORDINATION */}
          {activeTab === 'messages' && (
            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900">Communication with Primary Builder</h2>
              <div className="h-64 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 overflow-y-auto text-xs">
                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-2xl bg-white p-3 shadow-sm border border-slate-200">
                    <strong className="block text-slate-800">BuildCraft Infra (Builder)</strong>
                    Suresh garu, please ensure column vibrator is used during casting today to prevent honeycombing.
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-2xl bg-blue-600 p-3 text-white shadow-sm">
                    <strong className="block text-blue-100">You (Contractor)</strong>
                    Yes sir! Two mechanical needle vibrators are on site. Ramesh K was absent so we assigned Suresh P for column compaction.
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <input className="inp text-xs" placeholder="Message to Builder..." />
                <button
                  onClick={() => alert('Message delivered to Builder!')}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* TAB 9: CONTRACTOR PROFILE */}
          {activeTab === 'profile' && (
            <div className="card p-6 space-y-6 max-w-3xl border border-slate-200">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Contractor Profile & Fleet Credentials</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Update your trade specialization, supervisory experience, and contact credentials.
                </p>
              </div>

              <form onSubmit={handleUpdateContractorProfile} className="space-y-4 text-xs font-semibold">
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    Contractor Full Name
                    <input
                      className="inp mt-1 text-sm font-normal"
                      value={profName}
                      onChange={(e) => setProfName(e.target.value)}
                      required
                    />
                  </label>
                  <label className="block">
                    Specialization / Trade Focus
                    <input
                      className="inp mt-1 text-sm font-normal"
                      value={profSpec}
                      onChange={(e) => setProfSpec(e.target.value)}
                      required
                    />
                  </label>
                  <label className="block">
                    Location / Operational Area
                    <input
                      className="inp mt-1 text-sm font-normal"
                      value={profCity}
                      onChange={(e) => setProfCity(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    Contact Phone Number
                    <input
                      className="inp mt-1 text-sm font-normal"
                      value={profPhone}
                      onChange={(e) => setProfPhone(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    Years of Contracting Experience
                    <input
                      type="number"
                      className="inp mt-1 text-sm font-normal"
                      value={profExp}
                      onChange={(e) => setProfExp(Number(e.target.value))}
                    />
                  </label>
                  <label className="block">
                    Subcontractor Verification
                    <div className="mt-1 flex items-center gap-2 p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span>✓ BuildConnect Verified Sub-Contractor</span>
                    </div>
                  </label>
                </div>

                <label className="block">
                  Work Capacity & Fleet Bio
                  <textarea
                    rows={3}
                    className="inp mt-1 text-sm font-normal"
                    value={profBio}
                    onChange={(e) => setProfBio(e.target.value)}
                  />
                </label>

                <div className="pt-2">
                  <button type="submit" disabled={savingProfile} className="btn py-2 px-6 font-bold text-xs">
                    {savingProfile ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-md p-6 space-y-4 text-xs font-semibold">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Assign Construction Task</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-black">✕</button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <label className="block">
                Task Title
                <input
                  required
                  className="inp mt-1"
                  placeholder="e.g. Tie rebar for 1st floor beams"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  Trade
                  <select
                    className="inp mt-1"
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
                    className="inp mt-1"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                  >
                    {SEED_WORKERS.map((w) => (
                      <option key={w.id} value={w.name}>{w.name} ({w.skill})</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                Priority
                <select
                  className="inp mt-1"
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn flex-1 py-2 text-xs">Assign Task</button>
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn2 !bg-slate-200 !text-slate-800 py-2 text-xs">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
