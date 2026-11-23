import { useMemo, useState } from 'react'
import type { ForecastPoint, HistoricalPricePoint } from '../../types/materialIntelligence'
import { inr } from '../ui'

interface Props {
  history: HistoricalPricePoint[]
  forecastTrajectory: ForecastPoint[]
  unit: string
  activeHorizon: '7d' | '15d' | '30d'
  setActiveHorizon: (h: '7d' | '15d' | '30d') => void
  materialName: string
}

interface CombinedPoint {
  date: string
  label: string
  actual?: number
  predicted?: number
  lowBound?: number
  highBound?: number
  isFuture: boolean
  isToday: boolean
}

export default function MaterialChart({
  history,
  forecastTrajectory,
  unit,
  activeHorizon,
  setActiveHorizon,
  materialName,
}: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Number of future forecast days to display based on active horizon
  const futureDays = activeHorizon === '7d' ? 7 : activeHorizon === '15d' ? 15 : 30
  // Show the last 21 days of history for balance
  const pastDays = 21

  const combinedData = useMemo<CombinedPoint[]>(() => {
    const past = history.slice(-pastDays)
    const points: CombinedPoint[] = []

    past.forEach((h, i) => {
      const isLastPast = i === past.length - 1
      points.push({
        date: h.date,
        label: h.date.slice(5), // MM-DD
        actual: h.price,
        predicted: isLastPast ? h.price : undefined,
        lowBound: isLastPast ? h.price : undefined,
        highBound: isLastPast ? h.price : undefined,
        isFuture: false,
        isToday: isLastPast,
      })
    })

    const future = forecastTrajectory.slice(1, futureDays + 1)
    future.forEach((f) => {
      points.push({
        date: f.date,
        label: f.date.slice(5),
        predicted: f.predictedPrice,
        lowBound: f.lowBound,
        highBound: f.highBound,
        isFuture: true,
        isToday: false,
      })
    })

    return points
  }, [history, forecastTrajectory, futureDays])

  // Chart dimensions
  const width = 840
  const height = 300
  const padding = { top: 30, right: 35, bottom: 40, left: 60 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom

  // Min and max price for vertical scale with 8% breathing room
  const { minPrice, maxPrice } = useMemo(() => {
    let min = Infinity
    let max = -Infinity
    combinedData.forEach((d) => {
      if (d.actual !== undefined) {
        if (d.actual < min) min = d.actual
        if (d.actual > max) max = d.actual
      }
      if (d.predicted !== undefined) {
        if (d.predicted < min) min = d.predicted
        if (d.predicted > max) max = d.predicted
      }
      if (d.lowBound !== undefined && d.lowBound < min) min = d.lowBound
      if (d.highBound !== undefined && d.highBound > max) max = d.highBound
    })
    const span = max - min || 10
    return {
      minPrice: Math.floor(min - span * 0.08),
      maxPrice: Math.ceil(max + span * 0.08),
    }
  }, [combinedData])

  const getY = (val: number) => {
    const norm = (val - minPrice) / (maxPrice - minPrice || 1)
    return padding.top + innerHeight * (1 - norm)
  }

  const getX = (index: number) => {
    return padding.left + (index / (combinedData.length - 1 || 1)) * innerWidth
  }

  // Today's index
  const todayIndex = combinedData.findIndex((d) => d.isToday)

  // Construct SVG paths
  // 1. Solid history line (0 to todayIndex)
  const historyPath = useMemo(() => {
    const pts = combinedData.slice(0, todayIndex + 1)
    if (!pts.length) return ''
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.actual ?? 0)}`).join(' ')
  }, [combinedData, todayIndex, minPrice, maxPrice])

  // 2. Dashed forecast line (todayIndex to end)
  const forecastPath = useMemo(() => {
    const pts = combinedData.slice(todayIndex)
    if (!pts.length) return ''
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(todayIndex + i)} ${getY(p.predicted ?? 0)}`)
      .join(' ')
  }, [combinedData, todayIndex, minPrice, maxPrice])

  // 3. Shaded confidence band (upper bound forward, lower bound reverse)
  const confidenceBandPath = useMemo(() => {
    const pts = combinedData.slice(todayIndex)
    if (pts.length < 2) return ''
    const upper = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(todayIndex + i)} ${getY(p.highBound ?? p.predicted ?? 0)}`).join(' ')
    const lower = pts
      .slice()
      .reverse()
      .map((p, i) => `L ${getX(combinedData.length - 1 - i)} ${getY(p.lowBound ?? p.predicted ?? 0)}`)
      .join(' ')
    return `${upper} ${lower} Z`
  }, [combinedData, todayIndex, minPrice, maxPrice])

  // Horizontal price grid lines (4 lines)
  const yTicks = [
    minPrice,
    Math.round(minPrice + (maxPrice - minPrice) * 0.33),
    Math.round(minPrice + (maxPrice - minPrice) * 0.66),
    maxPrice,
  ]

  const activePoint = hoveredIndex !== null ? combinedData[hoveredIndex] : combinedData[todayIndex]

  return (
    <div className="card space-y-4 p-5">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h3 className="text-lg font-black text-slate-900">
              Econometric Price Trajectory & Confidence Envelope {materialName ? `– ${materialName}` : ''}
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Solid line shows 21-day verified history; dashed line projects future trend with 95% confidence bounds
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
            7-Day Model
          </button>
          <button
            type="button"
            onClick={() => setActiveHorizon('15d')}
            className={`rounded-md px-3 py-1.5 transition-all ${
              activeHorizon === '15d' ? 'bg-white text-brand shadow-xs font-black' : 'hover:text-slate-900'
            }`}
          >
            15-Day Model
          </button>
          <button
            type="button"
            onClick={() => setActiveHorizon('30d')}
            className={`rounded-md px-3 py-1.5 transition-all ${
              activeHorizon === '30d' ? 'bg-white text-brand shadow-xs font-black' : 'hover:text-slate-900'
            }`}
          >
            30-Day Model
          </button>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[620px] select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="historyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1d4fd8" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#1d4fd8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y axis ticks */}
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={getY(tick)}
                x2={width - padding.right}
                y2={getY(tick)}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={getY(tick) + 4}
                textAnchor="end"
                className="fill-slate-400 text-[11px] font-semibold"
              >
                ₹{tick}
              </text>
            </g>
          ))}

          {/* Dividing reference line for "Today" */}
          {todayIndex >= 0 && (
            <g>
              <line
                x1={getX(todayIndex)}
                y1={padding.top}
                x2={getX(todayIndex)}
                y2={height - padding.bottom}
                stroke="#0f1f3d"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <rect
                x={getX(todayIndex) - 28}
                y={padding.top - 18}
                width="56"
                height="16"
                rx="4"
                fill="#0f1f3d"
              />
              <text
                x={getX(todayIndex)}
                y={padding.top - 6}
                textAnchor="middle"
                className="fill-white text-[9px] font-black uppercase"
              >
                Today
              </text>
            </g>
          )}

          {/* Shaded Confidence Band (Forecast) */}
          <path d={confidenceBandPath} fill="url(#confidenceGrad)" />

          {/* Verified Historical Line (Solid Blue) */}
          <path d={historyPath} fill="none" stroke="#1d4fd8" strokeWidth="2.5" strokeLinecap="round" />

          {/* Predicted Forecast Line (Dashed Orange) */}
          <path
            d={forecastPath}
            fill="none"
            stroke="#f97316"
            strokeWidth="2.5"
            strokeDasharray="5 4"
            strokeLinecap="round"
          />

          {/* Hover crosshair */}
          {hoveredIndex !== null && (
            <line
              x1={getX(hoveredIndex)}
              y1={padding.top}
              x2={getX(hoveredIndex)}
              y2={height - padding.bottom}
              stroke="#64748b"
              strokeWidth="1"
            />
          )}

          {/* Data interactive touch targets & dots */}
          {combinedData.map((d, i) => {
            const x = getX(i)
            const y = getY(d.isFuture ? (d.predicted ?? 0) : (d.actual ?? 0))
            const isHovered = hoveredIndex === i
            const isToday = d.isToday

            return (
              <g
                key={d.date}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
              >
                {/* Invisible large target */}
                <rect
                  x={x - (innerWidth / combinedData.length) / 2}
                  y={padding.top}
                  width={innerWidth / combinedData.length}
                  height={innerHeight}
                  fill="transparent"
                />

                {/* Point dot */}
                {(isHovered || isToday || i % 4 === 0) && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 5.5 : isToday ? 4.5 : 2.5}
                    fill={d.isFuture ? '#f97316' : '#1d4fd8'}
                    stroke="#ffffff"
                    strokeWidth={isHovered ? 2 : 1.5}
                  />
                )}
              </g>
            )
          })}

          {/* X axis labels (periodic) */}
          {combinedData.map((d, i) => {
            if (i % Math.ceil(combinedData.length / 8) !== 0 && i !== todayIndex) return null
            return (
              <text
                key={d.date}
                x={getX(i)}
                y={height - padding.bottom + 18}
                textAnchor="middle"
                className={`text-[10px] font-semibold ${
                  d.isToday ? 'fill-slate-900 font-black' : 'fill-slate-400'
                }`}
              >
                {d.label}
              </text>
            )
          })}
        </svg>

        {/* Hover info badge */}
        {activePoint && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500">Date:</span>
              <span className="font-extrabold text-slate-800">{activePoint.date}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                  activePoint.isToday
                    ? 'bg-slate-800 text-white'
                    : activePoint.isFuture
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {activePoint.isToday
                  ? 'Today (Verified Spot)'
                  : activePoint.isFuture
                  ? 'AI Predicted'
                  : 'Verified Historical'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-500">Price: </span>
                <span className="font-black text-slate-900">
                  {inr(activePoint.isFuture ? (activePoint.predicted ?? 0) : (activePoint.actual ?? 0))}
                </span>
                <span className="text-slate-500"> / {unit}</span>
              </div>

              {activePoint.lowBound !== undefined && activePoint.highBound !== undefined && activePoint.isFuture && (
                <div className="border-l border-slate-200 pl-3">
                  <span className="text-slate-500">95% Range: </span>
                  <span className="font-bold text-slate-700">
                    {inr(activePoint.lowBound)} – {inr(activePoint.highBound)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1 w-6 rounded-full bg-blue-600" />
          <span className="font-medium">Verified Historical Price</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-1 w-6 border-b-2 border-dashed border-orange-500" />
          <span className="font-medium">AI Forecast Trajectory (Holt Damped Model)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3.5 w-6 rounded bg-orange-200/50 border border-orange-400/40" />
          <span className="font-medium">95% Confidence Interval (±1.96 SE)</span>
        </div>
      </div>
    </div>
  )
}
