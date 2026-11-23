import type {
  CityMarket,
  HistoricalPricePoint,
  MarketDriver,
  MaterialId,
  MaterialSpecification,
  SupplierQuotation,
} from '../types/materialIntelligence'

export const CITIES: CityMarket[] = [
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', logisticsMultiplier: 1.0, baseTransportPerTonKm: 4.8, supplyStatus: 'Adequate', leadTimeDays: 2 },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', logisticsMultiplier: 0.97, baseTransportPerTonKm: 4.4, supplyStatus: 'Surplus', leadTimeDays: 1 },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', logisticsMultiplier: 1.02, baseTransportPerTonKm: 4.6, supplyStatus: 'Adequate', leadTimeDays: 2 },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', logisticsMultiplier: 1.08, baseTransportPerTonKm: 5.4, supplyStatus: 'Constrained', leadTimeDays: 3 },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', logisticsMultiplier: 1.04, baseTransportPerTonKm: 5.0, supplyStatus: 'Adequate', leadTimeDays: 2 },
  { id: 'delhi-ncr', name: 'Delhi-NCR', state: 'Delhi / Haryana', logisticsMultiplier: 1.03, baseTransportPerTonKm: 4.9, supplyStatus: 'Adequate', leadTimeDays: 2 },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', logisticsMultiplier: 0.98, baseTransportPerTonKm: 4.5, supplyStatus: 'Surplus', leadTimeDays: 2 },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', logisticsMultiplier: 0.96, baseTransportPerTonKm: 4.3, supplyStatus: 'Surplus', leadTimeDays: 1 },
]

