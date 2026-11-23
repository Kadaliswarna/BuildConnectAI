import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { Field, Modal, PageShell, Pill, Stars, inr } from '../components/ui'
import { useCatalog } from '../hooks/useCatalog'
import { SEED_WORKERS } from '../data/seed'
import { useI18n } from '../lib/i18n'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { db, requireDb } from '../lib/firebase'
import { authMessage } from '../lib/errors'
import { SKILLS, type Booking, type Role, type Worker } from '../types'
import { getLocalBookings } from '../hooks/useBookings'

const todayISO = () => new Date().toISOString().slice(0, 10)
const tomorrowISO = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export default function Workers() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { data } = useCatalog<Worker>('workers', SEED_WORKERS)
  const [skill, setSkill] = useState('')
  const [city, setCity] = useState('')
  const [availOnly, setAvailOnly] = useState(false)
  const [q, setQ] = useState('')
  const [booking, setBooking] = useState<Worker | null>(null)

  const cities = useMemo(() => [...new Set(data.map((w) => w.city))].sort(), [data])
  const list = useMemo(() => data.filter((w) =>
    (!skill || w.skill === skill) && (!city || w.city === city) && (!availOnly || w.avail) &&
    (!q || w.name.toLowerCase().includes(q.trim().toLowerCase()))
  ).sort((a, b) => b.rating - a.rating), [data, skill, city, availOnly, q])

  return (
    <PageShell title={t('Workers')} subtitle="Find skilled workers near your site and send a booking request.">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600">
        <p>Showing verified worker listings. Select any available worker to schedule a booking request.</p>
        <Link to="/dashboard" className="font-semibold text-brand hover:underline">
          View My Bookings & Dashboard →
        </Link>
      </div>

      <div className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-semibold">{t('skill')}
          <select className="inp mt-1" value={skill} onChange={(e) => setSkill(e.target.value)}><option value="">{t('allSkills')}</option>{SKILLS.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="text-sm font-semibold">{t('city')}
          <select className="inp mt-1" value={city} onChange={(e) => setCity(e.target.value)}><option value="">{t('allCities')}</option>{cities.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="text-sm font-semibold">{t('search')}
          <input className="inp mt-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name" /></label>
        <label className="flex items-end gap-2 pb-2 text-sm font-semibold"><input type="checkbox" checked={availOnly} onChange={(e) => setAvailOnly(e.target.checked)} /> {t('availableOnly')}</label>
      </div>

      {list.length === 0 ? <p className="py-10 text-center text-slate-500">{t('noResults')}</p> : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((w) => (
            <article key={w.id} className="card card-hover p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div><h2 className="font-extrabold text-slate-900">{w.name}</h2><p className="text-sm text-slate-500">{w.skill} · {w.city}</p></div>
                  {w.avail ? <Pill tone="green">{t('available')}</Pill> : <Pill tone="red">{t('busy')}</Pill>}
                </div>
                <p className="mt-2 text-sm"><Stars value={w.rating} /> <span className="text-slate-500">{w.exp} yrs</span></p>
                <p className="mt-2 text-sm"><span className="font-extrabold text-slate-900">{inr(w.wage)}</span> / day</p>
              </div>

              <button
                className={`btn2 mt-4 w-full ${!w.avail ? '!bg-slate-100 !text-slate-400 cursor-not-allowed' : '!bg-blue-600 !text-white hover:!bg-blue-700'}`}
                onClick={() => setBooking(w)}
                disabled={!w.avail}
              >
                {!w.avail ? t('busy') : t('book')}
              </button>
            </article>
          ))}
        </div>
      )}

      {!user && (
        <p className="mt-6 text-sm text-slate-600">
          Want to track all requests? <Link to="/login" className="font-bold text-brand">{t('Login')}</Link> or book directly as a guest.
        </p>
      )}

      {booking && <BookModal worker={booking} onClose={() => setBooking(null)} />}
    </PageShell>
  )
}

