/**
 * PORTING NOTES
 * CFW: NextUI theme for N64FlashcartMenu
 * Devices: n64 (640x480, drawn to a television)
 * Source: src/menu/ui_components/context_menu.c, ui_components/common.c
 * Mode: reproduce
 *
 * The three things that draw over a screen rather than as one.
 *
 * Layout:
 *   - All three sit on `ui_components_dialog_draw`, which under this theme is a borderless
 *     rounded #2A2A2A panel centred on the display and sized to its own content plus 32.
 *   - Context menu: centre-aligned 16px rows, an accent pill behind the selected one.
 *   - Message box: centre-aligned 16px text, wrapped at 360.
 *   - Loader: a 320x24 stadium at the display centre, accent behind the main-colour fill.
 * Focus & selection:
 *   - The menu takes the input while it is up, which is what makes it modal.
 * Buttons:
 *   - Menu: Up/Down move, A chooses, B and R close. Message and loader: any of A, B, R dismisses.
 * Transitions:
 *   - None. The source draws these straight over the frame with no fade.
 */
import { CENTER, DISPLAY, FONT, VISIBLE } from '../layout'
import { textWidth } from '../text'
import type { Overlay as OverlayState } from '../nav'
import type { Tokens } from '../palette'

/** `MESSAGEBOX_*` and the dialog's own fill, which is a literal in the source rather than a slot. */
const MAX_WIDTH = 360
const MARGIN = 32
const PANEL = '#2A2A2A'
const LINE_HEIGHT = 22
const LOADER = { w: 320, h: 24 } as const

/** The panel every overlay sits on: rounded, borderless, sized to its content. */
function Dialog({ w, h, children }: { w: number; h: number; children: React.ReactNode }) {
  return (
    <div
      className="nx-dialog"
      style={{
        left: CENTER.x - w / 2,
        top: CENTER.y - h / 2,
        width: w,
        height: h,
        background: PANEL,
      }}
    >
      {children}
    </div>
  )
}

export function Overlay({ overlay, t }: { overlay: OverlayState; t: Tokens }) {
  if (overlay.kind === 'loading') {
    return (
      <>
        <div
          className="nx-pill"
          style={{
            left: CENTER.x - LOADER.w / 2,
            top: CENTER.y - LOADER.h / 2 - 8,
            width: LOADER.w,
            height: LOADER.h,
            background: t.primaryAccent,
          }}
        />
        <div
          className="nx-pill"
          style={{
            left: CENTER.x - LOADER.w / 2,
            top: CENTER.y - LOADER.h / 2 - 8,
            width: Math.max(LOADER.h, LOADER.w * overlay.progress),
            height: LOADER.h,
            background: t.main,
          }}
        />
        <div
          className="nx-dialog__text"
          style={{
            left: 0,
            top: CENTER.y + LOADER.h,
            width: DISPLAY.w,
            fontSize: FONT.small,
            color: t.listText,
          }}
        >
          {overlay.message}
        </div>
      </>
    )
  }

  if (overlay.kind === 'message') {
    const lines = overlay.text.split('\n')
    const widest = Math.max(...lines.map((line) => textWidth(line, FONT.tiny)))
    const w = Math.min(MAX_WIDTH, widest) + MARGIN
    const h = lines.length * LINE_HEIGHT + MARGIN

    return (
      <Dialog w={w} h={h}>
        <div
          className="nx-dialog__text nx-dialog__text--block"
          style={{
            width: '100%',
            fontSize: FONT.tiny,
            lineHeight: `${LINE_HEIGHT}px`,
            color: t.listText,
          }}
        >
          {overlay.text}
        </div>
      </Dialog>
    )
  }

  /*
   * The context menu. The source builds one paragraph of every row, sizes the panel to its bounding
   * box, then draws the accent pill behind row `selected` at one line's height - so the pill is as
   * wide as the whole panel rather than as wide as its own row, unlike every list in the theme.
   */
  const widest = Math.max(...overlay.items.map((item) => textWidth(item.text, FONT.tiny)))
  const w = Math.min(VISIBLE.w, widest) + MARGIN
  const h = overlay.items.length * LINE_HEIGHT + MARGIN
  const x0 = CENTER.x - w / 2
  const y0 = CENTER.y - h / 2

  return (
    <>
      <Dialog w={w} h={h}>
        <div
          className="nx-pill"
          style={{
            left: 0,
            top: MARGIN / 2 + overlay.selected * LINE_HEIGHT,
            width: w,
            height: LINE_HEIGHT,
            background: t.primaryAccent,
          }}
        />
        {overlay.items.map((item, i) => (
          <div
            key={item.text}
            className="nx-dialog__text"
            style={{
              left: 0,
              top: MARGIN / 2 + i * LINE_HEIGHT,
              width: w,
              height: LINE_HEIGHT,
              fontSize: FONT.tiny,
              color: i === overlay.selected ? t.hintText : t.listText,
            }}
          >
            {item.text}
          </div>
        ))}
      </Dialog>
      {/* Kept so the panel's own box is inspectable from a test without reading styles. */}
      <span hidden data-dialog={`${x0},${y0},${w},${h}`} />
    </>
  )
}
