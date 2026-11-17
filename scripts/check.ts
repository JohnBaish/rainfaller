// Checks of Rainfaller's rules (npm run check). Node runs this directly; no test framework.
// The readings are made up to test the rules.

import { clock, miles, mm, oneDecimal } from '../src/lib/format.ts'
import { outwardCode } from '../src/lib/place.ts'
import { askSince, figures, MIN_DAYS } from '../src/lib/rain.ts'
import { state, summary } from '../src/lib/summary.ts'
import { ukInstant } from '../src/lib/ukTime.ts'

let failed = 0
let passed = 0
function check(name: string, fn: () => void) {
  try {
    fn()
    passed++
  } catch (e) {
    failed++
    console.log(`FAIL ${name}: ${(e as Error).message}`)
  }
}
function eq<T>(got: T, want: T) {
  if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`)
}

const at = (date: string, h: number, m = 0) => ukInstant(date, h).getTime() + m * 60_000

/** 15-minute readings from `from` to `to` (UK clock), each `v` mm. */
function series(date: string, fromH: number, toH: number, toM: number, v: number) {
  const out: { t: number; v: number }[] = []
  for (let t = at(date, fromH) + 15 * 60_000; t <= at(date, toH, toM); t += 15 * 60_000) out.push({ t, v })
  return out
}

check('rounding', () => {
  eq(oneDecimal(4.55), '4.6')
  eq(oneDecimal(0.04), '0.0')
  eq(oneDecimal(15.05), '15.1')
  eq(mm(0.4), '0.4 mm')
})

check('clock times', () => {
  eq(clock(at('2026-11-17', 9, 15)), '9.15am')
  eq(clock(at('2026-11-17', 12)), 'midday')
  eq(clock(at('2026-11-17', 0)), 'midnight')
  eq(clock(at('2026-11-17', 15)), '3pm')
  eq(clock(at('2026-07-01', 21, 30)), '9.30pm')
})

check('miles', () => {
  eq(miles(0.4), 'less than 1 mile')
  eq(miles(1.2), '1 mile')
  eq(miles(12.6), '13 miles')
})

check('postcodes', () => {
  eq(outwardCode('rg4 7hn'), 'RG4')
  eq(outwardCode('RG1'), 'RG1')
  eq(outwardCode('sw1a1aa'), 'SW1A')
})

check('ask since: midnight 14 days back, BST and GMT', () => {
  eq(askSince(new Date(at('2026-11-17', 10))), '2026-11-03T00:00:00Z')
  eq(askSince(new Date(at('2026-07-20', 10))), '2026-07-05T23:00:00Z')
})

check('today, last hour, the midnight reading belongs to yesterday', () => {
  const now = new Date(at('2026-11-17', 9, 20))
  const rs = [...series('2026-11-16', 0, 24 - 1, 45, 0), { t: at('2026-11-17', 0), v: 5 }, ...series('2026-11-17', 0, 9, 15, 0.1)]
  const f = figures(rs, now)
  eq(f.latest, at('2026-11-17', 9, 15))
  eq(f.today, 3.7) // 37 readings from 00:15 to 09:15
  eq(f.hour, 0.4)
  eq(f.yesterday, 0) // midnight's 5 mm ends at 00:00, after 09:15 yesterday
})

check('fortnight average: each day to the same clock time; needs ten days', () => {
  const now = new Date(at('2026-11-17', 10))
  const rs: { t: number; v: number }[] = []
  // 12 earlier days: 1 mm by 6am, then 9 mm after 10am.
  for (let k = 1; k <= 12; k++) {
    const d = new Date(at('2026-11-17', 12) - k * 86_400_000).toISOString().slice(0, 10)
    rs.push({ t: at(d, 6), v: 1 }, { t: at(d, 18), v: 9 })
  }
  rs.push({ t: at('2026-11-17', 9), v: 2 })
  const f = figures(rs, now)
  eq(f.days, 12)
  eq(f.average, 1)
  eq(f.yesterday, 1)
  const short = figures(rs.filter((r) => r.t > at('2026-11-17', 12) - (MIN_DAYS - 1) * 86_400_000 - 43_200_000), now)
  eq(short.average, null)
})

check('a day counts only if the gauge reported at or after that time', () => {
  const now = new Date(at('2026-11-17', 10))
  // Yesterday the gauge stopped at 8am.
  const rs = [{ t: at('2026-11-16', 6), v: 1 }, { t: at('2026-11-16', 8), v: 1 }, { t: at('2026-11-17', 9), v: 1 }]
  eq(figures(rs, now).yesterday, null)
})

check('impossible readings left out', () => {
  const now = new Date(at('2026-11-17', 10))
  const f = figures([{ t: at('2026-11-17', 8), v: 60 }, { t: at('2026-11-17', 9), v: 1 }, { t: at('2026-11-17', 9, 15), v: -1 }], now)
  eq(f.today, 1)
  eq(f.rejected, 2)
})

check('no readings since midnight', () => {
  const now = new Date(at('2026-11-17', 0, 10))
  eq(figures([{ t: at('2026-11-17', 0), v: 1 }], now).today, null)
})

check('state', () => {
  eq(state(1.04, 1.0), null) // both shown as 1.0
  eq(state(1.2, 1.0), 'wetter')
  eq(state(0.2, 1.0), 'drier')
  eq(state(1, null), null)
})

const g = (name: string, hour: number | null, today: number | null, average: number | null) => ({ name, hour, today, average })

check("summary: John's wording", () => {
  eq(
    summary([
      g('Reading University', 0.2, 13.7, 0.5), g('Cleeve', 0, 8.2, 0.4), g('Yattendon', 0.4, 10, 0.7), g('Bracknell', 0.1, 9, 0.6),
      g('Benson', 0, 11, 0.5), g('Basingstoke', 0, 9, 0.5), g('Camberley', 0.3, 12, 0.5), g('Stokenchurch', 0, 9.5, 0.5),
    ]),
    [
      'There was rain in the last hour at four of the eight gauges, the highest of them, at Yattendon, recording 0.4 mm.',
      "The range of rainfall recorded so far today is 8.2 to 13.7 mm. All eight gauges had recorded more than the fortnight's average by this time.",
    ],
  )
})

check('summary: one gauge, ties, no rain, some without an average', () => {
  eq(summary([g('A', 0.2, 1, null), g('B', 0, 0, 0.5)])[0], 'There was rain in the last hour at one of the two gauges, A, recording 0.2 mm.')
  eq(summary([g('A', 0.2, 1, 0.5), g('B', 0.2, 2, 0.5)])[0], 'There was rain in the last hour at both gauges, the highest of them, at A and B, recording 0.2 mm.')
  eq(summary([g('A', 0, 0, 0.5), g('B', 0, 0, 0.5)]), [
    'There was no rain in the last hour at any of the two gauges.',
    "None of the two gauges has recorded any rain so far today. None of the two gauges had recorded more than the fortnight's average by this time.",
  ])
  eq(summary([g('A', 0, 2, 0.5), g('B', 0, 1, null), g('C', 0, 0.1, 0.5)])[1],
    "The range of rainfall recorded so far today is 0.1 to 2.0 mm. One of the two gauges with an average had recorded more than the fortnight's average by this time.")
})

console.log(`${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
