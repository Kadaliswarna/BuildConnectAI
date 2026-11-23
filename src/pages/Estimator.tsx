import { useMemo, useState } from 'react'
import { Field, PageShell, inr } from '../components/ui'

type Inputs = { area: number; floors: number; construction: string; quality: string; location: string; category: string }
type Rates = { cement: number; steel: number; sand: number; bricks: number; labour: number; electrical: number; plumbing: number; finish: number; contingency: number }
const rateDefaults: Rates = { cement: 420, steel: 68, sand: 55, bricks: 10, labour: 480, electrical: 160, plumbing: 140, finish: 220, contingency: 10 }
const rateNames: [keyof Rates, string, string][] = [
  ['cement', 'Cement', '₹ / 50 kg bag'], ['steel', 'Steel', '₹ / kg'], ['sand', 'Sand', '₹ / cubic ft'], ['bricks', 'Bricks', '₹ / piece'],
  ['labour', 'Labour', '₹ / sq ft'], ['electrical', 'Electrical', '₹ / sq ft'], ['plumbing', 'Plumbing', '₹ / sq ft'], ['finish', 'Flooring & painting', '₹ / sq ft'], ['contingency', 'Additional allowance', '%'],
]

export default function Estimator() {
  const [input, setInput] = useState<Inputs>({ area: 1000, floors: 1, construction: 'RCC frame', quality: 'Standard', location: '', category: 'Residential' })
  const [rates, setRates] = useState<Rates>(() => { try { return { ...rateDefaults, ...JSON.parse(localStorage.getItem('bc-estimator-rates') ?? '{}') } } catch { return rateDefaults } })
  const [showRates, setShowRates] = useState(false)
  const factor = (input.construction === 'Load-bearing' ? .9 : input.construction === 'Prefabricated' ? .82 : 1) * (input.quality === 'Economy' ? .88 : input.quality === 'Premium' ? 1.2 : 1) * (input.category === 'Commercial' ? 1.12 : input.category === 'Shop / office' ? 1.08 : 1)
  const result = useMemo(() => {
    const totalArea = input.area * input.floors
    const rows = [
      { name: 'Cement', qty: totalArea * .4 * factor, unit: 'bags', price: rates.cement },
      { name: 'Steel', qty: totalArea * 4 * factor, unit: 'kg', price: rates.steel },
      { name: 'Sand', qty: totalArea * 1.8 * factor, unit: 'cu ft', price: rates.sand },
      { name: 'Bricks', qty: totalArea * 8 * factor, unit: 'pieces', price: rates.bricks },
    ].map((x) => ({ ...x, qty: Math.ceil(x.qty), amount: Math.ceil(x.qty) * x.price }))
    const extras = [
      { name: 'Labour', amount: totalArea * rates.labour * factor },
      { name: 'Electrical', amount: totalArea * rates.electrical * factor },
      { name: 'Plumbing', amount: totalArea * rates.plumbing * factor },
      { name: 'Flooring & painting', amount: totalArea * rates.finish * factor },
    ]
    const base = rows.reduce((s, x) => s + x.amount, 0) + extras.reduce((s, x) => s + x.amount, 0)
    const additional = base * rates.contingency / 100
    return { totalArea, rows, extras, additional, total: base + additional, days: Math.ceil(100 + input.floors * 24 + totalArea / 45) }
  }, [input.area, input.floors, input.construction, input.quality, input.category, factor, rates])

  const updateRate = (key: keyof Rates, value: number) => {
    const next = { ...rates, [key]: Math.max(0, value) }; setRates(next)
    try { localStorage.setItem('bc-estimator-rates', JSON.stringify(next)) } catch { /* local preferences are optional */ }
  }
  const download = () => {
    const rows = [['BuildConnect AI · Construction estimate'], ['Location', input.location || 'Not specified'], ['Area per floor (sq ft)', String(input.area)], ['Floors', String(input.floors)], ['Construction type', input.construction], ['Material quality', input.quality], ['Building category', input.category], ['Estimated duration (days)', String(result.days)], [], ['Item', 'Quantity', 'Unit', 'Rate (INR)', 'Amount (INR)'], ...result.rows.map((x) => [x.name, String(x.qty), x.unit, String(x.price), String(x.amount)]), ...result.extras.map((x) => [x.name, '', '', '', String(Math.round(x.amount))]), ['Additional allowance', '', '', rates.contingency + '%', String(Math.round(result.additional))], ['Total estimated cost', '', '', '', String(Math.round(result.total))], [], ['Planning estimate only. Confirm current local quotes and engineering requirements before construction.']]
    const csv = rows.map((row) => row.map((cell) => '"' + String(cell ?? '').replace(/"/g, '""') + '"').join(',')).join('\r\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'buildconnect-construction-estimate.csv'; a.click(); URL.revokeObjectURL(a.href)
  }

  return <PageShell title="Construction cost estimator" subtitle="Adjust the assumptions and local rates to make a planning estimate for your project.">
    <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><strong>Planning estimate only.</strong> Default rates are illustrative placeholders, not verified current prices. Quantities and costs depend on soil, structural design, specifications, location and contractor quotes. Confirm with a licensed engineer and local suppliers.</div>
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="card space-y-4 p-5"><h2 className="text-xl font-extrabold">Project details</h2>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Area per floor (sq ft)"><input className="inp" type="number" min="100" max="100000" value={input.area} onChange={(e) => setInput({ ...input, area: Math.max(100, Number(e.target.value)) })} /></Field><Field label="Number of floors"><input className="inp" type="number" min="1" max="30" value={input.floors} onChange={(e) => setInput({ ...input, floors: Math.min(30, Math.max(1, Number(e.target.value))) })} /></Field>
          <Field label="Construction type"><select className="inp" value={input.construction} onChange={(e) => setInput({ ...input, construction: e.target.value })}><option>RCC frame</option><option>Load-bearing</option><option>Prefabricated</option></select></Field>
          <Field label="Material quality"><select className="inp" value={input.quality} onChange={(e) => setInput({ ...input, quality: e.target.value })}><option>Economy</option><option>Standard</option><option>Premium</option></select></Field>
          <Field label="Location"><input className="inp" placeholder="City / district" value={input.location} onChange={(e) => setInput({ ...input, location: e.target.value })} /></Field>
          <Field label="Building category"><select className="inp" value={input.category} onChange={(e) => setInput({ ...input, category: e.target.value })}><option>Residential</option><option>Commercial</option><option>Shop / office</option></select></Field>
        </div>
        <button className="text-sm font-bold text-brand underline" onClick={() => setShowRates((v) => !v)}>{showRates ? 'Hide' : 'Set'} local rate assumptions</button>
        {showRates && <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">{rateNames.map(([key, label, unit]) => <Field key={key} label={label + ' · ' + unit}><input className="inp" type="number" min="0" step="1" value={rates[key]} onChange={(e) => updateRate(key, Number(e.target.value))} /></Field>)}<button className="text-left text-sm font-semibold text-slate-600 underline" onClick={() => { setRates(rateDefaults); try { localStorage.removeItem('bc-estimator-rates') } catch { /* ignore */ } }}>Restore illustrative defaults</button></div>}
      </section>
      <section className="card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-500">Estimated total</p><div className="text-3xl font-extrabold text-brand">{inr(Math.round(result.total))}</div><p className="text-sm text-slate-500">{result.totalArea.toLocaleString()} total sq ft · about {result.days} calendar days</p></div><button className="btn2" onClick={download}>Download CSV</button></div>
        <h3 className="mt-6 font-extrabold">Materials</h3><div className="mt-2 divide-y">{result.rows.map((x) => <div key={x.name} className="flex items-center justify-between gap-3 py-2 text-sm"><span>{x.name}<small className="ml-2 text-slate-500">{x.qty.toLocaleString()} {x.unit}</small></span><strong>{inr(x.amount)}</strong></div>)}</div>
        <h3 className="mt-5 font-extrabold">Other costs</h3><div className="mt-2 divide-y">{result.extras.map((x) => <div key={x.name} className="flex justify-between gap-3 py-2 text-sm"><span>{x.name}</span><strong>{inr(Math.round(x.amount))}</strong></div>)}<div className="flex justify-between gap-3 py-2 text-sm"><span>Additional allowance ({rates.contingency}%)</span><strong>{inr(Math.round(result.additional))}</strong></div></div>
        <button className="mt-4 text-sm font-bold text-brand underline" onClick={() => window.print()}>Print / save as PDF</button>
      </section>
    </div>
  </PageShell>
}
