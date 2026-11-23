import type { MarketDriver } from '../../types/materialIntelligence'

interface Props {
  drivers: MarketDriver[]
}

export default function MarketFactorsPanel({ drivers }: Props) {
  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏭</span>
            <h3 className="text-lg font-black text-slate-900">Market Factors & Macro Econometric Drivers</h3>
          </div>
          <p className="text-xs text-slate-500">
            Real-time tracking of raw inputs, fuel, transport logistics, and seasonal indicators impacting wholesale rates
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Verified Data API
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-slate-500">
            <span className="h-2 w-2 rounded-full bg-slate-400" /> Analytical Estimate
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {drivers.map((d) => {
          return (
            <div
              key={d.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded bg-slate-200/70 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                    {d.category}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      d.isVerifiedData
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {d.isVerifiedData ? '✓ Verified Source' : 'Estimative Model'}
                  </span>
                </div>

                <h4 className="mt-2 text-sm font-extrabold text-slate-900">{d.name}</h4>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-sm font-black text-slate-800">{d.currentMetric}</span>
                  <span
                    className={`text-xs font-bold ${
                      d.trend === 'UP'
                        ? 'text-red-600'
                        : d.trend === 'DOWN'
                        ? 'text-emerald-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {d.trend === 'UP' ? '▲ Rising' : d.trend === 'DOWN' ? '▼ Softening' : '■ Steady'}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-slate-600">{d.description}</p>
              </div>

              <div className="mt-3 border-t border-slate-200/60 pt-2 text-[10px] text-slate-400">
                <span className="font-semibold text-slate-500">Source:</span> {d.dataSource}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
