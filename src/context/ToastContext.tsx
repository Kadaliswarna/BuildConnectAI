import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface Toast { id: number; msg: string; type: 'ok' | 'err' }
interface ToastApi { toast: (msg: string, type?: 'ok' | 'err') => void }
const Ctx = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const toast = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random()
    setItems((a) => [...a, { id, msg, type }])
    setTimeout(() => setItems((a) => a.filter((x) => x.id !== id)), 3200)
  }, [])
  const value = useMemo(() => ({ toast }), [toast])
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[100] space-y-2" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`card border-l-4 px-4 py-3 text-sm font-semibold ${t.type === 'err' ? 'border-red-500 text-red-700' : 'border-green-500 text-green-800'}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const c = useContext(Ctx)
  return c ? c.toast : () => {}
}
