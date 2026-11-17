// Choosing a place: the first half of a postcode, the nearest gauges and how far away
// they are. British National Grid positions (metres), as in Hindcaster's src/lib/choose.ts.

export type Point = { e: number; n: number }
export const METRES_PER_MILE = 1609.344

/** How far and which way `to` lies from `from`: miles, and degrees clockwise from north. */
export function offset(from: Point, to: Point): { miles: number; bearing: number } {
  const de = to.e - from.e
  const dn = to.n - from.n
  const bearing = (Math.atan2(de, dn) * 180) / Math.PI
  return { miles: Math.hypot(de, dn) / METRES_PER_MILE, bearing: (bearing + 360) % 360 }
}

const EIGHT = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']
export const directionWord = (bearing: number) => EIGHT[Math.round(bearing / 45) % 8]

/** The first half of a postcode from whatever is typed ("rg4", "RG4 7HN", "rg47hn"), or
 *  null if it can't be one (as Hindcaster). */
export function outwardCode(typed: string): string | null {
  const t = typed.toUpperCase().replace(/\s+/g, '')
  const m = /^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})?$/.exec(t)
  return m ? m[1] : null
}

/** The items nearest `place`, nearest first, with their distance and direction. */
export function nearest<T>(place: Point, items: T[], at: (item: T) => Point, count: number): { item: T; miles: number; dir: string }[] {
  return items
    .map((item) => {
      const o = offset(place, at(item))
      return { item, miles: o.miles, dir: directionWord(o.bearing) }
    })
    .sort((a, b) => a.miles - b.miles)
    .slice(0, count)
}
