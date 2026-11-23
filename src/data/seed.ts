import type { Builder, Worker } from '../types'

export const SEED_BUILDERS: Builder[] = [
  { id: 'b1', name: 'Sri Sai Constructions', city: 'Hyderabad', exp: 15, rating: 4.7, reviews: 128, projects: 96, rate: 1850, quote: { material: 1020000, labour: 540000, extra: 90000, total: 1650000, days: 150 }, hue: 215 },
  { id: 'b2', name: 'Vijaya Builders', city: 'Vijayawada', exp: 9, rating: 4.4, reviews: 64, projects: 41, rate: 1650, quote: { material: 940000, labour: 500000, extra: 60000, total: 1500000, days: 165 }, hue: 25 },
  { id: 'b3', name: 'Amaravati Infra', city: 'Guntur', exp: 20, rating: 4.8, reviews: 210, projects: 180, rate: 2100, quote: { material: 1180000, labour: 610000, extra: 120000, total: 1910000, days: 140 }, hue: 200 },
  { id: 'b4', name: 'Godavari Homes', city: 'Rajahmundry', exp: 6, rating: 4.1, reviews: 33, projects: 22, rate: 1500, quote: { material: 890000, labour: 470000, extra: 150000, total: 1510000, days: 180 }, hue: 15 },
  { id: 'b5', name: 'Deccan Contractors', city: 'Hyderabad', exp: 12, rating: 4.5, reviews: 97, projects: 70, rate: 1750, quote: { material: 1000000, labour: 520000, extra: 75000, total: 1595000, days: 155 }, hue: 230 },
  { id: 'b6', name: 'Kakatiya Developers', city: 'Warangal', exp: 8, rating: 4.3, reviews: 51, projects: 35, rate: 1600, quote: { material: 960000, labour: 495000, extra: 80000, total: 1535000, days: 160 }, hue: 35 },
]

export const SEED_WORKERS: Worker[] = [
  { id: 'w1', name: 'Ramesh K', skill: 'Mason', city: 'Hyderabad', exp: 10, wage: 900, rating: 4.6, avail: true },
  { id: 'w2', name: 'Suresh P', skill: 'Mason', city: 'Hyderabad', exp: 7, wage: 800, rating: 4.3, avail: true },
  { id: 'w3', name: 'Venkat R', skill: 'Electrician', city: 'Vijayawada', exp: 8, wage: 1000, rating: 4.5, avail: true },
  { id: 'w4', name: 'Lakshmi D', skill: 'Painter', city: 'Guntur', exp: 5, wage: 700, rating: 4.4, avail: false },
  { id: 'w5', name: 'Anwar S', skill: 'Plumber', city: 'Hyderabad', exp: 9, wage: 950, rating: 4.7, avail: true },
  { id: 'w6', name: 'Narayana M', skill: 'Carpenter', city: 'Warangal', exp: 14, wage: 1100, rating: 4.8, avail: true },
  { id: 'w7', name: 'Gopi T', skill: 'Labourer', city: 'Hyderabad', exp: 3, wage: 600, rating: 4.0, avail: true },
  { id: 'w8', name: 'Mahesh B', skill: 'Mason', city: 'Guntur', exp: 12, wage: 950, rating: 4.5, avail: true },
  { id: 'w9', name: 'Kiran V', skill: 'Electrician', city: 'Hyderabad', exp: 6, wage: 900, rating: 4.2, avail: true },
  { id: 'w10', name: 'Sita Devi', skill: 'Labourer', city: 'Vijayawada', exp: 4, wage: 600, rating: 4.3, avail: true },
]