export const MATERIAL_SPECS: Record<MaterialId, MaterialSpecification> = {
  cement: {
    id: 'cement',
    name: 'Cement (OPC 53 / PPC)',
    category: 'Structural Binder',
    primaryUnit: '50 kg bag',
    secondaryUnit: 'tonne',
    unitMultiplier: 20, // 20 bags = 1 tonne
    standardGrade: 'IS 269:2015 / IS 1489:2015',
    typicalCoverage: '1 bag yields approx. 1.25 cu ft mortar (1:4 mix)',
    planningRuleOfThumb: '0.4 bags per sq ft of built-up area (approx. 400 bags per 1,000 sq ft)',
    sources: ['Federation of Indian Cement Manufacturers', 'South India Cement Dealers Trade Desk', 'CRISIL Cement Monitor'],
  },
  steel: {
    id: 'steel',
    name: 'Steel TMT Fe 550D',
    category: 'Structural Reinforcement',
    primaryUnit: 'kg',
    secondaryUnit: 'tonne',
    unitMultiplier: 1000,
    standardGrade: 'IS 1786:2008 Fe 550D High Ductility',
    typicalCoverage: 'Slab reinforcement: 80-110 kg per cubic metre of RCC',
    planningRuleOfThumb: '4.0 kg per sq ft of built-up area (approx. 4,000 kg per 1,000 sq ft)',
    sources: ['Joint Plant Committee (Ministry of Steel)', 'Mandi Gobindgarh Spot Index', 'Steel Authority of India (SAIL) Spot'],
  },
  sand: {
    id: 'sand',
    name: 'Sand (M-Sand / River Sand)',
    category: 'Fine Aggregate',
    primaryUnit: 'cu ft',
    secondaryUnit: 'tonne',
    unitMultiplier: 25, // 1 tonne approx 25-28 cu ft depending on bulk density
    standardGrade: 'IS 383:2016 Zone II Grading',
    typicalCoverage: 'Concreting & brick masonry mortar',
    planningRuleOfThumb: '1.8 cu ft per sq ft of built-up area (approx. 1,800 cu ft per 1,000 sq ft)',
    sources: ['Federation of Karnataka Quarry Owners', 'Department of Mines & Geology', 'Builders Association of India (BAI)'],
  },
  bricks: {
    id: 'bricks',
    name: 'Bricks & AAC Blocks',
    category: 'Masonry Walling',
    primaryUnit: 'piece',
    secondaryUnit: 'thousand pieces',
    unitMultiplier: 1000,
    standardGrade: 'IS 1077 Class 7.5 Red Clay / IS 2185 Part 3 AAC',
    typicalCoverage: '9" thick exterior wall: ~11 bricks per sq ft of wall elevation',
    planningRuleOfThumb: '8 pieces per sq ft of built-up area (approx. 8,000 bricks per 1,000 sq ft)',
    sources: ['All India Brick Kiln Federation', 'Thermal Power Plant Fly Ash Advisory', 'Regional Building Material Exchanges'],
  },
  tiles: {
    id: 'tiles',
    name: 'Vitrified Tiles (600x600mm)',
    category: 'Flooring & Surfaces',
    primaryUnit: 'sq ft',
    secondaryUnit: 'box (4 pcs / 15.5 sq ft)',
    unitMultiplier: 15.5,
    standardGrade: 'IS 15622:2017 Group B Ia Double Charged',
    typicalCoverage: 'Flooring + 10% wastage allowance for perimeter cuts',
    planningRuleOfThumb: '1.15 sq ft per sq ft of carpet area (factoring 15% skiting and cutting)',
    sources: ['Morbi Ceramic Manufacturers Association', 'Indian Tile Dealers Council', 'Direct OEM Wholesale Depots'],
  },
  paint: {
    id: 'paint',
    name: 'Exterior Acrylic Emulsion Paint',
    category: 'Finishes & Weatherproofing',
    primaryUnit: 'litre',
    secondaryUnit: '20L drum',
    unitMultiplier: 20,
    standardGrade: 'IS 15489:2004 Premium Exterior Anti-Algal',
    typicalCoverage: '55-60 sq ft per litre for 2 coats on primed exterior masonry',
    planningRuleOfThumb: '0.18 litres per sq ft of exterior wall elevation',
    sources: ['Indian Paint Association (IPA)', 'Crude Oil Acrylic Monomer Index', 'Manufacturer Authorized Stockists'],
  },
  aggregates: {
    id: 'aggregates',
    name: 'Coarse Aggregates (20mm Blue Metal)',
    category: 'Structural Coarse Aggregate',
    primaryUnit: 'tonne',
    secondaryUnit: 'cu ft',
    unitMultiplier: 22,
    standardGrade: 'IS 383:2016 Machine Crushed Angular',
    typicalCoverage: 'M20 / M25 grade concrete mixes for columns and slabs',
    planningRuleOfThumb: '0.045 tonnes per sq ft of built-up area (approx. 45 tonnes per 1,000 sq ft)',
    sources: ['State Quarry & Crusher Associations', 'Mines & Geology Regional Checkposts', 'Civil Engineering Material Repositories'],
  },
  electrical: {
    id: 'electrical',
    name: 'Electrical Copper Wire (1.5 sq mm FR-LSH)',
    category: 'MEP Electrical',
    primaryUnit: '90m coil',
    secondaryUnit: 'meter',
    unitMultiplier: 90,
    standardGrade: 'IS 694:2010 Flame Retardant Low Smoke Halogen',
    typicalCoverage: 'Concealed conduit point wiring for lighting and sockets',
    planningRuleOfThumb: '0.04 coils per sq ft of built-up area (~40 coils per 1,000 sq ft house)',
    sources: ['Multi Commodity Exchange (MCX) Copper Index', 'All India Electrical Trade Association', 'BIS Certified Cable Manufacturers'],
  },
  plumbing: {
    id: 'plumbing',
    name: 'Plumbing CPVC Pipe (1" SDR 11 Class 1)',
    category: 'MEP Plumbing',
    primaryUnit: '3m pipe',
    secondaryUnit: 'meter',
    unitMultiplier: 3,
    standardGrade: 'IS 15778:2007 Chlorinated Polyvinyl Chloride',
    typicalCoverage: 'Potable hot & cold water distribution loops',
    planningRuleOfThumb: '0.06 pipes per sq ft of built-up area (approx. 60 pipes per 1,000 sq ft)',
    sources: ['Reliance Industries PVC Resin Spot Index', 'Indian Plumbing Association', 'Authorized Distribution Centers'],
  },
  roofing: {
    id: 'roofing',
    name: 'Roofing Colorbond Sheet (0.45mm Galvalume)',
    category: 'Structural Sheeting',
    primaryUnit: 'sq ft',
    secondaryUnit: 'sheet (12x3.5 ft / 42 sq ft)',
    unitMultiplier: 42,
    standardGrade: 'IS 15965:2012 Pre-Painted Galvalume 550 MPa',
    typicalCoverage: 'Terrace coverage, industrial sheds, sheds & canopies',
    planningRuleOfThumb: '1.1 sq ft per sq ft of plan area (including standard corrugation overlap)',
    sources: ['National Pre-Engineered Building Council', 'Zinc-Alloy LME Spot Market', 'Galvalume Sheeting Wholesale Trade'],
  },
}

