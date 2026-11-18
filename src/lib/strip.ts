// The small chart under each gauge (John, November 18th 2026, option 3 of the intensity mock-ups):
// the rain in each 15 minutes of today, midnight to midnight, UK clock time. Checked by scripts/check.ts.

import { clean, type Reading } from './rain.ts'
import { addDays, ukInstant, ukParts } from './ukTime.ts'

const SLOT = 15 * 60_000

export type StripData = {
  /** 15-minute slots in today: 96, or 92 and 100 on the days the clocks change. */
  slots: number
  /** Slots up to this gauge's latest reading (the rest of the day is still to come). */
  upTo: number
  /** Each wet reading: its slot (0 is midnight to 12.15am), its rain and when its 15 minutes ended. */
  marks: { slot: number; v: number; t: number }[]
  /** Where 6am, midday and 6pm fall. */
  ticks: { slot: number; label: string }[]
  /** The wettest 15 minutes (the latest, if tied), or null if dry. */
  heaviest: Reading | null
}

/** Today's readings for the strip, on the UK day of `now`. A reading is stamped at the END of its
 *  15 minutes, so the one stamped midnight belongs to yesterday. */
export function stripData(raw: { t: number; v: unknown }[], now: Date): StripData {
  const date = ukParts(now).date
  const start = ukInstant(date, 0).getTime()
  const next = ukInstant(addDays(date, 1), 0).getTime()
  const slots = Math.round((next - start) / SLOT)
  const today = clean(raw).readings.filter((r) => r.t > start && r.t <= next)
  const slotOf = (t: number) => Math.round((t - start) / SLOT) - 1
  let heaviest: Reading | null = null
  for (const r of today) if (r.v > 0 && (!heaviest || r.v >= heaviest.v)) heaviest = r
  return {
    slots,
    upTo: today.length ? slotOf(today[today.length - 1].t) + 1 : 0,
    marks: today.filter((r) => r.v > 0).map((r) => ({ slot: slotOf(r.t), v: r.v, t: r.t })),
    ticks: [[6, '6am'], [12, 'midday'], [18, '6pm']].map(([h, label]) => ({ slot: Math.round((ukInstant(date, h as number).getTime() - start) / SLOT), label: label as string })),
    heaviest,
  }
}

/** One scale for every strip on the page: the wettest 15 minutes among them, and at least 1 mm,
 *  so a drizzly day doesn't look like a downpour. */
export function stripTop(strips: (StripData | undefined)[]): number {
  return Math.max(1, ...strips.flatMap((s) => s?.marks.map((m) => m.v) ?? []))
}
