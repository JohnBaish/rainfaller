// MOCK-UP ONLY (November 18th 2026): three ways of showing how hard it rained.
import { clean, type Reading } from './rain.ts'
import { ukInstant, ukParts } from './ukTime.ts'

/** Bands as quoted by the USGS from the Met Office's Fact sheet 3 (not yet checked against the sheet). */
export function band(mmInHour: number): string | null {
  if (mmInHour <= 0) return null
  if (mmInHour < 0.5) return 'Slight'
  if (mmInHour < 4) return 'Moderate'
  if (mmInHour < 8) return 'Heavy'
  return 'Very heavy'
}

/** Today's 15-minute readings, midnight to the latest. */
export function todays(raw: { t: number; v: unknown }[], now: Date): Reading[] {
  const start = ukInstant(ukParts(now).date, 0).getTime()
  return clean(raw).readings.filter((r) => r.t > start)
}

/** The wettest 15 minutes today (the latest, if tied), or null if dry. */
export function heaviest(rs: Reading[]): Reading | null {
  let best: Reading | null = null
  for (const r of rs) if (r.v > 0 && (!best || r.v >= best.v)) best = r
  return best
}

export const midnightOf = (now: Date) => ukInstant(ukParts(now).date, 0).getTime()
