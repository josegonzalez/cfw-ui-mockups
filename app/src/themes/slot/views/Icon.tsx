/**
 * PORTING NOTES
 * CFW: slot (a GBA-only frontend for the Anbernic RG SP)
 * Devices: rg-sp (720x480)
 * Source: crates/slot-ui/src/icon.rs
 * Mode: reproduce
 *
 * The eight HUD glyphs, drawn rather than set.
 *
 * Layout:   18px square, tinted with the HUD ink, beside the bar at a 10px gap.
 * Buttons:  none - these are indicators, not controls.
 * Transitions: none. They appear and go with the plate they sit on.
 * Notes:
 *   slot takes these from `SymbolsNerdFontMono-Regular.ttf`, which is 2.5 MB for eight glyphs.
 *   Embedding a font that size to draw eight shapes would be most of this theme's asset weight,
 *   so they are drawn as paths instead. That is a deliberate deviation and is the only place
 *   this set does not use the source's own asset - see `docs/porting/slot.md`.
 */
import type { IconName } from '../library'

const PATHS: Record<IconName, string> = {
  /* A speaker with two arcs of sound. */
  volume:
    'M3 9v6h4l5 4V5L7 9H3zm12.5 3a4 4 0 0 0-2-3.5v7a4 4 0 0 0 2-3.5zm-2 -7.5v2.1a6 6 0 0 1 0 10.8v2.1a8 8 0 0 0 0-15z',
  /* The same speaker, struck through: silence is a state, not a low level. */
  volumeMuted:
    'M3 9v6h4l5 4V5L7 9H3zm18.5-2.5-1.4-1.4-4.6 4.6-4.6-4.6-1.4 1.4 4.6 4.6-4.6 4.6 1.4 1.4 4.6-4.6 4.6 4.6 1.4-1.4-4.6-4.6z',
  /* A sun. */
  brightness:
    'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-6 2 3h-4l2-3zm0 22-2-3h4l-2 3zM1 12l3-2v4l-3-2zm22 0-3 2v-4l3 2zM4.2 4.2l3.5.7-2.8 2.8-.7-3.5zm15.6 15.6-3.5-.7 2.8-2.8.7 3.5zM19.8 4.2l-.7 3.5-2.8-2.8 3.5-.7zM4.2 19.8l.7-3.5 2.8 2.8-3.5.7z',
  /* A crescent moon, for the blue-light filter. */
  blueLight: 'M13 2a10 10 0 1 0 9 13A8 8 0 0 1 13 2z',
  fastForward: 'M2 5l9 7-9 7V5zm11 0l9 7-9 7V5z',
  /* Latched: the same glyph with a bar against it, as a held toggle. */
  fastForwardLatched: 'M1 5l8 7-8 7V5zm9 0l8 7-8 7V5zm10 0h3v14h-3V5z',
  rewind: 'M22 5l-9 7 9 7V5zm-11 0-9 7 9 7V5z',
  /* A triangle with a bang: the cart that will not seat says so on the cart. */
  alert: 'M12 2 23 21H1L12 2zm-1 6v7h2V8h-2zm0 9v2h2v-2h-2z',
}

export function Icon({
  name,
  x,
  y,
  size,
  colour,
}: {
  name: IconName
  x: number
  y: number
  size: number
  colour: string
}) {
  return (
    <svg
      className="slot-icon"
      style={{ left: x, top: y, width: size, height: size }}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
    >
      <path d={PATHS[name]} fill={colour} />
    </svg>
  )
}
