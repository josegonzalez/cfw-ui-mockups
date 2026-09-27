/**
 * PORTING NOTES
 * CFW: TortOS            Devices: trimui-brick
 * Source: ericreinsmidt/TortOS - src/main.c np_draw (7346), muse_now_screen (7471);
 *         src/ui.c the play-mode marks (878-1059)
 * Mode: reproduce
 *
 * Layout:        Its own screen, not a panel: the album's cover at 432px square, x=80, y=140, in
 *                Muse's green glow; beside it from x=568, 392 wide, the position in the queue
 *                with the play mode's mark, then title, artist and album; a progress bar at
 *                y=440 with elapsed and remaining under it; "Next:" at the foot of the cover;
 *                and the hint line centred at y=696.
 * Focus & selection: None.
 * Buttons:       A play or pause, Y the next play mode, L1/R1 the previous or next track,
 *                Left/Right seek ten seconds, B back to the album's tracks, SELECT closes Muse,
 *                MENU Muse's menu.
 * Transitions:   None of its own; the title, artist and album slide together when too long.
 * Notes:         The cover is the card TortOS generates for an album with none - square, with
 *                no rounded corners - since the reference frame's cover art is not shipped here.
 *                The track does not advance on its own: nothing plays in a mockup, so the clock
 *                shows where it was left.
 */
import { ALBUMS, trackName } from '../library'
import { mmss, type MuseNow } from '../machine'
import { MUSE_GREEN, UI, hex } from '../palette'
import { FONT, GLOW, NOW, SCREEN } from '../spec'
import { fitText, textWidth } from '../text'
import { GeneratedCard, Glow, Marquee, Text } from './parts'

/**
 * A play mode's mark (`g_build`): strokes with round ends and arrowheads in a unit square, y down.
 * In order has no mark - it is what plays when nothing was asked for.
 */
function ModeMark({ mode, cx, cy, size, rgb }: { mode: number; cx: number; cy: number; size: number; rgb: number }) {
  if (mode === 0) return null
  const W = 0.055
  const lines: [number, number, number, number, number][] = []
  const heads: [number, number, number, number][] = []
  const arc = (x: number, y: number, r: number, a0: number, a1: number) => {
    for (let i = 0; i < 6; i++) {
      const t0 = a0 + ((a1 - a0) * i) / 6
      const t1 = a0 + ((a1 - a0) * (i + 1)) / 6
      lines.push([x + r * Math.cos(t0), y + r * Math.sin(t0), x + r * Math.cos(t1), y + r * Math.sin(t1), W])
    }
  }
  if (mode === 3) {
    lines.push([0.1, 0.32, 0.3, 0.32, W], [0.3, 0.32, 0.6, 0.68, W], [0.6, 0.68, 0.72, 0.68, W])
    heads.push([0.89, 0.68, 1, 0])
    lines.push([0.1, 0.68, 0.3, 0.68, W], [0.3, 0.68, 0.6, 0.32, W], [0.6, 0.32, 0.72, 0.32, W])
    heads.push([0.89, 0.32, 1, 0])
  } else {
    lines.push([0.12, 0.6, 0.12, 0.42, W])
    arc(0.3, 0.42, 0.18, Math.PI, 1.5 * Math.PI)
    lines.push([0.3, 0.24, 0.68, 0.24, W])
    heads.push([0.86, 0.24, 1, 0])
    lines.push([0.88, 0.4, 0.88, 0.58, W])
    arc(0.7, 0.58, 0.18, 0, 0.5 * Math.PI)
    lines.push([0.7, 0.76, 0.32, 0.76, W])
    heads.push([0.14, 0.76, -1, 0])
    if (mode === 2) lines.push([0.5, 0.38, 0.5, 0.62, 0.04], [0.5, 0.38, 0.445, 0.43, 0.04])
  }
  const color = hex(rgb)
  return (
    <svg style={{ position: 'absolute', left: `${cx - size / 2}px`, top: `${cy - size / 2}px` }} width={size} height={size} viewBox="0 0 1 1">
      {lines.map(([x0, y0, x1, y1, w], i) => (
        <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={color} strokeWidth={w * 2} strokeLinecap="round" />
      ))}
      {heads.map(([tx, ty, dx, dy], i) => {
        const bx = tx - dx * 0.17
        const by = ty - dy * 0.17
        const px = -dy * 0.13
        const py = dx * 0.13
        return <polygon key={i} points={`${tx},${ty} ${bx + px},${by + py} ${bx - px},${by - py}`} fill={color} />
      })}
    </svg>
  )
}

