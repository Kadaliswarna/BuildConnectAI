import { useEffect, useRef, type ReactNode } from 'react'

export const inr = (n: number) => '₹' + n.toLocaleString('en-IN')

export function Stars({ value }: { value: number }) {
  const r = Math.round(value)
  return <span className="text-amber-500" aria-label={`${value} out of 5`}>{'★'.repeat(r)}{'☆'.repeat(5 - r)}</span>
}

export function Pill({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'green' | 'amber' | 'red' | 'blue' }) {
  const map = { slate: 'bg-slate-100 text-slate-700', green: 'bg-green-100 text-green-700', amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700', blue: 'bg-blue-100 text-blue-700' }
  return <span className={`tag ${map[tone]}`}>{children}</span>
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold">
      <span className="mb-1 block">{label}</span>
      {children}
      {error && <span className="err block">{error}</span>}
    </label>
  )
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    ref.current?.querySelector<HTMLElement>('input,select,textarea,button')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="card mt-16 w-full max-w-md p-6 border border-slate-200 dark:border-slate-800">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-2xl leading-none text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function FirebaseBanner() {
  return null
}

export function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{title}</h1>
      {subtitle && <p className="mt-1 max-w-2xl text-slate-600 dark:text-slate-400">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  )
}
