import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Field, Modal, PageShell, Pill, inr } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useBookings } from '../hooks/useBookings'
import { useI18n } from '../lib/i18n'
import { isBuilderOrContractor, type BookingStatus, type UserProfile } from '../types'
import BuilderDashboard from '../components/dashboards/BuilderDashboard'
import WorkerDashboard from '../components/dashboards/WorkerDashboard'
import ArchitectDashboard from '../components/dashboards/ArchitectDashboard'
import CustomerArchitectSection from '../components/dashboards/CustomerArchitectSection'
import ChatPanel from '../components/ChatPanel'

const tone: Record<BookingStatus, 'amber' | 'green' | 'red'> = { pending: 'amber', accepted: 'green', rejected: 'red' }

interface DashboardProps {
  initialTab?: 'overview' | 'messages'
}

export default function Dashboard({ initialTab }: DashboardProps = {}) {
  const { user } = useAuth()

  if (!user) {
    return (
      <PageShell title="Dashboard" subtitle="Access your personalized role workspace">
        <div className="mx-auto max-w-md card p-8 text-center space-y-4 shadow-sm border border-slate-200">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-2xl font-bold">
            🔒
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Sign In to View Dashboard</h2>
          <p className="text-sm text-slate-500">
            Please sign in to access your role-specific dashboard and manage your projects, bookings, and designs.
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link to="/login" className="btn w-full py-2.5 text-center font-bold">
              Sign In to BuildConnect AI
            </Link>
            <Link to="/register" className="btn2 w-full py-2.5 text-center font-semibold">
              Don't have an account? Register Now
            </Link>
          </div>
        </div>
      </PageShell>
    )
  }

  // 1. UNIFIED BUILDER / CONTRACTOR DASHBOARD
  if (isBuilderOrContractor(user.role)) {
    return (
      <div className="w-full max-w-[1536px] mx-auto px-2 sm:px-4 lg:px-8 py-5">
        <BuilderDashboard key={user.uid} user={user} />
      </div>
    )
  }

  // 3. WORKER DASHBOARD
  if (user.role === 'Worker') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <WorkerDashboard key={user.uid} user={user} />
      </div>
    )
  }

  // 4. ARCHITECT / ENGINEER DASHBOARD
  if (user.role === 'Architect / Engineer') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <ArchitectDashboard key={user.uid} user={user} />
      </div>
    )
  }

  // 5. CUSTOMER DASHBOARD
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <CustomerDashboardView key={user.uid} user={user} initialTab={initialTab} />
    </div>
  )
}