export function NowPlaying({ now, mode, phase }: { now: MuseNow; mode: number; phase: number }) {
  const album = ALBUMS[now.album]!
  const track = album.tracks[now.track]!
  const next = mode !== 2 ? album.tracks[now.track + 1] : undefined
  const state = now.paused ? 'Paused' : null
  const k = track.len > 0 ? Math.min(1, Math.max(0, now.at / track.len)) : 0
  const cover = { left: NOW.x, top: NOW.y, width: NOW.side, height: NOW.side }
  const th = FONT.meta
  const gs = Math.trunc((th * 3) / 2)
  const asc = FONT.meta - Math.ceil(FONT.meta * 0.25)
  const cap = Math.round(FONT.meta * 0.702)
  const y = NOW.y + 36
  const countText = `${now.track + 1} of ${album.tracks.length}`
  // The mark follows the count, 18px on, and is centred on the count's ink rather than its box.
  const markX = NOW.textX + (album.tracks.length > 1 ? textWidth(countText, FONT.meta) + 18 : 0)
  const markY = y + asc - Math.trunc(cap / 2)
  const titleY = y + FONT.meta + 24
  const artistY = titleY + FONT.title + 10
  const albumY = artistY + FONT.menu
  const bar = NOW.y + NOW.side - 132
  const fill = Math.round(NOW.textW * k)
  const green = hex(MUSE_GREEN, state ? 0.45 : 1)

  return (
    <div style={{ position: 'absolute', inset: 0 }} data-part="now-playing">
      <Glow box={{ left: 0, top: SCREEN.h - 240, width: SCREEN.w, height: 480 }} rgb={MUSE_GREEN} alpha={GLOW.wash.alpha} spread={GLOW.wash.spread} />
      <Glow box={cover} rgb={MUSE_GREEN} alpha={GLOW.cover.alpha} spread={GLOW.cover.spread} />
      <div style={{ position: 'absolute', left: `${cover.left}px`, top: `${cover.top}px`, width: `${cover.width}px`, height: `${cover.height}px` }}>
        <GeneratedCard title={album.name} rgb={MUSE_GREEN} width={NOW.side} height={NOW.side} album />
      </div>

      {album.tracks.length > 1 && <Text text={countText} x={NOW.textX} y={y} size={FONT.meta} color={UI.dim} />}
      <ModeMark mode={mode} cx={markX + gs / 2} cy={markY} size={gs} rgb={MUSE_GREEN} />
      <Marquee text={trackName(track.name)} x={NOW.textX} y={titleY} w={NOW.textW} size={FONT.title} color={UI.text} phase={phase} />
      <Marquee text={album.artist} x={NOW.textX} y={artistY} w={NOW.textW} size={FONT.menu} color={UI.soft} phase={phase} />
      <Marquee text={album.name} x={NOW.textX} y={albumY} w={NOW.textW} size={FONT.menu} color={UI.dim} phase={phase} />

      <div style={{ position: 'absolute', left: `${NOW.textX}px`, top: `${bar}px`, width: `${NOW.textW}px`, height: `${NOW.barH}px`, borderRadius: `${NOW.barH / 2}px`, background: 'rgba(255,255,255,0.133)' }} />
      {fill > 0 && <div style={{ position: 'absolute', left: `${NOW.textX}px`, top: `${bar}px`, width: `${fill}px`, height: `${NOW.barH}px`, borderRadius: `${NOW.barH / 2}px`, background: green }} />}
      <Text text={mmss(now.at)} x={NOW.textX} y={bar + 16} size={FONT.meta} color={UI.soft} />
      <Text text={`-${mmss(Math.max(0, track.len - now.at))}`} x={NOW.textX + NOW.textW} y={bar + 16} size={FONT.meta} color={UI.soft} anchor={1} />
      {state && <Text text={state} x={NOW.textX + NOW.textW / 2} y={bar + 16} size={FONT.meta} color={hex(MUSE_GREEN)} anchor={0} />}

      {next && <Text text={fitText(`Next: ${trackName(next.name)}`, FONT.meta, NOW.textW)} x={NOW.textX} y={NOW.y + NOW.side - FONT.meta} size={FONT.meta} color={UI.dim} />}

      <Text
        text={state ? 'A: play    L1/R1: track    Left/Right: seek    Y: mode' : 'A: pause    L1/R1: track    Left/Right: seek    Y: mode'}
        x={SCREEN.w / 2}
        y={NOW.hintY}
        size={FONT.meta}
        color={UI.dim}
        anchor={0}
      />
    </div>
  )
}
