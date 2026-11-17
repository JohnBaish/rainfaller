// The two summary lines above the list (SPEC §3; John's wording, November 17th 2026; the
// variants for one gauge, ties, no rain and gauges without an average are drafts in the same
// pattern). Worked out from the figures as shown (one decimal place), so the words always
// agree with the list. Checked by scripts/check.ts.

import { mm, oneDecimal } from './format.ts'
import { numberWord as n } from './words.ts'

export type SummaryGauge = {
  name: string
  /** Rain in the last hour, or null for a gauge running late. */
  hour: number | null
  /** Rain since midnight, or null if none reported since midnight yet. */
  today: number | null
  average: number | null
}

const shown = (v: number) => Number(oneDecimal(v))
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

/** Wetter (blue edge), drier (sand) or neither, by today against the fortnight's average as
 *  shown (colour by state, HOUSE-STYLE §2; John, November 17th 2026). */
export function state(today: number | null, average: number | null): 'wetter' | 'drier' | null {
  if (today === null || average === null) return null
  return shown(today) > shown(average) ? 'wetter' : shown(today) < shown(average) ? 'drier' : null
}

export function summary(gauges: SummaryGauge[]): string[] {
  const lines: string[] = []

  const hourly = gauges.filter((g) => g.hour !== null)
  if (hourly.length) {
    const of = hourly.length
    const wet = hourly.filter((g) => shown(g.hour!) > 0)
    const top = Math.max(0, ...wet.map((g) => shown(g.hour!)))
    const topNames = wet.filter((g) => shown(g.hour!) === top).map((g) => g.name)
    const some = (k: number) => (k === of ? (of === 2 ? 'both' : `all ${n(of)}`) : `${n(k)} of the ${n(of)}`)
    lines.push(
      wet.length === 0
        ? `There was no rain in the last hour at any of the ${n(of)} gauges.`
        : wet.length === 1
          ? `There was rain in the last hour at one of the ${n(of)} gauges, ${topNames[0]}, recording ${mm(top)}.`
          : `There was rain in the last hour at ${some(wet.length)} gauges, the highest of them, at ${list(topNames)}, recording ${mm(top)}.`,
    )
  }

  const today = gauges.filter((g) => g.today !== null)
  if (today.length) {
    const lo = Math.min(...today.map((g) => shown(g.today!)))
    const hi = Math.max(...today.map((g) => shown(g.today!)))
    const range = hi === 0
      ? `None of the ${n(today.length)} gauges has recorded any rain so far today.`
      : `The range of rainfall recorded so far today is ${oneDecimal(lo)} to ${mm(hi)}.`
    const withAvg = today.filter((g) => g.average !== null)
    let above = ''
    if (withAvg.length) {
      const k = withAvg.filter((g) => state(g.today, g.average) === 'wetter').length
      const among = withAvg.length === today.length ? `${n(today.length)} gauges` : `${n(withAvg.length)} gauges with an average`
      above = k === withAvg.length
        ? ` All ${among} had recorded more than the fortnight's average by this time.`
        : k === 0
          ? ` None of the ${among} had recorded more than the fortnight's average by this time.`
          : ` ${cap(n(k))} of the ${among} had recorded more than the fortnight's average by this time.`
    }
    lines.push(range + above)
  }
  return lines
}