function BookModal({ worker, onClose }: { worker: Worker; onClose: () => void }) {
  const { t } = useI18n()
  const { user } = useAuth()
  const toast = useToast()

  const [date, setDate] = useState(tomorrowISO())
  const [site, setSite] = useState(`${worker.city} Construction Site`)
  const [note, setNote] = useState(`Required for ${worker.skill} work (${inr(worker.wage)}/day)`)
  const [guestName, setGuestName] = useState(user?.name || '')
  const [guestPhone, setGuestPhone] = useState(user?.phone || '')
  const [errs, setErrs] = useState<{ date?: string; site?: string; name?: string }>({})
  const [busy, setBusy] = useState(false)
  const [confirmed, setConfirmed] = useState<Booking | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errs = {}
    if (!date || date < todayISO()) next.date = 'Pick today or a future date.'
    if (site.trim().length < 3) next.site = 'Describe the site (min 3 characters).'
    if (!user && !guestName.trim()) next.name = 'Please provide your name.'
    setErrs(next)
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      const customerUid = user?.uid || ('guest-' + Date.now())
      const customerName = user ? user.name : (guestName.trim() || 'Guest')
      const customerRole: Role = user ? user.role : 'Customer'

      const newBooking: Booking = {
        id: 'bk-' + Date.now(),
        workerId: worker.id,
        workerName: worker.name,
        skill: worker.skill,
        customerId: customerUid,
        customerName,
        customerRole,
        date,
        site: site.trim(),
        note: note.trim().slice(0, 500),
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
            workerId: worker.id,
            workerName: worker.name,
            skill: worker.skill,
            customerId: customerUid || 'demo-customer',
            customerName,
            customerRole,
            date,
            site: site.trim(),
            note: note.trim().slice(0, 500),
            status: 'pending',
            createdAt: serverTimestamp(),
          })
        } catch {
          const stored = getLocalBookings()
          localStorage.setItem('bc-bookings-v1', JSON.stringify([newBooking, ...stored]))
          window.dispatchEvent(new Event('bc-bookings-change'))
        }
      }

      toast(`Booking request sent to ${worker.name}!`)
      setConfirmed(newBooking)
    } catch (err) {
      toast(authMessage(err), 'err')
    } finally {
      setBusy(false)
    }
  }

  if (confirmed) {
    return (
      <Modal title="Booking Confirmed" onClose={onClose}>
        <div className="py-2 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl font-bold">
            ✓
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Booking Request Sent!</h3>
            <p className="mt-1 text-sm text-slate-500">
              Your request has been delivered to <span className="font-semibold text-slate-700">{worker.name}</span>.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Worker</span>
              <span className="font-bold text-slate-800">{worker.name} ({worker.skill})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Scheduled Date</span>
              <span className="font-semibold text-slate-800">{confirmed.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Location</span>
              <span className="font-semibold text-slate-800">{confirmed.site}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Daily Wage</span>
              <span className="font-extrabold text-emerald-700">{inr(worker.wage)} / day</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-500">Status</span>
              <Pill tone="amber">Pending</Pill>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/dashboard"
              className="btn w-full text-center py-2.5 font-bold"
              onClick={onClose}
            >
              View in Dashboard & Chat →
            </Link>
            <button
              type="button"
              className="btn2 w-full !bg-slate-100 !text-slate-700 hover:!bg-slate-200"
              onClick={onClose}
            >
              Done / Book Another Worker
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={`${t('book')}: ${worker.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {!user ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2">
            <span>Booking as <strong>Guest</strong>. <Link to="/login" className="font-bold underline hover:text-blue-700">Sign in</Link> or <Link to="/register" className="font-bold underline hover:text-blue-700">Register</Link> to track bookings on your dashboard.</span>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-2.5 text-xs text-emerald-900 flex items-center gap-2">
            <span>✓ Booking as <strong>{user.name}</strong> ({user.role})</span>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
          <div>
            <div className="font-extrabold text-slate-800">{worker.name}</div>
            <div className="text-xs text-slate-500">{worker.skill} · {worker.city} · {worker.exp} yrs exp</div>
          </div>
          <div className="text-right">
            <div className="font-extrabold text-blue-600">{inr(worker.wage)}</div>
            <div className="text-xs text-slate-400">per day</div>
          </div>
        </div>

        {!user && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Your Name" error={errs.name}>
              <input className="inp" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="e.g. Ramesh S" />
            </Field>
            <Field label="Phone">
              <input className="inp" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+91 98765 43210" />
            </Field>
          </div>
        )}

        <Field label={t('date')} error={errs.date}>
          <input className="inp" type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <Field label={t('site')} error={errs.site}>
          <input className="inp" value={site} onChange={(e) => setSite(e.target.value)} placeholder="Construction site location" />
        </Field>

        <Field label={t('note')}>
          <textarea className="inp" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Details regarding work needed..." />
        </Field>

        <div className="flex gap-2 pt-2">
          <button className="btn flex-1" disabled={busy}>
            {busy ? 'Sending request…' : t('confirm')}
          </button>
          <button type="button" className="btn2 !bg-slate-200 !text-slate-800" onClick={onClose}>
            {t('cancel')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
