import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { Field, Modal, PageShell, Pill, Stars, inr } from '../components/ui'
import { useCatalog } from '../hooks/useCatalog'
import { SEED_BUILDERS } from '../data/seed'
import { useI18n } from '../lib/i18n'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { db, requireDb } from '../lib/firebase'
import { authMessage } from '../lib/errors'
import { getLocalBookings } from '../hooks/useBookings'
import type { Builder, Booking, Role } from '../types'

type Sort = 'rating' | 'price' | 'exp'

const todayISO = () => new Date().toISOString().slice(0, 10)
const tomorrowISO = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export default function Builders() {
  const { t } = useI18n()
  const toast = useToast()
  const { data, isDemo } = useCatalog<Builder>('builders', SEED_BUILDERS)
  const [city, setCity] = useState('')
  const [exp, setExp] = useState(0)
  const [budget, setBudget] = useState(3_000_000)
  const [sort, setSort] = useState<Sort>('rating')
  const [sel, setSel] = useState<string[]>([])
  const [bookingBuilder, setBookingBuilder] = useState<Builder | null>(null)

  const cities = useMemo(() => [...new Set(data.map((b) => b.city))].sort(), [data])
  const list = useMemo(() => {
    const l = data.filter((b) => (!city || b.city === city) && b.exp >= exp && (!b.quote?.total || b.quote.total <= budget))
    return l.sort((a, b) =>
      sort === 'rating'
        ? b.rating - a.rating
        : sort === 'price'
        ? (a.quote.total || Number.MAX_SAFE_INTEGER) - (b.quote.total || Number.MAX_SAFE_INTEGER)
        : b.exp - a.exp
    )
  }, [data, city, exp, budget, sort])

  const toggle = (id: string) =>
    setSel((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id)
      if (s.length >= 3) {
        toast('You can compare up to 3 builders', 'err')
        return s
      }
      return [...s, id]
    })

  const chosen = data.filter((b) => sel.includes(b.id) && b.quote?.total > 0)
  // Best value = lowest price per unit of (rating^1.5), same heuristic as prototype.
  const best = [...chosen].sort((a, b) => a.quote.total / a.rating ** 1.5 - b.quote.total / b.rating ** 1.5)[0]
  const min = (k: 'total' | 'days') => Math.min(...chosen.map((b) => b.quote[k]))

  return (
    <PageShell title={t('Builders')} subtitle="Search by location, experience and budget, then compare quotes and book online.">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600">
        <p>Explore verified builders & contractors, compare estimates side-by-side, and book direct consultations or turnkey projects.</p>
        <Link to="/dashboard" className="font-semibold text-brand hover:underline">
          View My Bookings & Dashboard →
        </Link>
      </div>

      {isDemo && <p className="mb-3 text-sm text-slate-500">Showing demo listings.</p>}

      <div className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-semibold">
          {t('city')}
          <select className="inp mt-1" value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">{t('allCities')}</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          {t('minExp')}: {exp}
          <input className="mt-3 w-full" type="range" min={0} max={20} value={exp} onChange={(e) => setExp(+e.target.value)} />
        </label>
        <label className="text-sm font-semibold">
          {t('maxBudget')}: {inr(budget)}
          <input
            className="mt-3 w-full"
            type="range"
            min={1_000_000}
            max={3_000_000}
            step={50_000}
            value={budget}
            onChange={(e) => setBudget(+e.target.value)}
          />
        </label>
        <label className="text-sm font-semibold">
          {t('sortBy')}
          <select className="inp mt-1" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="rating">{t('rating')}</option>
            <option value="price">{t('price')}</option>
            <option value="exp">{t('experience')}</option>
          </select>
        </label>
      </div>

      {list.length === 0 ? (
        <p className="py-10 text-center text-slate-500">{t('noResults')}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((b) => (
            <article key={b.id} className="card card-hover overflow-hidden flex flex-col justify-between">
              <div>
                <div className="h-2" style={{ background: `hsl(${b.hue} 80% 45%)` }} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-extrabold text-slate-900">{b.name}</h2>
                      <p className="text-sm text-slate-500">
                        {b.city} · {b.exp} yrs · {b.projects} projects
                      </p>
                    </div>
                    {b.rate ? (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                        ₹{b.rate}/sq ft
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm">
                    <Stars value={b.rating} /> <span className="font-bold">{b.rating}</span>{' '}
                    <span className="text-slate-500">({b.reviews})</span>
                  </p>

                  {b.quote?.total ? (
                    <p className="mt-3 text-sm">
                      Quote <span className="text-lg font-extrabold">{inr(b.quote.total)}</span>{' '}
                      <span className="text-slate-500">· {b.quote.days} days</span>
                    </p>
                  ) : (
                    <p className="mt-3 text-sm font-semibold text-slate-600">Quotation on request</p>
                  )}

                  {b.phone && (
                    <a className="mt-2 block text-sm font-semibold text-brand underline" href={'tel:' + b.phone}>
                      Call {b.phone}
                    </a>
                  )}
                </div>
              </div>

              <div className="p-5 pt-0">
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!b.quote?.total}
                      checked={sel.includes(b.id)}
                      onChange={() => toggle(b.id)}
                    />{' '}
                    {t('compare')}
                  </label>
                  <button
                    type="button"
                    className="btn !py-2 !px-4 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    onClick={() => setBookingBuilder(b)}
                  >
                    <span>📅</span>
                    <span>Book Now</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {chosen.length >= 2 && (
        <section className="card mt-8 overflow-x-auto p-4" aria-label="Comparison">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="font-extrabold text-slate-900 text-base">Builder Comparison</h3>
            <span className="text-xs text-slate-500">Comparing {chosen.length} builders</span>
          </div>
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-3" />
                {chosen.map((b) => (
                  <th key={b.id} className="p-3">
                    <div className="font-bold text-slate-900">{b.name}</div>
                    {b.id === best.id && (
                      <div className="mt-1">
                        <Pill tone="green">{t('bestValue')}</Pill>
                      </div>
                    )}
                    <button
                      type="button"
                      className="mt-2 block w-full rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm"
                      onClick={() => setBookingBuilder(b)}
                    >
                      Book Now
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {([['Material', 'material'], ['Labour', 'labour'], ['Extra', 'extra']] as const).map(([l, k]) => (
                <tr key={k} className="border-t">
                  <td className="p-3 font-semibold">{l}</td>
                  {chosen.map((b) => (
                    <td key={b.id} className="p-3">
                      {inr(b.quote[k])}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t">
                <td className="p-3 font-semibold">Total</td>
                {chosen.map((b) => (
                  <td
                    key={b.id}
                    className={`p-3 font-extrabold ${b.quote.total === min('total') ? 'text-green-700' : ''}`}
                  >
                    {inr(b.quote.total)}
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="p-3 font-semibold">Days</td>
                {chosen.map((b) => (
                  <td
                    key={b.id}
                    className={`p-3 ${b.quote.days === min('days') ? 'font-bold text-green-700' : ''}`}
                  >
                    {b.quote.days}
                  </td>
                ))}
              </tr>
              <tr className="border-t">
                <td className="p-3 font-semibold">{t('rating')}</td>
                {chosen.map((b) => (
                  <td key={b.id} className="p-3">
                    {b.rating}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {bookingBuilder && (
        <BookBuilderModal
          builder={bookingBuilder}
          onClose={() => setBookingBuilder(null)}
        />
      )}
    </PageShell>
  )
}

function BookBuilderModal({ builder, onClose }: { builder: Builder; onClose: () => void }) {
  const { t } = useI18n()
  const { user } = useAuth()
  const toast = useToast()

  const [customerName, setCustomerName] = useState(user?.name || '')
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '')
  const [customerEmail, setCustomerEmail] = useState(user?.email || '')
  const [site, setSite] = useState(builder.city ? `${builder.city} Project Site` : '')
  const [requirements, setRequirements] = useState('')
  const [budget, setBudget] = useState(builder.quote?.total || 2_500_000)
  const [meetingDate, setMeetingDate] = useState(tomorrowISO())
  const [timeSlot, setTimeSlot] = useState('Morning (10:00 AM - 12:00 PM)')
  const [busy, setBusy] = useState(false)
  const [confirmed, setConfirmed] = useState<Booking | null>(null)
  const [copied, setCopied] = useState(false)
  const [errs, setErrs] = useState<{
    name?: string
    phone?: string
    site?: string
    requirements?: string
    budget?: string
    date?: string
  }>({})

  const quickRequirements = [
    'Turnkey Villa (G+2)',
    'Independent House',
    'Commercial Space',
    'Structural Civil Work',
    'Full Renovation',
  ]

  const handleCopyId = (id: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(id)
        setCopied(true)
        toast('Booking ID copied to clipboard!')
        setTimeout(() => setCopied(false), 2500)
      } else {
        toast(`Booking ID: ${id}`)
      }
    } catch {
      toast(`Booking ID: ${id}`)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errs = {}
    if (!customerName.trim()) next.name = 'Please provide your full name.'
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 8) {
      next.phone = 'Please provide a valid contact phone number.'
    }
    if (!site.trim() || site.trim().length < 3) {
      next.site = 'Please provide project location or site address (min 3 chars).'
    }
    if (!requirements.trim() || requirements.trim().length < 5) {
      next.requirements = 'Please describe your construction requirements and scope.'
    }
    if (!budget || Number(budget) <= 10000) {
      next.budget = 'Please enter a valid estimated budget.'
    }
    if (!meetingDate || meetingDate < todayISO()) {
      next.date = 'Select today or a future date for preferred meeting.'
    }

    setErrs(next)
    if (Object.keys(next).length > 0) return

    setBusy(true)
    try {
      const bookingId = 'BK-BLD-' + Math.floor(100000 + Math.random() * 900000)
      const customerUid = user?.uid || ('guest-' + Date.now())
      const customerRole: Role = user?.role || 'Customer'

      const newBooking: Booking = {
        id: bookingId,
        bookingType: 'builder',
        builderId: builder.id,
        builderName: builder.name,
        workerId: builder.id,
        workerName: builder.name,
        skill: 'Builder',
        customerId: customerUid,
        customerName: customerName.trim(),
        customerRole,
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        date: meetingDate,
        meetingDate,
        timeSlot,
        site: site.trim(),
        budget: Number(budget),
        requirements: requirements.trim(),
        note: `${requirements.trim()} (Budget: ${inr(Number(budget))} · Meeting: ${meetingDate} ${timeSlot})`,
        status: 'pending',
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
      }

      if (!db) {
        const stored = getLocalBookings()
        localStorage.setItem('bc-bookings-v1', JSON.stringify([newBooking, ...stored]))
        window.dispatchEvent(new Event('bc-bookings-change'))
      } else {
        try {
          await addDoc(collection(requireDb(), 'bookings'), {
            id: bookingId,
            bookingType: 'builder',
            builderId: builder.id,
            builderName: builder.name,
            workerId: builder.id,
            workerName: builder.name,
            skill: 'Builder',
            customerId: customerUid,
            customerName: customerName.trim(),
            customerRole,
            customerPhone: customerPhone.trim(),
            customerEmail: customerEmail.trim() || undefined,
            date: meetingDate,
            meetingDate,
            timeSlot,
            site: site.trim(),
            budget: Number(budget),
            requirements: requirements.trim(),
            note: `${requirements.trim()} (Budget: ${inr(Number(budget))} · Meeting: ${meetingDate} ${timeSlot})`,
            status: 'pending',
            createdAt: serverTimestamp(),
          })
        } catch {
          const stored = getLocalBookings()
          localStorage.setItem('bc-bookings-v1', JSON.stringify([newBooking, ...stored]))
          window.dispatchEvent(new Event('bc-bookings-change'))
        }
      }

      toast(`Booking request submitted! Reference ID: ${bookingId}`)
      setConfirmed(newBooking)
    } catch (err) {
      toast(authMessage(err), 'err')
    } finally {
      setBusy(false)
    }
  }

  if (confirmed) {
    return (
      <Modal title="Builder Booking Confirmed" onClose={onClose}>
        <div className="py-2 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl font-bold">
            ✓
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Booking Request Submitted!</h3>
            <p className="mt-1 text-sm text-slate-500">
              Your consultation & project booking has been sent to{' '}
              <span className="font-semibold text-slate-800">{builder.name}</span>.
            </p>
          </div>

          {/* Official Booking ID Banner */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-center">
            <span className="text-[0.7rem] uppercase font-bold tracking-wider text-slate-500">
              Official Booking Reference ID
            </span>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="font-mono text-xl font-black text-[#1554C8]">{confirmed.id}</span>
              <button
                type="button"
                onClick={() => handleCopyId(confirmed.id)}
                className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-xs"
              >
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
            <p className="text-[0.75rem] text-slate-600 mt-1">
              Save this booking ID to track your quotation and site consultation.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Selected Builder</span>
              <span className="font-bold text-slate-800">
                {builder.name} ({builder.city})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Preferred Meeting</span>
              <span className="font-semibold text-slate-800">
                {confirmed.meetingDate || confirmed.date}
                {confirmed.timeSlot ? ` · ${confirmed.timeSlot}` : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Site Location</span>
              <span className="font-semibold text-slate-800">{confirmed.site}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Estimated Budget</span>
              <span className="font-extrabold text-emerald-700">{inr(confirmed.budget || 0)}</span>
            </div>
            {confirmed.requirements && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block">Requirements:</span>
                <span className="text-slate-800 italic mt-0.5 block">{confirmed.requirements}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-500">Status</span>
              <Pill tone="amber">Pending Builder Review</Pill>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/dashboard"
              className="btn w-full text-center py-2.5 font-bold"
              onClick={onClose}
            >
              Track under My Bookings & Dashboard →
            </Link>
            <button
              type="button"
              className="btn2 w-full !bg-slate-100 !text-slate-700 hover:!bg-slate-200"
              onClick={onClose}
            >
              Done / Book Another Builder
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={`Book Builder: ${builder.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 text-left" noValidate>
        {/* Selected Builder Card Summary */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs border border-slate-200">
          <div>
            <div className="font-extrabold text-slate-900 text-sm">{builder.name}</div>
            <div className="text-slate-500 mt-0.5">
              {builder.city} · {builder.exp} yrs exp · {builder.projects} projects
            </div>
          </div>
          <div className="text-right">
            {builder.quote?.total ? (
              <>
                <div className="font-extrabold text-blue-700 text-sm">{inr(builder.quote.total)}</div>
                <div className="text-[0.7rem] text-slate-400">est. {builder.quote.days} days</div>
              </>
            ) : (
              <span className="text-xs font-semibold text-slate-600">Quote on request</span>
            )}
          </div>
        </div>

        {/* Customer Identity Info */}
        {!user ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2">
            <span>
              Booking as <strong>Guest</strong>. <Link to="/login" className="font-bold underline hover:text-blue-700">Sign in</Link> to automatically link bookings to your customer account.
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-2 text-xs text-emerald-900 flex items-center gap-1.5">
            <span>✓ Booking as <strong>{user.name}</strong> ({user.role})</span>
          </div>
        )}

        {/* Customer Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Customer Name" error={errs.name}>
            <input
              className="inp text-sm"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Ramesh Sharma"
              required
            />
          </Field>
          <Field label="Phone / Mobile Number" error={errs.phone}>
            <input
              className="inp text-sm"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+91 98765 43210"
              required
            />
          </Field>
        </div>

        <Field label="Email Address (Optional)">
          <input
            className="inp text-sm"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </Field>

        {/* Project Location */}
        <Field label="Project Location / Site Address" error={errs.site}>
          <input
            className="inp text-sm"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            placeholder="e.g. Plot 42, Sector 8, Jubilee Hills, Hyderabad"
            required
          />
        </Field>

        {/* Construction Requirements */}
        <Field label="Construction Requirements & Scope" error={errs.requirements}>
          <textarea
            className="inp text-sm"
            rows={3}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Describe your construction plan: e.g. G+2 Duplex villa, 3200 sq ft, RCC frame with modular kitchen and solar provisions..."
            required
          />
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[0.7rem] text-slate-500 font-semibold">Quick insert:</span>
            {quickRequirements.map((qr) => (
              <button
                key={qr}
                type="button"
                onClick={() =>
                  setRequirements((prev) => (prev ? `${prev}, ${qr}` : qr))
                }
                className="rounded-full bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-[0.68rem] text-slate-700 font-medium transition"
              >
                + {qr}
              </button>
            ))}
          </div>
        </Field>

        {/* Budget and Meeting Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={`Estimated Budget: ${inr(Number(budget) || 0)}`} error={errs.budget}>
            <input
              className="inp text-sm"
              type="number"
              min={100000}
              step={50000}
              value={budget}
              onChange={(e) => setBudget(+e.target.value)}
              required
            />
          </Field>

          <Field label="Preferred Meeting Date" error={errs.date}>
            <input
              className="inp text-sm"
              type="date"
              min={todayISO()}
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              required
            />
          </Field>
        </div>

        <Field label="Preferred Meeting Time Slot">
          <select
            className="inp text-sm"
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
          >
            <option>Morning (10:00 AM - 12:00 PM)</option>
            <option>Afternoon (02:00 PM - 04:00 PM)</option>
            <option>Evening (05:00 PM - 07:00 PM)</option>
          </select>
        </Field>

        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn flex-1 py-2.5 font-bold" disabled={busy}>
            {busy ? 'Submitting Booking Request…' : 'Submit Booking Request'}
          </button>
          <button
            type="button"
            className="btn2 !bg-slate-200 !text-slate-800 py-2.5"
            onClick={onClose}
          >
            {t('cancel')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
