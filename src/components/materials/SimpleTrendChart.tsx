import { inr } from '../ui'

interface TrendPoint {
  label: string
  days: number
  price: number
}

interface Props {
  points: TrendPoint[]
  unit: string
}

export default function SimpleTrendChart({ points, unit }: Props) {
  if (points.length < 2) return null

  const prices = points.map((p) => p.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 10

  const width = 360
  const height = 140
  const padX = 40
  const padY = 25
  const chartW = width - padX * 2
  const chartH = height - padY * 2

  const getY = (val: number) => padY + chartH * (1 - (val - min) / range)
  const getX = (i: number) => padX + (i / (points.length - 1)) * chartW

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.price)}`)
    .join(' ')

  const isUp = points[points.length - 1].price > points[0].price
  const isDown = points[points.length - 1].price < points[0].price
  const strokeColor = isUp ? '#ea580c' : isDown ? '#16a34a' : '#2563eb'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="text-slate-500">Price Trend (Next 30 Days)</span>
        <span
          className={`flex items-center gap-1 ${
            isUp ? 'text-orange-600' : isDown ? 'text-green-600' : 'text-blue-600'
          }`}
        >
          {isUp ? '▲ Upward (Prices Rising)' : isDown ? '▼ Downward (Prices Falling)' : '■ Steady'}
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="mt-1 w-full overflow-visible">
        {/* Shaded Area Under Line */}
        <defs>
          <linearGradient id="simpleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <path
          d={`${pathD} L ${getX(points.length - 1)} ${height - padY} L ${getX(0)} ${height - padY} Z`}
          fill="url(#simpleGrad)"
        />

        {/* Trend Line */}
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />

        {/* Data Points and Value Labels */}
        {points.map((p, i) => {
          const x = getX(i)
          const y = getY(p.price)
          return (
            <g key={p.label}>
              <circle cx={x} cy={y} r="4" fill={strokeColor} stroke="#ffffff" strokeWidth="2" />
              <text
                x={x}
                y={y - 8}
                textAnchor="middle"
                className="fill-slate-900 text-[10px] font-black"
              >
                {inr(p.price)}
              </text>
              <text
                x={x}
                y={height - 5}
                textAnchor="middle"
                className="fill-slate-500 text-[9px] font-bold"
              >
                {p.label}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="mt-1 text-center text-[10px] text-slate-400">Values in ₹ per {unit}</p>
    </div>
  )
}
