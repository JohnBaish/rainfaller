// "Copy chart" / "Share chart" for comparing two places (John, November 17th 2026; HOUSE-STYLE §17): a picture of the
// chart with a heading, the date and time, the summary and the credits, always in the light colours, made on the
// visitor's device. On a touch screen it goes to the phone's own share sheet with a sentence, a link and a title; on a
// computer it's copied (or saved, where the browser won't copy). Nothing is sent anywhere until the visitor chooses.
import { oneDecimal } from './format.ts'
import { chartScale, type CmpPlace } from './compare.ts'

/** The light colours (organic.css), and the two places' colours (checked for colour-blind readers). */
const C = { bg: '#f5ead8', text: '#201e1d', muted: '#645c50', accent: '#c67139', line: 'rgba(32,30,29,0.2)', late: '#b9ab95' }
export const PLACE_COLOURS = ['#c67139', '#4a78b5']
const FIG = 'Figtree, system-ui, sans-serif'

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const w of text.split(' ')) {
    const t = line ? `${line} ${w}` : w
    if (ctx.measureText(t).width > width && line) { lines.push(line); line = w } else line = t
  }
  if (line) lines.push(line)
  return lines
}

function fit(ctx: CanvasRenderingContext2D, text: string, width: number): string {
  if (ctx.measureText(text).width <= width) return text
  let t = text
  while (t.length > 1 && ctx.measureText(`${t}…`).width > width) t = t.slice(0, -1)
  return `${t.trimEnd()}…`
}

/** On a phone the picture is tall and narrow, with larger type, as in Hindcaster. */
export const phoneShaped = () =>
  typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 500

export type ComparePicture = { places: [CmpPlace, CmpPlace]; when: string; summary: string[]; credit: string }

