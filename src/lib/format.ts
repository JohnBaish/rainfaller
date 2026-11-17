// How figures are written (from Hindcaster's src/lib/format.ts, the parts Rainfaller uses).
// Checked by scripts/check.ts.

const ZONE = 'Europe/London'

/** One decimal place, halves away from zero, worked in whole hundredths (not `toFixed`,
 *  which gives "4.5" for 4.55). Rain is never negative. */
export function oneDecimal(v: number): string {
  const hundredths = Math.round(Math.abs(v) * 100)
  const tenths = Math.floor((hundredths + 5) / 10)
  return `${Math.floor(tenths / 10)}.${tenths % 10}`
}

/** "0.4 mm": one decimal place, a space before mm (as Hindcaster). */
export const mm = (v: number) => `${oneDecimal(v)} mm`

/** Whole miles: "12 miles", "1 mile", "less than 1 mile". */
export function miles(m: number): string {
  const whole = Math.round(m)
  return whole < 1 ? 'less than 1 mile' : whole === 1 ? '1 mile' : `${whole} miles`
}

/** "9.15am", "3pm", "midday", "midnight", in UK clock time (a full stop, not a colon). */
export function clock(at: number): string {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(at))
  const hour = Number(p.find((x) => x.type === 'hour')?.value)
  const minute = Number(p.find((x) => x.type === 'minute')?.value)
  if (minute === 0 && hour === 12) return 'midday'
  if (minute === 0 && hour === 0) return 'midnight'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}${minute ? '.' + String(minute).padStart(2, '0') : ''}${hour < 12 ? 'am' : 'pm'}`
}
