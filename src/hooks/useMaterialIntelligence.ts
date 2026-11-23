import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  CityMarket,
  MaterialId,
  PriceAlert,
  PurchasePlanInput,
  PurchasePlanResult,
  SupplierQuotation,
} from '../types/materialIntelligence'
import {
  CITIES,
  HISTORICAL_SERIES,
  MARKET_DRIVERS,
  MATERIAL_SPECS,
  SEED_SUPPLIER_QUOTES,
} from '../data/materialMarketData'
import {
  calculatePurchasePlan,
  generateMaterialForecast,
  type MaterialForecastBundle,
} from '../lib/materialForecastingEngine'
import { db, firebaseReady } from '../lib/firebase'
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore'

const ALERTS_STORAGE_KEY = 'bc-material-alerts-v1'
const QUOTES_STORAGE_KEY = 'bc-material-quotes-v1'

export function useMaterialIntelligence() {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialId>('cement')
  const [selectedCityId, setSelectedCityId] = useState<string>('bengaluru')
  const [activeHorizon, setActiveHorizon] = useState<'7d' | '15d' | '30d'>('15d')

  // Find active city
  const currentCity = useMemo<CityMarket>(() => {
    return CITIES.find((c) => c.id === selectedCityId) ?? CITIES[0]
  }, [selectedCityId])

  // Alerts state
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const raw = localStorage.getItem(ALERTS_STORAGE_KEY)
      if (raw) return JSON.parse(raw) as PriceAlert[]
    } catch {
      // ignore
    }
    return [
      {
        id: 'default-alert-1',
        materialId: 'cement',
        city: 'bengaluru',
        condition: 'below',
        targetPrice: 370,
        createdDate: '2026-11-18',
        active: true,
        triggered: false,
      },
      {
        id: 'default-alert-2',
        materialId: 'steel',
        city: 'bengaluru',
        condition: 'percent_change',
        targetPrice: 70,
        targetPercent: 3.5,
        createdDate: '2026-11-19',
        active: true,
        triggered: true,
        lastCheckedPrice: 68.5,
      },
    ]
  })

  // Quotes state (combining seed + user entered)
  const [quotes, setQuotes] = useState<SupplierQuotation[]>(() => {
    try {
      const raw = localStorage.getItem(QUOTES_STORAGE_KEY)
      if (raw) return JSON.parse(raw) as SupplierQuotation[]
    } catch {
      // ignore
    }
    return SEED_SUPPLIER_QUOTES
  })

  // Persist alerts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts))
    } catch {
      // ignore
    }
  }, [alerts])

  // Persist quotes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(quotes))
    } catch {
      // ignore
    }
  }, [quotes])

  // Sync with Firestore if firebase is configured
  useEffect(() => {
    if (!firebaseReady || !db) return
    const firestore = db

    const unsubscribe = onSnapshot(collection(firestore, 'price_alerts'), (snap) => {
      if (!snap.empty) {
        const remoteAlerts = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PriceAlert, 'id'>) }))
        setAlerts((prev) => {
          const map = new Map<string, PriceAlert>()
          prev.forEach((a) => map.set(a.id, a))
          remoteAlerts.forEach((a) => map.set(a.id, a))
          return Array.from(map.values())
        })
      }
    })

    return () => unsubscribe()
  }, [])

  // Generate current forecast bundle
  const forecastBundle = useMemo<MaterialForecastBundle>(() => {
    const rawHistory = HISTORICAL_SERIES[selectedMaterial] ?? []
    return generateMaterialForecast(selectedMaterial, currentCity, rawHistory, MARKET_DRIVERS)
  }, [selectedMaterial, currentCity])

  // Filtered quotes for current material and city
  const relevantQuotes = useMemo(() => {
    return quotes
      .filter((q) => q.materialId === selectedMaterial)
      .sort((a, b) => a.price - b.price)
  }, [quotes, selectedMaterial])

  // Add a new user-entered quote
  const addQuote = useCallback(
    async (newQuote: Omit<SupplierQuotation, 'id' | 'date'>) => {
      const quote: SupplierQuotation = {
        ...newQuote,
        id: 'quote-' + Date.now(),
        date: new Date().toISOString().slice(0, 10),
      }
      setQuotes((prev) => [quote, ...prev])

      if (firebaseReady && db) {
        try {
          await setDoc(doc(db, 'material_quotes', quote.id), quote)
        } catch {
          // ignore error in offline fallback
        }
      }
      return quote
    },
    []
  )

  // Add a price alert
  const addAlert = useCallback(
    async (alertInput: Omit<PriceAlert, 'id' | 'createdDate' | 'active' | 'triggered'>) => {
      const alert: PriceAlert = {
        ...alertInput,
        id: 'alert-' + Date.now(),
        createdDate: new Date().toISOString().slice(0, 10),
        active: true,
        triggered: false,
      }
      setAlerts((prev) => [alert, ...prev])

      if (firebaseReady && db) {
        try {
          await setDoc(doc(db, 'price_alerts', alert.id), alert)
        } catch {
          // ignore
        }
      }
      return alert
    },
    []
  )

  // Delete an alert
  const deleteAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  // Toggle active alert
  const toggleAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)))
  }, [])

  // Run purchase planner
  const runPurchasePlanner = useCallback(
    (input: PurchasePlanInput): PurchasePlanResult => {
      return calculatePurchasePlan(input, forecastBundle)
    },
    [forecastBundle]
  )

  return {
    selectedMaterial,
    setSelectedMaterial,
    selectedCityId,
    setSelectedCityId,
    currentCity,
    cities: CITIES,
    activeHorizon,
    setActiveHorizon,
    forecastBundle,
    marketDrivers: MARKET_DRIVERS,
    materialSpecs: MATERIAL_SPECS,
    quotes: relevantQuotes,
    allQuotes: quotes,
    addQuote,
    alerts,
    addAlert,
    deleteAlert,
    toggleAlert,
    runPurchasePlanner,
  }
}