export function compareImage(o: ComparePicture, phone = phoneShaped()): HTMLCanvasElement {
  const W = phone ? 720 : 1200
  const PAD = phone ? 36 : 50
  const f = phone ? 1.3 : 1
  const width = W - 2 * PAD
  const scale = 2
  const canvas = document.createElement('canvas')
  const probe = canvas.getContext('2d')!
  const font = (px: number, weight = 400) => `${weight} ${Math.round(px * f)}px ${FIG}`
  const lineH = (px: number) => Math.round(px * f * 1.45)
  probe.font = font(13)
  const credit = wrap(probe, `rainfaller.baish.net · ${o.credit}`, width)
  probe.font = font(17)
  const summary = o.summary.flatMap((s) => wrap(probe, s.replaceAll(' mm', '\u00a0mm'), width))
  const rowH = 30 * f
  const groupH = 34 * f
  const rows = o.places.reduce((s, p) => s + p.rows.length, 0)
  let y = 52 * f
  const kickerY = y
  y += 44 * f
  const headY = y
  y += 30 * f
  const whenY = y
  y += 44 * f
  const sumY = y
  y += (summary.length - 1) * lineH(17) + 46 * f
  const colHeadY = y
  y += 14 * f
  const chartTop = y
  const chartH = o.places.length * groupH + rows * rowH
  const axisY = chartTop + chartH + 6 * f
  const H = axisY + 40 * f + 24 * f + credit.length * lineH(13) + 16
  canvas.width = W * scale
  canvas.height = Math.round(H * scale)
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = C.accent
  ctx.font = font(13, 600)
  ctx.fillText('RAINFALLER · RAIN SO FAR TODAY', PAD, kickerY)
  ctx.fillStyle = C.text
  ctx.font = `${Math.round(34 * f)}px Caprasimo, Georgia, serif`
  ctx.fillText(`${o.places[0].code} and ${o.places[1].code}`, PAD, headY)
  ctx.fillStyle = C.muted
  ctx.font = font(17)
  ctx.fillText(o.when, PAD, whenY)
  ctx.fillStyle = C.text
  summary.forEach((t, i) => ctx.fillText(t, PAD, sumY + i * lineH(17)))

  // Columns: name, bar, today's figure, the last hour.
  const nameW = phone ? 206 : 230
  const hourW = phone ? 116 : 110
  const todayW = phone ? 96 : 96
  const barL = PAD + nameW
  const barR = W - PAD - hourW - todayW - 14 * f
  const { max, ticks } = chartScale(Math.max(0, ...o.places.flatMap((p) => p.rows.map((r) => r.today ?? 0))))
  const x = (v: number) => barL + (Math.min(v, max) / max) * (barR - barL)
  ctx.fillStyle = C.muted
  ctx.font = font(12, 600)
  ctx.textAlign = 'right'
  ctx.fillText('TODAY', W - PAD - hourW, colHeadY)
  ctx.fillText('LAST HOUR', W - PAD, colHeadY)
  ctx.textAlign = 'left'
  let ry = chartTop
  o.places.forEach((p, pi) => {
    ry += groupH
    ctx.fillStyle = PLACE_COLOURS[pi]
    ctx.beginPath(); ctx.roundRect(PAD, ry - 13 * f, 13 * f, 13 * f, 3 * f); ctx.fill()
    ctx.fillStyle = C.muted
    ctx.font = font(13, 700)
    ctx.fillText(`${p.code}${p.place ? ` · ${p.place}` : ''}`.toUpperCase(), PAD + 20 * f, ry)
    for (const r of p.rows) {
      ry += rowH
      ctx.fillStyle = C.text
      ctx.font = font(15)
      ctx.fillText(fit(ctx, r.name, nameW - 12 * f), PAD, ry)
      if (r.today !== null && oneDecimal(r.today) !== '0.0') {
        ctx.fillStyle = r.late ? C.late : PLACE_COLOURS[pi]
        const w = Math.max(3, x(Number(oneDecimal(r.today))) - barL)
        ctx.beginPath(); ctx.roundRect(barL, ry - 12 * f, w, 12 * f, [0, 4, 4, 0]); ctx.fill()
      }
      ctx.textAlign = 'right'
      ctx.fillStyle = r.late || r.today === null ? C.muted : C.text
      ctx.fillText(r.today === null ? (r.failed ? 'No readings' : '–') : `${oneDecimal(r.today)} mm`, W - PAD - hourW, ry)
      ctx.fillStyle = C.muted
      ctx.fillText(r.hour === null ? '–' : `${oneDecimal(r.hour)} mm`, W - PAD, ry)
      ctx.textAlign = 'left'
    }
  })
  // The scale under the bars.
  ctx.strokeStyle = C.line; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(barL, axisY); ctx.lineTo(barR, axisY); ctx.stroke()
  ctx.fillStyle = C.muted; ctx.font = font(12)
  // Each mark's label, leaving out any that would run into the last one ("30 mm").
  const lastLabel = `${ticks[ticks.length - 1]} mm`
  const lastLeft = x(ticks[ticks.length - 1]) - ctx.measureText(lastLabel).width
  ticks.forEach((t, i) => {
    ctx.beginPath(); ctx.moveTo(x(t), axisY); ctx.lineTo(x(t), axisY + 5 * f); ctx.stroke()
    const last = i === ticks.length - 1
    const label = last ? lastLabel : String(t)
    const right = i === 0 ? x(t) + ctx.measureText(label).width : x(t) + ctx.measureText(label).width / 2
    if (!last && right > lastLeft - 8) return
    ctx.textAlign = i === 0 ? 'left' : last ? 'right' : 'center'
    ctx.fillText(label, x(t), axisY + 20 * f)
  })
  ctx.textAlign = 'left'
  const ruleY = axisY + 40 * f
  ctx.beginPath(); ctx.moveTo(PAD, ruleY); ctx.lineTo(W - PAD, ruleY); ctx.stroke()
  ctx.fillStyle = C.muted; ctx.font = font(13)
  credit.forEach((t, i) => ctx.fillText(t, PAD, ruleY + 22 * f + i * lineH(13)))
  return canvas
}

export type Delivered = 'shared' | 'copied' | 'saved' | 'cancelled'
const touch = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
/** "Share" on a touch screen (the phone's share sheet), "Copy" on a computer. */
export const shareVerb = () => (touch() ? 'Share' : 'Copy')

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** What goes with the picture (HOUSE-STYLE §17): a sentence, a link to the same view, and a title. */
export type ShareWords = { title: string; text: string; url: string }

/** Hands the picture over: the share sheet on a touch screen, else the clipboard, else a saved file. Call straight from the tap. */
export async function deliver(canvas: HTMLCanvasElement, filename: string, words: ShareWords): Promise<Delivered> {
  const blob = new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('No picture'))), 'image/png'))
  if (touch()) {
    const b = await blob
    const file = new File([b], filename, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], ...words })
        return 'shared'
      } catch (e) {
        if ((e as Error).name === 'AbortError') return 'cancelled'
      }
    }
    save(b, filename)
    return 'saved'
  }
  try {
    // The picture is handed over as a promise, made inside the click, which Safari needs.
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return 'copied'
  } catch {
    save(await blob, filename)
    return 'saved'
  }
}
