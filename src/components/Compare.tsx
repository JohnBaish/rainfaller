import { useEffect, useRef, useState, type FormEvent } from 'react'
import { chartScale, compareSummary, longDate, shareSentence, type CmpPlace } from '../lib/compare.ts'
import { clock, oneDecimal } from '../lib/format.ts'
import { loadLists, readings } from '../lib/load.ts'
import { ASKED, cmpRows, newestOf, pickShown, type Row } from '../lib/nearby.ts'
import { nearest, outwardCode } from '../lib/place.ts'
import { askSeconds, askSince, figures } from '../lib/rain.ts'
import { compareImage, deliver } from '../lib/shareImage.ts'
import { ShareButton } from './ShareButton.tsx'

// "Compare with another place" (John, November 17th 2026): the rain so far today at the eight gauges nearest a second
// postcode, beside this place's, in one chart with the last hour as a number by each bar, and Copy or Share
// (HOUSE-STYLE §17). The second place is in the address ("#RG4/PE38") so a shared link opens both, but it isn't kept
// anywhere else, and it isn't added to recent places.

type Other = { code: string; place: string | null; rows: Row[]; askedAt: number }

/** The second place's nearest gauges, all asked at once; `update` is called as each answer arrives, so the chart fills in
 *  gauge by gauge rather than waiting for the slowest (some Environment Agency answers take up to 20 seconds). */
async function fetchPlace(code: string, refresh: boolean, update: (o: Other) => void): Promise<void> {
  const { gauges, outcodes } = await loadLists()
  const o = outcodes.outcodes[code]
  if (!o) throw new Error('not England')
  const now = new Date()
  const since = askSince(now, askSeconds(now, refresh))
  const near = nearest({ e: o[0], n: o[1] }, gauges.gauges, (g) => g, ASKED)
  let rows: Row[] = near.map((x) => ({ gauge: x.item, miles: x.miles, dir: x.dir, status: 'loading' }))
  const send = () => update({ code, place: o[2], rows, askedAt: now.getTime() })
  send()
  await Promise.all(near.map(async (x) => {
    let patch: Partial<Row>
    try {
      patch = { status: 'done', fig: figures(await readings(x.item, since), now) }
    } catch {
      patch = { status: 'failed' }
    }
    rows = rows.map((r) => (r.gauge.id === x.item.id ? { ...r, ...patch } : r))
    send()
  }))
}

type Props = { code: string; place: string | null; first: CmpPlace['rows'] | null; firstNewest: number; checked: number | null; refreshes: number; initial: string | null; credit: string }

