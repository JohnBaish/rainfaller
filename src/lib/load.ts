// Where the figures come from (SPEC §6 and §7). The gauge list and postcode districts come from
// Hindcaster's site (option A, John, November 17th 2026), with this site's own copy as a safety
// net (public/data/, refreshed monthly by .github/workflows/copy-gauges.yml). The readings come
// straight from the Environment Agency, asked by the visitor's own browser.

export type Gauge = { id: string; live: string; m?: string; name: string; line: string; e: number; n: number }
export type GaugeFile = { made: string; credits: string[]; gauges: Gauge[] }
export type OutcodeFile = { credits: string[]; outcodes: Record<string, [number, number, string | null]> }

const HINDCASTER = 'https://hindcaster.baish.net/rainfaller/'
const EA = 'https://environment.data.gov.uk/flood-monitoring'

async function getJson<T>(url: string, ms: number, signal?: AbortSignal): Promise<T> {
  const stop = new AbortController()
  const timer = setTimeout(() => stop.abort(), ms)
  const onAbort = () => stop.abort()
  signal?.addEventListener('abort', onAbort)
  try {
    const res = await fetch(url, { signal: stop.signal })
    if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

/** Hindcaster's copy first; this site's own copy if that fails. */
async function either<T>(name: string): Promise<T> {
  try {
    return await getJson<T>(HINDCASTER + name, 10_000)
  } catch {
    return getJson<T>(`/data/${name}`, 10_000)
  }
}

let lists: Promise<{ gauges: GaugeFile; outcodes: OutcodeFile }> | null = null
export function loadLists() {
  lists ??= Promise.all([either<GaugeFile>('gauges.json'), either<OutcodeFile>('outcodes.json')])
    .then(([gauges, outcodes]) => ({ gauges, outcodes }))
    .catch((e) => {
      lists = null
      throw e
    })
  return lists
}

type Item = { dateTime: string; value: unknown; measure?: string }

/** One gauge's readings since `since`: by its 15-minute series when known (usually under a
 *  second), otherwise by its station (slower), choosing the series as Hindcaster does. */
export async function readings(g: Gauge, since: string, signal?: AbortSignal): Promise<{ t: number; v: unknown }[]> {
  const toReadings = (items: Item[]) => items.map((i) => ({ t: Date.parse(i.dateTime), v: i.value }))
  if (g.m) {
    const res = await getJson<{ items: Item[] }>(`${EA}/id/measures/${encodeURIComponent(g.m)}/readings?since=${since}&_sorted&_limit=2000`, 30_000, signal)
    return toReadings(res.items)
  }
  const res = await getJson<{ items: Item[] }>(`${EA}/id/stations/${encodeURIComponent(g.live)}/readings?since=${since}&_sorted&_limit=10000`, 30_000, signal)
  const series = [...new Set(res.items.map((i) => String(i.measure ?? '')).filter((m) => /-15_min-mm$/.test(m)))].sort()
  const chosen = series.find((m) => /-t-15_min-mm$/.test(m)) ?? series[0]
  return toReadings(res.items.filter((i) => i.measure === chosen))
}
