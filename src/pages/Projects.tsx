import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { PageShell, inr } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { db, firebaseReady, requireDb, requireStorage } from '../lib/firebase'
import { SEED_BUILDERS } from '../data/seed'
import { isBuilderOrContractor } from '../types'

const STAGES = [
  'Land preparation',
  'Foundation',
  'Basement',
  'Pillars and columns',
  'Brickwork',
  'Roofing',
  'Electrical work',
  'Plumbing',
  'Plastering',
  'Flooring',
  'Painting',
  'Final inspection',
]

type Stage = { name: string; progress: number; tasks: string[] }
type Report = { id: string; date: string; author: string; note: string; photoUrl?: string }
type Expense = { id: string; date: string; category: string; note: string; amount: number }
type Task = { id: string; title: string; completed: boolean }
type Project = {
  id: string
  name: string
  location: string
  budget: number
  startDate: string
  customerId: string
  customerName: string
  builderId: string
  builderName: string
  stages: Stage[]
  tasks: Task[]
  reports: Report[]
  expenses: Expense[]
  updatedAt?: { seconds: number }
}

const blankStages = (): Stage[] => STAGES.map((name) => ({ name, progress: 0, tasks: [] }))
const localKey = (uid: string) => 'bc-projects-v1:' + uid

const sampleProject = (uid: string): Project => ({
  id: 'demo-proj-1',
  name: 'Skyline Residency',
  location: 'Surampalem, Andhra Pradesh',
  budget: 7500000,
  startDate: '2026-08-10',
  customerId: uid,
  customerName: 'Demo Customer',
  builderId: 'b1',
  builderName: 'Himanth Reddy',
  stages: [
    { name: 'Land preparation', progress: 100, tasks: ['Site clearing', 'Soil test'] },
    { name: 'Foundation', progress: 100, tasks: ['Excavation', 'PCC', 'Footings'] },
    { name: 'Basement', progress: 100, tasks: ['Plinth beams', 'Waterproofing'] },
    { name: 'Pillars and columns', progress: 80, tasks: ['Column casting', 'Shuttering'] },
    { name: 'Brickwork', progress: 70, tasks: ['AAC block masonry'] },
    { name: 'Roofing', progress: 60, tasks: ['Ground floor slab casting'] },
    { name: 'Electrical work', progress: 50, tasks: ['Conduit piping'] },
    { name: 'Plumbing', progress: 40, tasks: ['Drain lines'] },
    { name: 'Plastering', progress: 30, tasks: ['Internal walls'] },
    { name: 'Flooring', progress: 20, tasks: ['Sub-base leveling'] },
    { name: 'Painting', progress: 10, tasks: ['Primer coat'] },
    { name: 'Final inspection', progress: 0, tasks: ['Quality audit'] },
  ],
  tasks: [
    { id: 't1', title: 'Complete column casting (Ground floor)', completed: true },
    { id: 't2', title: 'Formwork removal (Ground floor)', completed: true },
    { id: 't3', title: 'Slab curing and structural inspection', completed: false },
    { id: 't4', title: 'Start brickwork on 1st floor', completed: false },
  ],
  reports: [
    {
      id: 'r1',
      date: new Date().toISOString(),
      author: 'Himanth Reddy',
      note: 'Slab reinforcement work completed and certified by structural engineer.',
      photoUrl: '/hero-architecture-hd.jpg',
    },
    {
      id: 'r2',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      author: 'N. Sri Venkatesh',
      note: 'Brickwork in 1st floor — 60% completed with certified mortar mix.',
    },
  ],
  expenses: [
    { id: 'e1', date: new Date().toISOString().slice(0, 10), category: 'Materials', note: 'INV-1024 · Cement & TMT steel consignment', amount: 1200000 },
    { id: 'e2', date: new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10), category: 'Labour', note: 'INV-1025 · Masons and reinforcement wage payout', amount: 550000 },
    { id: 'e3', date: new Date(Date.now() - 86400000 * 6).toISOString().slice(0, 10), category: 'Equipment', note: 'INV-1019 · Concrete mixer and vibrator rental', amount: 200000 },
  ],
})

