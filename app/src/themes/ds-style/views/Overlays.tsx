/**
 * PORTING NOTES
 * CFW: DS Style            Devices: rg-sp
 * Source: FrankieT19/rg-sp-ds-style 2847683 - source/ui.h (hardware_popup, draw), extra_ui.h
 * Mode: reproduce
 *
 * Layout:        Every overlay is drawn over the page in `draw()`'s order (`ui.h:319-338`): the
 *                volume or brightness popup, then one of Launching, the launch-mode choice, a
 *                confirm or a notice, then the search keyboard, a help box or the binding box.
 *                Boxes are sized to their lines; Launching and notices are striped a row at a time.
 * Focus & selection: The search keyboard's chosen key, Delete or Results is an accent block.
 * Buttons:       A and B answer a popup or clear a notice; the keyboard takes the D-pad, A and B;
 *                a help box closes on A, B or X; binding takes the next button, and Left cancels.
 * Transitions:   None. The volume and brightness popups close after 1.4s in the live build.
 * Notes:         Volume and brightness have no key in the harness, so their popups are stills.
 */
import type { CSSProperties } from 'react'
import { SCALE, W, H, px } from '../layout'
import { SEARCH_KEYS, SET, CONTROL_ACTIONS, type State } from '../machine'
import { BUTTON_NAME } from '../machine'
import { GREY, WHITE, box } from '../palette'
import { glyphs, splitTitle, wrapBox } from '../text'
import { Border, Centered, Rect, Text, useDs } from './parts'

