// The two summary lines above the list (SPEC §3; John's wording, November 17th 2026). The
// variants for one or two gauges, ties, no rain, late or missing gauges, gauges without an
// average and just after midnight are Claude's drafts in the same pattern (fresh look 2.2, 2.3,
// 2.5 and 2.6, John, November 17th 2026: counts are always out of all the gauges listed).
// Worked out from the figures as shown (one decimal place), so the words always agree with the
// list. Checked by scripts/check.ts.

import { mm, oneDecimal } from './format.ts'
import { numberWord as n } from './words.ts'

export type SummaryGauge = {
  name: string
  /** Rain in the last hour, or null for a gauge running late or whose readings failed. */
  hour: number | null
  /** Rain since midnight, or null if failed or none reported since midnight yet. */
  today: number | null
  average: number | null
  /** Rain over the whole of yesterday, when the gauge has the complete day; else null. */
  yesterdayWhole?: number | null
}

const shown = (v: number) => Number(oneDecimal(v))
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)
const AVERAGE = "the fortnight's average by this time"

/** Wetter (blue edge), drier (sand) or neither, by today against the fortnight's average as
 *  shown (colour by state, HOUSE-STYLE §2; John, November 17th 2026). */
export function state(today: number | null, average: number | null): 'wetter' | 'drier' | null {
  if (today === null || average === null) return null
  return shown(today) > shown(average) ? 'wetter' : shown(today) < shown(average) ? 'drier' : null
}

/** `gauges` is every gauge listed, in the list's order. */
export function summary(gauges: SummaryGauge[]): string[] {
  const N = gauges.length
  if (!N) return []
  const lines: string[] = []
  // "both gauges", "all eight gauges"; one gauge is named instead.
  const all = N === 2 ? 'both gauges' : `all ${n(N)} gauges`
  const ofN = (k: number) => (k === N ? all : `${n(k)} of the ${n(N)} gauges`)

  // The last hour.
  const hourly = gauges.filter((g) => g.hour !== null)
  const m = N - hourly.length
  if (hourly.length === 0) {
    lines.push(N === 1 ? `${gauges[0].name}'s readings are late or missing.` : `The readings for ${all} are late or missing.`)
  } else {
    const late = m === 1 ? "One gauge's readings are late or missing." : `${cap(n(m))} gauges' readings are late or missing.`
    const wet = hourly.filter((g) => shown(g.hour!) > 0)
    const k = wet.length
    if (k === 0) {
      lines.push(
        m > 0
          ? `${late} There was no rain in the last hour at the other ${hourly.length === 1 ? 'gauge' : `${n(hourly.length)} gauges`}.`
          : N === 1
            ? `There was no rain in the last hour at ${gauges[0].name}.`
            : `There was no rain in the last hour at ${N === 2 ? 'either gauge' : `any of the ${n(N)} gauges`}.`,
      )
    } else {
      const top = Math.max(...wet.map((g) => shown(g.hour!)))
      const topNames = wet.filter((g) => shown(g.hour!) === top).map((g) => g.name)
      let s: string
      if (N === 1) s = `There was rain in the last hour at ${gauges[0].name}, recording ${mm(top)}.`
      else if (k === 1) s = `There was rain in the last hour at one of the ${n(N)} gauges, ${topNames[0]}, recording ${mm(top)}.`
      else if (topNames.length === k) s = `There was rain in the last hour at ${k === N ? all : `${ofN(k)}, ${list(topNames)}`}, each recording ${mm(top)}.`
      else s = `There was rain in the last hour at ${ofN(k)}, the ${k === 2 ? 'higher of the two' : 'highest of them'}, at ${list(topNames)}, recording ${mm(top)}.`
      lines.push(m > 0 ? `${s} ${late}` : s)
    }
  }

  // So far today.
  const today = gauges.filter((g) => g.today !== null)
  if (today.length === 0) {
    // Just after midnight, before today's readings arrive: yesterday's totals instead.
    const yest = gauges.filter((g) => g.yesterdayWhole != null)
    if (yest.length) {
      const lo = Math.min(...yest.map((g) => shown(g.yesterdayWhole!)))
      const hi = Math.max(...yest.map((g) => shown(g.yesterdayWhole!)))
      const whom = yest.length === N ? (N === 1 ? gauges[0].name : all) : `${ofN(yest.length)} with a full day's readings`
      lines.push(
        'No readings from today have arrived yet. ' +
          (hi === 0
            ? `Yesterday, ${whom} recorded no rain.`
            : lo === hi
              ? `Yesterday, ${whom} recorded ${mm(hi)}${yest.length > 1 ? ' each' : ''}.`
              : `Yesterday's rainfall ranged from ${oneDecimal(lo)} to ${mm(hi)}.`),
      )
    }
    return lines
  }
  const lo = Math.min(...today.map((g) => shown(g.today!)))
  const hi = Math.max(...today.map((g) => shown(g.today!)))
  const T = today.length
  const range =
    T === 1
      ? hi === 0
        ? `${today[0].name} hasn't recorded any rain so far today.`
        : `${today[0].name} has recorded ${mm(hi)} so far today.`
      : hi === 0
        ? T === N
          ? N === 2
            ? 'Neither gauge has recorded any rain so far today.'
            : `None of the ${n(N)} gauges has recorded any rain so far today.`
          : `None of the ${n(T)} gauges with readings today has recorded any rain so far.`
        : lo === hi
          ? T === N
            ? `${cap(all)} have recorded ${mm(hi)} so far today.`
            : `The ${n(T)} gauges with readings today have all recorded ${mm(hi)} so far.`
          : `The range of rainfall recorded so far today is ${oneDecimal(lo)} to ${mm(hi)}.`
  // No comparison with the average on a dry day: it would only repeat the first sentence.
  let above = ''
  const withAvg = today.filter((g) => g.average !== null)
  if (hi > 0 && withAvg.length) {
    const w = withAvg.filter((g) => state(g.today, g.average) === 'wetter').length
    if (w === withAvg.length && withAvg.length === N) {
      above = N === 1 ? ` It had recorded more than ${AVERAGE}.` : ` ${cap(all)} had recorded more than ${AVERAGE}.`
    } else if (w === 0) {
      above = withAvg.length === N
        ? N === 1
          ? ` It hadn't recorded more than ${AVERAGE}.`
          : N === 2
            ? ` Neither gauge had recorded more than ${AVERAGE}.`
            : ` None of the ${n(N)} gauges had recorded more than ${AVERAGE}.`
        : withAvg.length === 1
          ? ` The one gauge with an average, ${withAvg[0].name}, hadn't recorded more than ${AVERAGE}.`
          : ` None of the ${n(withAvg.length)} gauges with an average had recorded more than ${AVERAGE}.`
    } else {
      above = ` ${cap(n(w))} of the ${n(N)} gauges had recorded more than ${AVERAGE}.`
    }
  }
  lines.push(range + above)
  return lines
}
