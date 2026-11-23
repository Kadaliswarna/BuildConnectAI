export type MaterialId =
  | 'cement'
  | 'steel'
  | 'sand'
  | 'bricks'
  | 'tiles'
  | 'paint'
  | 'aggregates'
  | 'electrical'
  | 'plumbing'
  | 'roofing'

export type RecommendationType = 'BUY NOW' | 'WAIT' | 'BUY PARTIALLY' | 'MONITOR'
export type TrendDirection = 'UP' | 'DOWN' | 'STABLE'
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export interface HistoricalPricePoint {
  date: string // YYYY-MM-DD
  price: number
  volumeMetric?: number
  source: string
  isVerified: boolean
}

export interface ForecastPoint {
  date: string // YYYY-MM-DD
  dayLabel: string // e.g. "Today", "Tomorrow", "Mon, 24 Nov"
  predictedPrice: number
  lowBound: number
  highBound: number
  changePercent: number
  trend: TrendDirection
  weatherIcon: string
  weatherSummary: string
  isActual?: boolean
}

export interface RecommendationDetails {
  action: RecommendationType
  headline: string
  reason: string
  marketSituation: string
  expectedMovement: string
  expectedSavingsCost: string
  confidenceScore: number // 0-100%
  volatilityScore: number // 0-100%
  riskFactors: string[]
  disclaimer: string
}

export interface MarketDriver {
  id: string
  name: string
  category: 'Commodity' | 'Logistics' | 'Energy' | 'Seasonality' | 'Policy' | 'Demand'
  impact: 'positive' | 'negative' | 'neutral'
  weightPercent: number
  currentMetric: string
  trend: TrendDirection
  isVerifiedData: boolean
  dataSource: string
  description: string
}

export interface MaterialSpecification {
  id: MaterialId
  name: string
  category: string
  primaryUnit: string
  secondaryUnit?: string
  unitMultiplier?: number
  standardGrade: string
  typicalCoverage: string
  planningRuleOfThumb: string
  sources: string[]
}

export interface CityMarket {
  id: string
  name: string
  state: string
  logisticsMultiplier: number
  baseTransportPerTonKm: number
  supplyStatus: 'Surplus' | 'Adequate' | 'Constrained' | 'Volatile'
  leadTimeDays: number
}

export interface SupplierQuotation {
  id: string
  materialId: MaterialId
  supplierName: string
  city: string
  price: number
  unit: string
  date: string
  leadTimeDays: number
  transportFee: number
  isVerified: boolean
  contactPhone?: string
  minOrderQuantity?: string
}

export interface PriceAlert {
  id: string
  materialId: MaterialId
  city: string
  condition: 'below' | 'above' | 'percent_change'
  targetPrice: number
  targetPercent?: number
  createdDate: string
  active: boolean
  triggered: boolean
  lastCheckedPrice?: number
}

export interface PurchasePlanInput {
  builtUpArea: number
  floors: number
  materialId: MaterialId
  quantity: number
  targetPurchaseDate: string
  budget: number
}

export interface PurchasePlanResult {
  materialId: MaterialId
  quantity: number
  unit: string
  spotPrice: number
  spotCost: number
  futurePrice: number
  futureCost: number
  netSavings: number
  savingsPercent: number
  budgetImpact: 'Within Budget' | 'Budget Deficit' | 'Safe Margin'
  recommendedAction: RecommendationType
  procurementAdvice: string
}
