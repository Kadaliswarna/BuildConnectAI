import type { RecommendationDetails, RecommendationType } from '../../types/materialIntelligence'

interface Props {
  recommendation: RecommendationDetails
  materialName: string
  unit: string
  cityName: string
}

export default function RecommendationCard({ recommendation, materialName, unit, cityName }: Props) {
  const {
    action,
    headline,
    reason,
    marketSituation,
    expectedMovement,
    expectedSavingsCost,
    confidenceScore,
    volatilityScore,
    riskFactors,
    disclaimer,
  } = recommendation

  const badgeStyles: Record<
    RecommendationType,
    { bg: string; border: string; text: string; icon: string; title: string; pill: string }
  > = {
    'BUY NOW': {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/40',
      text: 'text-emerald-700',
      icon: '🟢',
      title: 'BUY NOW — Upward Price Pressure Anticipated',
      pill: 'bg-emerald-600 text-white',
    },
    WAIT: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/40',
      text: 'text-amber-800',
      icon: '🟡',
      title: 'WAIT — Price Softening / Cooling Projected',
      pill: 'bg-amber-600 text-white',
    },
    'BUY PARTIALLY': {
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/40',
      text: 'text-sky-800',
      icon: '🔵',
      title: 'BUY PARTIALLY — Volatility Hedge Strategy',
      pill: 'bg-sky-600 text-white',
    },
    MONITOR: {
      bg: 'bg-slate-500/10',
      border: 'border-slate-400/40',
      text: 'text-slate-800',
      icon: '⚪',
      title: 'MONITOR — Equilibrium / Insufficient Momentum',
      pill: 'bg-slate-700 text-white',
    },
  }

  const style = badgeStyles[action]

  return (
    <div className={`rounded-2xl border-2 ${style.border} ${style.bg} p-6 shadow-sm`}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{style.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${style.pill}`}>
                AI Decision: {action}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {cityName} Market · {materialName} ({unit})
              </span>
            </div>
            <h3 className="mt-1 text-xl font-black text-slate-900">{headline}</h3>
          </div>
        </div>

        {/* Confidence & Volatility Meters */}
        <div className="flex items-center gap-4 rounded-xl bg-white/80 px-4 py-2 text-right shadow-xs backdrop-blur-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Forecast Confidence</p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all"
                  style={{ width: `${confidenceScore}%` }}
                />
              </div>
              <span className="text-sm font-black text-slate-800">{confidenceScore}%</span>
            </div>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Market Volatility</p>
            <span
              className={`text-sm font-black ${
                volatilityScore > 4 ? 'text-amber-600' : 'text-slate-700'
              }`}
            >
              {volatilityScore > 4 ? 'High' : volatilityScore > 2 ? 'Moderate' : 'Low'} ({volatilityScore}%)
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Key AI Insights */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-white/90 p-4 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Why AI Recommends This</h4>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-800">{reason}</p>
        </div>

        <div className="rounded-xl bg-white/90 p-4 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Market Situation</h4>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-800">{marketSituation}</p>
        </div>

        <div className="rounded-xl bg-white/90 p-4 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Expected Movement & Impact</h4>
          <p className="mt-1.5 text-sm font-semibold text-slate-900">{expectedMovement}</p>
          <p className="mt-1 text-xs text-slate-600">{expectedSavingsCost}</p>
        </div>
      </div>

      {/* Risk Factors */}
      {riskFactors.length > 0 && (
        <div className="mt-4 rounded-xl bg-white/60 p-3 text-xs text-slate-700">
          <span className="font-bold text-slate-900">⚠️ Key Risk Considerations: </span>
          <span className="italic">{riskFactors.join(' · ')}</span>
        </div>
      )}

      {/* Mandatory Regulatory Disclaimer */}
      <p className="mt-3 text-[11px] leading-normal text-slate-500">
        <strong>Important Financial & Commercial Disclaimer:</strong> {disclaimer}
      </p>
    </div>
  )
}
