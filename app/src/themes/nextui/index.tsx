import { useCallback, useState, type CSSProperties } from 'react'
import { useButtonPress } from '../../input/InputProvider'
import { backgroundImage } from './art'
import { VIEWS, viewBySlug } from './library'
import { VISIBLE } from './layout'
import { PALETTES, paletteById, paletteVariables, tokens } from './palette'
import { useFontReady } from './text'
import { HintGroup } from './views/parts'
import { Screen } from './views/Screens'
import './nextui.css'

export interface NextUiProps {
  readonly view?: string | undefined
  readonly palette?: string | undefined
  /** NextUI's Game Switcher title treatment, off in all eighteen built-in palettes. */
  readonly titlePill?: boolean | undefined
  readonly selected?: number | undefined
  /**
   * A `bg.png` in the folder's `.media`, or the global background. Off is the stock look: the
   * menu clears to the palette's background slot and draws nothing else.
   */
  readonly background?: boolean | undefined
}

/**
 * The NextUI theme for N64FlashcartMenu.
 *
 * A flashcart menu rather than a firmware UI, drawn to a television at 640x480 with a 32x24
 * overscan margin it never paints into. Twenty-three of the menu's views render this theme, and
 * they share one list, one settings row, one hint bar and one box-art slot between them.
 *
 * The seven palette slots are written as custom properties on the root, which is what the menu
 * does - one lookup per slot, resolved once - and why a palette change needs no reboot. Nothing a
 * widget owns reads them; every colour a screen draws with is passed to it as a value.
 *
 * The hint groups live here rather than in the screens because every view draws the same three:
 * one anchored top-right, one bottom-left, one bottom-right. Which pills they hold is per view,
 * and that is data.
 */
export function NextUi({
  view = 'browser',
  palette: paletteId = 'Default',
  titlePill = false,
  selected = 0,
  background = false,
}: NextUiProps) {
  const def = viewBySlug(view)
  const applied = paletteById(paletteId)

  /* Pill widths are measured, and the first paint measures against the fallback face. */
  useFontReady()

  /*
   * The cursor starts where the caller posed it and moves from there.
   *
   * Deliberately not gated on `animate`. Motion off settles the marquee, which is the theme's one
   * animation; it does not mean the screen stops responding. A static route never receives a press
   * because it renders with `interactive={false}`, so it stays on the posed row on its own.
   */
  const [cursor, setCursor] = useState(selected)
  const index = cursor

  /*
   * The palette picker walks its eighteen palettes; every other view walks its own list. Clamping
   * here rather than in each shape keeps the whole input map in one place.
   */
  const limit = def.kind === 'palette' ? PALETTES.length : (def.items ?? 1)

  useButtonPress(
    useCallback(
      (button) => {
        const step = button === 'up' ? -1 : button === 'down' ? 1 : 0
        if (step === 0) return
        /* NextUI wraps at both ends of a list, and the theme adopts that. */
        setCursor((i) => (i + step + limit) % limit)
      },
      [limit],
    ),
  )

  /*
   * The picker previews live: the screen re-renders in whatever is highlighted rather than in
   * what is applied, which is why the background colour changes as the cursor moves.
   */
  const drawn =
    def.kind === 'palette' ? (PALETTES[Math.min(index, PALETTES.length - 1)] ?? applied) : applied
  const t = tokens(drawn)

  /* The picker clears flat so the Background slot is always visible, never to an image. */
  const showImage = background && def.kind !== 'palette'

  return (
    <div
      className="nx"
      style={paletteVariables(drawn) as CSSProperties}
      data-theme="nextui"
      data-view={def.slug}
      data-palette={drawn.id}
    >
      {showImage ? (
        <>
          <img className="nx-bg-image" src={backgroundImage()} alt="" />
          <div className="nx-bg-overlay" />
        </>
      ) : null}

      <div className="nx-stage">
        <Screen view={def} selected={index} palette={drawn} titlePill={titlePill} />

        {def.topHints ? (
          <HintGroup
            hints={def.topHints}
            alignRight
            y={VISIBLE.y0}
            main={t.main}
            accent={t.primaryAccent}
            glyph={t.secondaryAccent}
            hint={t.hintText}
          />
        ) : null}

        {def.leftHints ? (
          <HintGroup
            hints={def.leftHints}
            alignRight={false}
            main={t.main}
            accent={t.primaryAccent}
            glyph={t.secondaryAccent}
            hint={t.hintText}
          />
        ) : null}

        <HintGroup
          hints={def.rightHints}
          alignRight
          main={t.main}
          accent={t.primaryAccent}
          glyph={t.secondaryAccent}
          hint={t.hintText}
        />
      </div>
    </div>
  )
}

export { VIEWS }
