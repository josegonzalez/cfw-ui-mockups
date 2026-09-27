/**
 * PORTING NOTES
 * CFW: TortOS            Devices: trimui-brick
 * Source: ericreinsmidt/TortOS - src/keyboard.c kb_draw (35-245), kb_prompt (265-332);
 *         src/main.c ra_signin_screen (4748), ss_signin_screen (4814), wifi_key (4606)
 * Mode: reproduce
 *
 * Layout:        An 860x580 panel centred on the screen over the shelf, dimmed at 150. Title in
 *                the label font at +22; a text field at +74, 804 wide; ten keys by four rows,
 *                72x60 with 6px gaps, from +150; a full-width space bar 48 tall; and the button
 *                hints as chips in two rows, four then three, 20px off the bottom.
 * Focus & selection: The key under the cursor is a lighter key; both axes wrap, and the space bar
 *                is a row of one. It opens on the first row of letters, not the digits.
 * Buttons:       A types, B deletes (repeats), X shift, Y symbols, L1/R1 move the text cursor,
 *                START done, MENU cancel. B on an empty field does nothing - the header comment
 *                in the source says it cancels, and no code does.
 * Transitions:   None.
 * Notes:         The keyboard is drawn over the shelf, not over the menu that opened it, because
 *                the source's modal draws its own backdrop. The password is shown as typed, as it
 *                is on the device.
 */
import { KEY_LAYERS, type Keyboard as KeyboardState } from '../machine'
import { SURFACE, UI, hex } from '../palette'
import { FONT, KEYBOARD, SCREEN } from '../spec'
import { textWidth } from '../text'
import { Glow, Text, px } from './parts'

const HINTS = ['A', 'B', 'X', 'Y', 'L/R', 'START', 'MENU'] as const

export function Keyboard({ k, accent }: { k: KeyboardState; accent: number }) {
  const panel = { left: (SCREEN.w - KEYBOARD.w) / 2, top: (SCREEN.h - KEYBOARD.h) / 2, width: KEYBOARD.w, height: KEYBOARD.h }
  const kw = KEYBOARD.key.w
  const kh = KEYBOARD.key.h
  const gap = KEYBOARD.key.gap
  const gridW = KEYBOARD.cols * kw + (KEYBOARD.cols - 1) * gap
  const gx = panel.left + Math.trunc((KEYBOARD.w - gridW) / 2)
  const gy = panel.top + KEYBOARD.gridTop
  const layer = KEY_LAYERS[k.layer]!

  // The field scrolls so the cursor stays in view.
  const field = { left: panel.left + KEYBOARD.field.x, top: panel.top + KEYBOARD.field.top, width: KEYBOARD.w - 56, height: FONT.menu + 10 }
  const clipW = field.width - 12
  const pre = textWidth(k.text.slice(0, k.cur), FONT.menu)
  const shift = pre > clipW - 16 ? pre - (clipW - 16) : 0

  const labels = ['type', 'delete', k.layer === 1 ? 'unshift' : 'shift', k.layer === 2 ? 'letters' : 'symbols', 'cursor', 'done', 'cancel']
  const hintW = (i: number) => textWidth(HINTS[i]!, FONT.meta) + 14 + 6 + textWidth(labels[i]!, FONT.meta) + 18
  const lh = FONT.meta + 8
  const y0 = panel.top + KEYBOARD.h - 20 - FONT.meta - lh
  const ink = Math.trunc(Math.ceil(FONT.meta * 0.25) / 2)

  const hintRows = [
    [0, 1, 2, 3],
    [4, 5, 6],
  ]

  return (
    <div style={{ position: 'absolute', inset: 0 }} data-part="keyboard">
      <Glow box={panel} rgb={accent} alpha={60} spread={1.5} />
      <div style={{ position: 'absolute', ...px(panel), borderRadius: '20px', background: hex(accent) }} />
      <div style={{ position: 'absolute', left: `${panel.left + 12}px`, top: `${panel.top + 12}px`, width: `${KEYBOARD.w - 24}px`, height: `${KEYBOARD.h - 24}px`, borderRadius: '8px', background: SURFACE.panel }} />
      <Text text={k.title} x={panel.left + KEYBOARD.w / 2} y={panel.top + KEYBOARD.titleTop} size={FONT.label} color={UI.soft} anchor={0} />

      <div style={{ position: 'absolute', ...px(field), borderRadius: `${KEYBOARD.field.radius}px`, background: SURFACE.field }} />
      <div style={{ position: 'absolute', left: `${field.left + 6}px`, top: `${field.top}px`, width: `${clipW}px`, height: `${field.height}px`, overflow: 'hidden' }}>
        <Text text={k.text} x={6 - shift} y={5} size={FONT.menu} color={UI.text} />
      </div>
      <div style={{ position: 'absolute', left: `${field.left + 12 + pre - shift}px`, top: `${field.top + 6}px`, width: '2px', height: `${FONT.menu - 2}px`, background: hex(accent) }} />

      {Array.from({ length: KEYBOARD.rows * KEYBOARD.cols }, (_, i) => {
        const r = Math.trunc(i / KEYBOARD.cols)
        const c = i % KEYBOARD.cols
        const sel = k.row === r && k.col === c
        const q = { left: gx + c * (kw + gap), top: gy + r * (kh + gap), width: kw, height: kh }
        return (
          <div key={i}>
            <div style={{ position: 'absolute', ...px(q), borderRadius: '8px', background: sel ? SURFACE.keySelected : SURFACE.key }} />
            <Text text={layer[i]!} x={q.left + kw / 2} y={q.top + 12} size={FONT.menu} color={sel ? UI.text : UI.soft} anchor={0} />
          </div>
        )
      })}
      {(() => {
        const q = { left: gx, top: gy + KEYBOARD.rows * (kh + gap), width: gridW, height: kh - 12 }
        const sel = k.row === KEYBOARD.rows
        return (
          <>
            <div style={{ position: 'absolute', ...px(q), borderRadius: '8px', background: sel ? SURFACE.keySelected : SURFACE.key }} />
            <Text text="space" x={q.left + q.width / 2} y={q.top + 8} size={FONT.meta} color={sel ? UI.text : UI.dim} anchor={0} />
          </>
        )
      })()}

      {hintRows.map((row, n) => {
        const total = row.reduce((s, i) => s + hintW(i), 0)
        let hx = panel.left + Math.trunc((KEYBOARD.w - total) / 2)
        const y = y0 + n * lh
        return row.map((i) => {
          const bw = textWidth(HINTS[i]!, FONT.meta)
          const chip = { left: hx, top: y - 3, width: bw + 14, height: FONT.meta + 6 }
          const x = hx
          hx += hintW(i)
          return (
            <div key={i}>
              <div style={{ position: 'absolute', ...px(chip), borderRadius: '6px', background: SURFACE.chip }} />
              <Text text={HINTS[i]!} x={x + 7} y={y + ink} size={FONT.meta} color={UI.soft} />
              <Text text={labels[i]!} x={x + chip.width + 6} y={y + ink} size={FONT.meta} color={UI.dim} />
            </div>
          )
        })
      })}
    </div>
  )
}
