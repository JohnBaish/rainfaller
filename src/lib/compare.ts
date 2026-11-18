// Comparing two places (John, November 17th 2026): the summary sentences, the chart's scale and the
// words sent with a shared picture. Plain functions, checked by scripts/check.ts.

import { mm, oneDecimal } from './format.ts'
import { ukParts } from './ukTime.ts'
import { numberWord as n } from './words.ts'

/** One gauge in the comparison: its name, rain since midnight and in the last hour (null when not
 *  known: no readings today, a late gauge's last hour, or a gauge that couldn't be reached). */
export type CmpRow = { name: string; today: number | null; hour: number | null; late: boolean; failed: boolean; loading?: boolean }
export type CmpPlace = { code: string; place: string | null; rows: CmpRow[] }

const shown = (v: number) => Number(oneDecimal(v))
const mean = (vs: number[]) => (vs.length ? vs.reduce((s, v) => s + v, 0) / vs.length : null)
export const todayMean = (p: CmpPlace) => mean(p.rows.flatMap((r) => (r.today === null ? [] : [r.today])))
export const hourMean = (p: CmpPlace) => mean(p.rows.flatMap((r) => (r.hour === null ? [] : [r.hour])))

/** "the eight gauges nearest PE38", or "the seven gauges nearest PE38 with readings" when some have none. */
function whose(p: CmpPlace) {
  const k = p.rows.filter((r) => r.today !== null).length
  return k === p.rows.length ? `the ${n(k)} gauges nearest ${p.code}` : `the ${n(k)} gauges nearest ${p.code} with readings`
}

/** The summary (John's agreed draft): the wetter place first, then the last hour in the same order. */
export function compareSummary(a: CmpPlace, b: CmpPlace): string[] {
  const ta = todayMean(a)
  const tb = todayMean(b)
  if (ta === null && tb === null) return [`There are no readings yet today from the gauges nearest ${a.code} or ${b.code}.`]
  if (ta === null || tb === null) {
    const [has, none] = ta === null ? [b, a] : [a, b]
    return [`So far today ${whose(has)} have averaged ${mm(todayMean(has)!)}. There are no readings yet today from the gauges nearest ${none.code}.`]
  }
  const [first, second] = shown(tb) > shown(ta) ? [b, a] : [a, b]
  const lines = [`So far today ${whose(first)} have averaged ${mm(todayMean(first)!)}, and those nearest ${second.code} ${mm(todayMean(second)!)}.`]
  const h1 = hourMean(first)
  const h2 = hourMean(second)
  if (h1 !== null && h2 !== null) lines[0] += ` In the last hour: ${first.code} ${mm(h1)}, ${second.code} ${mm(h2)}.`
  return lines
}

/** The chart's top: the next of 5, 10, 20, 30, 50, 100… at or above the wettest gauge, with its marks. */
export function chartScale(most: number): { max: number; ticks: number[] } {
  const steps = [1, 2, 5, 10, 20, 30, 50, 100, 150, 200, 300, 500]
  const max = steps.find((s) => s >= shown(most)) ?? Math.ceil(most / 100) * 100
  const div = max <= 2 ? 2 : max === 30 || max === 300 || max === 150 ? 3 : max === 20 || max === 200 ? 4 : 5
  return { max, ticks: Array.from({ length: div + 1 }, (_, i) => Math.round((max / div) * i * 100) / 100) }
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const ordinal = (d: number) => `${d}${d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th'}`

/** "Tuesday November 17th", the UK date of an instant. */
export function longDate(at: number): string {
  const { date } = ukParts(new Date(at))
  const [y, m, d] = date.split('-').map(Number)
  return `${DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${MONTHS[m - 1]} ${ordinal(d)}`
}

/** The sentence sent with the picture (John's agreed draft; HOUSE-STYLE §17: a date, never "today"). */
export function shareSentence(a: CmpPlace, b: CmpPlace, at: number): string {
  const ka = a.rows.length
  const kb = b.rows.length
  const gauges = ka === kb ? `the ${n(ka)} gauges nearest ${a.code} and ${b.code}` : `the gauges nearest ${a.code} and ${b.code}`
  return `Rain so far on ${longDate(at)} at ${gauges}, from Rainfaller.`
}

/** The sentence sent with a place's charts (draft for John, November 18th 2026; HOUSE-STYLE §17). */
export function stripSentence(code: string, gauges: number, at: number): string {
  return `Rain in each 15 minutes on ${longDate(at)} at the ${n(gauges)} gauges nearest ${code}, from Rainfaller.`
}
