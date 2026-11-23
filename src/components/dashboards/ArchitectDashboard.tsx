import { useEffect, useState, type FormEvent } from 'react'
import { inr, Pill } from '../ui'
import type {
  ArchitecturalRequestStatus,
  DesignType,
  UserProfile,
} from '../../types'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../lib/i18n'
import { useArchitecturalRequests } from '../../hooks/useArchitecturalRequests'

interface ArchitectDashboardProps {
  user: UserProfile
}

// Active View Types for the Expandable Left Sidebar
export type ArchitectView =
  | 'dashboard'
  | 'pending_requests'
  | 'project_status'
  | 'customer_requests'
  | 'plans_2d'
  | 'elevations_3d'
  | 'revisions'
  | 'visualizer'
  | 'takeoff'
  | 'inspections'
  | 'my_projects'
  | 'messages'
  | 'approvals'
  | 'profile'

const statusToneMap: Record<ArchitecturalRequestStatus, 'amber' | 'blue' | 'green' | 'red'> = {
  Pending: 'amber',
  'Under Review': 'blue',
  Accepted: 'blue',
  'In Progress': 'blue',
  'Design Uploaded': 'green',
  Approved: 'green',
  'Revision Requested': 'amber',
  'More Info Needed': 'amber',
  Declined: 'red',
  Completed: 'green',
}