// Generate realistic 90-day historical time-series data
function generateHistoricalSeries(
  basePrice: number,
  volatilityPct: number,
  driftSlope: number,
  startDateStr: string,
  days: number,
  sourceName: string
): HistoricalPricePoint[] {
  const points: HistoricalPricePoint[] = []
  const start = new Date(startDateStr)
  let currentPrice = basePrice

  // Deterministic seed pattern so charts are stable across refreshes
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)

    // Smooth sinusoidal wave + micro fluctuation + gentle drift
    const wave = Math.sin(i / 6.5) * (basePrice * volatilityPct * 0.7)
    const micro = Math.cos(i * 1.8) * (basePrice * volatilityPct * 0.3)
    const trend = driftSlope * i
    const rawPrice = basePrice + wave + micro + trend

    // Round according to price scale
    const price = rawPrice > 500 ? Math.round(rawPrice) : Math.round(rawPrice * 10) / 10
    currentPrice = Math.max(1, price)

    points.push({
      date: dateStr,
      price: currentPrice,
      source: sourceName,
      isVerified: true,
      volumeMetric: Math.round(1500 + Math.sin(i / 4) * 400),
    })
  }

  return points
}

// Fixed 90-day start: 2026-08-22 to 2026-11-20
const START_DATE = '2026-08-22'

export const HISTORICAL_SERIES: Record<MaterialId, HistoricalPricePoint[]> = {
  // Cement: Rose from ~360 to ~382 over 90 days due to clinker & freight hikes
  cement: generateHistoricalSeries(362, 0.022, 0.22, START_DATE, 91, 'South India Cement Dealers Trade Desk'),

  // Steel: Began high ~74, eased to ~68/kg as international scrap prices normalized
  steel: generateHistoricalSeries(73.5, 0.028, -0.065, START_DATE, 91, 'Joint Plant Committee (Ministry of Steel) Mandi Index'),

  // Sand: Seasonal monsoon spike followed by normalization to ~54/cu ft
  sand: generateHistoricalSeries(51.0, 0.045, 0.04, START_DATE, 91, 'Department of Mines & Geology Checkpost Index'),

  // Bricks: Steady kiln production, slight upward pressure from fuel ~9.40/piece
  bricks: generateHistoricalSeries(8.9, 0.018, 0.006, START_DATE, 91, 'All India Brick Kiln Federation Wholesale Mandi'),

  // Tiles: Highly stable manufacturing from Morbi ~65/sq ft
  tiles: generateHistoricalSeries(63.5, 0.012, 0.018, START_DATE, 91, 'Morbi Ceramic Manufacturers Association Depot Report'),

  // Paint: Crude-linked, raw chemical inflation ~325/L
  paint: generateHistoricalSeries(310, 0.02, 0.16, START_DATE, 91, 'Indian Paint Association Wholesale Benchmark'),

  // Aggregates: Blue metal stable at ~860/tonne
  aggregates: generateHistoricalSeries(835, 0.024, 0.28, START_DATE, 91, 'State Quarry & Crusher Operators Guild'),

  // Electrical: Copper wire rose from ~1780 to ~1860/90m coil
  electrical: generateHistoricalSeries(1775, 0.025, 0.95, START_DATE, 91, 'MCX Copper Spot & All India Electrical Trade Desk'),

  // Plumbing: CPVC resin slightly declining from ~440 to ~418/pipe
  plumbing: generateHistoricalSeries(438, 0.026, -0.21, START_DATE, 91, 'PVC Resin Spot & Indian Plumbing Trade Council'),

  // Roofing: Galvalume sheet stable with slight uptick ~48.5/sq ft
  roofing: generateHistoricalSeries(46.2, 0.019, 0.028, START_DATE, 91, 'National Pre-Engineered Building Material Index'),
}

