import { useCallback, useReducer, type CSSProperties } from 'react'
import { useButtonPress } from '../../input/InputProvider'
import { backgroundImage } from './art'
import { SLOT_LABELS, VIEWS, viewBySlug } from './library'
import { VISIBLE } from './layout'
import { hintsFor, initialState, reduce, type NavButton } from './nav'
import { PALETTES, paletteById, paletteVariables, tokens } from './palette'
import { useFontReady } from './text'
import { Overlay } from './views/Overlay'
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

/** The device buttons the menu binds. Everything else is ignored rather than swallowed. */
const BOUND: Readonly<Record<string, NavButton>> = {
  up: 'up',
  down: 'down',
  left: 'left',
  right: 'right',
  a: 'a',
  b: 'b',
  r: 'r',
  start: 'start',
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
 * **The buttons the hint bar names all work.** `A` opens, `B` goes back, `R` opens the view's own
 * options menu and `START` opens Settings, following the graph in `nav.ts` - which is transcribed
 * from each view's own `menu->next_mode` rather than invented. The props below pose the opening
 * screen; the menu owns its state from there, exactly as it owns its configuration on hardware.
 */
export function NextUi({
  view = 'browser',
  palette: paletteId = 'Default',
  titlePill = false,
  selected = 0,
  background = false,
}: NextUiProps) {
  /* Pill widths are measured, and the first paint measures against the fallback face. */
  useFontReady()

  /*
   * Deliberately not gated on `animate`. Motion off settles the marquee, which is the theme's one
   * animation; it does not mean the screen stops responding. A static route never receives a press
   * because it renders with `interactive={false}`, so it stays on the posed screen on its own.
   */
  const [state, dispatch] = useReducer(
    reduce,
    initialState(view, selected, paletteId, titlePill, background),
  )

  useButtonPress(
    useCallback((button: string) => {
      const bound = BOUND[button]
      if (bound) dispatch(bound)
    }, []),
  )

  const def = viewBySlug(state.view)
  const applied = paletteById(state.palette)

  /*
   * The picker previews live: the screen re-renders in whatever is highlighted rather than in
   * what is applied, which is why the background colour changes as the cursor moves.
   */
  const drawn =
    def.kind === 'palette'
      ? (PALETTES[Math.min(state.cursor, PALETTES.length - 1)] ?? applied)
      : applied
  const t = tokens(drawn)

  /* The colour editor titles itself with the slot it was opened on. */
  const titled =
    def.kind === 'editor' ? { ...def, title: SLOT_LABELS[state.slot] ?? def.title } : def

  /* The picker clears flat so the Background slot is always visible, never to an image. */
  const showImage = state.background && def.kind !== 'palette'

  const groups = [
    { key: 'top' as const, hints: hintsFor(state, 'top'), alignRight: true, y: VISIBLE.y0 },
    { key: 'left' as const, hints: hintsFor(state, 'left'), alignRight: false, y: undefined },
    { key: 'right' as const, hints: hintsFor(state, 'right'), alignRight: true, y: undefined },
  ]

  return (
    <div
      className="nx"
      style={paletteVariables(drawn) as CSSProperties}
      data-theme="nextui"
      data-view={def.slug}
      data-palette={drawn.id}
      data-overlay={state.overlay?.kind}
    >
      {showImage ? (
        <>
          <img className="nx-bg-image" src={backgroundImage()} alt="" />
          <div className="nx-bg-overlay" />
        </>
      ) : null}

      <div className="nx-stage">
        <Screen
          view={titled}
          selected={state.cursor}
          palette={drawn}
          titlePill={state.titlePill}
          toggles={state.toggles}
          cheats={state.cheats}
        />

        {groups.map((group) =>
          group.hints.length ? (
            <HintGroup
              key={group.key}
              hints={group.hints}
              alignRight={group.alignRight}
              y={group.y}
              main={t.main}
              accent={t.primaryAccent}
              glyph={t.secondaryAccent}
              hint={t.hintText}
            />
          ) : null,
        )}

        {state.overlay ? <Overlay overlay={state.overlay} t={t} /> : null}
      </div>
    </div>
  )
}

export { VIEWS }
