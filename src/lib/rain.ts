// The figures for one rain gauge (SPEC §3 and §4): the last hour, today since midnight,
// the fortnight's average by this time and yesterday by this time. Plain functions on the
// Environment Agency's 15-minute readings, checked by scripts/check.ts.
//
// A reading is stamped at the END of its 15 minutes (as in Hindcaster), so the one stamped
// midnight belongs to the day before. Days are UK clock days.

import { addDays, ukInstant, ukParts } from './ukTime.ts'

/** One 15-minute reading: when its 15 minutes ended (milliseconds) and the rain in mm. */
export type Reading = { t: number; v: number }

/** A 15-minute reading above this is impossible here and is left out (as in Hindcaster). */
export const MAX_15MIN_MM = 50
/** An average needs at least this many of the 14 days (John, November 17th 2026). */
export const MIN_DAYS = 10
export const FORTNIGHT = 14
const MINUTE = 60_000

/** Sorted, one reading per time, impossible values left out (counted in `rejected`). */
export function clean(raw: { t: number; v: unknown }[]): { readings: Reading[]; rejected: number } {
  const byTime = new Map<number, number>()
  let rejected = 0
  for (const r of raw) {
    const v = typeof r.v === 'number' ? r.v : Number.NaN
    if (!Number.isFinite(r.t)) continue
    if (!Number.isFinite(v) || v < 0 || v > MAX_15MIN_MM) {
      rejected++
      continue
    }
    byTime.set(r.t, v)
  }
  const readings = [...byTime].map(([t, v]) => ({ t, v })).sort((a, b) => a.t - b.t)
  return { readings, rejected }
}

/** Added up in thousandths of a millimetre, so the sum is exact. */
const total = (rs: Reading[]) => rs.reduce((s, r) => s + Math.round(r.v * 1000), 0) / 1000

/** The instant UK clocks show `hour`:`minute` on `date`. */
function ukAt(date: string, hour: number, minute: number): number {
  return ukInstant(date, hour).getTime() + minute * MINUTE
}

export type GaugeFigures = {
  /** When the latest reading's 15 minutes ended, or null if there are none. */
  latest: number | null
  /** Rain in the hour to the latest reading. */
  hour: number | null
  /** Rain since midnight to the latest reading; null when nothing since midnight yet. */
  today: number | null
  /** Rain from midnight to the same clock time yesterday; null if the gauge hadn't reported by then. */
  yesterday: number | null
  /** The average over the last 14 days, each to the same clock time; null with fewer than 10 days. */
  average: number | null
  /** How many of the 14 days counted. */
  days: number
  /** Rain over the whole of yesterday, up to `yesterdayEnd`; null with no readings yesterday. */
  yesterdayWhole: number | null
  /** When `yesterdayWhole` runs to: midnight if the day is complete, else the latest reading. */
  yesterdayEnd: number | null
  /** Whether `yesterdayWhole` covers the whole of yesterday. */
  yesterdayComplete: boolean
  rejected: number
}

/** The figures for one gauge, on the UK day of `now`. */
export function figures(raw: { t: number; v: unknown }[], now: Date): GaugeFigures {
  const { readings, rejected } = clean(raw)
  const today = ukParts(now).date
  const startToday = ukAt(today, 0, 0)
  const latest = readings.length ? readings[readings.length - 1].t : null
  const none = { latest, hour: null, today: null, yesterday: null, average: null, days: 0, yesterdayWhole: null, yesterdayEnd: null, yesterdayComplete: false, rejected }
  if (latest === null) return none
  const hour = total(readings.filter((r) => r.t > latest - 60 * MINUTE && r.t <= latest))
  // The whole of yesterday (shown just after midnight, before today's readings arrive).
  const startYesterday = ukAt(addDays(today, -1), 0, 0)
  const yesterdayEnd = latest > startYesterday ? Math.min(latest, startToday) : null
  const yesterdayWhole = yesterdayEnd === null ? null : total(readings.filter((r) => r.t > startYesterday && r.t <= yesterdayEnd))
  const yesterdayComplete = latest >= startToday
  if (latest <= startToday) return { ...none, hour, yesterdayWhole, yesterdayEnd, yesterdayComplete }

  // The clock time of the latest reading, used for every earlier day.
  const at = ukParts(new Date(latest))
  const upTo = (date: string): number | null => {
    const start = ukAt(date, 0, 0)
    const end = ukAt(date, at.hour, at.minute)
    const next = ukAt(addDays(date, 1), 0, 0)
    // The day counts only if the gauge reported at or after that time on that day.
    if (!readings.some((r) => r.t >= end && r.t <= next)) return null
    return total(readings.filter((r) => r.t > start && r.t <= end))
  }
  const past: number[] = []
  for (let k = 1; k <= FORTNIGHT; k++) {
    const v = upTo(addDays(today, -k))
    if (v !== null) past.push(v)
  }
  const average = past.length >= MIN_DAYS ? Math.round((past.reduce((s, v) => s + v * 1000, 0) / past.length)) / 1000 : null
  return {
    latest,
    hour,
    today: total(readings.filter((r) => r.t > startToday && r.t <= latest)),
    yesterday: upTo(addDays(today, -1)),
    average,
    days: past.length,
    yesterdayWhole,
    yesterdayEnd,
    yesterdayComplete,
    rejected,
  }
}

/** The instant from which to ask for readings: midnight UK time 14 days before `now`'s day, plus
 *  `seconds` (under 15 minutes, so no reading the page uses is lost). The Environment Agency keeps
 *  a shared copy of each answer and can hand out one more than 10 minutes old (fresh look 2.1,
 *  November 17th 2026), so the question is varied to get a fresh answer. */
export function askSince(now: Date, seconds = 0): string {
  const at = ukAt(addDays(ukParts(now).date, -FORTNIGHT), 0, 0) + Math.min(Math.max(0, Math.floor(seconds)), 899) * 1000
  return new Date(at).toISOString().replace('.000Z', 'Z')
}

/** The seconds for `askSince`: on opening, a value that changes every 15 minutes (visitors in the
 *  same quarter-hour share answers); on Refresh, one that changes every second, so it always
 *  asks afresh (fresh look 2.1, option b, John, November 17th 2026). */
export function askSeconds(now: Date, refresh: boolean): number {
  return refresh ? 600 + (Math.floor(now.getTime() / 1000) % 290) : Math.floor(now.getTime() / 900_000) % 600
}