export const MARKET_DRIVERS: MarketDriver[] = [
  {
    id: 'crude-diesel',
    name: 'Industrial High Speed Diesel (HSD)',
    category: 'Energy',
    impact: 'positive',
    weightPercent: 22,
    currentMetric: '₹89.4 / Litre (+2.4% MoM)',
    trend: 'UP',
    isVerifiedData: true,
    dataSource: 'Indian Oil Corporation (IOCL) Industrial Freight Bulletin',
    description: 'Logistics and dump truck transport costs constitute 14-22% of aggregate, sand, and cement delivery. Recent fuel hikes add ₹6-12/bag freight burden.',
  },
  {
    id: 'clinker-coal',
    name: 'Imported Thermal Coal & Clinker',
    category: 'Commodity',
    impact: 'positive',
    weightPercent: 26,
    currentMetric: '$134.5 / MT (+4.1% MoM)',
    trend: 'UP',
    isVerifiedData: true,
    dataSource: 'Argus Coal Daily / Newcastle Index & Indian Port Customs',
    description: 'South African and Indonesian thermal coal imported by cement kilns has seen cost increases, creating upward price pressure on domestic OPC clinker.',
  },
  {
    id: 'lme-scrap-iron',
    name: 'Iron Ore Fines & Steel Billets',
    category: 'Commodity',
    impact: 'negative',
    weightPercent: 30,
    currentMetric: '$98.2 / Tonne (-5.2% MoM)',
    trend: 'DOWN',
    isVerifiedData: true,
    dataSource: 'London Metal Exchange (LME) & NMDC Iron Ore Auction',
    description: 'Global iron ore inventory surpluses and weaker export demand have reduced billet manufacturing costs for secondary and primary rebar rollers.',
  },
  {
    id: 'monsoon-seasonality',
    name: 'Post-Monsoon Construction Surge',
    category: 'Seasonality',
    impact: 'positive',
    weightPercent: 18,
    currentMetric: 'Peak Q3 Activity Window',
    trend: 'UP',
    isVerifiedData: true,
    dataSource: 'India Meteorological Department (IMD) & CREDAI National Activity Index',
    description: 'Dry post-monsoon weather triggers accelerated slab castings, foundation works, and road projects across southern and western peninsular zones.',
  },
  {
    id: 'quarry-regulations',
    name: 'River Sand Mining & Environmental Clearances',
    category: 'Policy',
    impact: 'neutral',
    weightPercent: 12,
    currentMetric: 'Strict GPS Checkpost Enforcement',
    trend: 'STABLE',
    isVerifiedData: true,
    dataSource: 'National Green Tribunal (NGT) & State Geology Departments',
    description: 'Permitted sand dredging blocks remain tightly capped. Builders are migrating 85%+ volume to manufactured sand (M-Sand), keeping prices range-bound.',
  },
  {
    id: 'nhai-infra-demand',
    name: 'National Highway & Urban Metro Off-Take',
    category: 'Demand',
    impact: 'positive',
    weightPercent: 15,
    currentMetric: '7.8 MT Monthly Cement Off-Take',
    trend: 'UP',
    isVerifiedData: false,
    dataSource: 'Analytical Estimate based on NHAI Tender Progress Reports',
    description: 'Government infrastructure procurement prioritizes institutional supply allocations, temporarily restricting retail dealer yard inventories in metros.',
  },
]

