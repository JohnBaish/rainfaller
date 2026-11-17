import { useEffect, useState, type FormEvent } from 'react'
import { loadLists } from '../lib/load.ts'
import { outwardCode } from '../lib/place.ts'
import { forget, recentPlaces, type Recent } from '../lib/recent.ts'

// The chooser (SPEC §2; John's wording, November 17th 2026): a postcode box and the last five
// places chosen, kept only in this browser.
export function Chooser() {
  const [typed, setTyped] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [recent, setRecent] = useState<Recent[]>(recentPlaces)
  useEffect(() => {
    loadLists().catch(() => {}) // start loading the lists while the visitor types
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const code = outwardCode(typed)
    if (!code) return setError("That doesn't look like a postcode. Try one like RG1 or RG1 8FR.")
    try {
      const { outcodes } = await loadLists()
      if (!outcodes.outcodes[code]) return setError(`${code} isn't a postcode district in England. Only England postcodes are currently accepted.`)
    } catch {
      return setError("The list of postcodes couldn't be loaded. Check your connection and try again.")
    }
    location.hash = code
  }

  return (
    <>
      <div className="chooser-head"><span className="card-kicker">Rain today</span><h2>Rainfall nearby</h2></div>
      <form className="card" style={{ padding: 'var(--space-6)', gap: 'var(--space-3)' }} onSubmit={submit}>
        <h3 style={{ margin: 0, fontSize: 20 }}>Choose a place</h3>
        <label htmlFor="pc" className="muted">Your postcode, or just its first half</label>
        <div className="choose-row">
          <input
            className="input" id="pc" value={typed} autoComplete="postal-code" placeholder="Postcode"
            onChange={(e) => { setTyped(e.target.value); setError(null) }}
            autoCapitalize="characters" autoCorrect="off" spellCheck={false} enterKeyHint="go"
          />
          <button className="btn btn-primary" type="submit">Show</button>
        </div>
        {error && <div className="choose-error" role="alert">{error}</div>}
        <p className="note" style={{ margin: 0 }}>Such as RG1 or RG1 8FR. Only the first half (RG1) is used. It stays on your device: nothing you type is sent anywhere.</p>
        {recent.length > 0 && (
          <>
            <p className="muted" style={{ margin: 'var(--space-2) 0 0' }}>Recent places</p>
            <div className="recent">
              {recent.map((r) => {
                const label = r.place ? `${r.code} · ${r.place}` : r.code
                return (
                  <span className="recent-btn" key={r.code}>
                    <button type="button" onClick={() => { location.hash = r.code }}>{label}</button>
                    <button type="button" className="x" aria-label={`Remove ${label}`} onClick={() => { forget(r.code); setRecent(recentPlaces()) }}>×</button>
                  </span>
                )
              })}
            </div>
          </>
        )}
      </form>
      <p className="chooser-about muted">
        The rain recorded so far today and in the last hour at the nearest Environment Agency rain gauges, with the
        fortnight's average and the total by yesterday at the same time. Readings arrive every 15 minutes. Free to use.
      </p>
    </>
  )
}
