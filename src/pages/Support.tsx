import { useEffect, useState, type FormEvent } from 'react'
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore'
import { Field, PageShell, Pill } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { db, firebaseReady, requireDb } from '../lib/firebase'

type Issue = { id: string; title: string; details: string; priority: string; date: string; status: string }
const key = 'bc-issue-reports-v1'
const localIssues = (): Issue[] => { try { return JSON.parse(localStorage.getItem(key) ?? '[]') as Issue[] } catch { return [] } }

export default function Support() {
  const { user } = useAuth(); const toast = useToast(); const [issues, setIssues] = useState<Issue[]>(localIssues); const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!db || !user) { setIssues(localIssues()); return }
    return onSnapshot(query(collection(db, 'issueReports'), where('reporterId', '==', user.uid)), (snap) => setIssues(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Issue)).sort((a, b) => b.date.localeCompare(a.date))), (e) => toast('Reports could not be loaded: ' + e.message, 'err'))
  }, [user, toast])
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const form = e.currentTarget; const data = new FormData(form); const title = String(data.get('title')).trim(); const details = String(data.get('details')).trim(); const priority = String(data.get('priority'))
    if (title.length < 3 || details.length < 10) { toast('Add a short title and at least 10 characters of detail.', 'err'); return }
    setBusy(true)
    try {
      const payload = { title, details, priority, reporterId: user?.uid ?? 'demo-user', reporterName: user?.name ?? 'Demo user', date: new Date().toISOString(), status: 'Received' }
      if (db && user) await addDoc(collection(requireDb(), 'issueReports'), { ...payload, createdAt: serverTimestamp() })
      else { const next = [{ id: String(Date.now()), ...payload }, ...localIssues()]; localStorage.setItem(key, JSON.stringify(next)); setIssues(next) }
      form.reset(); toast('Issue report saved.')
    } catch (err) { toast(err instanceof Error ? err.message : 'Report could not be saved.', 'err') }
    finally { setBusy(false) }
  }
  return <PageShell title="Safety & support" subtitle="Emergency contacts, a simple way to report a project issue, and your saved reports.">
    <section className="mb-6 rounded-2xl bg-red-50 p-5 ring-1 ring-red-200"><p className="text-sm font-bold uppercase tracking-wide text-red-800">Emergency in India</p><div className="mt-1 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-3xl font-extrabold text-red-900">112</h2><p className="text-sm text-red-900">Integrated emergency response for police, fire and health services.</p></div><a className="btn !bg-red-700 hover:!bg-red-800" href="tel:112">Call 112</a></div><a className="mt-3 inline-block text-sm font-semibold text-red-900 underline" href="https://www.mha.gov.in/emergency-response-support-system-erss" target="_blank" rel="noreferrer">Official Ministry of Home Affairs ERSS information</a></section>
    <div className="grid gap-6 lg:grid-cols-2"><section className="card p-5"><h2 className="text-xl font-extrabold">Report a project issue</h2><p className="mt-1 text-sm text-slate-600">For immediate danger or injury, call emergency services first. This form is not monitored as an emergency channel.</p><form className="mt-4 space-y-4" onSubmit={submit}><Field label="Issue title"><input className="inp" name="title" required maxLength={100} placeholder="What happened?" /></Field><Field label="Details"><textarea className="inp min-h-28" name="details" required minLength={10} maxLength={1500} placeholder="Include the project, location and the action you need." /></Field><Field label="Priority"><select className="inp" name="priority"><option>Normal</option><option>High</option><option>Urgent · no immediate danger</option></select></Field><button className="btn2" disabled={busy}>{busy ? 'Saving…' : 'Submit report'}</button></form></section>
      <section className="card p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-extrabold">Your reports</h2><Pill tone={firebaseReady && user ? 'green' : 'amber'}>{firebaseReady && user ? 'Synced' : 'This browser'}</Pill></div>{!issues.length ? <p className="mt-4 text-sm text-slate-500">No reports submitted yet.</p> : <div className="mt-4 space-y-3">{issues.map((x) => <article key={x.id} className="rounded-xl bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><b>{x.title}</b><Pill tone={x.priority.startsWith('Urgent') || x.priority === 'High' ? 'amber' : 'blue'}>{x.priority}</Pill></div><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{x.details}</p><p className="mt-2 text-xs text-slate-500">{new Date(x.date).toLocaleString()} · {x.status}</p></article>)}</div>}</section></div>
  </PageShell>
}