export function Compare({ code, place, first, firstNewest, checked, refreshes, initial, credit }: Props) {
  const [typed, setTyped] = useState(initial ?? '')
  const [other, setOther] = useState<string | null>(initial && initial !== code ? initial : null)
  const [data, setData] = useState<Other | null>(null)
  const [error, setError] = useState<string | null>(null)
  const round = useRef(0)

  // Ask for the second place when it's chosen, and again whenever this place's Refresh is pressed.
  const lastRefresh = useRef(refreshes)
  useEffect(() => {
    if (!other) return
    const refresh = refreshes !== lastRefresh.current
    lastRefresh.current = refreshes
    const mine = ++round.current
    fetchPlace(other, refresh, (d) => { if (round.current === mine) { setData(d); setError(null) } })
      .catch((e: Error) => {
        if (round.current !== mine) return
        setData(null)
        setError(e.message === 'not England'
          ? `${other} isn't a postcode district in England. Only England postcodes are currently accepted.`
          : "Couldn't get the readings for that place. Check your connection and try again.")
      })
  }, [other, refreshes])

  function submit(e: FormEvent) {
    e.preventDefault()
    const c = outwardCode(typed)
    if (!c) return setError("That doesn't look like a postcode. Try one like RG1 or RG1 8FR.")
    if (c === code) return setError(`That's ${code}, the place already shown. Try another postcode.`)
    setError(null)
    setData(null)
    setOther(c)
    history.replaceState(null, '', `#${code}/${c}`)
  }
  function clear() {
    round.current++
    setOther(null)
    setData(null)
    setTyped('')
    setError(null)
    history.replaceState(null, '', `#${code}`)
  }

  const second: CmpPlace | null = data ? { code: data.code, place: data.place, rows: cmpRows(pickShown(data.rows, data.askedAt)) } : null
  const a: CmpPlace | null = first ? { code, place, rows: first } : null
  const shownBoth = a && second && second.code === other
  const loading = !!shownBoth && [...a!.rows, ...second!.rows].some((r) => r.loading)
  const ready = !!shownBoth && !loading
  const newest = Math.max(firstNewest, data ? newestOf(pickShown(data.rows, data.askedAt)) : 0)
  const when = checked && newest ? `${longDate(newest)}, readings to ${clock(newest)}` : ''
  const summary = ready ? compareSummary(a!, second!) : []
  const { max, ticks } = chartScale(Math.max(0, ...(shownBoth ? [...a!.rows, ...second!.rows] : []).map((r) => r.today ?? 0)))

  const share = () => {
    const at = newest
    const canvas = compareImage({ places: [a!, second!], when, summary, credit })
    return deliver(canvas, `rainfaller-${code}-${second!.code}-${new Date(at).toISOString().slice(0, 10)}.png`, {
      title: 'Rainfaller: Rain so far today',
      text: shareSentence(a!, second!, at),
      url: `${location.origin}/#${code}/${second!.code}`,
    })
  }

  return (
    <section className="card cmp" aria-labelledby="cmp-h">
      <h3 id="cmp-h">Compare with another place</h3>
      {!other && <p className="note cmp-intro">See the rain at the gauges nearest another postcode alongside these eight, in a chart you can copy or share.</p>}
      <form className="cmp-form" onSubmit={submit} data-noprint>
        <label htmlFor="cmp-pc">Compare {code} with</label>
        <input
          id="cmp-pc" className="input" value={typed} placeholder="Postcode" autoComplete="off"
          onChange={(e) => { setTyped(e.target.value); setError(null) }}
          autoCapitalize="characters" autoCorrect="off" spellCheck={false} enterKeyHint="go"
        />
        <button className="btn btn-secondary" type="submit">Compare</button>
        {other && <button className="btn btn-ghost" type="button" onClick={clear}>Clear</button>}
      </form>
      {error && <div className="choose-error" role="alert">{error}</div>}
      {other && !error && !ready && <p className="rf-loading" aria-live="polite">Getting the readings for {other}…</p>}
      {shownBoth && !error && (
        <>
          {ready && <div className="card roundup">{summary.map((l) => <p key={l}>{l.replaceAll(' mm', '\u00a0mm')}</p>)}</div>}
          <figure className="cmp-chart" aria-label={`Rain so far today at the gauges nearest ${code} and ${second!.code}`}>
            <figcaption>
              <h4>Rain so far today</h4>
              <p className="cmp-sub">Each gauge from midnight to its latest reading, nearest first, on the same scale. The last hour beside each.</p>
            </figcaption>
            <div className="cmp-row cmp-head" aria-hidden="true"><span /><span /><span>Today</span><span>Last hour</span></div>
            {[a!, second!].map((p, pi) => (
              <div key={p.code} role="group" aria-label={`${p.code}${p.place ? `, ${p.place}` : ''}`}>
                <div className="cmp-grp"><span className={`sw sw${pi}`} />{p.code}{p.place ? ` · ${p.place}` : ''}</div>
                {p.rows.map((r, i) => {
                  const v = r.today === null ? null : Number(oneDecimal(r.today))
                  return (
                    <div className="cmp-row" key={`${r.name}-${i}`} title={`${r.name}: ${v === null ? 'no readings today' : `${oneDecimal(v)} mm so far today`}${r.hour === null ? '' : `, ${oneDecimal(r.hour)} mm in the last hour`}`}>
                      <span className="nm">{r.name}</span>
                      <span className="trk">{v !== null && v > 0 && <span className={`br br${pi}${r.late ? ' late' : ''}`} style={{ width: `${Math.max(0.6, (Math.min(v, max) / max) * 100)}%` }} />}</span>
                      <span className={`v${r.late || v === null ? ' muted' : ''}`}>{r.loading ? '…' : v === null ? (r.failed ? 'No readings' : '–') : `${oneDecimal(v)} mm`}</span>
                      <span className="v muted">{r.loading ? '' : r.hour === null ? '–' : `${oneDecimal(r.hour)} mm`}</span>
                    </div>
                  )
                })}
              </div>
            ))}
            <div className="cmp-row cmp-axis" aria-hidden="true">
              <span />
              <span className="ticks">{ticks.map((t, i) => <span key={t}>{i === ticks.length - 1 ? `${t} mm` : t}</span>)}</span>
              <span /><span />
            </div>
          </figure>
          {ready && (a!.rows.some((r) => r.late) || second!.rows.some((r) => r.late)) ? <p className="note">A grey bar is a gauge running late: its total is to its latest reading.</p> : null}
          <div className="share-row" data-noprint><ShareButton what="chart" make={share} disabled={!ready} /></div>
        </>
      )}
    </section>
  )
}