const readLocal = (uid: string): Project[] => {
  try {
    const raw = localStorage.getItem(localKey(uid))
    if (raw) return JSON.parse(raw) as Project[]
    const initial = [sampleProject(uid)]
    localStorage.setItem(localKey(uid), JSON.stringify(initial))
    return initial
  } catch {
    return []
  }
}

const writeLocal = (uid: string, rows: Project[]) => {
  try {
    localStorage.setItem(localKey(uid), JSON.stringify(rows))
  } catch {
    throw new Error('Browser storage is full. Please clear some data and try again.')
  }
}

const progressOf = (p: Project) =>
  Math.round(p.stages.reduce((s, x) => s + x.progress, 0) / Math.max(1, p.stages.length))

const imageData = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that image.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not a valid image.'))
      img.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })

export default function Projects() {
  const { user } = useAuth()
  const toast = useToast()

  const [projects, setProjects] = useState<Project[]>([])
  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState('')
  const [newOpen, setNewOpen] = useState(false)

  // Report Form state
  const [showAddReport, setShowAddReport] = useState(false)
  const [reportText, setReportText] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)

  // Task Form state
  const [taskTitle, setTaskTitle] = useState('')

  // Expense Form state
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ category: 'Materials', amount: '', note: '' })

  // Stage update state
  const [stageIdx, setStageIdx] = useState(0)
  const [stageProgress, setStageProgress] = useState(0)

  // Builder assignment state
  const [assignBuilderId, setAssignBuilderId] = useState('')
  const [builders, setBuilders] = useState<{ id: string; name: string; city?: string }[]>([])

  const builder = isBuilderOrContractor(user?.role)
  const active = projects.find((p) => p.id === selected) ?? projects[0] ?? null
  const canUpdate = !firebaseReady || (builder && !!user && active?.builderId === user.uid)
  const canManageTasks = !firebaseReady || (!!user && (active?.customerId === user.uid || active?.builderId === user.uid))
  const seenReports = useRef<Record<string, string>>({})

  useEffect(() => {
    if (!db || !user) {
      setProjects(firebaseReady ? [] : readLocal(user?.uid ?? 'guest'))
      return
    }
    seenReports.current = {}
    const field = isBuilderOrContractor(user.role) ? 'builderId' : 'customerId'
    return onSnapshot(
      query(collection(db, 'projects'), where(field, '==', user.uid)),
      (snap) => {
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Project))
          .sort((a, b) => (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0))
        rows.forEach((p) => {
          const newest = p.reports?.[0]?.id
          const prior = seenReports.current[p.id]
          if (prior && newest && newest !== prior) toast('Construction progress updated: ' + p.name)
          if (newest) seenReports.current[p.id] = newest
        })
        setProjects(rows)
      },
      (e) => toast('Project load failed: ' + e.message, 'err')
    )
  }, [user, toast])

  useEffect(() => {
    if (!db) {
      setBuilders(SEED_BUILDERS.map((b) => ({ id: b.id, name: b.name, city: b.city })))
      return
    }
    return onSnapshot(
      collection(db, 'builders'),
      (snap) =>
        setBuilders(
          snap.docs.map((d) => ({
            id: d.id,
            name: String(d.data().name ?? 'Builder'),
            city: String(d.data().city ?? ''),
          }))
        ),
      () => setBuilders([])
    )
  }, [])

  const updateProject = async (p: Project, patch: Partial<Project>) => {
    if (!firebaseReady) {
      const uid = user?.uid ?? 'guest'
      const rows = readLocal(uid).map((x) => (x.id === p.id ? { ...x, ...patch } : x))
      writeLocal(uid, rows)
      setProjects(rows)
      return
    }
    await updateDoc(doc(requireDb(), 'projects', p.id), { ...patch, updatedAt: serverTimestamp() })
  }

  const create = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (firebaseReady && (!user || user.role !== 'Customer')) {
      toast('Sign in as a customer to create a project.', 'err')
      return
    }
    const data = new FormData(e.currentTarget)
    const budget = Number(data.get('budget'))
    const name = String(data.get('name')).trim()
    const location = String(data.get('location')).trim()
    const startDate = String(data.get('startDate'))
    const builderId = String(data.get('builderId') ?? '')

    if (!name || !location || !startDate || !Number.isFinite(budget) || budget <= 0) {
      toast('Enter a project name, location, start date and valid budget.', 'err')
      return
    }

    setBusy(true)
    try {
      const row: Omit<Project, 'id'> = {
        name,
        location,
        startDate,
        budget,
        customerId: user?.uid ?? 'guest',
        customerName: user?.name ?? 'Guest User',
        builderId,
        builderName: builders.find((b) => b.id === builderId)?.name ?? '',
        stages: blankStages(),
        tasks: [],
        reports: [],
        expenses: [],
      }

      if (db && user) {
        const docRef = await addDoc(collection(db, 'projects'), {
          ...row,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        setSelected(docRef.id)
      } else {
        const id = 'demo-' + Date.now()
        const uid = user?.uid ?? 'guest'
        const all = [{ ...row, id }, ...readLocal(uid)]
        writeLocal(uid, all)
        setProjects(all)
        setSelected(id)
      }
      setNewOpen(false)
      toast('Construction project created.')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Project could not be created.', 'err')
    } finally {
      setBusy(false)
    }
  }

  const addReport = async (e: FormEvent) => {
    e.preventDefault()
    if (!active || !canUpdate || !reportText.trim()) return
    setBusy(true)
    try {
      let photoUrl: string | undefined
      if (photo) {
        if (photo.size > 5 * 1024 * 1024) throw new Error('Photos must be under 5 MiB.')
        if (!photo.type.startsWith('image/')) throw new Error('Please select an image file.')
        if (firebaseReady && user) {
          const path = 'projects/' + active.id + '/' + Date.now() + '-' + photo.name.replace(/[^a-zA-Z0-9._-]/g, '_')
          const uploaded = await uploadBytes(ref(requireStorage(), path), photo)
          photoUrl = await getDownloadURL(uploaded.ref)
        } else {
          photoUrl = await imageData(photo)
        }
      }
      const reports = [
        {
          id: String(Date.now()),
          date: new Date().toISOString(),
          author: user?.name ?? active.builderName ?? 'Assigned Builder',
          note: reportText.trim(),
          photoUrl,
        },
        ...active.reports,
      ]
      await updateProject(active, { reports })
      setReportText('')
      setPhoto(null)
      setShowAddReport(false)
      toast('Progress report added.')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Report could not be added.', 'err')
    } finally {
      setBusy(false)
    }
  }

  const saveStage = async () => {
    if (!active || !canUpdate) return
    const stages = active.stages.map((s, i) => (i === stageIdx ? { ...s, progress: stageProgress } : s))
    try {
      const reports = [
        {
          id: String(Date.now()),
          date: new Date().toISOString(),
          author: user?.name ?? active.builderName ?? 'Assigned Builder',
          note: 'Updated ' + active.stages[stageIdx].name + ' to ' + stageProgress + '%.',
        },
        ...active.reports,
      ]
      await updateProject(active, { stages, reports })
      toast('Construction stage and project update saved.')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not update stage.', 'err')
    }
  }

  const addTask = async (e: FormEvent) => {
    e.preventDefault()
    if (!active || !canManageTasks || !taskTitle.trim()) return
    const tasks = [{ id: String(Date.now()), title: taskTitle.trim(), completed: false }, ...(active.tasks ?? [])]
    try {
      await updateProject(active, { tasks })
      setTaskTitle('')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Task could not be saved.', 'err')
    }
  }

  const toggleTask = async (task: Task) => {
    if (!active || !canManageTasks) return
    const tasks = (active.tasks ?? []).map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
    try {
      await updateProject(active, { tasks })
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Task could not be updated.', 'err')
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!active || !canManageTasks) return
    const tasks = (active.tasks ?? []).filter((t) => t.id !== taskId)
    try {
      await updateProject(active, { tasks })
      toast('Task removed.')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not remove task.', 'err')
    }
  }

  const addExpense = async (e: FormEvent) => {
    e.preventDefault()
    if (!active || !canUpdate) return
    const amount = Number(expenseForm.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast('Enter an expense greater than zero.', 'err')
      return
    }
    const expenses = [
      {
        id: String(Date.now()),
        date: new Date().toISOString(),
        category: expenseForm.category,
        note: expenseForm.note.trim() || `Invoice for ${expenseForm.category}`,
        amount,
      },
      ...active.expenses,
    ]
    try {
      await updateProject(active, { expenses })
      setExpenseForm({ category: 'Materials', amount: '', note: '' })
      setShowAddExpense(false)
      toast('Expense recorded.')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Expense could not be saved.', 'err')
    }
  }

  const assignBuilder = async () => {
    if (!active || !user || user.role !== 'Customer' || !assignBuilderId) return
    const b = builders.find((x) => x.id === assignBuilderId)
    if (!b) return
    try {
      await updateProject(active, { builderId: b.id, builderName: b.name })
      setAssignBuilderId('')
      toast('Builder assigned to project.')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Builder could not be assigned.', 'err')
    }
  }

  const totalExpenses = useMemo(() => active?.expenses.reduce((s, e) => s + e.amount, 0) ?? 0, [active])

  return (
    <PageShell
      title="Track Progress"
      subtitle="Monitor construction progress, manage tasks, daily reports and expenses."
    >
      {/* Top Bar: Clean Project Selector & New Project Action */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {projects.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5">
              <span className="font-bold text-slate-500 whitespace-nowrap">Projects:</span>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition whitespace-nowrap ${
                    p.id === active?.id
                      ? 'bg-[#1554C8] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {p.name} ({progressOf(p)}%)
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="btn !py-1.5 !px-3 text-xs font-bold shrink-0 ml-auto"
          disabled={firebaseReady && (!user || user.role !== 'Customer')}
          title={firebaseReady && user && user.role !== 'Customer' ? 'Only customers can create projects.' : ''}
          onClick={() => setNewOpen((v) => !v)}
        >
          {newOpen ? '✕ Close Form' : '+ New project'}
        </button>
      </div>

      {/* New Project Creation Form Modal/Card */}
      {newOpen && (
        <form
          className="card mb-6 grid gap-3.5 p-4 sm:p-5 sm:grid-cols-2 lg:grid-cols-4 border border-blue-200 shadow-sm"
          onSubmit={create}
        >
          <label className="text-xs font-bold text-slate-700">
            Project name
            <input
              className="inp mt-1 text-xs"
              name="name"
              required
              maxLength={80}
              placeholder="e.g. Skyline Residency"
            />
          </label>
          <label className="text-xs font-bold text-slate-700">
            Location
            <input
              className="inp mt-1 text-xs"
              name="location"
              required
              maxLength={100}
              placeholder="City, area"
            />
          </label>
          <label className="text-xs font-bold text-slate-700">
            Budget (₹)
            <input
              className="inp mt-1 text-xs"
              type="number"
              name="budget"
              min="1"
              step="1000"
              placeholder="7500000"
              required
            />
          </label>
          <label className="text-xs font-bold text-slate-700">
            Start date
            <input className="inp mt-1 text-xs" type="date" name="startDate" required />
          </label>
          <label className="text-xs font-bold text-slate-700 sm:col-span-2">
            Builder (optional)
            <select className="inp mt-1 text-xs" name="builderId" defaultValue="">
              <option value="">Choose later</option>
              {builders.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.city ? ' · ' + b.city : ''}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2 pt-1">
            <button className="btn text-xs py-2 px-4 font-bold" disabled={busy}>
              {busy ? 'Saving…' : 'Create project'}
            </button>
            <button
              type="button"
              className="btn2 text-xs py-2 px-3.5 font-semibold"
              onClick={() => setNewOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!projects.length ? (
        <div className="card p-8 text-center space-y-2 border border-slate-200 shadow-xs">
          <div className="text-lg font-extrabold text-slate-900">No projects yet</div>
          <p className="text-xs text-slate-500">
            Create a project to start tracking stages, tasks, reports, and costs in real time.
          </p>
        </div>
      ) : active ? (
        <div className="space-y-5">
          {/* 1. PROJECT OVERVIEW CARD */}
          <section
            aria-label="Project Overview"
            className="card p-4 sm:p-5 border border-slate-200 shadow-xs bg-white"
          >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <span className="text-base">🏢</span>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Project Overview</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Left Column: Thumbnail + Details */}
              <div className="md:col-span-5 flex items-center gap-3.5">
                <div className="h-16 w-20 sm:h-18 sm:w-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 shadow-2xs">
                  <img
                    src={active.reports.find((r) => r.photoUrl)?.photoUrl || '/hero-architecture-hd.jpg'}
                    alt={active.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                    {active.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 truncate">
                    <span>📍</span>
                    <span className="truncate">{active.location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-600 mt-1 font-semibold truncate">
                    <span>👷</span>
                    <span className="truncate">Builder: {active.builderName || 'Not assigned'}</span>
                  </div>
                </div>
              </div>

              {/* Middle Column: Overall Progress */}
              <div className="md:col-span-3 px-1 sm:px-3">
                <div className="text-xs font-semibold text-slate-500">Overall Progress</div>
                <div className="text-2xl font-black text-[#1554C8] tracking-tight mt-0.5">
                  {progressOf(active)}%
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden mt-1.5 border border-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                    style={{ width: `${progressOf(active)}%` }}
                  />
                </div>
              </div>

              {/* Right Column: Budget & Expenses Mini Cards */}
              <div className="md:col-span-4 flex items-center gap-2.5">
                <div className="flex-1 rounded-xl bg-indigo-50/70 border border-indigo-100 p-2.5 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-sm">
                    💰
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[0.68rem] font-bold uppercase tracking-wider text-indigo-600">
                      Budget
                    </span>
                    <span className="block text-xs sm:text-sm font-black text-slate-900 truncate">
                      {inr(active.budget)}
                    </span>
                  </div>
                </div>

                <div className="flex-1 rounded-xl bg-emerald-50/70 border border-emerald-100 p-2.5 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-sm">
                    👛
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[0.68rem] font-bold uppercase tracking-wider text-emerald-600">
                      Expenses
                    </span>
                    <span className="block text-xs sm:text-sm font-black text-slate-900 truncate">
                      {inr(totalExpenses)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Builder Assignment for Customer */}
            {firebaseReady && user?.role === 'Customer' && !active.builderId && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700">Assign a builder:</span>
                <select
                  className="inp !py-1 text-xs"
                  value={assignBuilderId}
                  onChange={(e) => setAssignBuilderId(e.target.value)}
                >
                  <option value="">Select Builder</option>
                  {builders.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                      {b.city ? ' · ' + b.city : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn2 text-xs py-1 px-3 font-bold"
                  disabled={!assignBuilderId}
                  onClick={assignBuilder}
                >
                  Assign
                </button>
              </div>
            )}
          </section>

          {/* 2 & 3: CONSTRUCTION STAGES (LEFT) & PROJECT TASKS (RIGHT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* 2. CONSTRUCTION STAGES (12) */}
            <section
              aria-label="Construction Stages"
              className="lg:col-span-7 card p-4 sm:p-5 border border-slate-200 shadow-xs bg-white"
            >
              <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-base">🥞</span>
                  <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Construction Stages ({active.stages.length})
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {active.stages.filter((s) => s.progress === 100).length} / {active.stages.length} Completed
                </span>
              </div>

              {/* 12 Stages Compact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {active.stages.map((s, i) => {
                  const isDone = s.progress === 100
                  const isCurrent = stageIdx === i
                  return (
                    <div
                      key={s.name}
                      onClick={() => {
                        setStageIdx(i)
                        setStageProgress(s.progress)
                      }}
                      className={`cursor-pointer rounded-xl border p-2.5 transition-all ${
                        isCurrent
                          ? 'border-blue-400 bg-blue-50/40 ring-1 ring-blue-300 shadow-2xs'
                          : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold ${
                              isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate" title={s.name}>
                            {s.name}
                          </span>
                        </div>
                        <span
                          className={`text-[0.7rem] font-bold shrink-0 ${
                            isDone ? 'text-emerald-700' : s.progress > 0 ? 'text-indigo-600' : 'text-slate-400'
                          }`}
                        >
                          {s.progress}%
                        </span>
                      </div>

                      <div className="h-1.5 w-full rounded-full bg-slate-200/80 overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isDone ? 'bg-emerald-500' : s.progress > 0 ? 'bg-indigo-600' : 'bg-transparent'
                          }`}
                          style={{ width: `${s.progress}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Stage Progress Slider Controls (Functional for builder / tests) */}
              {canUpdate && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Update Stage:</span>
                    <select
                      className="inp !py-1 text-xs"
                      value={stageIdx}
                      onChange={(e) => {
                        const i = Number(e.target.value)
                        setStageIdx(i)
                        setStageProgress(active.stages[i].progress)
                      }}
                    >
                      {active.stages.map((s, i) => (
                        <option key={s.name} value={i}>
                          {i + 1}. {s.name} ({s.progress}%)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="font-bold text-slate-700 min-w-8 text-right">{stageProgress}%</span>
                    <input
                      className="w-24 sm:w-32 accent-blue-600 cursor-pointer"
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={stageProgress}
                      onChange={(e) => setStageProgress(Number(e.target.value))}
                    />
                    <button
                      type="button"
                      className="btn2 !bg-blue-600 !text-white hover:!bg-blue-700 !py-1 text-xs font-bold shadow-2xs"
                      onClick={saveStage}
                    >
                      Save stage
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* 3. PROJECT TASKS */}
            <section
              aria-label="Project Tasks"
              className="lg:col-span-5 card p-4 sm:p-5 border border-slate-200 shadow-xs bg-white"
            >
              <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-base">☑️</span>
                  <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Project Tasks</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.68rem] font-bold text-emerald-700 border border-emerald-100">
                  {(active.tasks ?? []).filter((t) => t.completed).length} / {(active.tasks ?? []).length} done
                </span>
              </div>

              {/* Compact Inline Add Task Form */}
              {canManageTasks && (
                <form className="mb-3 flex gap-2" onSubmit={addTask}>
                  <input
                    className="inp text-xs py-1.5 flex-1"
                    maxLength={120}
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Add a new project task..."
                    aria-label="Add a project task"
                  />
                  <button
                    className="btn2 !bg-blue-600 !text-white hover:!bg-blue-700 !py-1.5 !px-3 text-xs font-bold shrink-0"
                    disabled={!taskTitle.trim()}
                  >
                    Add
                  </button>
                </form>
              )}

              {/* Tasks List */}
              <div className="space-y-2 max-h-[19.5rem] overflow-y-auto pr-1">
                {(active.tasks ?? []).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        disabled={!canManageTasks}
                        onChange={() => toggleTask(task)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                      />
                      <span
                        className={`text-xs font-medium truncate ${
                          task.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                        }`}
                      >
                        {task.title}
                      </span>
                    </label>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${
                          task.completed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {task.completed ? 'Completed' : 'Pending'}
                      </span>
                      {canManageTasks && (
                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          className="text-slate-300 hover:text-red-500 text-xs px-1"
                          title="Delete task"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {!(active.tasks ?? []).length && (
                  <p className="text-xs text-slate-400 text-center py-4">No tasks added yet.</p>
                )}
              </div>
            </section>
          </div>

          {/* 4. DAILY REPORTS (LEFT) & EXPENSES (RIGHT) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {/* DAILY REPORTS */}
            <section
              aria-label="Daily Reports"
              className="card p-4 sm:p-5 border border-slate-200 shadow-xs bg-white"
            >
              <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-base">📄</span>
                  <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Daily Reports</h2>
                </div>
                {canUpdate && (
                  <button
                    type="button"
                    onClick={() => setShowAddReport((v) => !v)}
                    className="btn !py-1 !px-2.5 text-xs font-bold"
                  >
                    {showAddReport ? 'Cancel' : '+ Add Report'}
                  </button>
                )}
              </div>

              {/* Expandable Add Report Form */}
              {showAddReport && canUpdate && (
                <form
                  onSubmit={addReport}
                  className="mb-3.5 p-3 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2.5 text-xs"
                >
                  <textarea
                    className="inp text-xs min-h-16"
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    maxLength={1500}
                    required
                    placeholder="Describe today's construction work, materials poured, or milestones reached..."
                    aria-label="Daily progress report"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                      onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                      aria-label="Site photo"
                    />
                    <div className="flex gap-1.5 ml-auto">
                      <button className="btn text-xs py-1 px-3 font-bold" disabled={busy || !reportText.trim()}>
                        {busy ? 'Saving…' : 'Submit Report'}
                      </button>
                      <button
                        type="button"
                        className="btn2 text-xs py-1 px-2.5 font-semibold"
                        onClick={() => setShowAddReport(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Reports List */}
              <div className="space-y-2.5 max-h-[18rem] overflow-y-auto pr-1">
                {active.reports.map((r) => (
                  <article
                    key={r.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition"
                  >
                    {r.photoUrl ? (
                      <a href={r.photoUrl} target="_blank" rel="noreferrer" className="shrink-0 group">
                        <img
                          src={r.photoUrl}
                          alt="Site update"
                          className="h-12 w-12 rounded-lg object-cover border border-slate-200 group-hover:opacity-90"
                        />
                      </a>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100/60 text-blue-700 text-lg border border-blue-200/60">
                        🏗️
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 line-clamp-2">{r.note}</p>
                      <div className="flex items-center gap-2 text-[0.7rem] text-slate-500 mt-1">
                        <span>
                          📅{' '}
                          {new Date(r.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span>·</span>
                        <span>👤 {r.author}</span>
                      </div>
                    </div>
                    {r.photoUrl && (
                      <span className="rounded-md bg-slate-200/60 px-1.5 py-0.5 text-[0.65rem] font-bold text-slate-700 shrink-0">
                        📷 1
                      </span>
                    )}
                  </article>
                ))}
                {!active.reports.length && (
                  <p className="text-xs text-slate-400 text-center py-4">No daily reports recorded yet.</p>
                )}
              </div>
            </section>

            {/* EXPENSES */}
            <section
              aria-label="Expenses"
              className="card p-4 sm:p-5 border border-slate-200 shadow-xs bg-white"
            >
              <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-base">👛</span>
                  <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Expenses</h2>
                </div>
                {canUpdate && (
                  <button
                    type="button"
                    onClick={() => setShowAddExpense((v) => !v)}
                    className="btn !py-1 !px-2.5 text-xs font-bold"
                  >
                    {showAddExpense ? 'Cancel' : '+ Add Expense'}
                  </button>
                )}
              </div>

              {/* Expandable Add Expense Form */}
              {showAddExpense && canUpdate && (
                <form
                  onSubmit={addExpense}
                  className="mb-3.5 p-3 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2.5 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      className="inp text-xs py-1.5"
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm((s) => ({ ...s, category: e.target.value }))}
                    >
                      <option>Materials</option>
                      <option>Labour</option>
                      <option>Equipment</option>
                      <option>Permits</option>
                      <option>Other</option>
                    </select>
                    <input
                      className="inp text-xs py-1.5"
                      type="number"
                      min="1"
                      step="10"
                      placeholder="Amount (₹)"
                      required
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm((s) => ({ ...s, amount: e.target.value }))}
                    />
                  </div>
                  <input
                    className="inp text-xs py-1.5"
                    placeholder="Expense note / invoice reference (e.g. INV-1026)"
                    value={expenseForm.note}
                    onChange={(e) => setExpenseForm((s) => ({ ...s, note: e.target.value }))}
                  />
                  <div className="flex gap-1.5">
                    <button className="btn text-xs py-1 px-3 font-bold" disabled={busy}>
                      Add expense
                    </button>
                    <button
                      type="button"
                      className="btn2 text-xs py-1 px-2.5 font-semibold"
                      onClick={() => setShowAddExpense(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Expenses Clean Table */}
              <div className="overflow-x-auto max-h-[18rem]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-2 px-2.5">Category</th>
                      <th className="py-2 px-2.5">Amount (₹)</th>
                      <th className="py-2 px-2.5">Invoice Ref.</th>
                      <th className="py-2 px-2.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {active.expenses.map((x) => (
                      <tr key={x.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-2.5 px-2.5 font-bold text-slate-800 flex items-center gap-1.5">
                          <span>
                            {x.category === 'Materials'
                              ? '🧱'
                              : x.category === 'Labour'
                              ? '👷'
                              : x.category === 'Equipment'
                              ? '🚚'
                              : '📄'}
                          </span>
                          <span>{x.category}</span>
                        </td>
                        <td className="py-2.5 px-2.5 font-extrabold text-slate-900">{inr(x.amount)}</td>
                        <td className="py-2.5 px-2.5 text-slate-600 truncate max-w-[10rem]">
                          {x.note || '—'}
                        </td>
                        <td className="py-2.5 px-2.5 text-slate-500 whitespace-nowrap">
                          {new Date(x.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                    {!active.expenses.length && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-xs text-slate-400">
                          No expenses recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </PageShell>
  )
}