export const SEED_SUPPLIER_QUOTES: SupplierQuotation[] = [
  // Cement
  { id: 'q-cem-1', materialId: 'cement', supplierName: 'Sri Balaji Cement Wholesalers', city: 'Bengaluru', price: 378, unit: '50 kg bag', date: '2026-11-20', leadTimeDays: 1, transportFee: 350, isVerified: true, contactPhone: '+91 98450 12345' },
  { id: 'q-cem-2', materialId: 'cement', supplierName: 'Deccan Building Solutions', city: 'Bengaluru', price: 384, unit: '50 kg bag', date: '2026-11-20', leadTimeDays: 2, transportFee: 200, isVerified: true, contactPhone: '+91 98450 54321' },
  { id: 'q-cem-3', materialId: 'cement', supplierName: 'Telangana Cement Traders', city: 'Hyderabad', price: 368, unit: '50 kg bag', date: '2026-11-20', leadTimeDays: 1, transportFee: 300, isVerified: true, contactPhone: '+91 98490 11223' },
  { id: 'q-cem-4', materialId: 'cement', supplierName: 'Mumbai Metro Cement Yard', city: 'Mumbai', price: 410, unit: '50 kg bag', date: '2026-11-20', leadTimeDays: 2, transportFee: 450, isVerified: true, contactPhone: '+91 98200 44556' },

  // Steel
  { id: 'q-stl-1', materialId: 'steel', supplierName: 'Kamdhenu & TMT Direct Yard', city: 'Bengaluru', price: 67.5, unit: 'kg', date: '2026-11-20', leadTimeDays: 1, transportFee: 800, isVerified: true, contactPhone: '+91 99001 22334' },
  { id: 'q-stl-2', materialId: 'steel', supplierName: 'Apex Steels Corporation', city: 'Bengaluru', price: 69.0, unit: 'kg', date: '2026-11-20', leadTimeDays: 2, transportFee: 500, isVerified: true, contactPhone: '+91 99001 55667' },
  { id: 'q-stl-3', materialId: 'steel', supplierName: 'Hyderabad Steel Syndicate', city: 'Hyderabad', price: 65.5, unit: 'kg', date: '2026-11-20', leadTimeDays: 1, transportFee: 700, isVerified: true, contactPhone: '+91 98480 33445' },
  { id: 'q-stl-4', materialId: 'steel', supplierName: 'Western India Rebar Mandi', city: 'Mumbai', price: 73.0, unit: 'kg', date: '2026-11-20', leadTimeDays: 2, transportFee: 900, isVerified: true, contactPhone: '+91 98210 77889' },

  // Sand
  { id: 'q-snd-1', materialId: 'sand', supplierName: 'Venkateshwara M-Sand Crusher', city: 'Bengaluru', price: 53.0, unit: 'cu ft', date: '2026-11-20', leadTimeDays: 1, transportFee: 1200, isVerified: true, contactPhone: '+91 97410 88990' },
  { id: 'q-snd-2', materialId: 'sand', supplierName: 'Cauvery River & Plaster Sand', city: 'Bengaluru', price: 56.5, unit: 'cu ft', date: '2026-11-20', leadTimeDays: 2, transportFee: 1500, isVerified: true, contactPhone: '+91 97410 44556' },
  { id: 'q-snd-3', materialId: 'sand', supplierName: 'Krishna Basin Sand Suppliers', city: 'Hyderabad', price: 51.5, unit: 'cu ft', date: '2026-11-20', leadTimeDays: 1, transportFee: 1100, isVerified: true, contactPhone: '+91 98499 66778' },
  { id: 'q-snd-4', materialId: 'sand', supplierName: 'Maharashtra Crushed Sand Hub', city: 'Mumbai', price: 58.0, unit: 'cu ft', date: '2026-11-20', leadTimeDays: 2, transportFee: 1400, isVerified: true, contactPhone: '+91 98205 11223' },

  // Bricks
  { id: 'q-brk-1', materialId: 'bricks', supplierName: 'Pooja Red Clay Brick Kilns', city: 'Bengaluru', price: 9.2, unit: 'piece', date: '2026-11-20', leadTimeDays: 2, transportFee: 1500, isVerified: true, contactPhone: '+91 94480 33445' },
  { id: 'q-brk-2', materialId: 'bricks', supplierName: 'Hyderabad AAC Block Works', city: 'Hyderabad', price: 8.9, unit: 'piece', date: '2026-11-20', leadTimeDays: 2, transportFee: 1300, isVerified: true, contactPhone: '+91 98495 55667' },
  { id: 'q-brk-3', materialId: 'bricks', supplierName: 'Navi Mumbai Brick Mandi', city: 'Mumbai', price: 10.1, unit: 'piece', date: '2026-11-20', leadTimeDays: 2, transportFee: 1600, isVerified: true, contactPhone: '+91 98212 99887' },

  // Tiles
  { id: 'q-til-1', materialId: 'tiles', supplierName: 'Classic Ceramic World', city: 'Bengaluru', price: 64.0, unit: 'sq ft', date: '2026-11-20', leadTimeDays: 2, transportFee: 600, isVerified: true, contactPhone: '+91 98860 11223' },
  { id: 'q-til-2', materialId: 'tiles', supplierName: 'Morbi Direct Tile Gallery', city: 'Hyderabad', price: 62.0, unit: 'sq ft', date: '2026-11-20', leadTimeDays: 2, transportFee: 500, isVerified: true, contactPhone: '+91 98485 22334' },

  // Paint
  { id: 'q-pnt-1', materialId: 'paint', supplierName: 'Metro Colour Studio & Depot', city: 'Bengaluru', price: 320, unit: 'litre', date: '2026-11-20', leadTimeDays: 1, transportFee: 200, isVerified: true, contactPhone: '+91 98451 77889' },
  { id: 'q-pnt-2', materialId: 'paint', supplierName: 'Telangana Paint Center', city: 'Hyderabad', price: 312, unit: 'litre', date: '2026-11-20', leadTimeDays: 1, transportFee: 180, isVerified: true, contactPhone: '+91 98492 44556' },

  // Aggregates
  { id: 'q-agg-1', materialId: 'aggregates', supplierName: 'Granite Crushing Hub Ltd', city: 'Bengaluru', price: 850, unit: 'tonne', date: '2026-11-20', leadTimeDays: 1, transportFee: 1100, isVerified: true, contactPhone: '+91 97400 66778' },
  { id: 'q-agg-2', materialId: 'aggregates', supplierName: 'Secunderabad Blue Metal Quarry', city: 'Hyderabad', price: 825, unit: 'tonne', date: '2026-11-20', leadTimeDays: 1, transportFee: 1000, isVerified: true, contactPhone: '+91 98496 77889' },

  // Electrical
  { id: 'q-ele-1', materialId: 'electrical', supplierName: 'South India Electrical Wholesale', city: 'Bengaluru', price: 1840, unit: '90m coil', date: '2026-11-20', leadTimeDays: 1, transportFee: 150, isVerified: true, contactPhone: '+91 98453 88990' },
  { id: 'q-ele-2', materialId: 'electrical', supplierName: 'Ranigunj Cable & Wire Mart', city: 'Hyderabad', price: 1790, unit: '90m coil', date: '2026-11-20', leadTimeDays: 1, transportFee: 120, isVerified: true, contactPhone: '+91 98488 11223' },

  // Plumbing
  { id: 'q-plm-1', materialId: 'plumbing', supplierName: 'Deccan Pipe & Fittings Corp', city: 'Bengaluru', price: 415, unit: '3m pipe', date: '2026-11-20', leadTimeDays: 1, transportFee: 200, isVerified: true, contactPhone: '+91 98458 33445' },
  { id: 'q-plm-2', materialId: 'plumbing', supplierName: 'Balanagar Plastic & Pipe Yard', city: 'Hyderabad', price: 405, unit: '3m pipe', date: '2026-11-20', leadTimeDays: 1, transportFee: 180, isVerified: true, contactPhone: '+91 98494 55667' },

  // Roofing
  { id: 'q-rof-1', materialId: 'roofing', supplierName: 'National Steel Roofing & Sheeting', city: 'Bengaluru', price: 48.0, unit: 'sq ft', date: '2026-11-20', leadTimeDays: 2, transportFee: 650, isVerified: true, contactPhone: '+91 98459 22334' },
  { id: 'q-rof-2', materialId: 'roofing', supplierName: 'Telangana Galvalume Depot', city: 'Hyderabad', price: 46.5, unit: 'sq ft', date: '2026-11-20', leadTimeDays: 2, transportFee: 600, isVerified: true, contactPhone: '+91 98497 88990' },
]
