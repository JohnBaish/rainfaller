import { Component, useEffect, useState, type ReactNode } from 'react'
import { Chooser } from './components/Chooser.tsx'
import { PlaceView } from './components/PlaceView.tsx'
import { ThemeSwitch } from './components/ThemeSwitch.tsx'
import { outwardCode } from './lib/place.ts'
import { recentPlaces } from './lib/recent.ts'

// The address after "#" says what to show: "#RG4" for a place, "#RG4/PE38" for a place compared with another,
// "#choose" for the chooser. With nothing there, the page opens on the last place chosen (SPEC §2), else the chooser.
type View = { code: string | null; compare: string | null }
function fromHash(hash: string): View {
  const h = decodeURIComponent(hash.replace(/^#/, ''))
  if (h === 'choose') return { code: null, compare: null }
  if (!h) return { code: recentPlaces()[0]?.code ?? null, compare: null }
  const [a, b] = h.split('/')
  return { code: outwardCode(a), compare: b ? outwardCode(b) : null }
}

/** If a part of the page fails while drawing, a message instead of an empty page (HOUSE-STYLE §5). */
class SafetyNet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="card not-found" role="alert">
        <p>Sorry, this page couldn't be shown. Choose another place, or try again later.</p>
        <a className="btn btn-secondary" href="#choose">Choose again</a>
      </div>
    )
  }
}

export default function App() {
  const [view, setView] = useState<View>(() => fromHash(location.hash))
  const { code, compare } = view
  useEffect(() => {
    const onHash = () => {
      setView(fromHash(location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <>
      <nav className="nav" data-noprint>
        <a className="nav-brand" href="#choose">Rainfaller</a>
        <div className="nav-right"><ThemeSwitch /></div>
      </nav>
      <main className="col screen">
        <SafetyNet key={code ?? 'choose'}>{code ? <PlaceView key={`${code}/${compare ?? ''}`} code={code} compareWith={compare} fromLink={!!compare} /> : <Chooser />}</SafetyNet>
        <footer className="footer-notice" data-noprint>
          Rainfaller is a free-to-use personal project by John Baish. Your device, rather than the website, stores your
          recent places and your choice of light or dark mode. To get the readings, your browser asks the Environment
          Agency directly. We don't record anything you do here, apart from anonymous visit statistics (no cookies, no
          personal data) showing us how the site is used. For yesterday's weather, see{' '}
          <a href="https://hindcaster.baish.net/" target="_blank" rel="noopener noreferrer" className="footer-link">Hindcaster</a>.
          More free tools at{' '}
          <a href="https://www.baish.net/" target="_blank" rel="noopener noreferrer" className="footer-link">www.baish.net</a>.
        </footer>
      </main>
    </>
  )
}
