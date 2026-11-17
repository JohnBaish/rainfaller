import { nearest } from '/home/user/rainfaller/src/lib/place.ts'
import { askSince, figures } from '/home/user/rainfaller/src/lib/rain.ts'
const H = 'https://hindcaster.baish.net/rainfaller/'
const EA = 'https://environment.data.gov.uk/flood-monitoring'
const g = await (await fetch(H + 'gauges.json')).json()
const o = await (await fetch(H + 'outcodes.json')).json()
const now = new Date()
const since = askSince(now)
const out: Record<string, unknown> = { now: now.getTime() }
for (const code of ['RG4', 'PE38']) {
  const p = o.outcodes[code]
  const near = nearest({ e: p[0], n: p[1] }, g.gauges, (x: any) => x, 12)
  const rows = []
  for (const x of near) {
    const r = await (await fetch(`${EA}/id/measures/${encodeURIComponent(x.item.m)}/readings?since=${since}&_sorted&_limit=2000`)).json()
    const f = figures(r.items.map((i: any) => ({ t: Date.parse(i.dateTime), v: i.value })), now)
    if (f.latest && now.getTime() - f.latest < 86400000) rows.push({ name: x.item.name, line: x.item.line, miles: x.miles, dir: x.dir, ...f })
    if (rows.length === 8) break
  }
  out[code] = { place: p[2], rows }
}
console.log(JSON.stringify(out))
