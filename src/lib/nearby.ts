// The rules for which gauges are shown for a place (SPEC §3), shared by the place's own list and by
// the comparison.

import type { CmpRow } from './compare.ts'
import type { Gauge } from './load.ts'
import type { GaugeFigures } from './rain.ts'
import type { StripData } from './strip.ts'

export const SHOWN = 8
/** Gauges asked for: a few more than shown, so a gauge that has gone quiet can be passed over. */
export const ASKED = 12
/** A gauge with no reading for this long isn't reporting, and the next nearest takes its place. */
export const QUIET = 24 * 60 * 60_000
/** A gauge this far behind the newest reading is shown in grey as running late. */
export const LATE = 60 * 60_000

export type Row = { gauge: Gauge; miles: number; dir: string; status: 'loading' | 'failed' | 'done'; fig?: GaugeFigures; strip?: StripData }

/** The nearest eight that are reporting: a gauge whose readings arrived but have nothing in the last day gives way to
 *  the next nearest. One still loading or failed keeps its place. */
export const pickShown = (rows: Row[], askedAt: number) =>
  rows.filter((r) => !(r.status === 'done' && (r.fig?.latest == null || askedAt - r.fig.latest > QUIET))).slice(0, SHOWN)

export const newestOf = (rows: Row[]) => Math.max(0, ...rows.map((r) => (r.status === 'done' ? (r.fig?.latest ?? 0) : 0)))

/** The figures a comparison needs from each shown gauge. */
export function cmpRows(shown: Row[]): CmpRow[] {
  const newest = newestOf(shown)
  return shown.map((r) => {
    const f = r.status === 'done' ? r.fig : undefined
    const late = !!f?.latest && newest - f.latest > LATE
    return { name: r.gauge.name, today: f ? f.today : null, hour: f && !late ? f.hour : null, late, failed: r.status === 'failed', loading: r.status === 'loading' }
  })
}
