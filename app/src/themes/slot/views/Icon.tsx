/**
 * PORTING NOTES
 * CFW: slot (a GBA-only frontend for the Anbernic RG SP)
 * Devices: rg-sp (720x480)
 * Source: crates/slot-ui/src/icon.rs
 * Mode: reproduce
 *
 * The eight HUD glyphs, set in the source's own font at the source's own codepoints.
 *
 * Layout:   18px, tinted with the HUD ink, beside the bar at a 10px gap.
 * Buttons:  none - these are indicators, not controls.
 * Transitions: none. They appear and go with the plate they sit on.
 * Notes:
 *   slot picks the **Mono** variant deliberately: its fixed advance width "keeps a HUD row from
 *   reflowing when the glyph changes under it", which matters because the volume glyph swaps to
 *   the muted one at zero and the fast-forward glyph swaps when it latches. Setting these in a
 *   proportional face would move the bar beside them.
 */
import type { IconName } from '../library'

/**
 * `Icon::glyph()`, codepoint for codepoint.
 *
 * Fast-forward and its latched form are the same silhouette at the same width differing only in
 * fill - "hollow while the finger is down, solid once it is latched on" - so the badge never
 * reflows between the two and the weight carries the meaning.
 */
const GLYPH: Record<IconName, string> = {
  volume: '\u{f028}',
  volumeMuted: '\u{f026}',
  brightness: '\u{f185}',
  blueLight: '\u{f186}',
  fastForward: '\u{f06d2}',
  fastForwardLatched: '\u{f0211}',
  rewind: '\u{f04a}',
  alert: '\u{f0026}',
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
    <div
      className="slot-icon"
      style={{ left: x, top: y, width: size, height: size, fontSize: size, color: colour }}
    >
      {GLYPH[name]}
    </div>
  )
}