/** A box striped a logical row at a time: odd rows, then even (`ui.h:325, 332`). */
function Striped({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const { dark } = useDs()
  const [odd, even] = box(dark).stripe
  // Row y takes the odd colour when y is odd; the stripe is anchored to the canvas, not the box.
  const first = y % 2 ? odd : even
  const second = y % 2 ? even : odd
  const style: CSSProperties = {
    position: 'absolute',
    left: px(x),
    top: px(y),
    width: px(w),
    height: px(h),
    background: `repeating-linear-gradient(${first} 0 ${SCALE}px, ${second} ${SCALE}px ${2 * SCALE}px)`,
  }
  return <div style={style} />
}

/** `adaptive_popup` (`extra_ui.h:85`): a title and one or two choices, sized to the longest. */
function Popup({ lines }: { lines: string[] }) {
  const { dark } = useDs()
  const n = lines.length
  const w = Math.min(224, Math.max(90, ...lines.map((l) => glyphs(l) * 6)) + 16)
  const h = n * 14 + 16
  const x = Math.trunc((W - w) / 2)
  const y = Math.trunc((H - h) / 2)
  const b = box(dark)
  return (
    <>
      <Rect x={x} y={y} w={w} h={h} color={b.fill} />
      <Border x={x} y={y} w={w} h={h} color={b.border} />
      {lines.map((line, i) => (
        <Centered key={i} x={x + 8} y={y + 8 + i * 14} w={w - 16} s={line} />
      ))}
    </>
  )
}

/** `extra_box` (`extra_ui.h:42-49`): wrapped text in a 216-wide box. */
function HelpBox({ body }: { body: string }) {
  const { dark } = useDs()
  const lines = wrapBox(body)
  const h = lines.length * 12 + 20
  const y = Math.max(3, Math.trunc((H - h) / 2))
  const b = box(dark)
  return (
    <>
      <Rect x={12} y={y} w={216} h={h} color={b.fill} />
      <Border x={12} y={y} w={216} h={h} color={b.border} />
      {lines.map((line, i) => (
        <Text key={i} x={21} y={y + 9 + i * 12} s={line} max={33} />
      ))}
    </>
  )
}

/** `hardware_popup` (`ui.h:311-317`): the speaker or the sun, and a level bar. */
function Hardware({ kind, level }: { kind: 1 | 2; level: number }) {
  const ds = useDs()
  const ink = ds.dark ? WHITE : '#000000'
  return (
    <>
      <Rect x={48} y={65} w={144} h={30} color={ds.dark ? '#0d0d0d' : WHITE} />
      <Border x={48} y={65} w={144} h={30} color={ink} />
      <Border x={50} y={67} w={140} h={26} color={ds.accent} />
      {kind === 1 ? (
        <>
          <Rect x={59} y={77} w={3} h={6} color={ink} />
          {[0, 1, 2, 3].map((i) => (
            <Rect key={i} x={62 + i} y={76 - i} w={1} h={8 + 2 * i} color={ink} />
          ))}
          <Rect x={69} y={77} w={1} h={6} color={ink} />
          <Rect x={68} y={76} w={1} h={1} color={ink} />
          <Rect x={68} y={83} w={1} h={1} color={ink} />
        </>
      ) : (
        <>
          <Border x={61} y={77} w={5} h={5} color={ink} />
          <Rect x={63} y={73} w={1} h={2} color={ink} />
          <Rect x={63} y={84} w={1} h={2} color={ink} />
          <Rect x={57} y={79} w={2} h={1} color={ink} />
          <Rect x={68} y={79} w={2} h={1} color={ink} />
        </>
      )}
      {level < 0 ? (
        <Text x={78} y={74} s="Unavailable" max={16} />
      ) : (
        <>
          <Border x={78} y={76} w={103} h={8} color={ink} />
          <Rect x={80} y={78} w={Math.trunc((99 * level) / 100)} h={4} color={ds.accent} />
        </>
      )}
    </>
  )
}

/** The search keyboard (`extra_ui.h:50-57`). */
function Keyboard({ query, cell }: { query: string; cell: number }) {
  const ds = useDs()
  const b = box(ds.dark)
  const tail = query.length > 34 ? query.slice(query.length - 34) : query
  return (
    <>
      <Rect x={8} y={25} w={224} h={128} color={b.fill} />
      <Border x={8} y={25} w={224} h={128} color={ds.accent} />
      <Text x={16} y={30} s={ds.tr('Search')} max={20} />
      <Text x={16} y={44} s={tail} max={34} />
      <Border x={14} y={42} w={212} h={16} color={GREY} />
      {Array.from({ length: 40 }, (_, i) => {
        const x = 15 + (i % 10) * 21
        const y = 63 + Math.trunc(i / 10) * 16
        const k = SEARCH_KEYS[i] === ' ' ? '_' : SEARCH_KEYS[i]!
        return (
          <div key={i}>
            {i === cell ? <Rect x={x} y={y} w={19} h={14} color={ds.accent} /> : null}
            <Text x={x + 6} y={y + 1} s={k} color={i === cell ? WHITE : '#000000'} max={1} />
          </div>
        )
      })}
      {cell === 40 ? <Rect x={15} y={129} w={99} h={16} color={ds.accent} /> : null}
      {cell === 41 ? <Rect x={120} y={129} w={104} h={16} color={ds.accent} /> : null}
      <Text x={22} y={131} s={ds.tr('Delete')} color={cell === 40 ? WHITE : '#000000'} max={14} />
      <Text x={128} y={131} s={ds.tr('Results')} color={cell === 41 ? WHITE : '#000000'} max={14} />
    </>
  )
}

/** `setting_explanation` (`extra_ui.h:1-40`), by setting id. */
const EXPLANATIONS = [
  'Choose a 12 or 24 hour clock.',
  'Use list views for folders. Game folders keep your chosen view.',
  'Show full system names. The top bar keeps short names.',
  'Hide file extensions, tags and file sizes in lists.',
  'Choose the accent colour used by bars and selections.',
  'Choose List, List + Art, Horizontal or Vertical.',
  'Render artwork at GBA resolution for a pixel look.',
  'Choose the colour of the artwork outline, or turn it off.',
  'Round artwork corners. No Start keeps home artwork square.',
  'Align the smaller images in vertical view.',
  'Align the smaller images in horizontal view.',
  'Contain wide images, or let them overlap in horizontal view.',
  'Place list artwork at the top, centre or bottom.',
  'Choose Apps, Favourites or Recents for the home button.',
  'Add an LCD grid to the screen.',
  'Return to Stock OS. Stock settings remain available there.',
  'Start DS Style automatically when the device boots.',
  'Restart the device using the stock power route.',
  'Turn off the device using the stock power route.',
  'Open installed applications.',
  'Play sounds when a menu action takes place.',
  'Play a startup sound on device boot.',
  'Use console icons or folder icons for systems.',
  'Toggle dark backgrounds.',
  'Add a pixel transparency effect.',
  'Choose where DS Style starts. Hold START at startup to skip automatic game launch.',
  'Turn off the home screen. Home boot then opens Games.',
  'Choose Recents or Favourites for the home game.',
  'Hold this button at startup to launch the home game.',
  'Choose the interface language. Game filenames stay unchanged.',
  'Choose a controller to edit. Connected devices are detected automatically.',
  "Restore this controller's default buttons. D-pad navigation stays fixed.",
  'Show an Apps shortcut in the Systems list.',
]
const BIND_HELP =
  'Press a new button to bind. Conflicts swap buttons. D-pad Left cancels. Binding times out after 5 seconds.'

export function explanation(id: number): string {
  if (id < 0) return 'Hold START while DS Style starts to return to the menu when Last game boot is enabled.'
  if (id >= SET.bind0) return BIND_HELP
  return EXPLANATIONS[id] ?? 'Use left or right to change this setting.'
}

/** Every overlay, in `draw()`'s order (`ui.h:324-338`). */
export function Overlays({ s }: { s: State }) {
  const ds = useDs()
  const b = box(ds.dark)
  const label = (action: (typeof CONTROL_ACTIONS)[number]) =>
    BUTTON_NAME[s.bindings[CONTROL_ACTIONS.indexOf(action)]!] ?? '?'
  let popup = null
  if (s.launching !== null) {
    popup = (
      <>
        <Striped x={67} y={66} w={106} h={28} />
        <Border x={67} y={66} w={106} h={28} color={b.border} />
        <Centered x={75} y={73} w={90} s={ds.tr('Launching')} />
      </>
    )
  } else if (s.launchMode !== null) {
    popup = (
      <Popup lines={[ds.tr('Set launch mode'), `${label('accept')}: RetroArch`, `${label('back')}: Game Rooms`]} />
    )
  } else if (s.powerConfirm) {
    popup = (
      <Popup
        lines={[
          ds.tr(s.powerConfirm === 1 ? 'Reboot?' : 'Shutdown?'),
          `${label('accept')}: ${ds.tr('Yes')}`,
          `${label('back')}: ${ds.tr('Cancel')}`,
        ]}
      />
    )
  } else if (s.notice) {
    const lines = splitTitle(ds.tr(s.notice))
    const w = Math.max(90, ...lines.map((l) => glyphs(l) * 6)) + 16
    const h = lines.length * 12 + 16
    const x = Math.trunc((W - w) / 2)
    const y = Math.trunc((H - h) / 2)
    popup = (
      <>
        <Striped x={x} y={y} w={w} h={h} />
        <Border x={x} y={y} w={w} h={h} color={b.border} />
        {lines.map((line, i) => (
          <Centered key={i} x={x + 8} y={y + 7 + i * 12} w={w - 16} s={line} />
        ))}
      </>
    )
  }
  return (
    <>
      {s.hardware ? <Hardware kind={s.hardware.kind} level={s.hardware.level} /> : null}
      {popup}
      {s.search?.keyboard ? <Keyboard query={s.search.query} cell={s.search.cell} /> : null}
      {s.settingHelp !== null ? <HelpBox body={ds.tr(explanation(s.settingHelp))} /> : null}
      {s.capture !== null ? <HelpBox body={ds.tr(BIND_HELP)} /> : null}
    </>
  )
}

/**
 * The LCD grid (`ui.h:340-366`): every pixel of a 3x3 cell scaled by
 * `(4 - cos(2π(x+½)/3))/5 * (16 - cos(2π(y+½)/3))/17`, the same for each channel. A multiply blend
 * of that cell, tiled, is the same product; it is a blend, so the fallback render leaves it off.
 */
export function LcdGrid() {
  const cells: string[] = []
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      const gx = (4 - Math.cos((2 * Math.PI * (x + 0.5)) / 3)) / 5
      const gy = (16 - Math.cos((2 * Math.PI * (y + 0.5)) / 3)) / 17
      const v = Math.round(255 * gx * gy)
      cells.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="rgb(${v},${v},${v})"/>`)
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="3" height="3" shape-rendering="crispEdges">${cells.join('')}</svg>`
  return (
    <div
      aria-hidden
      data-part="lcd-grid"
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
        backgroundSize: `${SCALE}px ${SCALE}px`,
        imageRendering: 'pixelated',
        mixBlendMode: 'multiply',
        pointerEvents: 'none',
      }}
    />
  )
}
