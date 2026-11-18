import { clock, mm } from '../lib/format.ts'
import type { StripData } from '../lib/strip.ts'

// Today's rain in each 15 minutes, on the page's shared scale (src/lib/strip.ts).
const W = 3 // width of one slot in the drawing's own units
const H = 28

export function RainStrip({ data, top }: { data: StripData; top: number }) {
  const width = data.slots * W
  const label = data.heaviest
    ? `Rain in each 15 minutes since midnight. Heaviest: ${mm(data.heaviest.v)} in the 15 minutes to ${clock(data.heaviest.t)}.`
    : 'Rain in each 15 minutes since midnight: none so far.'
  const at = (slot: number) => `${(slot / data.slots) * 100}%`
  return (
    <div className="rf-strip">
      <svg viewBox={`0 0 ${width} ${H + 1}`} preserveAspectRatio="none" role="img" aria-label={label}>
        <rect x={0} y={H} width={data.upTo * W} height={1} className="rf-strip-base" />
        <rect x={data.upTo * W} y={H} width={width - data.upTo * W} height={1} className="rf-strip-rest" />
        {data.marks.map((m) => {
          const h = Math.max(1.5, (m.v / top) * H)
          return (
            <g key={m.t}>
              <title>{`${mm(m.v)} in the 15 minutes to ${clock(m.t)}`}</title>
              <rect x={m.slot * W} y={0} width={W} height={H} className="rf-strip-hit" />
              <rect x={m.slot * W} y={H - h} width={W - 1} height={h} className="rf-strip-mark" />
            </g>
          )
        })}
      </svg>
      <div className="rf-strip-axis" aria-hidden="true">
        <span style={{ left: 0 }} className="end">midnight</span>
        {data.ticks.map((t) => <span key={t.label} style={{ left: at(t.slot) }} className="mid">{t.label}</span>)}
        <span style={{ right: 0 }} className="end">midnight</span>
      </div>
    </div>
  )
}
