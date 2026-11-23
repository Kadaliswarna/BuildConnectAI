import type { CityMarket, MaterialId, SupplierQuotation } from '../../types/materialIntelligence'
import { inr } from '../ui'

interface Props {
  cities: CityMarket[]
  selectedCityId: string
  onSelectCity: (cityId: string) => void
  currentBasePrice: number
  unit: string
  materialId?: MaterialId
  quotes?: SupplierQuotation[]
}

export default function RegionalPriceTable({
  cities,
  selectedCityId,
  onSelectCity,
  currentBasePrice,
  unit,
  quotes,
}: Props) {
  const activeCity = cities.find((c) => c.id === selectedCityId) ?? cities[0]

  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📍</span>
            <h3 className="text-lg font-black text-slate-900">Regional Price Intelligence & Multi-City Comparison</h3>
          </div>
          <p className="text-xs text-slate-500">
            Compare regional wholesale indices, delivery lead times, and freight multipliers across Indian metro hubs
            {quotes && quotes.length > 0 ? ` (${quotes.length} verified quotes available)` : ''}
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Selected Hub: <strong className="text-slate-800">{activeCity.name}</strong>
        </div>
      </div>

      {/* City Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500">
              <th className="py-2.5 px-3">City / Market</th>
              <th className="py-2.5 px-3">State</th>
              <th className="py-2.5 px-3">Spot Rate ({unit})</th>
              <th className="py-2.5 px-3">Variance vs {activeCity.name}</th>
              <th className="py-2.5 px-3">Freight Base</th>
              <th className="py-2.5 px-3">Supply Status</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cities.map((city) => {
              const isSelected = city.id === selectedCityId
              // Compute spot price in this city relative to the benchmark
              const cityPrice = Math.round(currentBasePrice * (city.logisticsMultiplier / activeCity.logisticsMultiplier) * 10) / 10
              const diffFromActive = cityPrice - currentBasePrice
              const diffPct = Math.round((diffFromActive / currentBasePrice) * 1000) / 10

              return (
                <tr
                  key={city.id}
                  className={`transition-colors ${
                    isSelected ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <span className="font-extrabold text-slate-800">{city.name}</span>
                    {isSelected && (
                      <span className="ml-1.5 rounded bg-brand px-1.5 py-0.5 text-[9px] font-black text-white">
                        ACTIVE
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{city.state}</td>
                  <td className="py-2.5 px-3 font-black text-slate-900">{inr(cityPrice)}</td>
                  <td className="py-2.5 px-3">
                    {diffFromActive === 0 ? (
                      <span className="text-slate-400">Baseline</span>
                    ) : diffFromActive > 0 ? (
                      <span className="font-bold text-red-600">
                        +{inr(diffFromActive)} (+{diffPct}%)
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-600">
                        {inr(diffFromActive)} ({diffPct}%)
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    ₹{city.baseTransportPerTonKm} / ton-km
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        city.supplyStatus === 'Surplus'
                          ? 'bg-emerald-100 text-emerald-800'
                          : city.supplyStatus === 'Adequate'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {city.supplyStatus} · {city.leadTimeDays}d lead
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      disabled={isSelected}
                      onClick={() => onSelectCity(city.id)}
                      className={`rounded px-2.5 py-1 text-[11px] font-bold transition-all ${
                        isSelected
                          ? 'bg-slate-200 text-slate-500 cursor-default'
                          : 'bg-brand text-white hover:bg-brand-dark'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Switch City'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