export default function ArchitectDashboard({ user }: ArchitectDashboardProps) {
  const { t } = useI18n()
  const toast = useToast()
  const { updateProfile, logout } = useAuth()
  const {
    requests,
    updateStatus,
    uploadDesign,
    respondRevision,
    sendMessage,
    addInspection,
  } = useArchitecturalRequests(user)

  // Current Active View
  const [activeView, setActiveView] = useState<ArchitectView>('dashboard')

  // Expandable Sidebar Sections
  const [overviewExpanded, setOverviewExpanded] = useState(true)
  const [studioExpanded, setStudioExpanded] = useState(true)
  const [projectsExpanded, setProjectsExpanded] = useState(true)

  // Mobile Sidebar Toggle
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Selected Project for details / messages
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)

  // 3D Visualizer Layer Toggles
  const [showShell, setShowShell] = useState(true)
  const [showFrame, setShowFrame] = useState(true)
  const [showConduits, setShowConduits] = useState(true)
  const [activeFloor, setActiveFloor] = useState<'Ground Floor' | 'First Floor' | 'Terrace'>('Ground Floor')

  // Upload Design Modal
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadProjectId, setUploadProjectId] = useState<string>('')
  const [designTitle, setDesignTitle] = useState('')
  const [designType, setDesignType] = useState<DesignType>('2D Floor Plan')
  const [designPlotSize, setDesignPlotSize] = useState('30 ft × 40 ft (1,200 sq.ft)')
  const [designFloors, setDesignFloors] = useState('G + 1 Floor')
  const [designRooms, setDesignRooms] = useState('3 BHK Duplex, Puja Room')
  const [designConcrete, setDesignConcrete] = useState('M25 Grade (1 : 1 : 2)')
  const [designSteel, setDesignSteel] = useState('5.4')
  const [designNotes, setDesignNotes] = useState('')
  const [designPreviewUrl, setDesignPreviewUrl] = useState(
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
  )
  const [uploadSubmitting, setUploadSubmitting] = useState(false)

  // Request More Info Modal
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [infoReqId, setInfoReqId] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  // Revision Response Modal
  const [showRevResponseModal, setShowRevResponseModal] = useState(false)
  const [activeRev, setActiveRev] = useState<{ reqId: string; revId: string; notes: string } | null>(null)
  const [revResponseText, setRevResponseText] = useState('')

  // Add Inspection Modal
  const [showInspModal, setShowInspModal] = useState(false)
  const [inspProjectId, setInspProjectId] = useState('')
  const [inspTitle, setInspTitle] = useState('Ground Floor Column Rebar Inspection')
  const [inspStage, setInspStage] = useState('Columns & Plinth')
  const [inspDate, setInspDate] = useState(new Date().toISOString().slice(0, 10))
  const [inspStatus, setInspStatus] = useState<'Passed' | 'Action Required'>('Passed')
  const [inspSpacing, setInspSpacing] = useState('150 mm c/c (IS 456 compliant)')
  const [inspSlump, setInspSlump] = useState('100 mm slump')
  const [inspCover, setInspCover] = useState('40 mm clear cover')
  const [inspCuring, setInspCuring] = useState('14 days pond curing')
  const [inspFindings, setInspFindings] = useState('Column ties bent at 135-degree seismic hooks. Rebar spacing verified.')

  // Structural Takeoff Calculator State
  const [calcArea, setCalcArea] = useState<number>(1800)
  const [calcFloors, setCalcFloors] = useState<number>(2)

  // Direct Chat Message
  const [chatText, setChatText] = useState('')

  // Profile Edit Form State
  const [profileName, setProfileName] = useState(user.name)
  const [profileCoa, setProfileCoa] = useState(user.coaReg || 'CA/2018/98421')
  const [profileQual, setProfileQual] = useState(
    user.qualifications || 'B.Arch (SPA), M.Tech (IIT Structural Engineering)'
  )
  const [profileExp, setProfileExp] = useState(user.experienceYears || 11)
  const [profileSpec, setProfileSpec] = useState(
    user.specialization || 'Vaastu Duplexes, Cantilever Villas, Commercial RCC'
  )
  const [profileCity, setProfileCity] = useState(user.city || 'Hyderabad')
  const [profilePhone, setProfilePhone] = useState(user.phone || '+91 98765 43214')
  const [profileBio, setProfileBio] = useState(
    user.bio ||
      'Licensed Building Consultant & Structural Designer with over 85+ approved residential and commercial projects.'
  )
  const [profileSaving, setProfileSaving] = useState(false)

  // Sync profile form when user changes
  useEffect(() => {
    setProfileName(user.name)
    setProfileCoa(user.coaReg || 'CA/2018/98421')
    setProfileQual(user.qualifications || 'B.Arch (SPA), M.Tech (IIT Structural Engineering)')
    setProfileExp(user.experienceYears || 11)
    setProfileSpec(user.specialization || 'Vaastu Duplexes, Cantilever Villas, Commercial RCC')
    setProfileCity(user.city || 'Hyderabad')
    setProfilePhone(user.phone || '+91 98765 43214')
    setProfileBio(
      user.bio ||
        'Licensed Building Consultant & Structural Designer with over 85+ approved residential and commercial projects.'
    )
  }, [user])

  // Select first request by default
  useEffect(() => {
    if (requests.length > 0 && !selectedRequestId) {
      setSelectedRequestId(requests[0].id)
    }
  }, [requests, selectedRequestId])

  const activeRequest =
    requests.find((r) => r.id === selectedRequestId) || (requests.length > 0 ? requests[0] : null)

  // Filtered lists for metrics
  const pendingRequests = requests.filter((r) => r.status === 'Pending')
  const activeProjects = requests.filter((r) =>
    ['Accepted', 'In Progress', 'Design Uploaded', 'Revision Requested'].includes(r.status)
  )
  const completedProjects = requests.filter((r) => r.status === 'Approved' || r.status === 'Completed')
  const pendingRevisions = requests.flatMap((r) => (r.revisions || []).filter((rev) => rev.status === 'Open'))
  const allDesigns = requests.flatMap((r) => r.designs || [])
  const plans2dDesigns = allDesigns.filter((d) => d.type === '2D Floor Plan')
  const elevations3dDesigns = allDesigns.filter((d) => d.type === '3D Elevation')
  const allInspections = requests.flatMap((r) => r.inspections || [])

  // Material Takeoff Calculations
  const totalBuiltup = calcArea * calcFloors
  const estCementBags = Math.round(totalBuiltup * 0.42)
  const estSteelTonnes = Math.round(((totalBuiltup * 3.8) / 100) * 10) / 10
  const estSandBrass = Math.round(((totalBuiltup * 2.2) / 100) * 10) / 10
  const estAggregatesTonnes = Math.round(((totalBuiltup * 5.5) / 100) * 10) / 10

  // Handle Accept Request
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await updateStatus(
        requestId,
        'Accepted',
        `Ar. ${user.name} accepted your design request. Architectural drafting is now in progress.`
      )
      toast('Project request accepted! Added to Active Architectural Projects.')
    } catch (err: any) {
      toast(err?.message || 'Failed to accept request', 'err')
    }
  }

  // Handle Decline Request
  const handleDeclineRequest = async (requestId: string) => {
    try {
      await updateStatus(
        requestId,
        'Declined',
        `Ar. ${user.name} was unable to accept this design request at this time.`
      )
      toast('Project request declined.')
    } catch (err: any) {
      toast(err?.message || 'Failed to decline request', 'err')
    }
  }

  // Handle Request Additional Information
  const handleSubmitMoreInfo = async (e: FormEvent) => {
    e.preventDefault()
    if (!infoReqId || !infoMessage.trim()) return
    try {
      await updateStatus(
        infoReqId,
        'More Info Needed',
        `Architect requested information: "${infoMessage.trim()}"`
      )
      toast('Information request sent to customer!')
      setShowInfoModal(false)
      setInfoMessage('')
    } catch (err: any) {
      toast(err?.message || 'Failed to request info', 'err')
    }
  }

  // Handle Upload Design
  const handleUploadDesign = async (e: FormEvent) => {
    e.preventDefault()
    const targetId = uploadProjectId || activeRequest?.id
    if (!targetId || !designTitle.trim()) {
      toast('Please select a project and enter design title', 'err')
      return
    }

    setUploadSubmitting(true)
    try {
      await uploadDesign(targetId, {
        title: designTitle.trim(),
        type: designType,
        previewUrl: designPreviewUrl.trim(),
        dimensions: designPlotSize.trim(),
        floors: designFloors.trim(),
        rooms: designRooms.trim(),
        concreteMix: designConcrete.trim(),
        steelTonnes: Number(designSteel) || 4.5,
        structuralNotes: designNotes.trim() || 'Designed as per IS 456:2000 structural concrete codes.',
      })
      toast('Architectural drawing uploaded and published to customer dashboard!')
      setShowUploadModal(false)
      setDesignTitle('')
      setDesignNotes('')
    } catch (err: any) {
      toast(err?.message || 'Failed to upload design', 'err')
    } finally {
      setUploadSubmitting(false)
    }
  }

  // Handle Respond to Revision
  const handleRespondRevision = async (e: FormEvent) => {
    e.preventDefault()
    if (!activeRev || !revResponseText.trim()) return
    try {
      await respondRevision(activeRev.reqId, activeRev.revId, revResponseText.trim())
      toast('Revision feedback sent to customer!')
      setShowRevResponseModal(false)
      setRevResponseText('')
      setActiveRev(null)
    } catch (err: any) {
      toast(err?.message || 'Failed to respond to revision', 'err')
    }
  }

  // Handle Add Inspection
  const handleAddInspection = async (e: FormEvent) => {
    e.preventDefault()
    const targetId = inspProjectId || activeRequest?.id
    if (!targetId || !inspTitle.trim()) {
      toast('Please select a project and enter inspection title', 'err')
      return
    }

    try {
      await addInspection(targetId, {
        title: inspTitle.trim(),
        stage: inspStage.trim(),
        date: inspDate,
        status: inspStatus,
        rebarSpacing: inspSpacing.trim(),
        concreteSlump: inspSlump.trim(),
        coverBlocks: inspCover.trim(),
        curingPeriod: inspCuring.trim(),
        findings: inspFindings.trim(),
        certifiedBy: `${user.name} (COA Reg: ${user.coaReg || 'CA/2018/98421'})`,
      })
      toast('Structural inspection audit signed and recorded successfully!')
      setShowInspModal(false)
    } catch (err: any) {
      toast(err?.message || 'Failed to add inspection', 'err')
    }
  }

  // Handle Send Chat
  const handleSendChat = async (e: FormEvent) => {
    e.preventDefault()
    if (!activeRequest || !chatText.trim()) return
    const text = chatText
    setChatText('')
    try {
      await sendMessage(activeRequest.id, text)
    } catch (err: any) {
      setChatText(text)
      toast(err?.message || 'Failed to send message', 'err')
    }
  }

  // Handle Save Profile
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    try {
      await updateProfile({
        name: profileName.trim(),
        coaReg: profileCoa.trim(),
        qualifications: profileQual.trim(),
        experienceYears: Number(profileExp) || 0,
        specialization: profileSpec.trim(),
        city: profileCity.trim(),
        phone: profilePhone.trim(),
        bio: profileBio.trim(),
      })
      toast('Architect qualifications and profile updated successfully!')
    } catch (err: any) {
      toast(err?.message || 'Failed to update profile', 'err')
    } finally {
      setProfileSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ============================================================ */}
      {/* 2. WELCOME BANNER                                            */}
      {/* Blueprint illustration left, modern building right, gradient */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50/95 via-indigo-50/50 to-white border border-blue-200/80 text-slate-900 shadow-sm dark:bg-gradient-to-r dark:from-[#08265B] dark:via-[#1554C8] dark:to-[#0284C7] dark:border-transparent dark:text-white p-6 sm:p-8 lg:p-10 transition-colors duration-200">
        {/* Subtle decorative architectural grid background overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #000000 1px, transparent 1px), linear-gradient(to bottom, #000000 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
          {/* Left: Architectural blueprint illustration + text */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 max-w-2xl">
            {/* Blueprint Icon / Illustration */}
            <div className="shrink-0 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-white dark:bg-white/10 backdrop-blur-md border border-blue-200 dark:border-white/25 shadow-xs text-[#1554C8] dark:text-cyan-200">
              <svg
                width="54"
                height="54"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-xs"
              >
                {/* Blueprint Drafting Compass & Ruler */}
                <path d="M12 2v4" />
                <path d="m19 13-7-9-7 9" />
                <path d="M7 13h10" />
                <path d="M5 21l3-6" />
                <path d="M19 21l-3-6" />
                <circle cx="12" cy="4" r="1.5" fill="currentColor" />
                <path d="M3 21h18" />
              </svg>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-orange-100 text-[#FF7900] border border-orange-200 dark:bg-orange-500/25 dark:text-orange-300 dark:border-orange-400/30 px-2.5 py-0.5 text-[0.72rem] font-extrabold uppercase tracking-wider">
                  Architectural & Structural Engineering Suite
                </span>
                <span className="rounded-md bg-blue-100 text-[#1554C8] border border-blue-200 dark:bg-blue-900/60 dark:text-cyan-200 dark:border-cyan-400/25 px-2.5 py-0.5 text-[0.72rem] font-mono">
                  COA Reg: {user.coaReg || 'CA/2018/98421'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {t('Welcome back, Architect!')}
              </h1>

              <p className="text-base sm:text-lg font-bold text-[#1554C8] dark:text-cyan-100 italic">
                “{t('Design. Plan. Build a Better Tomorrow.')}”
              </p>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-blue-100">
                Logged in as <span className="font-bold text-slate-900 dark:text-white">{user.name}</span> · {user.qualifications || 'B.Arch, Structural Consultant'} · {user.city}
              </p>
            </div>
          </div>

          {/* Right: Modern building image & quick action */}
          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative h-28 w-44 sm:h-32 sm:w-52 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-white/30 shadow-lg dark:shadow-2xl bg-slate-900">
              <img
                src="/hero-architecture-hd.jpg"
                alt="Modern Architecture"
                className="h-full w-full object-cover transform hover:scale-105 transition duration-500"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                <span className="text-[0.68rem] font-bold text-white tracking-wide uppercase">
                  Modern Villa Blueprint
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  if (activeRequest) setUploadProjectId(activeRequest.id)
                  setShowUploadModal(true)
                }}
                className="whitespace-nowrap rounded-xl bg-[#FF7900] hover:bg-orange-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition flex items-center justify-center gap-1.5"
              >
                <span>+</span>
                <span>Upload 2D / 3D Design</span>
              </button>
              <button
                onClick={() => setActiveView('visualizer')}
                className="whitespace-nowrap rounded-xl bg-white dark:bg-white/15 hover:bg-slate-50 dark:hover:bg-white/25 border border-slate-300 dark:border-white/30 px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-white shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <span>🏛️</span>
                <span>3D Visualizer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MAIN DASHBOARD LAYOUT: Expandable Left Sidebar + Content   */}
      {/* ============================================================ */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Mobile Sidebar Toggle Button */}
        <div className="lg:hidden w-full flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-800">Architect Navigation</span>
            <span className="text-xs text-blue-600 font-bold capitalize">({activeView.replace('_', ' ')})</span>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="rounded-xl bg-[#1554C8] text-white px-3 py-1.5 text-xs font-bold"
          >
            {mobileSidebarOpen ? '✕ Close Menu' : '☰ Open Menu'}
          </button>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* LEFT SIDEBAR: Expandable Sections                            */}
        {/* ------------------------------------------------------------ */}
        <aside
          className={`${
            mobileSidebarOpen ? 'block' : 'hidden'
          } lg:block w-full lg:w-72 xl:w-80 shrink-0 space-y-4`}
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#1554C8] to-[#0D9488] text-white text-sm font-black shadow-xs">
                  📐
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Architect Console</h2>
                  <p className="text-[0.68rem] text-slate-500 font-medium">Design & Client Operations</p>
                </div>
              </div>
              <span className="rounded-full bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 text-[0.65rem] font-bold">
                Online
              </span>
            </div>

            {/* SECTION 1: OVERVIEW (Expandable) */}
            <div className="space-y-1">
              <button
                onClick={() => setOverviewExpanded(!overviewExpanded)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-black uppercase tracking-wider text-slate-700 hover:text-[#1554C8] hover:bg-slate-50 rounded-lg transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">📊</span>
                  <span>Overview</span>
                </div>
                <span className="text-slate-400 text-xs">{overviewExpanded ? '▾' : '▸'}</span>
              </button>

              {overviewExpanded && (
                <div className="pl-3 space-y-0.5 border-l-2 border-blue-100 ml-3 py-1">
                  <button
                    onClick={() => {
                      setActiveView('dashboard')
                      setMobileSidebarOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                      activeView === 'dashboard'
                        ? 'bg-[#1554C8] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>Dashboard Overview</span>
                    <span className="text-[0.65rem] opacity-75">Home</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('pending_requests')
                      setMobileSidebarOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                      activeView === 'pending_requests'
                        ? 'bg-[#1554C8] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>Pending Requests</span>
                    {pendingRequests.length > 0 && (
                      <span className="rounded-full bg-orange-100 text-[#FF7900] px-1.5 py-0.2 text-[0.65rem] font-black">
                        {pendingRequests.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('project_status')
                      setMobileSidebarOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                      activeView === 'project_status'
                        ? 'bg-[#1554C8] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>Project Status</span>
                    <span className="text-[0.65rem] opacity-75">{activeProjects.length} Active</span>
                  </button>
                </div>
              )}
            </div>

            {/* SECTION 2: DESIGN STUDIO (Expandable) */}
            <div className="space-y-1">
              <button
                onClick={() => setStudioExpanded(!studioExpanded)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-black uppercase tracking-wider text-slate-700 hover:text-[#0D9488] hover:bg-slate-50 rounded-lg transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-teal-600">🎨</span>
                  <span>Design Studio</span>
                </div>
                <span className="text-slate-400 text-xs">{studioExpanded ? '▾' : '▸'}</span>
              </button>

              {studioExpanded && (
                <div className="pl-3 space-y-0.5 border-l-2 border-teal-100 ml-3 py-1">
                  <button
                    onClick={() => {
                      setActiveView('customer_requests')
                      setMobileSidebarOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                      activeView === 'customer_requests'
                        ? 'bg-[#0D9488] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>Customer Requests</span>
                    <span className="text-[0.65rem] opacity-75">{requests.length}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('plans_2d')
                      setMobileSidebarOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                      activeView === 'plans_2d'
                        ? 'bg-[#0D9488] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>2D Floor Plans & CAD</span>
                    <span className="text-[0.65rem] opacity-75">{plans2dDesigns.length}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('elevations_3d')
                      setMobileSidebarOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                      activeView === 'elevations_3d'
                        ? 'bg-[#0D9488] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>3D Elevations & Models</span>
                    <span className="text-[0.65rem] opacity-75">{elevations3dDesigns.length}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('revisions')
                      setMobileSidebarOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                      activeView === 'revisions'
                        ? 'bg-[#0D9488] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>Design Revisions</span>
                    {pendingRevisions.length > 0 && (
                      <span className="rounded-full bg-amber-100 text-amber-800 px-1.5 py-0.2 text-[0.65rem] font-black">
                        {pendingRevisions.length}
                      </span>
                    )}
                  </button>

                  {/* Sub-tools for Studio */}
                  <div className="pt-1.5 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => {
                        setActiveView('visualizer')
                        setMobileSidebarOpen(false)
                      }}
                      className="rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 px-2 py-1 text-[0.68rem] font-bold border border-teal-200 transition"
                    >
                      🏛️ 3D Visualizer
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('takeoff')
                        setMobileSidebarOpen(false)
                      }}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 text-[0.68rem] font-bold border border-slate-200 transition"
                    >
                      🧮 Material Takeoff Calc
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('inspections')
                        setMobileSidebarOpen(false)
                      }}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 text-[0.68rem] font-bold border border-slate-200 transition"
                    >
                      🔍 Structural Inspections
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: PROJECTS & CLIENTS (Expandable) */}
            <div className="space-y-1">
              <button
                onClick={() => setProjectsExpanded(!projectsExpanded)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-black uppercase tracking-wider text-slate-700 hover:text-[#FF7900] hover:bg-slate-50 rounded-lg transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-orange-500">📁</span>
                  <span>Projects & Clients</span>
                </div>
                <span className="text-slate-400 text-xs">{projectsExpanded ? '▾' : '▸'}</span>
              </button>

              {projectsExpanded && (
                <div className="pl-3 space-y-0.5 border-l-2 border-orange-100 ml-3 py-1">
                  <button
                    onClick={() => {
                      setActiveView('my_projects')
                      setMobileSidebarOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                      activeView === 'my_projects'
                        ? 'bg-[#FF7900] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>My Projects (Active Projects)</span>
                    <span className="text-[0.65rem] opacity-75">{activeProjects.length}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('messages')
                      setMobileSidebarOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                      activeView === 'messages'
                        ? 'bg-[#FF7900] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>Customer Messages</span>
                    <span className="text-[0.65rem] opacity-75">Chat</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('approvals')
                      setMobileSidebarOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                      activeView === 'approvals'
                        ? 'bg-[#FF7900] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>Design Approvals</span>
                    <span className="text-[0.65rem] opacity-75">{completedProjects.length}</span>
                  </button>
                </div>
              )}
            </div>

            {/* SECTION 4: PROFILE & QUALIFICATIONS */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setActiveView('profile')
                  setMobileSidebarOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                  activeView === 'profile'
                    ? 'bg-[#08265B] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>👤</span>
                  <span>Profile & Qualifications</span>
                </div>
                <span className="text-[0.65rem] opacity-75">Edit</span>
              </button>
            </div>

            {/* Logout Shortcut */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={async () => {
                  await logout()
                  window.location.href = '/'
                }}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ------------------------------------------------------------ */}
        {/* RIGHT CONTENT AREA                                           */}
        {/* ------------------------------------------------------------ */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* ========================================================== */}
          {/* VIEW: MAIN DASHBOARD                                       */}
          {/* Summary Cards + 3 Large Visual Cards + Recent Customer Req */}
          {/* ========================================================== */}
          {activeView === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 1. THREE SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Summary Card 1: Pending Design Requests */}
                <div
                  onClick={() => setActiveView('pending_requests')}
                  className="rounded-2xl border-l-4 border-l-[#FF7900] border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition cursor-pointer group space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Pending Design Requests
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-orange-100 text-[#FF7900] flex items-center justify-center text-lg font-bold">
                      📋
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">{pendingRequests.length}</span>
                    <span className="text-[0.68rem] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                      Needs Review
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 group-hover:text-[#1554C8] transition">
                    Customer architectural briefs awaiting review →
                  </p>
                </div>

                {/* Summary Card 2: Active Projects */}
                <div
                  onClick={() => setActiveView('my_projects')}
                  className="rounded-2xl border-l-4 border-l-[#1554C8] border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition cursor-pointer group space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Active Projects
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-blue-100 text-[#1554C8] flex items-center justify-center text-lg font-bold">
                      🏗️
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">{activeProjects.length}</span>
                    <span className="text-[0.68rem] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      In Progress
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 group-hover:text-[#1554C8] transition">
                    2D CAD & 3D elevations actively being developed →
                  </p>
                </div>

                {/* Summary Card 3: Completed Designs */}
                <div
                  onClick={() => setActiveView('plans_2d')}
                  className="rounded-2xl border-l-4 border-l-[#0D9488] border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition cursor-pointer group space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Completed Designs
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-teal-100 text-[#0D9488] flex items-center justify-center text-lg font-bold">
                      🏆
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">
                      {completedProjects.length + allDesigns.length}
                    </span>
                    <span className="text-[0.68rem] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      Published
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 group-hover:text-[#0D9488] transition">
                    {completedProjects.length} approved · {allDesigns.length} drawings published →
                  </p>
                </div>
              </div>

              {/* 2. THREE LARGE VISUAL CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Large Card 1: Overview – View Dashboard */}
                <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    <img
                      src="/hero-visual-hd.png"
                      alt="Overview Visualization"
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500 opacity-90"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent flex items-end p-4">
                      <span className="rounded-full bg-blue-500/80 backdrop-blur-xs text-white text-[0.68rem] font-black uppercase px-2.5 py-0.5 tracking-wider">
                        Real-time Telemetry
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Overview</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Track overall architectural metrics, incoming customer requests, structural stages, and project approvals.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveView('project_status')}
                      className="w-full rounded-xl bg-[#1554C8] hover:bg-blue-700 text-white py-2.5 text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <span>View Dashboard</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

                {/* Large Card 2: Design Studio – Start Designing */}
                <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    <img
                      src="/hero-house-engineer.png"
                      alt="Design Studio Architectural Model"
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500 opacity-90"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent flex items-end p-4">
                      <span className="rounded-full bg-[#0D9488]/90 backdrop-blur-xs text-white text-[0.68rem] font-black uppercase px-2.5 py-0.5 tracking-wider">
                        CAD & 3D Elevations
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Design Studio</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Draft 2D layouts, publish certified AutoCAD drawings, inspect 3D elevations, and launch the 3D visualizer.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (activeRequest) setUploadProjectId(activeRequest.id)
                        setShowUploadModal(true)
                      }}
                      className="w-full rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white py-2.5 text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <span>+ Start Designing</span>
                      <span>🎨</span>
                    </button>
                  </div>
                </div>

                {/* Large Card 3: Projects & Clients – View Projects */}
                <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    <img
                      src="/hero-architecture-hd.jpg"
                      alt="Project Execution"
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500 opacity-90"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=800&q=80'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent flex items-end p-4">
                      <span className="rounded-full bg-[#FF7900]/90 backdrop-blur-xs text-white text-[0.68rem] font-black uppercase px-2.5 py-0.5 tracking-wider">
                        Client Operations
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Projects & Clients</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Manage active projects, send direct client messages, record structural inspections, and handle approvals.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveView('my_projects')}
                      className="w-full rounded-xl bg-[#FF7900] hover:bg-orange-600 text-white py-2.5 text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <span>View Projects</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. RECENT CUSTOMER REQUESTS */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Recent Customer Requests</h3>
                    <p className="text-xs text-slate-500">
                      Incoming architectural planning briefs from homeowners and developers.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveView('customer_requests')}
                    className="text-xs font-bold text-[#1554C8] hover:underline"
                  >
                    View All ({requests.length}) →
                  </button>
                </div>

                {requests.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No customer requests received yet. Customer submissions will automatically appear here.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requests.slice(0, 4).map((r) => (
                      <div
                        key={r.id}
                        className="rounded-2xl border border-slate-200 p-4 hover:border-blue-300 transition space-y-3 bg-slate-50/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900">{r.projectName}</h4>
                            <p className="text-xs text-slate-500">
                              Client: <span className="font-semibold text-slate-700">{r.customerName}</span> · {r.location}
                            </p>
                          </div>
                          <Pill tone={statusToneMap[r.status] || 'blue'}>{r.status}</Pill>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[0.72rem] bg-white p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-slate-400 block font-normal">Plot Dimensions:</span>
                            <span className="font-bold text-slate-800">{r.plotDimensions}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-normal">Est. Budget:</span>
                            <span className="font-bold text-slate-800">{inr(r.budget)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-normal">Floors / Style:</span>
                            <span className="font-bold text-slate-800">
                              G+{r.floors} ({r.designStyle || 'Contemporary'})
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-normal">Drawings:</span>
                            <span className="font-bold text-slate-800">{r.designs?.length || 0} published</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {r.status === 'Pending' ? (
                            <>
                              <button
                                onClick={() => handleAcceptRequest(r.id)}
                                className="flex-1 rounded-xl bg-[#1554C8] hover:bg-blue-700 text-white py-1.5 text-xs font-bold transition shadow-xs text-center"
                              >
                                Accept Request
                              </button>
                              <button
                                onClick={() => {
                                  setInfoReqId(r.id)
                                  setShowInfoModal(true)
                                }}
                                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition"
                              >
                                Ask Info
                              </button>
                              <button
                                onClick={() => handleDeclineRequest(r.id)}
                                className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition"
                              >
                                Decline
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedRequestId(r.id)
                                  setUploadProjectId(r.id)
                                  setShowUploadModal(true)
                                }}
                                className="flex-1 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white py-1.5 text-xs font-bold transition shadow-xs text-center"
                              >
                                + Upload Design
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequestId(r.id)
                                  setActiveView('messages')
                                }}
                                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition"
                              >
                                💬 Chat
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. BOTTOM MOTIVATIONAL BANNER */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-50 via-cyan-50/60 to-blue-50 border border-teal-200/80 text-slate-900 shadow-sm dark:bg-gradient-to-r dark:from-[#08265B] dark:via-[#0E7490] dark:to-[#0D9488] dark:border-transparent dark:text-white p-6 sm:p-8 transition-colors duration-200">
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 50%, #ffffff 2px, transparent 2px)',
                    backgroundSize: '24px 24px',
                  }}
                />
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-100/70 dark:bg-white/15 text-teal-700 dark:text-white backdrop-blur-md border border-teal-200 dark:border-white/20 text-3xl shadow-xs">
                      ❝
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Great designs build great spaces!
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-teal-100 max-w-xl">
                        Precision engineering, thoughtful architecture, and seamless collaboration from blueprint to foundation.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (activeRequest) setUploadProjectId(activeRequest.id)
                      setShowUploadModal(true)
                    }}
                    className="shrink-0 rounded-2xl bg-[#FF7900] hover:bg-orange-600 px-5 py-2.5 text-xs sm:text-sm font-black text-white shadow-lg transition"
                  >
                    + Upload New Design
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: PENDING REQUESTS                                     */}
          {/* ========================================================== */}
          {activeView === 'pending_requests' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Pending Customer Requests</h3>
                  <p className="text-xs text-slate-500">
                    Architectural design and structural consultation briefs awaiting review.
                  </p>
                </div>
                <span className="rounded-full bg-orange-100 text-[#FF7900] px-3 py-1 text-xs font-black">
                  {pendingRequests.length} Pending
                </span>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  🎉 No pending requests right now. All received briefs have been addressed!
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-slate-200 p-5 hover:border-amber-300 transition space-y-3 bg-amber-50/20"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h4 className="text-base font-extrabold text-slate-900">{r.projectName}</h4>
                          <p className="text-xs text-slate-600">
                            Client: <span className="font-bold text-slate-900">{r.customerName}</span> ({r.customerEmail} · {r.customerPhone})
                          </p>
                          <p className="text-xs text-slate-500">{r.location}</p>
                        </div>
                        <Pill tone="amber">{r.status}</Pill>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <span className="text-slate-400 block">Plot Dimensions</span>
                          <span className="font-bold text-slate-800">{r.plotDimensions}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Target Budget</span>
                          <span className="font-bold text-slate-800">{inr(r.budget)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Floors & Style</span>
                          <span className="font-bold text-slate-800">
                            G+{r.floors} ({r.designStyle || 'Contemporary'})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Target Rooms</span>
                          <span className="font-bold text-slate-800">{r.bedrooms || '3 BHK'}</span>
                        </div>
                      </div>

                      {r.requirements && (
                        <div className="rounded-xl bg-slate-50 p-3 text-xs border border-slate-200 text-slate-700">
                          <span className="font-bold block text-slate-900 mb-0.5">Customer Brief & Requirements:</span>
                          <p>{r.requirements}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-2">
                        <button
                          onClick={() => handleAcceptRequest(r.id)}
                          className="rounded-xl bg-[#1554C8] hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold transition shadow-xs"
                        >
                          ✓ Accept Request & Start Drafting
                        </button>
                        <button
                          onClick={() => {
                            setInfoReqId(r.id)
                            setShowInfoModal(true)
                          }}
                          className="rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition"
                        >
                          Request More Information
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(r.id)}
                          className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2 text-xs font-bold text-red-700 transition"
                        >
                          Decline Request
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: PROJECT STATUS                                       */}
          {/* ========================================================== */}
          {activeView === 'project_status' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Project Status & Milestones</h3>
                  <p className="text-xs text-slate-500">
                    Live execution status, architectural deliverables, and inspection status.
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('inspections')}
                  className="rounded-xl bg-teal-50 border border-teal-200 text-teal-800 px-3 py-1.5 text-xs font-bold hover:bg-teal-100 transition"
                >
                  🔍 View Inspections ({allInspections.length})
                </button>
              </div>

              {activeProjects.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No active projects currently. Accept a pending customer request to start.
                </div>
              ) : (
                <div className="space-y-4">
                  {activeProjects.map((r) => {
                    const progress =
                      r.status === 'Approved' || r.status === 'Completed'
                        ? 100
                        : r.status === 'Design Uploaded'
                        ? 75
                        : r.status === 'In Progress' || r.status === 'Accepted'
                        ? 45
                        : 20

                    return (
                      <div
                        key={r.id}
                        className="rounded-2xl border border-slate-200 p-5 space-y-3 hover:border-blue-300 transition"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h4 className="text-base font-extrabold text-slate-900">{r.projectName}</h4>
                            <p className="text-xs text-slate-500">
                              Client: {r.customerName} · {r.location} · {r.plotDimensions}
                            </p>
                          </div>
                          <Pill tone={statusToneMap[r.status] || 'blue'}>{r.status}</Pill>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span>Project Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#1554C8] to-[#0D9488] transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <button
                            onClick={() => {
                              setSelectedRequestId(r.id)
                              setUploadProjectId(r.id)
                              setShowUploadModal(true)
                            }}
                            className="rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs"
                          >
                            + Upload 2D / 3D Design
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequestId(r.id)
                              setActiveView('messages')
                            }}
                            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition"
                          >
                            💬 Client Messages
                          </button>
                          <button
                            onClick={() => {
                              setInspProjectId(r.id)
                              setShowInspModal(true)
                            }}
                            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition"
                          >
                            + Structural Audit
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: CUSTOMER REQUESTS (Design Studio)                    */}
          {/* ========================================================== */}
          {activeView === 'customer_requests' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Customer Requests</h3>
                  <p className="text-xs text-slate-500">
                    All customer design planning briefs received on the BuildConnect AI network.
                  </p>
                </div>
                <span className="rounded-full bg-blue-100 text-[#1554C8] px-3 py-1 text-xs font-bold">
                  {requests.length} Requests
                </span>
              </div>

              {requests.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">No customer design requests found.</div>
              ) : (
                <div className="space-y-4">
                  {requests.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-slate-200 p-5 space-y-3 hover:border-slate-300 transition"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h4 className="text-base font-extrabold text-slate-900">{r.projectName}</h4>
                          <p className="text-xs text-slate-600">
                            Client: <span className="font-bold text-slate-800">{r.customerName}</span> · {r.location}
                          </p>
                        </div>
                        <Pill tone={statusToneMap[r.status] || 'blue'}>{r.status}</Pill>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block font-normal">Plot Dimensions:</span>
                          <span className="font-bold text-slate-800">{r.plotDimensions}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-normal">Estimated Budget:</span>
                          <span className="font-bold text-slate-800">{inr(r.budget)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-normal">Building Floors:</span>
                          <span className="font-bold text-slate-800">G+{r.floors}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-normal">Published Drawings:</span>
                          <span className="font-bold text-slate-800">{r.designs?.length || 0}</span>
                        </div>
                      </div>

                      {r.requirements && (
                        <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700">
                          <span className="font-bold text-slate-900 block mb-0.5">Requirements:</span>
                          <p>{r.requirements}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => {
                            setSelectedRequestId(r.id)
                            setUploadProjectId(r.id)
                            setShowUploadModal(true)
                          }}
                          className="rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs"
                        >
                          + Upload Design
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequestId(r.id)
                            setActiveView('messages')
                          }}
                          className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition"
                        >
                          💬 Chat with Customer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: 2D FLOOR PLANS & CAD                                 */}
          {/* ========================================================== */}
          {activeView === 'plans_2d' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">2D Floor Plans & CAD</h3>
                  <p className="text-xs text-slate-500">
                    Municipal setback-compliant 2D layouts and AutoCAD technical drawings.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDesignType('2D Floor Plan')
                    setShowUploadModal(true)
                  }}
                  className="rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition"
                >
                  + Upload 2D Plan
                </button>
              </div>

              {plans2dDesigns.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No 2D Floor Plans uploaded yet. Click "+ Upload 2D Plan" to publish a drawing.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans2dDesigns.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-2xl border border-slate-200 p-4 space-y-3 hover:border-slate-300 transition"
                    >
                      <div className="h-40 rounded-xl bg-slate-900 overflow-hidden relative">
                        <img
                          src={d.previewUrl}
                          alt={d.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            ;(e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
                          }}
                        />
                        <div className="absolute top-2 left-2">
                          <span className="rounded-md bg-blue-900/80 backdrop-blur-xs text-white text-[0.65rem] font-bold px-2 py-0.5">
                            2D AutoCAD
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-extrabold text-slate-900">{d.title}</h4>
                        <p className="text-xs text-slate-500">
                          {d.dimensions} · {d.floors} · {d.rooms}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-2 text-[0.72rem] text-slate-600 border border-slate-100">
                        <span className="font-bold text-slate-800">Compliance & RCC Notes:</span>
                        <p>{d.structuralNotes || 'Compliant with IS 456:2000 structural concrete codes.'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: 3D DESIGNS & MODELS (3D Elevations & Models)        */}
          {/* ========================================================== */}
          {activeView === 'elevations_3d' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">3D Elevations & Models</h3>
                  <p className="text-xs text-slate-500">
                    High-definition architectural rendering, cantilever profiles, and materials visualization.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveView('visualizer')}
                    className="rounded-xl bg-[#1554C8] hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-bold transition shadow-xs"
                  >
                    🏛️ 3D Visualizer
                  </button>
                  <button
                    onClick={() => {
                      setDesignType('3D Elevation')
                      setShowUploadModal(true)
                    }}
                    className="rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition"
                  >
                    + Upload 3D Design
                  </button>
                </div>
              </div>

              {elevations3dDesigns.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No 3D Elevations uploaded yet. Click "+ Upload 3D Design" to publish.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {elevations3dDesigns.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-2xl border border-slate-200 p-4 space-y-3 hover:border-slate-300 transition"
                    >
                      <div className="h-44 rounded-xl bg-slate-900 overflow-hidden relative">
                        <img
                          src={d.previewUrl}
                          alt={d.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            ;(e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
                          }}
                        />
                        <div className="absolute top-2 left-2">
                          <span className="rounded-md bg-teal-800/80 backdrop-blur-xs text-white text-[0.65rem] font-bold px-2 py-0.5">
                            3D Elevation Render
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-extrabold text-slate-900">{d.title}</h4>
                        <p className="text-xs text-slate-500">
                          {d.dimensions} · {d.floors}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveView('visualizer')}
                          className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-1.5 text-xs font-bold transition text-center"
                        >
                          Open in 3D Visualizer →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: DESIGN REVISIONS                                     */}
          {/* ========================================================== */}
          {activeView === 'revisions' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Design Revisions</h3>
                  <p className="text-xs text-slate-500">
                    Client revision requests, room adjustments, and architect responses.
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-black">
                  {pendingRevisions.length} Open Revisions
                </span>
              </div>

              {pendingRevisions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  ✨ No pending revision requests. All designs are currently approved as drafted!
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((r) =>
                    (r.revisions || []).map((rev) => (
                      <div
                        key={rev.id}
                        className="rounded-2xl border border-slate-200 p-5 space-y-3 hover:border-slate-300 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900">
                              Revision on {r.projectName}
                            </h4>
                            <p className="text-xs text-slate-500">
                              Client: {r.customerName} · Requested: {new Date(rev.requestedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Pill tone={rev.status === 'Open' ? 'amber' : 'green'}>{rev.status}</Pill>
                        </div>

                        <div className="rounded-xl bg-amber-50/60 p-3 text-xs border border-amber-200 text-amber-900">
                          <span className="font-bold block mb-0.5">Client Feedback / Requested Changes:</span>
                          <p>{rev.notes}</p>
                        </div>

                        {rev.architectResponse && (
                          <div className="rounded-xl bg-blue-50/60 p-3 text-xs border border-blue-200 text-blue-900">
                            <span className="font-bold block mb-0.5">Architect Response:</span>
                            <p>{rev.architectResponse}</p>
                          </div>
                        )}

                        {rev.status === 'Open' && (
                          <div className="pt-1">
                            <button
                              onClick={() => {
                                setActiveRev({ reqId: r.id, revId: rev.id, notes: rev.notes })
                                setShowRevResponseModal(true)
                              }}
                              className="rounded-xl bg-[#1554C8] hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold transition shadow-xs"
                            >
                              Respond to Revision & Update Drawing
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: 3D VISUALIZER                                        */}
          {/* ========================================================== */}
          {activeView === 'visualizer' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">3D Visualizer & CAD Inspector</h3>
                  <p className="text-xs text-slate-500">
                    Interactive multi-layer architectural visualizer for elevations and MEP conduits.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-teal-50 border border-teal-200 text-teal-800 px-3 py-1 text-xs font-bold">
                    Floor: {activeFloor}
                  </span>
                </div>
              </div>

              {/* Layer Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Floor:</span>
                  {(['Ground Floor', 'First Floor', 'Terrace'] as const).map((floor) => (
                    <button
                      key={floor}
                      onClick={() => setActiveFloor(floor)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                        activeFloor === floor
                          ? 'bg-[#1554C8] text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {floor}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showShell}
                      onChange={(e) => setShowShell(e.target.checked)}
                      className="rounded"
                    />
                    <span>Building Shell</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showFrame}
                      onChange={(e) => setShowFrame(e.target.checked)}
                      className="rounded"
                    />
                    <span>RCC Frame</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showConduits}
                      onChange={(e) => setShowConduits(e.target.checked)}
                      className="rounded"
                    />
                    <span>MEP Conduits</span>
                  </label>
                </div>
              </div>

              {/* Interactive Visual Canvas Mockup */}
              <div className="relative h-96 w-full rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
                <img
                  src="/hero-house-engineer.png"
                  alt="3D Building Model"
                  className="max-h-80 object-contain drop-shadow-2xl"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
                  }}
                />

                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl p-3 text-white text-xs space-y-1">
                  <div className="font-black text-cyan-300">Active Blueprint Telemetry</div>
                  <div>Active Floor: {activeFloor}</div>
                  <div>Shell Layer: {showShell ? 'Visible' : 'Hidden'}</div>
                  <div>RCC Columns: {showFrame ? 'Verified (150 mm c/c)' : 'Hidden'}</div>
                  <div>Plumbing / Electrical: {showConduits ? 'Mapped' : 'Hidden'}</div>
                </div>

                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl p-3 text-white text-xs">
                  <span className="font-bold text-orange-400">Structural Specs:</span> M25 Concrete · Fe 500D TMT Steel
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: MATERIAL TAKEOFF CALCULATOR                          */}
          {/* ========================================================== */}
          {activeView === 'takeoff' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900">Material Takeoff Calc</h3>
                <p className="text-xs text-slate-500">
                  Engineering structural estimation as per Bureau of Indian Standards (IS 456).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Plot / Built-up Area per Floor (sq.ft)
                  </label>
                  <input
                    type="number"
                    value={calcArea}
                    onChange={(e) => setCalcArea(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Number of Floors</label>
                  <input
                    type="number"
                    value={calcFloors}
                    onChange={(e) => setCalcFloors(Number(e.target.value) || 1)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 p-4 text-center space-y-1 bg-white shadow-xs">
                  <span className="text-[0.68rem] font-bold uppercase text-slate-400">Cement</span>
                  <p className="text-2xl font-black text-slate-900">{estCementBags}</p>
                  <span className="text-xs text-slate-500 font-semibold">Bags (50 kg)</span>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 text-center space-y-1 bg-white shadow-xs">
                  <span className="text-[0.68rem] font-bold uppercase text-slate-400">TMT Steel</span>
                  <p className="text-2xl font-black text-slate-900">{estSteelTonnes}</p>
                  <span className="text-xs text-slate-500 font-semibold">Tonnes (Fe 500D)</span>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 text-center space-y-1 bg-white shadow-xs">
                  <span className="text-[0.68rem] font-bold uppercase text-slate-400">Sand</span>
                  <p className="text-2xl font-black text-slate-900">{estSandBrass}</p>
                  <span className="text-xs text-slate-500 font-semibold">Brass (River / M-Sand)</span>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 text-center space-y-1 bg-white shadow-xs">
                  <span className="text-[0.68rem] font-bold uppercase text-slate-400">Aggregates</span>
                  <p className="text-2xl font-black text-slate-900">{estAggregatesTonnes}</p>
                  <span className="text-xs text-slate-500 font-semibold">Tonnes (20 mm)</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: STRUCTURAL INSPECTIONS                               */}
          {/* ========================================================== */}
          {activeView === 'inspections' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Structural Inspections</h3>
                  <p className="text-xs text-slate-500">
                    On-site certified structural audits, rebar tie checks, and concrete slump test reports.
                  </p>
                </div>
                <button
                  onClick={() => setShowInspModal(true)}
                  className="rounded-xl bg-[#1554C8] hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-bold transition shadow-xs"
                >
                  + Record Site Audit
                </button>
              </div>

              {allInspections.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No structural inspection audits logged yet. Click "+ Record Site Audit" to add one.
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((r) =>
                    (r.inspections || []).map((insp) => (
                      <div
                        key={insp.id}
                        className="rounded-2xl border border-slate-200 p-5 space-y-3 hover:border-slate-300 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900">{insp.title}</h4>
                            <p className="text-xs text-slate-500">
                              Project: {r.projectName} · Stage: {insp.stage} · Date: {insp.date}
                            </p>
                          </div>
                          <Pill tone={insp.status === 'Passed' ? 'green' : 'amber'}>
                            {insp.status}
                          </Pill>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-slate-400 block font-normal">Rebar Spacing:</span>
                            <span className="font-bold text-slate-800">{insp.rebarSpacing}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-normal">Slump:</span>
                            <span className="font-bold text-slate-800">{insp.concreteSlump}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-normal">Clear Cover:</span>
                            <span className="font-bold text-slate-800">{insp.coverBlocks}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-normal">Curing:</span>
                            <span className="font-bold text-slate-800">{insp.curingPeriod}</span>
                          </div>
                        </div>

                        <div className="rounded-xl bg-white border border-slate-200 p-2.5 text-xs text-slate-700">
                          <span className="font-bold text-slate-900 block mb-0.5">Findings:</span>
                          <p>{insp.findings}</p>
                          <span className="text-[0.68rem] text-slate-400 block mt-1">
                            Certified By: {insp.certifiedBy}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: MY PROJECTS (Active Projects)                        */}
          {/* ========================================================== */}
          {activeView === 'my_projects' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Active Projects</h3>
                  <p className="text-xs text-slate-500">
                    Ongoing projects with 2D drawings, 3D renderings, and customer approvals.
                  </p>
                </div>
                <span className="rounded-full bg-blue-100 text-[#1554C8] px-3 py-1 text-xs font-black">
                  {activeProjects.length} Active
                </span>
              </div>

              {activeProjects.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No active projects currently. Accept a pending customer brief to begin.
                </div>
              ) : (
                <div className="space-y-4">
                  {activeProjects.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-slate-200 p-5 space-y-3 hover:border-slate-300 transition"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h4 className="text-base font-extrabold text-slate-900">{r.projectName}</h4>
                          <p className="text-xs text-slate-500">
                            Client: {r.customerName} ({r.customerEmail} · {r.customerPhone}) · {r.location}
                          </p>
                        </div>
                        <Pill tone={statusToneMap[r.status] || 'blue'}>{r.status}</Pill>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block font-normal">Plot Dimensions:</span>
                          <span className="font-bold text-slate-800">{r.plotDimensions}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-normal">Target Budget:</span>
                          <span className="font-bold text-slate-800">{inr(r.budget)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-normal">Floors & Style:</span>
                          <span className="font-bold text-slate-800">
                            G+{r.floors} ({r.designStyle || 'Contemporary'})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-normal">Drawings Uploaded:</span>
                          <span className="font-bold text-slate-800">{r.designs?.length || 0}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => {
                            setSelectedRequestId(r.id)
                            setUploadProjectId(r.id)
                            setShowUploadModal(true)
                          }}
                          className="rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white px-3.5 py-1.5 text-xs font-bold transition shadow-xs"
                        >
                          + Upload Design Drawing
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequestId(r.id)
                            setActiveView('messages')
                          }}
                          className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition"
                        >
                          💬 Client Messages
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: CUSTOMER MESSAGES                                    */}
          {/* ========================================================== */}
          {activeView === 'messages' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Customer Messages</h3>
                  <p className="text-xs text-slate-500">
                    Direct communication with project homeowners and builders.
                  </p>
                </div>

                {/* Project Selector for Chat */}
                <select
                  value={activeRequest?.id || ''}
                  onChange={(e) => setSelectedRequestId(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800"
                >
                  {requests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.projectName} ({r.customerName})
                    </option>
                  ))}
                </select>
              </div>

              {!activeRequest ? (
                <div className="p-12 text-center text-slate-400 text-xs">No active project conversation found.</div>
              ) : (
                <div className="space-y-4">
                  {/* Messages Feed */}
                  <div className="h-80 overflow-y-auto rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-3">
                    {(activeRequest.messages || []).length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400">
                        No messages exchanged yet. Send a message to start communicating with {activeRequest.customerName}.
                      </div>
                    ) : (
                      activeRequest.messages?.map((m) => {
                        const isMe = m.senderRole === 'Architect / Engineer'
                        return (
                          <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-md rounded-2xl p-3 text-xs shadow-xs ${
                                isMe
                                  ? 'bg-[#1554C8] text-white rounded-br-none'
                                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3 text-[0.65rem] opacity-75 mb-1">
                                <span className="font-bold">{m.senderName}</span>
                                <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="leading-relaxed">{m.text}</p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Send Chat Form */}
                  <form onSubmit={handleSendChat} className="flex gap-2">
                    <input
                      type="text"
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder={`Message ${activeRequest.customerName} about ${activeRequest.projectName}…`}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!chatText.trim()}
                      className="rounded-xl bg-[#1554C8] hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 text-xs font-bold shadow-xs transition"
                    >
                      Send Message
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: DESIGN APPROVALS                                     */}
          {/* ========================================================== */}
          {activeView === 'approvals' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900">Design Approvals</h3>
                <p className="text-xs text-slate-500">
                  Track client sign-offs, municipal approvals, and stamped architectural layouts.
                </p>
              </div>

              {completedProjects.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No projects with completed design approvals yet. Once client approves a plan, it appears here.
                </div>
              ) : (
                <div className="space-y-4">
                  {completedProjects.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-emerald-200 bg-emerald-50/20 p-5 space-y-2 hover:border-emerald-300 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-base font-extrabold text-slate-900">{r.projectName}</h4>
                          <p className="text-xs text-slate-500">
                            Client: {r.customerName} · Approved as per IS 456 · Location: {r.location}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-black border border-emerald-200">
                          ✓ Approved
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {r.designs?.length || 0} drawing files certified and delivered to client dashboard. Ready for contractor execution.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW: PROFILE & QUALIFICATIONS                             */}
          {/* ========================================================== */}
          {activeView === 'profile' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900">Profile & Qualifications</h3>
                <p className="text-xs text-slate-500">
                  Manage your Council of Architecture registration, credentials, and contact details.
                </p>
              </div>

              {/* Profile Summary Card */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100">
                <div className="h-20 w-20 rounded-2xl bg-[#08265B] text-white flex items-center justify-center text-3xl font-black shadow-md shrink-0">
                  🏛️
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h4 className="text-lg font-black text-slate-900">{user.name}</h4>
                    <span className="rounded-full bg-blue-100 text-[#1554C8] px-2.5 py-0.5 text-xs font-bold border border-blue-200">
                      Verified Architect
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600">{user.qualifications || 'B.Arch, Structural Consultant'}</p>
                  <p className="text-xs text-slate-500">COA Reg No: {user.coaReg || 'CA/2018/98421'} · {user.experienceYears || 11}+ Years Experience · {user.city}</p>
                </div>
              </div>

              {/* Editable Profile Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 mb-1">Architect Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1">COA Registration Number</label>
                    <input
                      type="text"
                      required
                      value={profileCoa}
                      onChange={(e) => setProfileCoa(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 mb-1">Degrees & Qualifications</label>
                    <input
                      type="text"
                      value={profileQual}
                      onChange={(e) => setProfileQual(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1">Years of Experience</label>
                    <input
                      type="number"
                      value={profileExp}
                      onChange={(e) => setProfileExp(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 mb-1">City / Base Location</label>
                    <input
                      type="text"
                      value={profileCity}
                      onChange={(e) => setProfileCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Specialization Areas</label>
                  <input
                    type="text"
                    value={profileSpec}
                    onChange={(e) => setProfileSpec(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Professional Portfolio Bio</label>
                  <textarea
                    rows={3}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="rounded-xl bg-[#1554C8] hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold transition shadow-xs"
                  >
                    {profileSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: Upload 2D / 3D Design                               */}
      {/* ============================================================ */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="card w-full max-w-xl p-6 space-y-4 text-xs font-semibold my-8 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Upload Architectural Design Drawing</h3>
                <p className="text-slate-500 text-[0.72rem] font-normal">
                  Publish 2D AutoCAD layout or 3D elevation to client dashboard.
                </p>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-black text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadDesign} className="space-y-3">
              <div>
                <label className="block text-slate-700 mb-1">Select Target Project / Client</label>
                <select
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800"
                  value={uploadProjectId || activeRequest?.id || ''}
                  onChange={(e) => setUploadProjectId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Select Project --</option>
                  {requests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.projectName} ({r.customerName} - {r.plotDimensions})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Design Drawing Title</label>
                  <input
                    type="text"
                    required
                    value={designTitle}
                    onChange={(e) => setDesignTitle(e.target.value)}
                    placeholder="e.g. Ground Floor Vaastu 2D Layout v1.0"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Drawing / Deliverable Type</label>
                  <select
                    value={designType}
                    onChange={(e) => setDesignType(e.target.value as DesignType)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                  >
                    <option value="2D Floor Plan">2D Floor Plan</option>
                    <option value="3D Elevation">3D Elevation</option>
                    <option value="Structural Drawing">Structural Drawing</option>
                    <option value="Electrical / Plumbing">Electrical / Plumbing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Plot Dimensions</label>
                  <input
                    type="text"
                    value={designPlotSize}
                    onChange={(e) => setDesignPlotSize(e.target.value)}
                    placeholder="e.g. 30 ft × 40 ft (1,200 sq.ft)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Floors Configuration</label>
                  <input
                    type="text"
                    value={designFloors}
                    onChange={(e) => setDesignFloors(e.target.value)}
                    placeholder="e.g. G + 1 Floor"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Rooms / Layout</label>
                  <input
                    type="text"
                    value={designRooms}
                    onChange={(e) => setDesignRooms(e.target.value)}
                    placeholder="e.g. 3 BHK Duplex"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Concrete Mix</label>
                  <input
                    type="text"
                    value={designConcrete}
                    onChange={(e) => setDesignConcrete(e.target.value)}
                    placeholder="e.g. M25 Grade"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Est. Steel (Tonnes)</label>
                  <input
                    type="text"
                    value={designSteel}
                    onChange={(e) => setDesignSteel(e.target.value)}
                    placeholder="e.g. 5.4"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Preview Image URL (or CAD Render)</label>
                <input
                  type="url"
                  value={designPreviewUrl}
                  onChange={(e) => setDesignPreviewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Structural & Compliance Notes</label>
                <textarea
                  rows={2}
                  value={designNotes}
                  onChange={(e) => setDesignNotes(e.target.value)}
                  placeholder="Designed as per IS 456:2000 code. Minimum clear cover 40 mm."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={uploadSubmitting}
                  className="rounded-xl bg-[#FF7900] hover:bg-orange-600 text-white flex-1 py-2 text-xs font-bold transition shadow-xs"
                >
                  {uploadSubmitting ? 'Publishing…' : 'Publish Design to Client'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn2 py-2 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: Request More Information                            */}
      {/* ============================================================ */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-md p-6 space-y-4 text-xs font-semibold border border-slate-200 shadow-xl">
            <h3 className="text-base font-extrabold text-slate-900">Request Information from Client</h3>
            <form onSubmit={handleSubmitMoreInfo} className="space-y-3">
              <div>
                <label className="block text-slate-700 mb-1">What additional details do you require?</label>
                <textarea
                  rows={3}
                  required
                  value={infoMessage}
                  onChange={(e) => setInfoMessage(e.target.value)}
                  placeholder="e.g. Please provide soil test report or municipal setback guidelines..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn flex-1 py-2 text-xs font-bold">
                  Send to Client
                </button>
                <button type="button" onClick={() => setShowInfoModal(false)} className="btn2 py-2 text-xs">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: Respond to Revision                                 */}
      {/* ============================================================ */}
      {showRevResponseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-md p-6 space-y-4 text-xs font-semibold border border-slate-200 shadow-xl">
            <h3 className="text-base font-extrabold text-slate-900">Respond to Client Revision</h3>
            <p className="text-slate-600 bg-slate-50 p-2 rounded-lg italic">"{activeRev?.notes}"</p>
            <form onSubmit={handleRespondRevision} className="space-y-3">
              <div>
                <label className="block text-slate-700 mb-1">Architect Response / Actions Taken</label>
                <textarea
                  rows={3}
                  required
                  value={revResponseText}
                  onChange={(e) => setRevResponseText(e.target.value)}
                  placeholder="e.g. Enlarged master bedroom and updated balcony cantilever per client preference."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn flex-1 py-2 text-xs font-bold">
                  Submit Response
                </button>
                <button type="button" onClick={() => setShowRevResponseModal(false)} className="btn2 py-2 text-xs">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: Add Structural Inspection Record                    */}
      {/* ============================================================ */}
      {showInspModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-lg p-6 space-y-4 text-xs font-semibold border border-slate-200 shadow-xl">
            <h3 className="text-base font-extrabold text-slate-900">Record Structural Inspection Audit</h3>
            <form onSubmit={handleAddInspection} className="space-y-3">
              <div>
                <label className="block text-slate-700 mb-1">Select Project</label>
                <select
                  value={inspProjectId || activeRequest?.id || ''}
                  onChange={(e) => setInspProjectId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                  required
                >
                  <option value="" disabled>-- Select Project --</option>
                  {requests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.projectName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Inspection Title</label>
                  <input
                    type="text"
                    required
                    value={inspTitle}
                    onChange={(e) => setInspTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Stage</label>
                  <input
                    type="text"
                    required
                    value={inspStage}
                    onChange={(e) => setInspStage(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Rebar Spacing</label>
                  <input
                    type="text"
                    value={inspSpacing}
                    onChange={(e) => setInspSpacing(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Audit Status</label>
                  <select
                    value={inspStatus}
                    onChange={(e) => setInspStatus(e.target.value as 'Passed' | 'Action Required')}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                  >
                    <option value="Passed">Passed</option>
                    <option value="Action Required">Action Required</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Inspection Date</label>
                  <input
                    type="date"
                    value={inspDate}
                    onChange={(e) => setInspDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Concrete Slump</label>
                  <input
                    type="text"
                    value={inspSlump}
                    onChange={(e) => setInspSlump(e.target.value)}
                    placeholder="e.g. 100 mm slump"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Cover Blocks</label>
                  <input
                    type="text"
                    value={inspCover}
                    onChange={(e) => setInspCover(e.target.value)}
                    placeholder="e.g. 40 mm clear cover"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Curing Period</label>
                  <input
                    type="text"
                    value={inspCuring}
                    onChange={(e) => setInspCuring(e.target.value)}
                    placeholder="e.g. 14 days pond curing"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Findings & Audit Observations</label>
                <textarea
                  rows={2}
                  value={inspFindings}
                  onChange={(e) => setInspFindings(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn flex-1 py-2 text-xs font-bold">
                  Sign & Certify Audit
                </button>
                <button type="button" onClick={() => setShowInspModal(false)} className="btn2 py-2 text-xs">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
