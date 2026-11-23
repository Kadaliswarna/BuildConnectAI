import { useEffect, useState, type FormEvent } from 'react'
import { inr, Pill, Stars } from '../ui'
import {
  getStoredJobs,
  getStoredPayments,
  saveAlerts,
  getStoredAlerts,
  type WorkerJob,
  type WorkerPayment,
  type EmergencyAlert,
} from '../../data/multiRoleData'
import type { UserProfile, Skill, Booking, BookingStatus } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useI18n } from '../../lib/i18n'
import { useBookings } from '../../hooks/useBookings'
import { doc, updateDoc } from 'firebase/firestore'
import { db, requireDb } from '../../lib/firebase'
import { authMessage } from '../../lib/errors'
import ChatPanel from '../ChatPanel'
import { SEED_WORKERS } from '../../data/seed'

interface WorkerDashboardProps {
  user: UserProfile
}

type WorkerTab =
  | 'voice'
  | 'profile'
  | 'requests'
  | 'find_jobs'
  | 'wages'
  | 'history'
  | 'notifications'

type RecognitionLang = 'te-IN' | 'hi-IN' | 'en-IN'

export default function WorkerDashboard({ user }: WorkerDashboardProps) {
  const { t } = useI18n()
  const { updateProfile, logout } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<WorkerTab>('voice')
  const [isAvailable, setIsAvailable] = useState(true)
  const [jobs, setJobs] = useState<WorkerJob[]>([])
  const [payments, setPayments] = useState<WorkerPayment[]>([])
  const { bookings: customerBookings } = useBookings(user)
  const [openBookingId, setOpenBookingId] = useState<string | null>(null)

  // Profile fields state
  const [profName, setProfName] = useState(user.name)
  const [profSkill, setProfSkill] = useState<Skill>((user.skill as Skill) || 'Mason')
  const [profCity, setProfCity] = useState(user.city || 'Hyderabad')
  const [profPhone, setProfPhone] = useState(user.phone || '+91 91234 56789')
  const [profExp, setProfExp] = useState(user.experienceYears || 8)
  const [profBio, setProfBio] = useState(user.bio || 'Skilled construction worker specializing in residential and commercial brickwork and plastering.')
  const [savingProfile, setSavingProfile] = useState(false)

  const handleUpdateWorkerProfile = async (e: FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await updateProfile({
        name: profName.trim(),
        skill: profSkill,
        city: profCity.trim(),
        phone: profPhone.trim(),
        experienceYears: Number(profExp) || 0,
        bio: profBio.trim(),
      })
      toast('Worker profile updated successfully!')
    } catch (err: any) {
      toast(err?.message || 'Failed to update profile', 'err')
    } finally {
      setSavingProfile(false)
    }
  }
  const [requests, setRequests] = useState<{ id: string; builderName: string; site: string; wage: number; date: string; status: 'pending' | 'accepted' | 'declined' }[]>([
    { id: 'req-1', builderName: 'BuildCraft Infra', site: 'Green Villa, Jubilee Hills Rd #36', wage: 950, date: 'Tomorrow, 8:00 AM', status: 'pending' },
    { id: 'req-2', builderName: 'Sri Sai Constructions', site: 'Sector 5, Madhapur', wage: 1000, date: '22 Nov 2026', status: 'pending' },
  ])

  // Emergency "Unable to Attend" Modal
  const [showUnableModal, setShowUnableModal] = useState(false)
  const [absenceReason, setAbsenceReason] = useState('Sudden illness / Fever (జ్వరం / అనారోగ్యం)')
  const [absenceSite, setAbsenceSite] = useState('Green Villa, Jubilee Hills Site')

  // Voice Assistant state
  const [voiceLang, setVoiceLang] = useState<'te' | 'hi' | 'en'>('te')
  const [listening, setListening] = useState(false)
  const [heardText, setHeardText] = useState('')
  const [voiceReply, setVoiceReply] = useState<string>('నమస్కారం! మాట్లాడటానికి క్రింది మైక్రోఫోన్ బటన్ నొక్కండి. ఉదాహరణ: "నాకు ఇద్దరు మేస్త్రీలు కావాలి"')
  const [matchedResults, setMatchedResults] = useState<typeof SEED_WORKERS | null>(null)

  useEffect(() => {
    setJobs(getStoredJobs())
    setPayments(getStoredPayments())
  }, [])

  // Audio Speech Synthesis
  const speakText = (text: string, langCode: RecognitionLang) => {
    setVoiceReply(text)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(text)
      utt.lang = langCode
      utt.rate = 0.95
      window.speechSynthesis.speak(utt)
    }
  }

  // Handle Speech Recognition or Simulation
  const handleVoiceInput = (overrideText?: string) => {
    if (overrideText) {
      processSpokenCommand(overrideText)
      return
    }

    // Try Web Speech API
    const SpeechConstructor =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition

    if (!SpeechConstructor) {
      // Fallback: provide quick chips
      processSpokenCommand('నాకు ఇద్దరు మేస్త్రీలు కావాలి')
      return
    }

    try {
      const rec = new SpeechConstructor()
      rec.lang = voiceLang === 'te' ? 'te-IN' : voiceLang === 'hi' ? 'hi-IN' : 'en-IN'
      rec.interimResults = false
      setListening(true)
      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript
        setHeardText(transcript)
        processSpokenCommand(transcript)
      }
      rec.onerror = () => setListening(false)
      rec.onend = () => setListening(false)
      rec.start()
    } catch {
      setListening(false)
      processSpokenCommand('నాకు ఇద్దరు మేస్త్రీలు కావాలి')
    }
  }

  // Natural Language Understanding for Telugu / Hindi / English
  const processSpokenCommand = (phrase: string) => {
    setHeardText(phrase)
    const lower = phrase.toLowerCase()

    // 1. "నాకు ఇద్దరు మేస్త్రీలు కావాలి" or find masons / workers
    if (
      lower.includes('మేస్త్రీ') ||
      lower.includes('మస్త్రి') ||
      lower.includes('mason') ||
      lower.includes('कारीगर') ||
      lower.includes('కార్మికులు')
    ) {
      const masons = SEED_WORKERS.filter((w) => w.skill === 'Mason' && w.avail)
      setMatchedResults(masons)
      const reply =
        voiceLang === 'te'
          ? `మీ కోసం ${masons.length} అందుబాటులో ఉన్న మేస్త్రీలను కనుగొన్నాము. రమేష్ కుమార్ మరియు సురేష్ ప్రస్తుతం అందుబాటులో ఉన్నారు.`
          : voiceLang === 'hi'
          ? `आपके लिए ${masons.length} उपलब्ध मेसन मिले हैं। रमेश और सुरेश काम के लिए तैयार हैं।`
          : `Found ${masons.length} available verified masons near your site. Ramesh K and Suresh P are available.`
      speakText(reply, voiceLang === 'te' ? 'te-IN' : voiceLang === 'hi' ? 'hi-IN' : 'en-IN')
      return
    }

    // 2. "నేను రాలేను" / Unable to attend
    if (
      lower.includes('రాలేను') ||
      lower.includes('రాలేదు') ||
      lower.includes('leave') ||
      lower.includes('नहीं आ') ||
      lower.includes('sick')
    ) {
      setShowUnableModal(true)
      const reply =
        voiceLang === 'te'
          ? 'అత్యవసర సమాచారం: మీ గైర్హాజరును బిల్డర్ మరియు కాంట్రాక్టర్‌కు తెలియజేయడానికి వివరాలను నిర్ధారించండి.'
          : voiceLang === 'hi'
          ? 'आपातकालीन सूचना: अपनी अनुपस्थिति की पुष्टि करें ताकि बिल्डर को सूचित किया जा सके।'
          : 'Emergency Absence: Please confirm your absence so the site builder is alerted immediately.'
      speakText(reply, voiceLang === 'te' ? 'te-IN' : voiceLang === 'hi' ? 'hi-IN' : 'en-IN')
      return
    }

    // 3. "నా జీతం ఎంత ఉంది?" / Check wage balance
    if (
      lower.includes('జీతం') ||
      lower.includes('డబ్బులు') ||
      lower.includes('wage') ||
      lower.includes('salary') ||
      lower.includes('वेतन')
    ) {
      const reply =
        voiceLang === 'te'
          ? `మీ ఈ వారం మొత్తం సంపాదన ₹5,700. ఈరోజు జీతం ₹950 చెల్లించబడింది.`
          : voiceLang === 'hi'
          ? 'आपकी इस सप्ताह की कुल कमाई ₹5,700 है। आज की दिहाड़ी ₹950 जमा हो चुकी है।'
          : 'Your total earnings this week are ₹5,700. Today’s wage of ₹950 is credited.'
      speakText(reply, voiceLang === 'te' ? 'te-IN' : voiceLang === 'hi' ? 'hi-IN' : 'en-IN')
      return
    }

    // Default
    const defaultReply =
      voiceLang === 'te'
        ? `మీరు చెప్పినది: "${phrase}". మేము మేస్త్రీలు, రేట్లు మరియు హాజరు సమాచారంలో సహాయపడగలము.`
        : voiceLang === 'hi'
        ? `आपने कहा: "${phrase}"। हम कारीगर और मजदूरी खोजने में सहायता कर सकते हैं।`
        : `Heard: "${phrase}". You can ask to find masons, report absence, or check wage balance.`
    speakText(defaultReply, voiceLang === 'te' ? 'te-IN' : voiceLang === 'hi' ? 'hi-IN' : 'en-IN')
  }

  // Handle Unable to Attend Submission
  const handleConfirmUnableToAttend = () => {
    const newAlert: EmergencyAlert = {
      id: 'alt-' + Date.now(),
      workerId: user.uid,
      workerName: user.name,
      skill: 'Mason',
      site: absenceSite,
      date: new Date().toISOString().slice(0, 10),
      reason: absenceReason,
      status: 'active',
      reportedAt: 'Just now',
    }

    const current = getStoredAlerts()
    saveAlerts([newAlert, ...current])
    setIsAvailable(false)
    setShowUnableModal(false)
    toast('Emergency absence reported! Builder has been alerted.', 'ok')

    // Voice response
    const audioMsg =
      voiceLang === 'te'
        ? 'మీ సెలవు సమాచారం బిల్డర్‌కు పంపబడింది. తక్షణ రీప్లేస్‌మెంట్ కార్మికుడు కేటాయించబడతాడు.'
        : 'Your absence notice has been transmitted. The builder will arrange replacement.'
    speakText(audioMsg, voiceLang === 'te' ? 'te-IN' : 'en-IN')
  }

  // Merge customer bookings with direct requests
  const allRequests: Booking[] = [
    ...customerBookings,
    ...requests
      .filter((r) => !customerBookings.some((b) => b.id === r.id))
      .map((r) => ({
        id: r.id,
        bookingType: 'builder' as const,
        workerId: user.uid,
        workerName: user.name,
        builderName: r.builderName,
        skill: (user.skill as string) || 'Mason',
        customerId: 'demo-builder-' + r.id,
        customerName: r.builderName,
        customerRole: 'Builder' as const,
        customerPhone: '+91 98765 43210',
        date: r.date,
        site: r.site,
        note: `Offered daily wage: ${inr(r.wage)} / day`,
        status: (r.status === 'declined' ? 'rejected' : r.status) as BookingStatus,
      })),
  ]

  const selectedBooking = allRequests.find((b) => b.id === openBookingId) || null

  useEffect(() => {
    if (activeTab === 'requests' && allRequests.length > 0 && !openBookingId) {
      setOpenBookingId(allRequests[0].id)
    }
  }, [activeTab, allRequests.length, openBookingId])

  // Accept / Decline Job Request
  const handleDecideRequest = async (id: string, status: 'accepted' | 'declined') => {
    const bookingStatus: BookingStatus = status === 'accepted' ? 'accepted' : 'rejected'
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    const target = customerBookings.find((b) => b.id === id)
    if (target) {
      try {
        if (!db) {
          const stored = (JSON.parse(localStorage.getItem('bc-bookings-v1') ?? '[]') as Booking[]).map((x) =>
            x.id === id ? { ...x, status: bookingStatus } : x
          )
          localStorage.setItem('bc-bookings-v1', JSON.stringify(stored))
          window.dispatchEvent(new Event('bc-bookings-change'))
        } else {
          await updateDoc(doc(requireDb(), 'bookings', id), { status: bookingStatus })
        }
      } catch (err) {
        toast(authMessage(err), 'err')
      }
    }
    toast(status === 'accepted' ? 'Job request accepted!' : 'Job request declined')
  }

  const totalEarnedThisWeek = payments.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0)
  const pendingWages = payments.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0)

  return (
    <div className="space-y-6">
      {/* Worker Header Card - Clean Light Mode, Navy in Dark Mode */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-50/90 via-slate-50 to-white border border-blue-200/80 text-slate-900 shadow-sm dark:bg-gradient-to-r dark:from-navy dark:via-navy-700 dark:to-blue-800 dark:border-transparent dark:text-white p-6 transition-colors duration-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-white/10 text-slate-800 dark:text-white text-3xl font-black border border-slate-200 dark:border-white/20 shadow-xs">
              🔨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  {t('Welcome back,')} <span>{user.name}</span>!
                </h1>
                <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/40 px-2.5 py-0.5 text-xs font-bold">
                  ✓ {t('Verified Craftsman')}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-blue-100">
                {t('You are logged in as a')} <span className="font-semibold text-slate-800 dark:text-white">{t(user.role)}</span> · {user.skill || 'Master Mason (మేస్త్రీ)'} · {user.city} · {user.experienceYears ? `${user.experienceYears} Years Experience` : 'Experienced'}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-amber-500 dark:text-amber-300">
                <Stars value={4.8} /> <span className="font-bold text-slate-700 dark:text-white">(4.8 / 5.0) · 48 Sites Completed</span>
              </div>
            </div>
          </div>

          {/* Availability Toggle & Emergency Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={() => setIsAvailable(!isAvailable)}
              className={`rounded-xl px-4 py-2.5 text-xs font-black shadow-sm transition flex items-center justify-center gap-2 ${
                isAvailable ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-600 text-white'
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${isAvailable ? 'bg-white animate-ping' : 'bg-slate-400'}`} />
              {isAvailable ? '🟢 AVAILABLE FOR WORK TODAY' : '🔴 ON LEAVE / BUSY'}
            </button>

            <button
              onClick={() => setShowUnableModal(true)}
              className="rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-black text-white hover:bg-orange-700 shadow-md flex items-center justify-center gap-1.5"
            >
              <span>🚨</span> UNABLE TO ATTEND
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Large Touch Targets */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('voice')}
          className={`rounded-xl px-4 py-2.5 text-sm font-extrabold transition flex items-center gap-2 ${
            activeTab === 'voice' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span>🎙️</span> AI Voice Assistant (తెలుగు / Hindi / English)
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`rounded-xl px-4 py-2.5 text-sm font-extrabold transition flex items-center gap-2 ${
            activeTab === 'requests' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span>📬</span> {t('Job Requests')} ({allRequests.filter((r) => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('find_jobs')}
          className={`rounded-xl px-4 py-2.5 text-sm font-extrabold transition flex items-center gap-2 ${
            activeTab === 'find_jobs' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span>🔍</span> Find Daily Jobs
        </button>
        <button
          onClick={() => setActiveTab('wages')}
          className={`rounded-xl px-4 py-2.5 text-sm font-extrabold transition flex items-center gap-2 ${
            activeTab === 'wages' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span>💰</span> Wages & Wallet
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`rounded-xl px-4 py-2.5 text-sm font-extrabold transition flex items-center gap-2 ${
            activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span>👤</span> My Profile & Badges
        </button>
        <button
          onClick={async () => {
            await logout()
            window.location.href = '/'
          }}
          className="rounded-xl px-4 py-2.5 text-sm font-extrabold transition flex items-center gap-2 bg-white text-red-600 hover:bg-red-50 border border-slate-200"
        >
          <span>🚪</span> Logout
        </button>
      </div>

      {/* TAB 1: VOICE ASSISTANT (AI MODULE E) */}
      {activeTab === 'voice' && (
        <div className="card p-6 border-2 border-blue-200 bg-gradient-to-b from-blue-50/50 to-white space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎙️</span>
                <h2 className="text-xl font-black text-slate-900">
                  Multilingual AI Voice Assistant (వాయిస్ అసిస్టెంట్)
                </h2>
              </div>
              <p className="text-xs text-slate-600">
                Speak directly or tap prompt chips below in your preferred language.
              </p>
            </div>

            {/* Language Switcher */}
            <div className="flex gap-1 rounded-xl bg-slate-200 p-1 text-xs font-bold">
              <button
                onClick={() => { setVoiceLang('te'); speakText('నమస్కారం! మాట్లాడటానికి క్రింది బటన్ నొక్కండి.', 'te-IN') }}
                className={`rounded-lg px-3 py-1.5 ${voiceLang === 'te' ? 'bg-blue-600 text-white shadow' : 'text-slate-700'}`}
              >
                తెలుగు (Telugu)
              </button>
              <button
                onClick={() => { setVoiceLang('hi'); speakText('नमस्ते! बोलने के लिए नीचे दिए गए बटन को दबाएं।', 'hi-IN') }}
                className={`rounded-lg px-3 py-1.5 ${voiceLang === 'hi' ? 'bg-blue-600 text-white shadow' : 'text-slate-700'}`}
              >
                हिन्दी (Hindi)
              </button>
              <button
                onClick={() => { setVoiceLang('en'); speakText('Hello! Press the mic button to speak your request.', 'en-IN') }}
                className={`rounded-lg px-3 py-1.5 ${voiceLang === 'en' ? 'bg-blue-600 text-white shadow' : 'text-slate-700'}`}
              >
                English
              </button>
            </div>
          </div>

          {/* Central Voice Control */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200/80 text-slate-900 dark:bg-navy dark:border-transparent dark:text-white p-6 text-center space-y-4 shadow-sm transition-colors duration-200">
            <div className="flex justify-center">
              <button
                onClick={() => handleVoiceInput()}
                className={`flex h-20 w-20 items-center justify-center rounded-full text-3xl shadow-xl transition-all ${
                  listening ? 'bg-red-500 ring-8 ring-red-400/40 animate-pulse' : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                🎤
              </button>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                {listening ? 'Listening to your voice... (వింటున్నాము...)' : 'Tap Microphone or Prompt Below'}
              </p>
              {heardText && (
                <p className="mt-2 text-sm italic text-slate-600 dark:text-blue-200">
                  "{heardText}"
                </p>
              )}
            </div>

            <div className="rounded-xl bg-white/80 dark:bg-white/10 p-4 text-sm font-semibold text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/10 shadow-xs">
              🗣️ <strong>AI Assistant:</strong> {voiceReply}
            </div>
          </div>

          {/* Quick Voice Prompt Chips */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Try Common Requests (క్లిక్ చేసి మాట్లాడండి):
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleVoiceInput('నాకు ఇద్దరు మేస్త్రీలు కావాలి')}
                className="rounded-xl border border-blue-300 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-900 hover:bg-blue-100 transition shadow-sm"
              >
                🗣️ "నాకు ఇద్దరు మేస్త్రీలు కావాలి" (Find 2 Masons)
              </button>
              <button
                onClick={() => handleVoiceInput('నేను ఈరోజు రాలేను')}
                className="rounded-xl border border-red-300 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-900 hover:bg-red-100 transition shadow-sm"
              >
                🚨 "నేను ఈరోజు రాలేను" (Report Unable to Attend)
              </button>
              <button
                onClick={() => handleVoiceInput('నా జీతం ఎంత ఉంది?')}
                className="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition shadow-sm"
              >
                💰 "నా జీతం ఎంత ఉంది?" (Check My Wage Balance)
              </button>
              <button
                onClick={() => handleVoiceInput('मुझे दो राजमिस्त्री चाहिए')}
                className="rounded-xl border border-purple-300 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-900 hover:bg-purple-100 transition shadow-sm"
              >
                🗣️ "मुझे दो राजमिस्त्री चाहिए" (Hindi)
              </button>
            </div>
          </div>

          {/* Voice Search Results if matched */}
          {matchedResults && matchedResults.length > 0 && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-4 space-y-3">
              <h3 className="font-extrabold text-emerald-900 text-sm">
                ✓ Matching Verified Workers Found ({matchedResults.length})
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {matchedResults.map((m) => (
                  <div key={m.id} className="rounded-xl bg-white p-3 border border-emerald-200 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900">{m.name}</div>
                      <div className="text-xs text-slate-500">{m.skill} · {m.city} · ★ {m.rating}</div>
                      <div className="text-xs font-black text-emerald-700 mt-1">{inr(m.wage)} / day</div>
                    </div>
                    <button
                      onClick={() => alert(`Call initiated to ${m.name} (+91 98765 00000)`)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      📞 Call Worker
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: JOB REQUESTS & CUSTOMER MESSAGES */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{t('Job Requests')}</span>
              <span className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2.5 py-0.5 text-xs font-bold">
                {allRequests.length}
              </span>
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_24rem] xl:grid-cols-[1fr_26rem]">
            {/* Left Column: Requests List */}
            <div className="space-y-3">
              {allRequests.length === 0 && (
                <div className="card p-8 text-center text-slate-500 dark:text-slate-400">
                  {t('No bookings yet.')}
                </div>
              )}
              {allRequests.map((req) => {
                const isSelected = openBookingId === req.id
                const isPending = req.status === 'pending'
                const displayName = req.customerName || req.builderName || 'Customer'
                const displayRole = req.customerRole || (req.bookingType === 'builder' ? 'Builder' : 'Customer')
                return (
                  <div
                    key={req.id}
                    className={`card p-5 border transition-all ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-md bg-blue-50/20 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[0.7rem] font-bold text-blue-700 bg-blue-50 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 px-1.5 py-0.5 rounded">
                          {req.id}
                        </span>
                        <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 px-2 py-0.5 text-[0.65rem] font-bold">
                          {displayRole === 'Builder' ? '🏗️ ' + t('Builder') : '👤 ' + t('Customer')}
                        </span>
                      </div>
                      <Pill tone={req.status === 'accepted' ? 'green' : req.status === 'rejected' ? 'red' : 'amber'}>
                        {t(req.status)}
                      </Pill>
                    </div>

                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {displayName}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          📍 {req.site} · Scheduled: <strong>{req.date}</strong>
                        </p>
                        {req.note && (
                          <p className="mt-1.5 text-xs text-slate-700 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60">
                            "{req.note}"
                          </p>
                        )}
                        {req.customerPhone && (
                          <p className="mt-1 text-[0.7rem] text-slate-400">
                            📞 Contact: {req.customerPhone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      {isPending ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDecideRequest(req.id, 'accepted')}
                            className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-black text-white hover:bg-emerald-700 shadow-xs transition"
                          >
                            ✓ {t('accept')}
                          </button>
                          <button
                            onClick={() => handleDecideRequest(req.id, 'declined')}
                            className="rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-xs transition"
                          >
                            ✕ {t('reject')}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">
                          {req.status === 'accepted' ? '✓ ' + t('Accepted') : '✕ ' + t('Rejected')}
                        </span>
                      )}

                      <button
                        onClick={() => setOpenBookingId(req.id)}
                        className={`btn2 !py-1.5 text-xs font-bold flex items-center gap-1.5 transition ${
                          isSelected
                            ? '!bg-blue-600 !text-white shadow-xs'
                            : '!bg-slate-100 dark:!bg-slate-800 !text-slate-800 dark:!text-slate-200 hover:!bg-slate-200 dark:hover:!bg-slate-700'
                        }`}
                      >
                        💬 <span>{t('messages')}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right Column: Chat Panel */}
            <div className="min-w-0">
              {selectedBooking ? (
                <ChatPanel
                  booking={selectedBooking}
                  user={user}
                  onClose={() => setOpenBookingId(null)}
                />
              ) : (
                <div className="card p-10 text-center space-y-3 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c1b38] transition-colors duration-200">
                  <span className="text-4xl">💬</span>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {t('Direct Chat with Customer')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    {t('Select a booking to open its conversation.')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FIND JOBS */}
      {activeTab === 'find_jobs' && (
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900">Nearby Daily Labour & Site Openings</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {jobs.map((j) => (
              <div key={j.id} className="card p-5 border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-extrabold text-slate-900 text-sm">{j.title}</h3>
                    <Pill tone={j.urgency === 'Immediate' ? 'red' : 'blue'}>{j.urgency}</Pill>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    📍 {j.siteLocation}, {j.city} · Posted by: <strong className="text-slate-700">{j.postedBy}</strong>
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs font-bold">
                    <span className="text-blue-600 text-base">{inr(j.dailyWage)} / day</span>
                    <span className="text-slate-500">Duration: {j.duration}</span>
                  </div>
                </div>
                <button
                  onClick={() => alert(`Application sent to ${j.postedBy}! They will contact you shortly.`)}
                  className="rounded-lg bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  ⚡ Apply for Site Work
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: WAGES & WALLET */}
      {activeTab === 'wages' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card p-4 border-l-4 border-l-emerald-600">
              <div className="text-xs font-bold text-slate-400 uppercase">Received This Week</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{inr(totalEarnedThisWeek)}</div>
              <div className="text-xs text-emerald-600 font-semibold">Credited via UPI / Cash</div>
            </div>
            <div className="card p-4 border-l-4 border-l-blue-600">
              <div className="text-xs font-bold text-slate-400 uppercase">Today's Daily Wage</div>
              <div className="text-2xl font-black text-slate-900 mt-1">₹950</div>
              <div className="text-xs text-slate-500">Jubilee Hills Site</div>
            </div>
            <div className="card p-4 border-l-4 border-l-amber-500">
              <div className="text-xs font-bold text-slate-400 uppercase">Pending Clearance</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{inr(pendingWages)}</div>
              <div className="text-xs text-amber-700 font-semibold">1 Day Pending Approval</div>
            </div>
          </div>

          <div className="card p-5 border border-slate-200 space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Wage Payment Receipts</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {payments.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">{p.site}</div>
                    <div className="text-slate-400">{p.date} · {p.paymentMethod} ({p.refNo})</div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900 block text-sm">{inr(p.amount)}</span>
                    <span className={`text-[0.7rem] font-bold ${p.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {p.status === 'Paid' ? '✓ Received' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PROFILE */}
      {activeTab === 'profile' && (
        <div className="card p-6 border border-slate-200 max-w-2xl space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Worker Profile & Credentials</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your verified skilled worker profile visible to builders and site contractors.
            </p>
          </div>

          <form onSubmit={handleUpdateWorkerProfile} className="space-y-4 text-xs font-semibold">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                Full Name
                <input
                  className="inp mt-1 text-sm font-normal"
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  required
                />
              </label>
              <label className="block">
                Primary Trade / Skill
                <select
                  className="inp mt-1 text-sm font-normal"
                  value={profSkill}
                  onChange={(e) => setProfSkill(e.target.value as Skill)}
                >
                  <option value="Mason">Master Mason (మేస్త్రీ / राजमिस्त्री)</option>
                  <option value="Electrician">Electrician (ఎలక్ట్రీషియన్)</option>
                  <option value="Plumber">Plumber (ప్లంబర్)</option>
                  <option value="Carpenter">Carpenter (వడ్రంగి)</option>
                  <option value="Painter">Painter (పెయింటర్)</option>
                  <option value="Labourer">General Construction Labourer</option>
                </select>
              </label>
              <label className="block">
                Location / City
                <input
                  className="inp mt-1 text-sm font-normal"
                  value={profCity}
                  onChange={(e) => setProfCity(e.target.value)}
                />
              </label>
              <label className="block">
                Phone / Mobile Number
                <input
                  className="inp mt-1 text-sm font-normal"
                  value={profPhone}
                  onChange={(e) => setProfPhone(e.target.value)}
                />
              </label>
              <label className="block">
                Years of Experience
                <input
                  type="number"
                  className="inp mt-1 text-sm font-normal"
                  value={profExp}
                  onChange={(e) => setProfExp(Number(e.target.value))}
                />
              </label>
              <label className="block">
                Verification Status
                <div className="mt-1 flex items-center gap-2 p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span>✓ UIDAI & BuildConnect Skill Verified</span>
                </div>
              </label>
            </div>

            <label className="block">
              Skill Bio & Past Project Summary
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

      {/* Emergency Absence Modal */}
      {showUnableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-md p-6 space-y-4 text-xs font-semibold">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚨</span>
                <h3 className="text-base font-extrabold text-red-900">Report Unable to Attend Work</h3>
              </div>
              <button onClick={() => setShowUnableModal(false)} className="text-slate-400 hover:text-black">✕</button>
            </div>
            <p className="text-slate-600">
              This will notify your Site Builder and Contractor immediately so they can arrange an alternative worker without delaying site operations.
            </p>

            <div className="space-y-3">
              <label className="block">
                Assigned Site Today
                <input
                  className="inp mt-1 text-xs"
                  value={absenceSite}
                  onChange={(e) => setAbsenceSite(e.target.value)}
                />
              </label>

              <label className="block">
                Reason for Absence (కారణం)
                <select
                  className="inp mt-1 text-xs"
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                >
                  <option value="Sudden illness / Fever (జ్వరం / అనారోగ్యం)">Sudden illness / Fever (జ్వరం / అనారోగ్యం)</option>
                  <option value="Family Emergency (కుటుంబ అత్యవసర పరిస్థితి)">Family Emergency (కుటుంబ అత్యవసర పరిస్థితి)</option>
                  <option value="Transportation Breakdown (రవాణా సమస్య)">Transportation Breakdown (రవాణా సమస్య)</option>
                  <option value="Injury / Sprain on Site (గాయం)">Injury / Sprain on Site (గాయం)</option>
                </select>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmUnableToAttend}
                className="rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white hover:bg-red-700 flex-1 text-xs shadow-md"
              >
                Confirm & Alert Builder
              </button>
              <button
                onClick={() => setShowUnableModal(false)}
                className="rounded-xl bg-slate-200 px-4 py-2.5 font-bold text-slate-800 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
