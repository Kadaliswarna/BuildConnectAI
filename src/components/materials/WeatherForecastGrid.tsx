import type { ForecastPoint } from '../../types/materialIntelligence'
import { inr } from '../ui'

interface Props {
  forecastTrajectory: ForecastPoint[]
  unit: string
  activeHorizon: '7d' | '15d' | '30d'
  setActiveHorizon: (h: '7d' | '15d' | '30d') => void
}

export default function WeatherForecastGrid({
  forecastTrajectory,
  unit,
  activeHorizon,
  setActiveHorizon,
}: Props) {
  // Select key weather forecast milestone cards: Today (0), Tomorrow (1), Day 3 (3), Day 7 (7), Day 15 (15), Day 30 (30)
  const milestoneIndices = [0, 1, 3, 7, 15, 30]
  const cards = milestoneIndices
    .map((idx) => forecastTrajectory[idx])
    .filter((pt): pt is ForecastPoint => Boolean(pt))

  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌤️</span>
            <h3 className="text-lg font-black text-slate-900">Weather-Style Price Outlook</h3>
          </div>
          <p className="text-xs text-slate-500">
            Micro-forecast showing daily expected price temperature, variance cones, and trend weather
          </p>
        </div>

        {/* Horizon selector buttons */}
        <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveHorizon('7d')}
            className={`rounded-md px-3 py-1.5 transition-all ${
              activeHorizon === '7d' ? 'bg-white text-brand shadow-xs font-black' : 'hover:text-slate-900'
            }`}
          >
            7 Days
          </button>
          <button
            type="button"
            onClick={() => setActiveHorizon('15d')}
            className={`rounded-md px-3 py-1.5 transition-all ${
              activeHorizon === '15d' ? 'bg-white text-brand shadow-xs font-black' : 'hover:text-slate-900'
            }`}
          >
            15 Days
          </button>
          <button
            type="button"
            onClick={() => setActiveHorizon('30d')}
            className={`rounded-md px-3 py-1.5 transition-all ${
              activeHorizon === '30d' ? 'bg-white text-brand shadow-xs font-black' : 'hover:text-slate-900'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Grid of weather cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card, i) => {
          const isToday = i === 0
          const isTomorrow = i === 1
          const changeIsPositive = card.changePercent > 0
          const changeIsNegative = card.changePercent < 0

          return (
            <div
              key={card.date}
              className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition-all hover:shadow-md ${
                isToday
                  ? 'border-brand/40 bg-gradient-to-b from-blue-50/80 to-white shadow-xs'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {/* Badge for Today / Horizon */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider ${
                    isToday ? 'text-brand' : 'text-slate-400'
                  }`}
                >
                  {isToday ? 'Verified Spot' : isTomorrow ? 'Day +1' : card.dayLabel.split(',')[0]}
                </span>
                <span className="text-xl" title={card.weatherSummary}>
                  {card.weatherIcon}
                </span>
              </div>

              {/* Day title & Date */}
              <div className="mt-1">
                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                  {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : card.dayLabel}
                </h4>
                <p className="text-[10px] text-slate-400">{card.date}</p>
              </div>

              {/* Main Predicted Price */}
              <div className="my-2">
                <div className="text-lg font-black text-slate-900">
                  {inr(card.predictedPrice)}
                </div>
                <div className="text-[10px] font-semibold text-slate-500">per {unit}</div>
              </div>

              {/* Min-Max Temperature-style range */}
              <div className="border-t border-slate-100 pt-2 text-[10px]">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Range:</span>
                  <span className="font-bold text-slate-700">
                    {inr(card.lowBound)} - {inr(card.highBound)}
                  </span>
                </div>

                {/* Percentage Change Tag */}
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-slate-400">Trend:</span>
                  {isToday ? (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-600">
                      Baseline
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-bold ${
                        changeIsPositive
                          ? 'bg-red-50 text-red-600'
                          : changeIsNegative
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      {changeIsPositive ? '▲ +' : changeIsNegative ? '▼ ' : '■ '}
                      {card.changePercent}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
