import { useCallback, useEffect, useRef, useState } from 'react'
import { clock, miles, mm, oneDecimal } from '../lib/format.ts'
import { loadLists, readings } from '../lib/load.ts'
import { nearest } from '../lib/place.ts'
import { askSeconds, askSince, figures } from '../lib/rain.ts'
import { remember } from '../lib/recent.ts'
import { state, summary } from '../lib/summary.ts'
import { numberWord as n } from '../lib/words.ts'
import { cmpRows, LATE, newestOf, pickShown, SHOWN, ASKED, type Row } from '../lib/nearby.ts'
import { Compare } from './Compare.tsx'
import { ShareButton } from './ShareButton.tsx'
import { deliver, stripImage } from '../lib/shareImage.ts'
import { longDate, stripSentence } from '../lib/compare.ts'
import { RainStrip } from './RainStrip.tsx'
import { stripData, stripTop } from '../lib/strip.ts'

// A place's eight nearest reporting gauges (SPEC §3), each asked for its own readings by the
// visitor's browser and shown as soon as they arrive (SPEC §6). Asked when the page opens and
// again only when Refresh is pressed (SPEC §5).

export function PlaceView({ code, compareWith, fromLink }: { code: string; compareWith: string | null; fromLink: boolean }) {
  const [place, setPlace] = useState<string | null>(null)
  const [credits, setCredits] = useState<string[]>([])
  const [rows, setRows] = useState<Row[] | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [checked, setChecked] = useState<number | null>(null)
  const [askedAt, setAskedAt] = useState(0)
  const [refreshes, setRefreshes] = useState(0)
  const round = useRef(0)

  const ask = useCallback((list: Row[], refresh = false) => {
    const now = new Date()
    const since = askSince(now, askSeconds(now, refresh))
    const mine = ++round.current
    setAskedAt(now.getTime())
    setRows(list.map((r) => ({ ...r, status: 'loading', fig: undefined, strip: undefined })))
    setChecked(null)
    let left = list.length
    const settle = (id: string, patch: Partial<Row>) => {
      if (round.current !== mine) return
      setRows((rs) => rs?.map((r) => (r.gauge.id === id ? { ...r, ...patch } : r)) ?? rs)
      if (--left === 0) setChecked(Date.now())
    }
    for (const r of list) {
      readings(r.gauge, since)
        .then((raw) => settle(r.gauge.id, { status: 'done', fig: figures(raw, now), strip: stripData(raw, now) }))
        .catch(() => settle(r.gauge.id, { status: 'failed' }))
    }
  }, [])

  useEffect(() => {
    let live = true
    loadLists()
      .then(({ gauges, outcodes }) => {
        if (!live) return
        const o = outcodes.outcodes[code]
        if (!o) return setProblem(`${code} isn't a postcode district in England. Only England postcodes are currently accepted.`)
        setPlace(o[2])
        setCredits(gauges.credits)
        // A link opening two places adds neither to recent places (John, November 17th 2026).
        if (!fromLink) remember({ code, place: o[2] })
        const near = nearest({ e: o[0], n: o[1] }, gauges.gauges, (g) => g, ASKED)
        ask(near.map((x) => ({ gauge: x.item, miles: x.miles, dir: x.dir, status: 'loading' })))
      })
      .catch(() => live && setProblem("The list of rain gauges couldn't be loaded. Check your connection and try again."))
    const rounds = round
    return () => {
      live = false
      rounds.current++ // answers still arriving for this place are ignored
    }
  }, [code, ask, fromLink])

  if (problem) {
    return (
      <div className="card not-found" role="alert">
        <p>{problem}</p>
        <a className="btn btn-secondary" href="#choose">Choose again</a>
      </div>
    )
  }

  // The nearest eight that are reporting: a gauge whose readings arrived but have nothing in
  // the last day gives way to the next nearest. One still loading or failed keeps its place.
  const shown = pickShown(rows ?? [], askedAt)
  const done = shown.filter((r) => r.status === 'done' && r.fig)
  const newest = newestOf(shown)
  const late = (r: Row) => !!r.fig?.latest && newest - r.fig.latest > LATE
  const allIn = rows !== null && shown.every((r) => r.status !== 'loading')
  const most = Math.max(0, ...done.map((r) => r.fig!.today ?? 0))
  const top = stripTop(done.map((r) => r.strip))
  // Every gauge listed counts (fresh look 2.2, option b): a failed gauge has no figures.
  const lines = allIn
    ? summary(shown.map((r) => {
        const f = r.status === 'done' ? r.fig : undefined
        return {
          name: r.gauge.name,
          hour: f && !late(r) ? f.hour : null,
          today: f ? f.today : null,
          average: f ? f.average : null,
          yesterdayWhole: f && f.yesterdayComplete ? f.yesterdayWhole : null,
        }
      }))
    : []
  const allFailed = allIn && shown.length > 0 && shown.every((r) => r.status === 'failed')
  // The nearest gauge more than 20 miles away (fresh look 4.3, John, November 17th 2026).
  const farOff = allIn && shown.length > 0 && Math.round(shown[0].miles) > 20
  const credit = (() => {
    const t = `This uses Environment Agency rainfall data from the real-time data API (Beta). ${credits.join(' ')}`.trim()
    return /[.!?]$/.test(t) ? t : `${t}.`
  })()

  const shareStrips = () => {
    const pic = stripImage({
      code, place, when: `${longDate(newest)}, readings to ${clock(newest)}`, top, credit,
      rows: shown.map((r) => ({ name: r.gauge.name, today: r.fig?.today ?? null, late: late(r), failed: r.status === 'failed', strip: r.status === 'done' ? r.strip : undefined })),
    })
    return deliver(pic, `rainfaller-${code}-${new Date(newest).toISOString().slice(0, 10)}.png`, {
      title: 'Rainfaller: Rain today',
      text: stripSentence(code, shown.length, newest),
      url: `${location.origin}/#${code}`,
    })
  }

  const todayCell = (r: Row) => {
    if (r.status === 'loading') return <span className="rf-loading">Getting readings…</span>
    if (r.status === 'failed' || !r.fig) return <span className="muted">Couldn't get this gauge's readings. Press Refresh to try again.</span>
    const f = r.fig
    if (f.today === null) {
      // A gauge that has stopped (fresh look 2.4): when its last reading was, not "yet".
      if (late(r)) {
        const when = clock(f.latest!)
        return <div className="rf-late"><div className="note">Latest reading {when === 'midnight' ? 'at midnight' : `${when} yesterday`}</div></div>
      }
      // Just after midnight (fresh look 2.5): yesterday's total until today's readings arrive.
      return (
        <div>
          <span className="muted">No readings since midnight yet.</span>
          {f.yesterdayWhole !== null && f.yesterdayEnd !== null && (
            <div className="note">{f.yesterdayComplete ? 'Yesterday' : `Yesterday to ${clock(f.yesterdayEnd)}`}: {mm(f.yesterdayWhole)}</div>
          )}
        </div>
      )
    }
    const cut = clock(f.latest!)
    return (
      <div className={late(r) ? 'rf-late' : ''}>
        <span className="big mono">{mm(f.today)}</span>
        {oneDecimal(f.today) !== '0.0' && <div className="bar" style={{ width: `${Math.max(2, most ? (f.today / most) * 100 : 0)}%` }} />}
        {late(r) && <div className="note">Latest reading {cut}</div>}
        <div className="note">{f.average === null ? 'Not enough readings for an average' : `Fortnight average by ${cut}: ${mm(f.average)}`}</div>
        {f.yesterday !== null && <div className="note">By {cut} yesterday: {mm(f.yesterday)}</div>}
        {r.strip && oneDecimal(f.today) !== '0.0' && <RainStrip data={r.strip} top={top} />}
      </div>
    )
  }
  const hourCell = (r: Row) => {
    if (r.status !== 'done' || !r.fig) return null
    if (late(r)) return <span className="muted">Not available</span>
    return <span className="mono">{mm(r.fig.hour ?? 0)}</span>
  }
  const edge = (r: Row) => (r.status === 'done' && r.fig ? (state(r.fig.today, r.fig.average) ? `rf-${state(r.fig.today, r.fig.average)}` : '') : '')

  return (
    <>
      <div className="card strip place-strip">
        <h2>{code} · {n(shown.length || SHOWN)} gauges nearest to {place ?? code}</h2>
        <a className="btn btn-secondary" href="#choose" data-noprint>Change</a>
      </div>
      <div className="fresh">
        <p className="muted" aria-live="polite">
          {allFailed
            ? "Couldn't reach the Environment Agency. Press Refresh to try again."
            : checked && newest ? `Readings to ${clock(newest)}. Checked at ${clock(checked)}.` : 'Getting the latest readings…'}
        </p>
        <button className="btn btn-secondary" type="button" disabled={!allIn} onClick={() => { if (rows) { ask(rows, true); setRefreshes((k) => k + 1) } }} data-noprint>Refresh</button>
      </div>
      {farOff && <p className="muted far-note">The nearest gauges are some way off, so may not reflect the rain here.</p>}
      {lines.length > 0 && <div className="card roundup">{lines.map((l) => <p key={l}>{l}</p>)}</div>}
      <section className="source">
        <div className="section-head"><h3>Rain today</h3></div>
        <p className="note gauges-intro">The {n(shown.length || SHOWN)} nearest Environment Agency rain gauges reporting, nearest first. Today is from midnight.<span className="dark-only"> A blue edge means wetter than the fortnight's average by this time; sand, drier.</span></p>
        <table className="table figures rf-table">
          <colgroup><col style={{ width: '34%' }} /><col style={{ width: '16%' }} /><col style={{ width: '14%' }} /><col style={{ width: '36%' }} /></colgroup>
          <thead><tr><th>Gauge</th><th>Distance</th><th>Last hour</th><th>Today</th></tr></thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.gauge.id} className={edge(r)}>
                <td><b>{r.gauge.name}</b>{r.gauge.line && <div className="note">{r.gauge.line}</div>}</td>
                <td className="mono">{miles(r.miles)}<div className="note">{r.dir}</div></td>
                <td>{hourCell(r)}</td>
                <td className="rf-today">{todayCell(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="rf-cards">
          {shown.map((r) => (
            <div className={`card rf-card ${edge(r)}`} key={r.gauge.id}>
              <h4>{r.gauge.name}</h4>
              {r.gauge.line && <div className="note">{r.gauge.line}</div>}
              <div className="row"><span className="label">Distance</span><span>{miles(r.miles)} {r.dir}</span></div>
              {r.status === 'done' && <div className="row"><span className="label">Last hour</span><span>{hourCell(r)}</span></div>}
              <div className="row"><span className="label">Today</span><span className="rf-today">{todayCell(r)}</span></div>
            </div>
          ))}
        </div>
        {allIn && !allFailed && shown.length > 0 && (
          <div className="share-row" data-noprint><ShareButton what="charts" make={shareStrips} /></div>
        )}
        <p className="data-credit">{credit}</p>
      </section>
      <Compare code={code} place={place} first={rows ? cmpRows(shown) : null} firstNewest={newest} checked={checked} refreshes={refreshes} initial={compareWith} credit={credit} />
      <AboutFigures />
    </>
  )
}

// Drafts for John (November 17th 2026), from the spec's notes.
function AboutFigures() {
  return (
    <section className="card rf-about">
      <h3>About these figures</h3>
      <p>Readings come from the Environment Agency's rain gauges every 15 minutes, usually 20 to 45 minutes after the rain fell. They're provisional: the Environment Agency can correct them later.</p>
      <p>Today is from midnight, UK time. ‘The last hour’ is defined as the aggregate of the four latest 15-minute readings. The small chart under each gauge shows the rain in each 15 minutes since midnight, with all the gauges on the same scale.</p>
      <p>The fortnight's average is the rain from midnight to the same time on each of the last 14 days, averaged. It includes dry days, so one wet day can lift it a lot. It's shown when at least ten of the 14 days have readings.</p>
      <p>The gauges are the ones offered by the companion baish.net website Hindcaster: checked each month against the Environment Agency's quality-checked figures, less any held back that day for disagreeing with the gauges around them. A 15-minute reading of more than 50 mm is left out.</p>
      <p>Rainfaller is an independent project, not connected with or endorsed by the Environment Agency.</p>
    </section>
  )
}
