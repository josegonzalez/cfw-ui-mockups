/**
 * PORTING NOTES
 * CFW: SimpleOS            Devices: rg-ds
 * Source: boorngos/SimpleOS - README.txt ("In game"), CHANGELOG.txt 20260911-20260914, the
 *         `simpleos` binary's strings; the trailer's quick-menu, switcher and unlock frames
 * Mode: reproduce
 *
 * Layout:        The game's two screens fill the panels. With the menu up, the bottom panel
 *                carries the items at 3x centred on a 56px pitch, white capitals outlined one
 *                font pixel in black, straight over the game with no scrim; the top panel carries
 *                the title at 2x and the binary's `<  >` at 1x, both outlined, across its head.
 *                The unlock banner is 550x84 at the head of the top panel: a blue strip with
 *                `RETROACHIEVEMENTS` at 1x and the points at 2x, over a white body with the cup
 *                and the achievement's name.
 * Focus & selection: The menu cursor is a white box behind black text, 32px either side of the
 *                label and 50px tall. It wraps. It resets to the first item on a new title.
 * Buttons:       MENU opens the menu; up/down move; A confirms; B or MENU resumes. Left and right
 *                change title, and a title that is not running offers only LOAD, ARCHIVE and HOME
 *                (20260913) - that is the game switcher. LOAD on another title switches to it.
 * Transitions:   None seen: the menu is on or off from one frame to the next.
 * Notes:         The trailer's build shows seven items; the release this port reads has eight,
 *                with CONTROLS after VIDEO (20260914), and the eight are drawn - the binary's
 *                `CUR_ITEMS` is eight pointers and `OTH_ITEMS` three. The source draws the dark
 *                edge with `Draw_textShadow`; at the trailer's resolution it reads as a full
 *                outline, and is drawn as one here. Game screens are
 *                generated stand-ins. `SAVED` and `LOADED` are the binary's OSD strings; where
 *                they sit is not shown anywhere, so they sit at the head of the top panel until
 *                the next button. The unlock banner is posed by the mockup's own panel: nothing
 *                a player can do in a mockup unlocks an achievement.
 */
import { Panels } from '../../../device/Panels'
import { place } from '../../../layout/box'
import { GAMES, SWITCH_HINT, type MenuItem } from '../library'
import { FONT, MENU, MENU_TOP, TOAST } from '../layout'
import { PALETTE } from '../palette'
import type { Osd } from '../machine'
import { GamePane, PixelText } from './parts'

export interface InGameProps {
  readonly running: number
  /** The in-game menu, or null while playing. */
  readonly menu: {
    readonly title: number
    readonly items: readonly MenuItem[]
    readonly cursor: number
  } | null
  readonly osd: Osd
  readonly toast: boolean
}

function MenuItems({ items, cursor }: { items: readonly MenuItem[]; cursor: number }) {
  const first = 240 - ((items.length - 1) * MENU.pitch) / 2
  return (
    <>
      {items.map((item, i) => {
        const centerY = first + i * MENU.pitch
        const selected = i === cursor
        const top = Math.round(centerY - FONT.large / 2)
        const boxW = item.length * FONT.large + MENU.boxPadX * 2
        return (
          <div key={item} data-selected={selected || undefined} role="menuitem">
            {selected ? (
              <div
                style={{
                  ...place({
                    left: 320 - boxW / 2,
                    top: Math.round(centerY - MENU.boxHeight / 2),
                    width: boxW,
                    height: MENU.boxHeight,
                  }),
                  background: PALETTE.menuSelected,
                }}
              />
            ) : null}
            <PixelText
              text={item}
              x={320}
              top={top}
              font={FONT.large}
              color={selected ? PALETTE.menuSelectedText : PALETTE.menuText}
              align="center"
              outline={selected ? undefined : MENU.outline}
              outlineColor={PALETTE.menuOutline}
            />
          </div>
        )
      })}
    </>
  )
}

/** The cup on the unlock banner. */
function Cup() {
  const i = TOAST.icon
  const c = PALETTE.toastIcon
  return (
    <div style={{ ...place(i) }} aria-hidden="true">
      <div style={{ ...place({ left: 2, top: 2, width: 36, height: 20, radius: 10 }), background: c }} />
      <div style={{ ...place({ left: 16, top: 20, width: 8, height: 10 }), background: c }} />
      <div style={{ ...place({ left: 9, top: 30, width: 22, height: 6, radius: 2 }), background: c }} />
    </div>
  )
}

function Unlock() {
  const b = TOAST.box
  return (
    <div
      style={{
        ...place(b),
        background: PALETTE.toastBody,
        overflow: 'hidden',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
      }}
      data-part="unlock"
    >
      <div style={{ ...place({ left: 0, top: 0, width: b.width, height: TOAST.headHeight }), background: PALETTE.toastHead }} />
      <PixelText text="RETROACHIEVEMENTS" x={TOAST.labelLeft} top={TOAST.labelTop} font={FONT.small} color={PALETTE.toastHeadText} />
      <PixelText text="10 pts" x={b.width - TOAST.pointsRight} top={TOAST.pointsTop} font={FONT.body} color={PALETTE.toastHeadText} align="right" />
      <Cup />
      <PixelText text="Trophy" x={TOAST.nameLeft} top={TOAST.nameTop} font={FONT.body} color={PALETTE.toastText} />
    </div>
  )
}

export function InGame({ running, menu, osd, toast }: InGameProps) {
  const shown = menu ? menu.title : running
  const title = GAMES[shown]!

  return (
    <Panels
      top={
        <>
          <GamePane game={shown} title={title} which="top" />
          {menu ? (
            <>
              <PixelText text={title} x={320} top={MENU_TOP.titleTop} font={FONT.body} color={PALETTE.menuText} align="center" maxChars={38} outline={MENU_TOP.outline} outlineColor={PALETTE.menuOutline} />
              <PixelText text={SWITCH_HINT} x={320} top={MENU_TOP.hintTop} font={FONT.small} color={PALETTE.menuText} align="center" outline={1} outlineColor={PALETTE.menuOutline} />
            </>
          ) : null}
          {!menu && osd ? (
            <PixelText text={osd} x={320} top={MENU_TOP.titleTop} font={FONT.body} color={PALETTE.menuText} align="center" outline={MENU_TOP.outline} outlineColor={PALETTE.menuOutline} />
          ) : null}
          {!menu && toast ? <Unlock /> : null}
        </>
      }
      bottom={
        <>
          <GamePane game={shown} title={title} which="bottom" />
          {menu ? <MenuItems items={menu.items} cursor={menu.cursor} /> : null}
        </>
      }
    />
  )
}