/** Customer Dashboard with separate Overview and Messages options */
function CustomerDashboardView({ user, initialTab }: { user: UserProfile; initialTab?: 'overview' | 'messages' }) {
  const { t } = useI18n()
  const toast = useToast()
  const { updateProfile } = useAuth()
  const { bookings, loading, error } = useBookings(user)
  const [searchParams, setSearchParams] = useSearchParams()

  const urlTab = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<'overview' | 'messages'>(() => {
    if (initialTab === 'messages' || urlTab === 'messages') return 'messages'
    return 'overview'
  })

  // Sync tab with URL search parameter
  useEffect(() => {
    if (urlTab === 'messages') {
      setActiveTab('messages')
    } else if (urlTab === 'overview' || urlTab === 'dashboard') {
      setActiveTab('overview')
    }
  }, [urlTab])

  const handleTabChange = (tab: 'overview' | 'messages') => {
    setActiveTab(tab)
    if (tab === 'messages') {
      setSearchParams({ tab: 'messages' })
    } else {
      setSearchParams({})
    }
  }

  // Selected chat contact - NOT auto-opened in Overview
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [bookingFilter, setBookingFilter] = useState<'all' | 'builder' | 'worker'>('all')

  const openChatForBooking = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setActiveTab('messages')
    setSearchParams({ tab: 'messages' })
  }

  // Profile editing state
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [profName, setProfName] = useState(user.name)
  const [profPhone, setProfPhone] = useState(user.phone || '')
  const [profCity, setProfCity] = useState(user.city || '')
  const [profBio, setProfBio] = useState(user.bio || '')
  const [savingProfile, setSavingProfile] = useState(false)

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    if (!profName.trim()) return
    setSavingProfile(true)
    try {
      await updateProfile({
        name: profName.trim(),
        phone: profPhone.trim(),
        city: profCity.trim(),
        bio: profBio.trim(),
      })
      toast('Profile updated successfully!')
      setShowEditProfile(false)
    } catch (err: any) {
      toast(err?.message || 'Failed to update profile', 'err')
    } finally {
      setSavingProfile(false)
    }
  }

  const builderBookings = bookings.filter((b) => b.bookingType === 'builder' || b.skill === 'Builder')
  const workerBookings = bookings.filter((b) => b.bookingType !== 'builder' && b.skill !== 'Builder')
  const pendingBookings = bookings.filter((b) => b.status === 'pending')

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'builder') return b.bookingType === 'builder' || b.skill === 'Builder'
    if (bookingFilter === 'worker') return b.bookingType !== 'builder' && b.skill !== 'Builder'
    return true
  })

  const openBooking = bookings.find((b) => b.id === selectedBookingId) ?? null

  return (
    <div className="space-y-6">
      {/* 1. Customer Portal Header - Clean Light Mode, Navy in Dark Mode */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-slate-50 to-white border border-blue-200/80 text-slate-900 shadow-sm dark:bg-gradient-to-r dark:from-navy dark:to-brand dark:border-transparent dark:text-white p-6 transition-colors duration-200">
        <div>
          <span className="rounded-lg bg-orange-100 text-[#FF7900] border border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
            {t('Customer Portal')}
          </span>
          <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {t('Welcome back,')} <span>{user.name}</span>!
          </h1>
          <p className="text-sm text-slate-600 dark:text-blue-100">
            {t('You are logged in as a')} <span className="font-semibold text-slate-800 dark:text-white">{t(user.role)}</span> · {user.city} · {t('Manage your bookings, requests, and direct chat')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setProfName(user.name)
              setProfPhone(user.phone || '')
              setProfCity(user.city || '')
              setProfBio(user.bio || '')
              setShowEditProfile(true)
            }}
            className="rounded-xl bg-white dark:bg-white/10 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/20 border border-slate-300 dark:border-white/20 shadow-xs transition"
          >
            ⚙️ {t('Edit Profile')}
          </button>
          <Link
            to="/track"
            className="rounded-xl bg-white dark:bg-white/10 px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/20 border border-slate-300 dark:border-white/20 shadow-xs transition"
          >
            {t('Track Site Construction →')}
          </Link>
          <Link
            to="/builders"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 shadow-md transition"
          >
            {t('+ Book A Builder')}
          </Link>
          <Link
            to="/workers"
            className="rounded-xl bg-[#FF7900] px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 shadow-lg transition"
          >
            {t('+ Book A Worker')}
          </Link>
        </div>
      </div>

      {/* Edit Customer Profile Modal */}
      {showEditProfile && (
        <Modal title="My Customer Profile" onClose={() => setShowEditProfile(false)}>
          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs font-semibold">
            <Field label="Full Name">
              <input
                className="inp mt-1 text-sm font-normal"
                value={profName}
                onChange={(e) => setProfName(e.target.value)}
                required
              />
            </Field>
            <Field label="Phone / Mobile Number">
              <input
                className="inp mt-1 text-sm font-normal"
                value={profPhone}
                onChange={(e) => setProfPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </Field>
            <Field label="City / Location">
              <input
                className="inp mt-1 text-sm font-normal"
                value={profCity}
                onChange={(e) => setProfCity(e.target.value)}
                placeholder="e.g. Hyderabad"
              />
            </Field>
            <Field label="About / Personal Notes">
              <textarea
                className="inp mt-1 text-sm font-normal"
                rows={3}
                value={profBio}
                onChange={(e) => setProfBio(e.target.value)}
                placeholder="Residential plot owner planning G+2 duplex construction..."
              />
            </Field>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={savingProfile} className="btn flex-1 py-2 text-xs font-bold">
                {savingProfile ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setShowEditProfile(false)}
                className="btn2 !bg-slate-200 !text-slate-800 py-2 text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 2. Customer Dashboard Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {/* Dashboard (Overview) Tab */}
          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-extrabold transition shadow-xs ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-[#0c1b38] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>📊</span>
            <span>{t('Dashboard')}</span>
          </button>

          {/* Messages Tab */}
          <button
            type="button"
            onClick={() => handleTabChange('messages')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-extrabold transition shadow-xs ${
              activeTab === 'messages'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-[#0c1b38] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>💬</span>
            <span>{t('Messages')}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[0.68rem] font-black ${
                activeTab === 'messages'
                  ? 'bg-white text-blue-700'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
              }`}
            >
              {bookings.length}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {activeTab === 'overview' ? (
            <span>📋 {t('Dashboard Overview')}</span>
          ) : (
            <span>💬 {t('Direct Chat with Builders & Workers')}</span>
          )}
        </div>
      </div>

      {/* 3. Tab Content */}
      {activeTab === 'overview' ? (
        /* ================= OVERVIEW PAGE (NO AUTOMATIC CHAT) ================= */
        <div className="space-y-8">
          {/* A. Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c1b38]">
              <div className="flex items-center justify-between">
                <span className="text-2xl">📦</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{bookings.length}</span>
              </div>
              <div className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">{t('Total Bookings')}</div>
            </div>
            <div className="card p-5 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c1b38]">
              <div className="flex items-center justify-between">
                <span className="text-2xl">👷</span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{workerBookings.length}</span>
              </div>
              <div className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">{t('Active Workers')}</div>
            </div>
            <div className="card p-5 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c1b38]">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🏗️</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{builderBookings.length}</span>
              </div>
              <div className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">{t('Builders Hired')}</div>
            </div>
            <div className="card p-5 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c1b38]">
              <div className="flex items-center justify-between">
                <span className="text-2xl">⏳</span>
                <span className="text-2xl font-black text-orange-600 dark:text-orange-400">{pendingBookings.length}</span>
              </div>
              <div className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">{t('Pending Confirmations')}</div>
            </div>
          </div>

          {/* B. Project Status Section */}
          <div className="card p-6 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c1b38] transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-lg">
                  🏗️
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {t('Project Status')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Residential Villa Construction (G+2) · {user.city || 'Hyderabad'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 px-3 py-1 text-xs font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t('Active Site Execution')}
                </span>
                <Link
                  to="/track"
                  className="btn2 !py-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  {t('View Detailed Site Tracking →')}
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">Phase 3: Superstructure & Brickwork</span>
                <span className="text-blue-600 dark:text-blue-400">65% Completed</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-[#FF7900] h-2.5 rounded-full" style={{ width: '65%' }} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-500 text-[0.68rem]">Phase 1</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">Foundation ✅</div>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
                  <div className="text-blue-600 dark:text-blue-400 text-[0.68rem]">Phase 2</div>
                  <div className="font-bold text-blue-700 dark:text-blue-300">Brickwork (65%) 🔄</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-500 text-[0.68rem]">Phase 3</div>
                  <div className="font-bold text-slate-600 dark:text-slate-400">Electrical ⏳</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-500 text-[0.68rem]">Phase 4</div>
                  <div className="font-bold text-slate-600 dark:text-slate-400">Finishing ⏳</div>
                </div>
              </div>
            </div>
          </div>

          {/* C. Booking Summaries Section (No chat panel open) */}
          <section aria-label={t('myBookings')} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📋 {t('Booking Summaries')}</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {bookings.length}
                </span>
              </h2>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Link to="/builders" className="text-brand hover:underline font-bold">
                  + Find Builder
                </Link>
                <span className="text-slate-300">|</span>
                <Link to="/workers" className="text-slate-600 dark:text-slate-400 hover:text-brand hover:underline font-bold">
                  + Hire Worker
                </Link>
              </div>
            </div>

            {bookings.length > 0 && (
              <div className="flex items-center gap-1.5 pb-1">
                {(['all', 'builder', 'worker'] as const).map((tab) => {
                  const count =
                    tab === 'all'
                      ? bookings.length
                      : tab === 'builder'
                      ? builderBookings.length
                      : workerBookings.length
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setBookingFilter(tab)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                        bookingFilter === tab
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {tab === 'all' ? t('All Bookings') : tab === 'builder' ? t('Builders') : t('Workers')} ({count})
                    </button>
                  )
                })}
              </div>
            )}

            {loading && <p className="text-sm text-slate-500">Loading…</p>}
            {error && <p className="err">{error}</p>}
            {!loading && !error && bookings.length === 0 && (
              <div className="card p-8 text-center space-y-3">
                <p className="text-sm text-slate-500">No bookings yet.</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
                  <Link to="/builders" className="btn text-xs">
                    Browse & Book Builders
                  </Link>
                  <Link to="/workers" className="btn2 text-xs">
                    Browse Workers
                  </Link>
                </div>
              </div>
            )}

            {filteredBookings.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredBookings.map((b) => {
                  const isBuilder = b.bookingType === 'builder' || b.skill === 'Builder'
                  const displayName = b.builderName || b.workerName || 'Service Provider'
                  return (
                    <div
                      key={b.id}
                      className="card p-4 flex flex-col justify-between border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0c1b38] hover:border-blue-400 dark:hover:border-blue-600 transition shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[0.7rem] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded">
                              {b.id}
                            </span>
                            {isBuilder ? (
                              <span className="rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 text-[0.65rem] font-bold">
                                🏗️ Builder
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[0.65rem] font-bold">
                                👷 Worker
                              </span>
                            )}
                          </div>
                          <Pill tone={tone[b.status]}>{t(b.status)}</Pill>
                        </div>

                        <div className="font-extrabold text-slate-900 dark:text-white text-base">
                          {displayName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {isBuilder ? 'General Builder' : b.skill} · 📅 {b.meetingDate || b.date}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          📍 {b.site}
                        </div>
                        {b.budget ? (
                          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1.5">
                            Estimated Budget: {inr(b.budget)}
                          </div>
                        ) : null}

                        {(b.requirements || b.note) && (
                          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50/70 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80">
                            "{b.requirements || b.note}"
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <span className="text-[0.68rem] text-slate-400">
                          {b.customerPhone ? `Contact: ${b.customerPhone}` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => openChatForBooking(b.id)}
                          className="btn !py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 shadow-xs"
                        >
                          <span>💬</span>
                          <span>{isBuilder ? t('Chat with Builder') : t('Chat with Worker')}</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* D. Customer Architectural Design & Blueprints Integration */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
            <CustomerArchitectSection user={user} />
          </div>
        </div>
      ) : (
        /* ================= MESSAGES PAGE (2-COLUMN CHAT INTERFACE) ================= */
        <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
          {/* Left Column: Booking Contacts */}
          <section aria-label={t('Booking Contacts')} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>💬 {t('Booking Contacts')}</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {filteredBookings.length}
                </span>
              </h2>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 pb-1">
              {(['all', 'builder', 'worker'] as const).map((tab) => {
                const count =
                  tab === 'all'
                    ? bookings.length
                    : tab === 'builder'
                    ? builderBookings.length
                    : workerBookings.length
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setBookingFilter(tab)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      bookingFilter === tab
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tab === 'all' ? t('All Bookings') : tab === 'builder' ? t('Builders') : t('Workers')} ({count})
                  </button>
                )
              })}
            </div>

            {/* Contacts list */}
            {filteredBookings.length === 0 ? (
              <div className="card p-6 text-center text-sm text-slate-500">
                {t('No conversations yet')}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredBookings.map((b) => {
                  const isBuilder = b.bookingType === 'builder' || b.skill === 'Builder'
                  const displayName = b.builderName || b.workerName || 'Contact'
                  const isSelected = b.id === selectedBookingId
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBookingId(b.id)}
                      className={`w-full text-left card p-3 transition-all rounded-xl border ${
                        isSelected
                          ? 'ring-2 ring-blue-600 border-blue-500 bg-blue-50/60 dark:bg-blue-900/30'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1b38] hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                          {displayName}
                        </span>
                        <Pill tone={tone[b.status]}>{t(b.status)}</Pill>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>{isBuilder ? '🏗️ Builder' : `👷 ${b.skill}`}</span>
                        <span>·</span>
                        <span className="font-mono text-[0.68rem]">{b.id}</span>
                      </div>
                      <div className="text-[0.72rem] text-slate-600 dark:text-slate-300 truncate mt-1">
                        📍 {b.site}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* Right Column: Chat Conversation */}
          <section aria-label={t('messages')}>
            {openBooking ? (
              <ChatPanel booking={openBooking} user={user} />
            ) : (
              <div className="card p-10 text-center space-y-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c1b38] transition-colors duration-200">
                <span className="text-4xl">💬</span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                  {t('Direct Chat with Builders & Workers')}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {t('Select a contact to start conversation')}
                </p>
                {filteredBookings.length > 0 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBookingId(filteredBookings[0].id)}
                      className="btn text-xs font-bold px-4 py-2"
                    >
                      💬 {t('Open Chat')} ({filteredBookings[0].builderName || filteredBookings[0].workerName})
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
