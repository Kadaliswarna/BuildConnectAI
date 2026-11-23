import { useState, type FormEvent } from 'react'
import type { MaterialId, PriceAlert } from '../../types/materialIntelligence'
import { Modal, inr } from '../ui'
import { MATERIAL_SPECS } from '../../data/materialMarketData'

interface Props {
  isOpen: boolean
  onClose: () => void
  alerts: PriceAlert[]
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdDate' | 'active' | 'triggered'>) => void
  onDeleteAlert: (id: string) => void
  onToggleAlert: (id: string) => void
  currentMaterialId: MaterialId
  currentCityId: string
  currentPrice: number
  onTriggerToast: (msg: string) => void
}

export default function PriceAlertModal({
  isOpen,
  onClose,
  alerts,
  onAddAlert,
  onDeleteAlert,
  onToggleAlert,
  currentMaterialId,
  currentCityId,
  currentPrice,
  onTriggerToast,
}: Props) {
  const [materialId, setMaterialId] = useState<MaterialId>(currentMaterialId)
  const [condition, setCondition] = useState<'below' | 'above' | 'percent_change'>('below')
  const [targetPrice, setTargetPrice] = useState<string>(String(Math.round(currentPrice * 0.95)))
  const [targetPercent, setTargetPercent] = useState<string>('5')

  if (!isOpen) return null

  const spec = MATERIAL_SPECS[materialId]

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const p = Number(targetPrice)
    const pct = Number(targetPercent)
    if (condition !== 'percent_change' && (!Number.isFinite(p) || p <= 0)) return
    if (condition === 'percent_change' && (!Number.isFinite(pct) || pct <= 0)) return

    onAddAlert({
      materialId,
      city: currentCityId,
      condition,
      targetPrice: condition === 'percent_change' ? currentPrice : p,
      targetPercent: condition === 'percent_change' ? pct : undefined,
    })

    onTriggerToast(`Price alert activated for ${spec.name}!`)
  }

  const simulateMarketCheck = () => {
    let triggeredCount = 0
    alerts.forEach((a) => {
      if (a.active) {
        if (a.condition === 'below' && currentPrice <= a.targetPrice) {
          triggeredCount++
        } else if (a.condition === 'above' && currentPrice >= a.targetPrice) {
          triggeredCount++
        }
      }
    })
    if (triggeredCount > 0) {
      onTriggerToast(`🔔 ${triggeredCount} active alert(s) condition met! Real-time notification dispatched.`)
    } else {
      onTriggerToast('Market checked: All materials currently trading within normal bounds.')
    }
  }

  return (
    <Modal title="AI Construction Price Alert System" onClose={onClose}>
      <div className="space-y-5">
        <p className="text-xs text-slate-500">
          Set proactive threshold triggers. The engine monitors daily wholesale trading logs and dispatches alerts when rates hit your target.
        </p>

        {/* Create Alert Form */}
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-slate-50 p-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
            Create New Price Alert
          </h4>

          <div>
            <label className="text-xs font-bold text-slate-700">Material</label>
            <select
              value={materialId}
              onChange={(e) => {
                const nextMat = e.target.value as MaterialId
                setMaterialId(nextMat)
              }}
              className="inp mt-1"
            >
              {Object.values(MATERIAL_SPECS).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Trigger Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as any)}
              className="inp mt-1"
            >
              <option value="below">Price drops below target value (₹)</option>
              <option value="above">Price increases above target value (₹)</option>
              <option value="percent_change">Price shifts by percentage (%)</option>
            </select>
          </div>

          {condition === 'percent_change' ? (
            <div>
              <label className="text-xs font-bold text-slate-700">
                Trigger When Price Shifts by (%)
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                required
                value={targetPercent}
                onChange={(e) => setTargetPercent(e.target.value)}
                className="inp mt-1"
                placeholder="e.g. 5"
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-slate-700">
                Target Threshold (₹ per {spec.primaryUnit})
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                required
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="inp mt-1"
                placeholder="e.g. 350"
              />
            </div>
          )}

          <button type="submit" className="btn w-full !py-2 text-xs font-bold">
            + Activate Price Alert
          </button>
        </form>

        {/* Existing Alerts List */}
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Active Alerts ({alerts.length})
            </h4>
            <button
              type="button"
              onClick={simulateMarketCheck}
              className="text-[11px] font-bold text-brand hover:underline"
            >
              ⚡ Test Alerts Now
            </button>
          </div>

          {alerts.length === 0 ? (
            <p className="mt-3 text-center text-xs text-slate-400">No active alerts configured.</p>
          ) : (
            <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
              {alerts.map((a) => {
                const s = MATERIAL_SPECS[a.materialId]
                return (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between rounded-lg border p-2.5 text-xs transition-all ${
                      a.active ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-100 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900">{s.name}</strong>
                        {a.triggered && (
                          <span className="rounded bg-red-100 px-1.5 py-0.2 text-[9px] font-black text-red-700">
                            TRIGGERED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {a.condition === 'below'
                          ? `Alert when price drops below ${inr(a.targetPrice)}`
                          : a.condition === 'above'
                          ? `Alert when price rises above ${inr(a.targetPrice)}`
                          : `Alert on ${a.targetPercent}% price volatility`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleAlert(a.id)}
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          a.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {a.active ? 'Active' : 'Paused'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAlert(a.id)}
                        className="text-slate-400 hover:text-red-600"
                        title="Delete alert"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
