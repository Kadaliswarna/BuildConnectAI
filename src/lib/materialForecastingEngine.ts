import type {
  CityMarket,
  ForecastPoint,
  HistoricalPricePoint,
  MarketDriver,
  MaterialId,
  PurchasePlanInput,
  PurchasePlanResult,
  RecommendationDetails,
  RecommendationType,
  TrendDirection,
} from '../types/materialIntelligence'
import { MATERIAL_SPECS } from '../data/materialMarketData'

interface HoltResult {
  level: number
  trend: number
  forecasts: number[]
  inSampleFitted: number[]
  rmse: number
}

/**
 * Holt's Linear Exponential Smoothing with Trend Damping
 * Alpha: Level smoothing factor (0 < alpha < 1)
 * Beta: Trend smoothing factor (0 < beta < 1)
 * Phi: Trend damping parameter (0 < phi <= 1)
 */
export function fitHoltDampedModel(
  history: number[],
  horizon: number,
  alpha = 0.35,
  beta = 0.15,
  phi = 0.92
): HoltResult {
  const n = history.length
  if (n < 3) {
    const last = history[n - 1] || 100
    return {
      level: last,
      trend: 0,
      forecasts: Array(horizon).fill(last),
      inSampleFitted: history,
      rmse: 0,
    }
  }

  // Initial values
  let level = history[0]
  let trend = history[1] - history[0]
  const inSampleFitted: number[] = [level]
  let sse = 0

  for (let t = 1; t < n; t++) {
    const y = history[t]
    const prevLevel = level
    const prevTrend = trend

    const yHat = prevLevel + phi * prevTrend
    inSampleFitted.push(yHat)
    sse += (y - yHat) ** 2

    // Update level and trend
    level = alpha * y + (1 - alpha) * (prevLevel + phi * prevTrend)
    trend = beta * (level - prevLevel) + (1 - beta) * (phi * prevTrend)
  }

  const rmse = Math.sqrt(sse / Math.max(1, n - 1))

  // Generate future horizon steps
  const forecasts: number[] = []
  let cumulativePhi = 0
  for (let h = 1; h <= horizon; h++) {
    cumulativePhi += Math.pow(phi, h)
    const yFuture = level + cumulativePhi * trend
    forecasts.push(Math.max(0.1, yFuture))
  }

  return { level, trend, forecasts, inSampleFitted, rmse }
}

/**
 * Weather icon & condition synthesis based on trend and volatility
 */
function getWeatherCondition(_trend: TrendDirection, volatilityPct: number, changePct: number): { icon: string; summary: string } {
  if (changePct > 3.0) {
    return { icon: '⛈️', summary: 'Severe Price Surge (High Cost Ahead)' }
  } else if (changePct > 1.0) {
    return { icon: '📈', summary: 'Rising Momentum (Upward Pressure)' }
  } else if (changePct < -2.5) {
    return { icon: '🌧️', summary: 'Sharp Price Drop (Buyer Advantage)' }
  } else if (changePct < -0.8) {
    return { icon: '⛅', summary: 'Softening Market (Gradual Ease)' }
  } else if (volatilityPct > 3.5) {
    return { icon: '🌪️', summary: 'Choppy & Volatile (Uncertain Trajectory)' }
  }
  return { icon: '☀️', summary: 'Stable Market (Fair Trading Window)' }
}

/**
 * Format a date with day name
 */
function formatDayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Today (Verified)'
  if (index === 1) return 'Tomorrow'
  const d = new Date(dateStr)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`
}

export interface MaterialForecastBundle {
  materialId: MaterialId
  city: CityMarket
  currentPrice: number
  previousPrice: number
  dayChange: number
  dayChangePct: number
  weekChangePct: number
  monthChangePct: number
  forecast7d: number
  forecast15d: number
  forecast30d: number
  confidenceRange7d: [number, number]
  confidenceRange15d: [number, number]
  confidenceRange30d: [number, number]
  recommendation: RecommendationDetails
  forecastTrajectory: ForecastPoint[]
  history: HistoricalPricePoint[]
  lastUpdated: string
  dataSource: string
  isDataSufficient: boolean
}

/**
 * Generate full forecast bundle for a given material and city
 */
export function generateMaterialForecast(
  materialId: MaterialId,
  city: CityMarket,
  rawHistory: HistoricalPricePoint[],
  marketDrivers: MarketDriver[]
): MaterialForecastBundle {
  const isDataSufficient = rawHistory.length >= 7

  if (!isDataSufficient) {
    const dummyPrice = 100 * city.logisticsMultiplier
    return {
      materialId,
      city,
      currentPrice: dummyPrice,
      previousPrice: dummyPrice,
      dayChange: 0,
      dayChangePct: 0,
      weekChangePct: 0,
      monthChangePct: 0,
      forecast7d: dummyPrice,
      forecast15d: dummyPrice,
      forecast30d: dummyPrice,
      confidenceRange7d: [dummyPrice * 0.9, dummyPrice * 1.1],
      confidenceRange15d: [dummyPrice * 0.85, dummyPrice * 1.15],
      confidenceRange30d: [dummyPrice * 0.8, dummyPrice * 1.2],
      recommendation: {
        action: 'MONITOR',
        headline: 'Insufficient Historical Data for Reliable Forecasting',
        reason: 'Less than 7 verified daily price points exist for this material in the selected location.',
        marketSituation: 'Awaiting verified supplier quotation logs to construct an econometric time-series baseline.',
        expectedMovement: 'Undetermined due to high statistical variance.',
        expectedSavingsCost: 'Cannot calculate savings with high confidence.',
        confidenceScore: 20,
        volatilityScore: 10,
        riskFactors: ['High data sparsity', 'Risk of spot price mispricing'],
        disclaimer: 'Never guarantee future prices. Actual purchase prices depend on binding supplier contracts.',
      },
      forecastTrajectory: [],
      history: rawHistory,
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST Today',
      dataSource: 'Insufficient Data',
      isDataSufficient: false,
    }
  }

  // Adjust historical prices by city logistics multiplier
  const history = rawHistory.map((pt) => ({
    ...pt,
    price: Math.round(pt.price * city.logisticsMultiplier * 10) / 10,
  }))

  const priceValues = history.map((pt) => pt.price)
  const currentPrice = priceValues[priceValues.length - 1]
  const previousPrice = priceValues[priceValues.length - 2] ?? currentPrice
  const weekAgoPrice = priceValues[Math.max(0, priceValues.length - 8)] ?? currentPrice
  const monthAgoPrice = priceValues[Math.max(0, priceValues.length - 31)] ?? currentPrice

  const dayChange = Math.round((currentPrice - previousPrice) * 100) / 100
  const dayChangePct = Math.round(((currentPrice - previousPrice) / previousPrice) * 1000) / 10
  const weekChangePct = Math.round(((currentPrice - weekAgoPrice) / weekAgoPrice) * 1000) / 10
  const monthChangePct = Math.round(((currentPrice - monthAgoPrice) / monthAgoPrice) * 1000) / 10

  // Fit Holt Damped model for 30 future steps
  const model = fitHoltDampedModel(priceValues, 30)

  // Factor in exogenous driver shocks:
  // e.g. Diesel hike +2.4% -> +0.5% drift on heavy goods (cement/sand/aggregates)
  let exogenousDriftPct = 0
  if (['cement', 'sand', 'aggregates'].includes(materialId)) {
    exogenousDriftPct += 0.012 // Freight push
  }
  if (materialId === 'steel') {
    exogenousDriftPct -= 0.015 // Iron ore softness
  }
  if (materialId === 'paint' || materialId === 'plumbing') {
    exogenousDriftPct += 0.008 // Crude/Resin push
  }

  const startDate = new Date(history[history.length - 1].date)
  const forecastTrajectory: ForecastPoint[] = [
    {
      date: history[history.length - 1].date,
      dayLabel: 'Today (Spot)',
      predictedPrice: currentPrice,
      lowBound: currentPrice,
      highBound: currentPrice,
      changePercent: 0,
      trend: 'STABLE',
      weatherIcon: '☀️',
      weatherSummary: 'Current Verified Spot Price',
      isActual: true,
    },
  ]

  for (let h = 1; h <= 30; h++) {
    const futureDate = new Date(startDate)
    futureDate.setDate(futureDate.getDate() + h)
    const dateStr = futureDate.toISOString().slice(0, 10)

    // Blend statistical model with gradual exogenous factor weight
    const rawPredicted = model.forecasts[h - 1]
    const exogenousFactor = 1 + exogenousDriftPct * (h / 30)
    const predictedPrice = Math.round(rawPredicted * exogenousFactor * 10) / 10

    // Standard error expands with horizon
    const horizonFactor = Math.sqrt(1 + 0.07 * (h - 1))
    const margin = 1.96 * model.rmse * horizonFactor
    const lowBound = Math.max(0.1, Math.round((predictedPrice - margin) * 10) / 10)
    const highBound = Math.round((predictedPrice + margin) * 10) / 10

    const changePercent = Math.round(((predictedPrice - currentPrice) / currentPrice) * 1000) / 10
    const trend: TrendDirection = changePercent > 0.8 ? 'UP' : changePercent < -0.8 ? 'DOWN' : 'STABLE'
    const volatilityPct = (model.rmse / currentPrice) * 100
    const { icon, summary } = getWeatherCondition(trend, volatilityPct, changePercent)

    forecastTrajectory.push({
      date: dateStr,
      dayLabel: formatDayLabel(dateStr, h),
      predictedPrice,
      lowBound,
      highBound,
      changePercent,
      trend,
      weatherIcon: icon,
      weatherSummary: summary,
      isActual: false,
    })
  }

  const pt7 = forecastTrajectory[7]
  const pt15 = forecastTrajectory[15]
  const pt30 = forecastTrajectory[30]

  const forecast7d = pt7 ? pt7.predictedPrice : currentPrice
  const forecast15d = pt15 ? pt15.predictedPrice : currentPrice
  const forecast30d = pt30 ? pt30.predictedPrice : currentPrice

  const confidenceRange7d: [number, number] = [pt7?.lowBound ?? currentPrice, pt7?.highBound ?? currentPrice]
  const confidenceRange15d: [number, number] = [pt15?.lowBound ?? currentPrice, pt15?.highBound ?? currentPrice]
  const confidenceRange30d: [number, number] = [pt30?.lowBound ?? currentPrice, pt30?.highBound ?? currentPrice]

  // Synthesize Buy Now / Wait Recommendation
  const recommendation = evaluateRecommendation(
    materialId,
    currentPrice,
    forecast15d,
    forecast30d,
    model.rmse,
    marketDrivers,
    city
  )

  const spec = MATERIAL_SPECS[materialId]
  const dataSource = spec ? spec.sources[0] : 'National Building Material Exchange'

  return {
    materialId,
    city,
    currentPrice,
    previousPrice,
    dayChange,
    dayChangePct,
    weekChangePct,
    monthChangePct,
    forecast7d,
    forecast15d,
    forecast30d,
    confidenceRange7d,
    confidenceRange15d,
    confidenceRange30d,
    recommendation,
    forecastTrajectory,
    history,
    lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST Today',
    dataSource,
    isDataSufficient,
  }
}

/**
 * AI Recommendation Decision Engine
 */
function getMaterialMarketContext(materialId: MaterialId, city: CityMarket): string {
  switch (materialId) {
    case 'cement':
      return `Cement wholesale dispatches in ${city.name} are affected by clinker manufacturing costs and diesel transport freight.`
    case 'steel':
      return `TMT steel rebar prices in ${city.name} are tracking domestic rolling mill billets and raw iron scrap supplies.`
    case 'sand':
      return `M-sand and river sand rates in ${city.name} are determined by local quarry checkposts and tipper truck delivery charges.`
    case 'bricks':
      return `Brick and AAC block rates in ${city.name} depend on regional kiln firing capacity and coal fuel availability.`
    case 'tiles':
      return `Vitrified tile wholesale rates in ${city.name} reflect manufacturer dispatches from Morbi production clusters and freight.`
    case 'paint':
      return `Paint prices in ${city.name} track raw acrylic polymer chemical costs and manufacturer wholesale lists.`
    case 'aggregates':
      return `20mm coarse aggregate prices in ${city.name} reflect local stone crusher pithead supplies and heavy transport costs.`
    case 'electrical':
      return `Electrical copper wire rates in ${city.name} are closely linked to raw copper commodity trading and PVC resin costs.`
    case 'plumbing':
      return `CPVC plumbing pipe rates in ${city.name} reflect polymer resin raw material prices and pipe manufacturer wholesale policies.`
    case 'roofing':
      return `Colorbond Galvalume roofing sheet prices in ${city.name} reflect steel coil supply and galvanizing metal rates.`
    default:
      return `Wholesale building material supplies in ${city.name} are balanced with local construction demand.`
  }
}

/**
 * AI Recommendation Decision Engine
 */
function evaluateRecommendation(
  materialId: MaterialId,
  currentPrice: number,
  forecast15d: number,
  forecast30d: number,
  rmse: number,
  _marketDrivers: MarketDriver[],
  city: CityMarket
): RecommendationDetails {
  const spec = MATERIAL_SPECS[materialId]
  const delta15Pct = ((forecast15d - currentPrice) / currentPrice) * 100
  const delta30Pct = ((forecast30d - currentPrice) / currentPrice) * 100
  const volatilityScore = Math.min(100, Math.round((rmse / currentPrice) * 1000) / 10)
  const unit = spec.primaryUnit
  const matName = spec.name.split('(')[0].trim()
  const marketContext = getMaterialMarketContext(materialId, city)

  let action: RecommendationType = 'MONITOR'
  let headline = ''
  let reason = ''
  let marketSituation = marketContext
  let expectedMovement = ''
  let expectedSavingsCost = ''
  let confidenceScore = 82
  const riskFactors: string[] = []

  // Check specific market dynamics
  if (delta15Pct >= 1.8 || delta30Pct >= 3.0) {
    action = 'BUY NOW'
    confidenceScore = Math.max(75, Math.min(94, 90 - volatilityScore * 2))
    headline = `Buy Now — ${matName} Prices Expected to Rise`
    reason = `${matName} prices in ${city.name} are expected to rise by +${delta15Pct.toFixed(1)}% over the next 15 days. Purchasing what you need for immediate construction work now will help you avoid higher costs.`
    expectedMovement = `Projected to increase from ₹${currentPrice} to about ₹${forecast15d} (+₹${Math.round(forecast15d - currentPrice)} per ${unit}) over 15 days.`
    expectedSavingsCost = `Buying now saves about ₹${Math.round(forecast15d - currentPrice)} per ${unit} compared to purchasing in 2 weeks.`
    riskFactors.push(`Storage conditions on site — ensure proper protection from rain and dampness`)
    riskFactors.push(`Only purchase for immediate construction milestones (within 4-6 weeks)`)
  } else if (delta15Pct <= -1.5 || delta30Pct <= -2.5) {
    action = 'WAIT'
    confidenceScore = Math.max(70, Math.min(92, 88 - volatilityScore * 2))
    headline = `Wait — ${matName} Prices Expected to Drop`
    reason = `${matName} wholesale rates in ${city.name} are showing a downward trend of ${delta15Pct.toFixed(1)}% over the next 15 days. If your construction schedule is flexible, waiting can help you save money.`
    expectedMovement = `Projected to decrease from ₹${currentPrice} to about ₹${forecast15d} (-₹${Math.round(currentPrice - forecast15d)} per ${unit}) over 15 days.`
    expectedSavingsCost = `Waiting 15 days is estimated to save about ₹${Math.round(currentPrice - forecast15d)} per ${unit}.`
    riskFactors.push(`Potential delivery delays if local dealer stock runs low`)
    riskFactors.push(`Ensure your site work schedule is not delayed while waiting for price drops`)
  } else if (volatilityScore >= 4.0 || (delta15Pct > 0.6 && delta15Pct < 1.8)) {
    action = 'BUY PARTIALLY'
    confidenceScore = 76
    headline = `Buy Partially — Order What You Need for This Week`
    reason = `${matName} prices are showing minor fluctuations in ${city.name}. Buy a partial quantity for your immediate construction work and purchase the rest later.`
    expectedMovement = `Prices are moving within a narrow range of ±${Math.abs(delta15Pct).toFixed(1)}% over 15 days.`
    expectedSavingsCost = `Splitting your order protects you from sudden price jumps while keeping site work running smoothly.`
    riskFactors.push(`Ordering in smaller split batches may incur multiple delivery transport charges`)
  } else {
    action = 'MONITOR'
    confidenceScore = 72
    headline = `Monitor Market — ${matName} Prices are Steady`
    reason = `${matName} prices in ${city.name} are currently stable with no urgent change expected. You can order normally based on your contractor's schedule.`
    expectedMovement = `Prices are holding steady near ₹${currentPrice} per ${unit} (less than 1% change projected).`
    expectedSavingsCost = `Neutral impact; prices are currently at fair market benchmark levels.`
    riskFactors.push(`Check with local suppliers for batch availability and transport fees`)
  }

  return {
    action,
    headline,
    reason,
    marketSituation,
    expectedMovement,
    expectedSavingsCost,
    confidenceScore,
    volatilityScore,
    riskFactors,
    disclaimer: 'Price predictions are statistical estimates based on verified regional wholesale trends. Always confirm final delivery charges and taxes with local suppliers before purchasing.',
  }
}

