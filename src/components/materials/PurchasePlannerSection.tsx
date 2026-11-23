import { useMemo, useState } from 'react'
import type {
  MaterialId,
  MaterialSpecification,
  PurchasePlanInput,
  PurchasePlanResult,
} from '../../types/materialIntelligence'
import { inr } from '../ui'
import type { MaterialForecastBundle } from '../../lib/materialForecastingEngine'

interface Props {
  materialId: MaterialId
  forecastBundle?: MaterialForecastBundle
  spec: MaterialSpecification
  onRunPlanner: (input: PurchasePlanInput) => PurchasePlanResult
}

export default function PurchasePlannerSection({
  materialId,
  spec,
  onRunPlanner,
}: Props) {
  const [area, setArea] = useState<number>(1000)
  const [floors, setFloors] = useState<number>(1)
  const [customQty, setCustomQty] = useState<number | null>(null)
  const [targetHorizon, setTargetHorizon] = useState<number>(15)
  const [budget, setBudget] = useState<number>(0)

  // Calculate default rule-of-thumb quantity based on built-up area and floors
  const suggestedQty = useMemo(() => {
    const totalArea = area * floors
    switch (materialId) {
      case 'cement':
        return Math.round(totalArea * 0.4) // 400 bags per 1,000 sq ft
      case 'steel':
        return Math.round(totalArea * 4.0) // 4,000 kg per 1,000 sq ft
      case 'sand':
        return Math.round(totalArea * 1.8) // 1,800 cu ft per 1,000 sq ft
      case 'bricks':
        return Math.round(totalArea * 8.0) // 8,000 bricks per 1,000 sq ft
      case 'tiles':
        return Math.round(totalArea * 1.15) // 1,150 sq ft per 1,000 sq ft
      case 'paint':
        return Math.round(totalArea * 0.18) // 180 litres
      case 'aggregates':
        return Math.round(totalArea * 0.045) // 45 tonnes
      case 'electrical':
        return Math.round(totalArea * 0.04) // 40 coils
      case 'plumbing':
        return Math.round(totalArea * 0.06) // 60 pipes
      case 'roofing':
        return Math.round(totalArea * 1.1) // 1,100 sq ft
      default:
        return 100
    }
  }, [area, floors, materialId])

  const quantity = customQty !== null ? customQty : suggestedQty

  // Target purchase date based on selected horizon
  const targetDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + targetHorizon)
    return d.toISOString().slice(0, 10)
  }, [targetHorizon])

  // Calculation result
  const planResult = useMemo<PurchasePlanResult>(() => {
    return onRunPlanner({
      builtUpArea: area,
      floors,
      materialId,
      quantity,
      targetPurchaseDate: targetDate,
      budget,
    })
  }, [area, floors, materialId, quantity, targetDate, budget, onRunPlanner])

  const costDifference = Math.abs(planResult.spotCost - planResult.futureCost)
  const isFutureMoreExpensive = planResult.futureCost > planResult.spotCost

  return (
    <div className="card space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧮</span>
            <h3 className="text-xl font-black text-slate-900">AI Construction Purchase Planner</h3>
          </div>
          <p className="text-xs text-slate-500">
            Compare spot purchase vs forecasted schedule to optimize cashflow and lock in maximum procurement savings
          </p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-brand">
          Target: {spec.name}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Parameters */}
        <div className="space-y-4 rounded-xl bg-slate-50 p-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Project Parameters & Quantity Estimation
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Built-Up Area (sq ft)</label>
              <input
                type="number"
                min="100"
                step="50"
                value={area}
                onChange={(e) => setArea(Math.max(100, Number(e.target.value)))}
                className="inp mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Number of Floors</label>
              <input
                type="number"
                min="1"
                max="10"
                value={floors}
                onChange={(e) => setFloors(Math.max(1, Number(e.target.value)))}
                className="inp mt-1"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Required Quantity ({spec.primaryUnit})
              </label>
              <span className="text-[10px] text-slate-500">
                AI Rule of Thumb: {spec.planningRuleOfThumb.split('(')[0]}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setCustomQty(Math.max(1, Number(e.target.value)))}
                className="inp flex-1 font-bold"
              />
              <button
                type="button"
                onClick={() => setCustomQty(null)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                title="Reset to engineering formula recommendation"
              >
                Auto-Suggest
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Expected Purchase Timing</label>
            <div className="mt-1 grid grid-cols-4 gap-1.5 text-xs font-bold">
              {[
                { label: 'Today', days: 0 },
                { label: '7 Days', days: 7 },
                { label: '15 Days', days: 15 },
                { label: '30 Days', days: 30 },
              ].map((btn) => (
                <button
                  key={btn.days}
                  type="button"
                  onClick={() => setTargetHorizon(btn.days)}
                  className={`rounded-lg py-2 transition-all ${
                    targetHorizon === btn.days
                      ? 'bg-brand text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Evaluating procurement schedule for: <strong>{targetDate}</strong>
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Allocated Budget (₹ Optional)</label>
            <input
              type="number"
              min="0"
              step="1000"
              placeholder="e.g. 150000"
              value={budget || ''}
              onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
              className="inp mt-1"
            />
          </div>
        </div>

        {/* Calculation & Strategic Recommendation */}
        <div className="flex flex-col justify-between space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Financial Cost Comparison
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                  planResult.recommendedAction === 'BUY NOW'
                    ? 'bg-emerald-100 text-emerald-800'
                    : planResult.recommendedAction === 'WAIT'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                Recommended: {planResult.recommendedAction}
              </span>
            </div>

            {/* Price Comparison Metric */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] font-bold text-slate-500">Current Cost (Buy Today)</p>
                <div className="mt-1 text-xl font-black text-slate-900">
                  {inr(planResult.spotCost)}
                </div>
                <p className="text-[10px] text-slate-400">
                  {quantity.toLocaleString()} {spec.primaryUnit} @ {inr(planResult.spotPrice)}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] font-bold text-slate-500">
                  Forecasted Cost ({targetHorizon === 0 ? 'Today' : `in ${targetHorizon}d`})
                </p>
                <div className="mt-1 text-xl font-black text-slate-900">
                  {inr(planResult.futureCost)}
                </div>
                <p className="text-[10px] text-slate-400">
                  {quantity.toLocaleString()} {spec.primaryUnit} @ {inr(planResult.futurePrice)}
                </p>
              </div>
            </div>

            {/* Net Savings Callout */}
            <div
              className={`mt-4 rounded-xl p-4 ${
                isFutureMoreExpensive
                  ? 'border border-red-200 bg-red-50 text-red-950'
                  : costDifference > 0
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-950'
                  : 'border border-slate-200 bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">
                  {isFutureMoreExpensive
                    ? '⚠️ Projected Cost Escalation (Cost of Delay)'
                    : costDifference > 0
                    ? '🎉 Projected Savings by Waiting'
                    : '⚖️ Neutral Price Horizon'}
                </span>
                <span className="text-base font-black">
                  {isFutureMoreExpensive ? '+' : '-'} {inr(costDifference)} ({Math.abs(planResult.savingsPercent)}%)
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed opacity-90">
                {planResult.procurementAdvice}
              </p>
            </div>

            {/* Budget Health Indicator */}
            {budget > 0 && (
              <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">Budget Allocated: {inr(budget)}</span>
                <span
                  className={`font-bold ${
                    planResult.budgetImpact === 'Budget Deficit'
                      ? 'text-red-600'
                      : 'text-emerald-700'
                  }`}
                >
                  Status: {planResult.budgetImpact} ({inr(Math.abs(budget - planResult.futureCost))}{' '}
                  {planResult.futureCost > budget ? 'Over' : 'Remaining'})
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-400">
            <strong>Calculation Basis:</strong> {quantity.toLocaleString()} units × unit spot rate ({inr(planResult.spotPrice)}) versus Holt damped forecast rate ({inr(planResult.futurePrice)}).
          </div>
        </div>
      </div>
    </div>
  )
}