/**
 * AI Purchase Planner Calculation Engine
 */
export function calculatePurchasePlan(
  input: PurchasePlanInput,
  forecastBundle: MaterialForecastBundle
): PurchasePlanResult {
  const spec = MATERIAL_SPECS[input.materialId]
  const spotPrice = forecastBundle.currentPrice

  // Determine future price based on target date
  const today = new Date().toISOString().slice(0, 10)
  const targetDate = input.targetPurchaseDate || today
  const targetPt = forecastBundle.forecastTrajectory.find((pt) => pt.date === targetDate)
  const futurePrice = targetPt ? targetPt.predictedPrice : forecastBundle.forecast30d

  const spotCost = Math.round(input.quantity * spotPrice)
  const futureCost = Math.round(input.quantity * futurePrice)
  const netSavings = spotCost - futureCost // Positive means future is cheaper, negative means future is more expensive
  const savingsPercent = spotCost > 0 ? Math.round((netSavings / spotCost) * 1000) / 10 : 0

  let budgetImpact: 'Within Budget' | 'Budget Deficit' | 'Safe Margin' = 'Within Budget'
  if (input.budget > 0) {
    if (futureCost > input.budget) {
      budgetImpact = 'Budget Deficit'
    } else if (input.budget - futureCost > input.budget * 0.15) {
      budgetImpact = 'Safe Margin'
    }
  }

  let recommendedAction: RecommendationType = forecastBundle.recommendation.action
  let procurementAdvice = ''

  if (futureCost > spotCost) {
    const costIncrease = futureCost - spotCost
    procurementAdvice = `Procure ${input.quantity.toLocaleString()} ${spec.primaryUnit} immediately. Prices are projected to increase by ₹${costIncrease.toLocaleString()} (+${Math.abs(savingsPercent)}%) by ${targetDate}. Immediate procurement locks in the current spot rate of ₹${spotPrice}/${spec.primaryUnit}.`
    recommendedAction = 'BUY NOW'
  } else if (futureCost < spotCost) {
    const costSaving = spotCost - futureCost
    procurementAdvice = `Schedule procurement for ${targetDate}. Waiting is projected to save ₹${costSaving.toLocaleString()} (${savingsPercent}%) as wholesale quotes ease from ₹${spotPrice} to ₹${futurePrice}/${spec.primaryUnit}.`
    recommendedAction = 'WAIT'
  } else {
    procurementAdvice = `Prices on ${targetDate} are projected to remain steady around ₹${spotPrice}/${spec.primaryUnit}. Order according to site construction milestones without rush.`
    recommendedAction = 'MONITOR'
  }

  return {
    materialId: input.materialId,
    quantity: input.quantity,
    unit: spec.primaryUnit,
    spotPrice,
    spotCost,
    futurePrice,
    futureCost,
    netSavings,
    savingsPercent,
    budgetImpact,
    recommendedAction,
    procurementAdvice,
  }
}
