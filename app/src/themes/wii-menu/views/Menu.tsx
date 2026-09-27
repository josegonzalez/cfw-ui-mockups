import { useEffect, useState, type ReactNode } from 'react'
import { useScreen } from '../../../device/ScreenContext'
import { useInteractive } from '../../../input/InputProvider'
import { menuImg } from '../assets'
import { BAR, CLOCK_BOX, DATE_Y, H, MAIL_BUTTON, PAGE_W, SD_BUTTON, TILE, W, WII_BUTTON, tileBox } from '../layout'
import { CHANNELS, CLOCK, DATE_LABEL, GRID, PAGES, PER_PAGE } from '../library'
import type { Focus } from '../machine'
import { MOTION } from '../motion'
import { PALETTE } from '../palette'
import { ChannelIcon } from './Channel'
import { abs, Bubble, Clock, Img, motion, PageArrow, Text, type Box } from './parts'

/**
 * PORTING NOTES
 * CFW: Wii Menu (System Menu 4.3U)   Devices: rg35xx
 * Source: closed. Measured from `docs/themes/wii-menu/reference/frames/menu.png`, `menu-hover.png`
 *         and `menu-page-2.png` (a 640x480 capture-card recording), with WM4K's `Wii Menu/` textures.
 * Mode: reproduce
 *
 * Layout:        Four pages of a 4x3 grid of 120x90 slots on a 128x96 pitch, starting at (53, 37).
 *                The next page's first column shows at the right edge and the previous page's
 *                last at the left. Below, the bar: Wii button, SD Card Menu button, the
 *                seven-segment clock in the bar's dip with the date under it, the Message Board
 *                button.
 * Focus & selection: The pointer's highlight: a cyan outline on the slot and a name bubble below
 *                it. The + Control Pad moves it slot to slot; past the last column it turns the
 *                page, below the last row it drops into the bar. Starts on the Disc Channel.
 * Buttons:       A opens a channel's preview, or the bar button's screen. L / SELECT and R / START
 *                are the Wii Remote's - and +, turning the page. MENU is HOME.
 * Transitions:   A page turn slides the grid 512px in 333ms, decelerating (`v43` 137.57s). The
 *                highlight's rim eases in over 100ms and its name bubble appears 367ms after it
 *                lands. A bar button grows 8% under the highlight in 50ms, its rim unchanged.
 *                After boot "Wii Menu" stands in the clock's place for 3.67s, then cross-fades to
 *                the clock (200ms); the clock's colon blinks, a second on and a second off.
 *                Opening Wii Options or the SD Card Menu fades the menu to black (333ms). The
 *                page arrows bob inward and back, the channel icons loop (see `Channel`), and an
 *                empty slot's static flickers through WM4K's four frames - all `v43`.
 * Notes:         The pointer is not drawn - a handheld has none - so the highlight stands for it.
 *                An empty slot's static is drawn over a flat grey, the same as the captures show.
 */

/** An empty slot's static: WM4K's four frames, cycling while the live build runs. */
function Static({ box }: { box: Box }) {
  const live = useInteractive()
  const { animate } = useScreen()
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    if (!live || !animate) return
    const id = setInterval(() => setFrame((f) => (f + 1) % 4), MOTION.staticFrame)
    return () => clearInterval(id)
  }, [live, animate])
  return <Img src={menuImg(`static-${frame}`)} box={box} style={{ opacity: 0.1 }} />
}

function Slot({ slot, box, focused }: { slot: number; box: Box; focused: boolean }) {
  const { animate } = useScreen()
  const id = GRID[slot]
  const inner: Box = { x: 0, y: 0, w: box.w, h: box.h }
  // The highlight eases in and out rather than switching, so its glow and cyan rim are layers of
  // their own whose opacity moves.
  const ease = motion(animate, [{ property: 'opacity', duration: MOTION.highlight, easing: 'easeOut' }])
  return (
    <>
      <div
        style={{
          ...abs(box),
          borderRadius: TILE.radius,
          boxShadow: `0 0 6px ${PALETTE.cyanSoft}`,
          opacity: focused ? 1 : 0,
          transition: ease,
        }}
      />
      <div
        className="wii-slot"
        data-slot={slot}
        data-focused={focused || undefined}
        style={{
          ...abs(box),
          borderRadius: TILE.radius,
          overflow: 'hidden',
          background: id ? '#ffffff' : '#eeefef',
        }}
      >
        {id ? <ChannelIcon id={id} box={inner} /> : <Static box={inner} />}
        {/* The rims are drawn over the art, so a full-bleed icon still reads as a slot. */}
        <div style={{ ...abs(inner), borderRadius: TILE.radius, boxShadow: `inset 0 0 0 2px ${PALETTE.tileEdge}` }} />
        <div
          style={{
            ...abs(inner),
            borderRadius: TILE.radius,
            boxShadow: `inset 0 0 0 3px ${PALETTE.cyan}`,
            opacity: focused ? 1 : 0,
            transition: ease,
          }}
        />
      </div>
    </>
  )
}

/**
 * The bar's top edge: flat under the buttons, dipping in the middle round the clock. `closed` runs
 * it round the bottom of the screen, for the fill; the cyan line follows only the edge itself.
 */
export function barPath(closed = true): string {
  const { top, dip, dipFrom, dipTo, curve } = BAR
  const edge = [
    `M 0 ${top}`,
    `L ${dipFrom - curve} ${top}`,
    `C ${dipFrom - curve / 3} ${top}, ${dipFrom - curve / 3} ${dip}, ${dipFrom + curve / 2} ${dip}`,
    `L ${dipTo - curve / 2} ${dip}`,
    `C ${dipTo + curve / 3} ${dip}, ${dipTo + curve / 3} ${top}, ${dipTo + curve} ${top}`,
    `L ${W} ${top}`,
  ]
  return (closed ? [...edge, `L ${W} ${H}`, `L 0 ${H}`, 'Z'] : edge).join(' ')
}

/** A round bar button. Under the pointer it grows by 8%, its cyan rim unchanged (`v43` 280.9s). */
function RoundButton({ cx, cy, d, focused, children }: { cx: number; cy: number; d: number; focused: boolean; children: ReactNode }) {
  const { animate } = useScreen()
  return (
    <div
      className="wii-round"
      data-focused={focused || undefined}
      style={{
        ...abs({ x: cx - d / 2, y: cy - d / 2, w: d, h: d }),
        borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 35%, #ffffff 0%, #eef0f1 55%, #d6dadd 100%)',
        border: `3px solid ${PALETTE.cyan}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        boxSizing: 'border-box',
        transform: focused ? `scale(${MOTION.hoverScale})` : 'none',
        transition: motion(animate, [{ property: 'transform', duration: MOTION.hover, easing: 'easeOut' }]),
      }}
    >
      {children}
    </div>
  )
}

/**
 * The bar. Just after boot `label` puts "Wii Menu" in the clock's place, cyan; it cross-fades to the
 * clock after its hold (`v43` 9.58-13.45s).
 */
export function Bar({ focus, label = false }: { focus: Focus; label?: boolean }) {
  const { animate } = useScreen()
  const swap = motion(animate, [{ property: 'opacity', duration: MOTION.bootLabel.fade, easing: 'linear' }])
  const on = (item: 'wii' | 'sd' | 'mail') => focus.area === 'bar' && focus.item === item
  const wiiInner = WII_BUTTON.d - 12
  return (
    <>
      <svg className="wii-bar" width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <defs>
          <linearGradient id="wii-bar-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset={BAR.top / H} stopColor={PALETTE.bar} />
            <stop offset="1" stopColor={PALETTE.barLow} />
          </linearGradient>
        </defs>
        <path d={barPath()} fill="url(#wii-bar-fill)" />
        <path d={barPath(false)} fill="none" stroke={PALETTE.cyan} strokeWidth={3} />
      </svg>
      <RoundButton cx={WII_BUTTON.cx} cy={WII_BUTTON.cy} d={WII_BUTTON.d} focused={on('wii')}>
        <Img src={menuImg('wii-button')} box={{ x: 3, y: 3, w: wiiInner, h: wiiInner }} style={{ opacity: 0.7 }} />
      </RoundButton>
      <Img src={menuImg(on('sd') ? 'sd-lit' : 'sd')} box={SD_BUTTON} />
      <RoundButton cx={MAIL_BUTTON.cx} cy={MAIL_BUTTON.cy} d={MAIL_BUTTON.d} focused={on('mail')}>
        <Img src={menuImg('mail')} box={{ x: (MAIL_BUTTON.d - 6 - 44) / 2, y: 20, w: 44, h: 30 }} />
      </RoundButton>
      <div style={{ ...abs({ x: 0, y: 0, w: W, h: H }), opacity: label ? 0 : 1, transition: swap }}>
        <Clock cx={CLOCK_BOX.cx} cy={CLOCK_BOX.cy} hour={CLOCK.hour} minute={CLOCK.minute} pm={CLOCK.pm} digit={CLOCK_BOX.digit} />
      </div>
      <div style={{ ...abs({ x: 0, y: 0, w: W, h: H }), opacity: label ? 1 : 0, transition: swap }}>
        <Text box={{ x: 0, y: CLOCK_BOX.cy - 18, w: W, h: 36 }} size={28} weight={500} color={PALETTE.cyan}>
          Wii Menu
        </Text>
      </div>
      <Text box={{ x: 0, y: DATE_Y, w: W, h: 34 }} size={30} weight={700} color={PALETTE.clock}>
        {DATE_LABEL}
      </Text>
      {on('wii') ? <Bubble key="wii" x={WII_BUTTON.cx - 12} y={WII_BUTTON.cy - WII_BUTTON.d / 2 - 44} label="Wii Options" /> : null}
      {on('sd') ? <Bubble key="sd" x={SD_BUTTON.x - 20} y={SD_BUTTON.y - 46} label="SD Card Menu" /> : null}
      {on('mail') ? <Bubble key="mail" x={MAIL_BUTTON.cx - 190} y={MAIL_BUTTON.cy - MAIL_BUTTON.d / 2 - 44} label="Wii Message Board" /> : null}
    </>
  )
}

/** The Wii Menu: the grid strip, its arrows, and the bar. */
/**
 * The Wii Menu. `label` is the boot label (see `Bar`); `leaving` fades the menu to black as it
 * opens Wii Options or the SD Card Menu.
 */
export function Menu({ page, focus, label, leaving }: { page: number; focus: Focus; label: boolean; leaving: boolean }) {
  const { animate } = useScreen()
  const focusedSlot = focus.area === 'grid' ? page * PER_PAGE + focus.slot : -1
  // Every page is laid out side by side; the strip slides so the current page is in place. Slots
  // more than one page away are never on screen, so only the neighbours are drawn.
  const slots = GRID.map((_, i) => i).filter((i) => Math.abs(Math.floor(i / PER_PAGE) - page) <= 1)
  const bubbleAt = focus.area === 'grid' ? tileBox(focus.slot) : null
  return (
    <div
      className="wii-menu-screen"
      style={{
        ...abs({ x: 0, y: 0, w: W, h: H }),
        background: `linear-gradient(${PALETTE.ground} 60%, ${PALETTE.groundLow})`,
        opacity: leaving ? 0 : 1,
        transition: motion(animate, [{ property: 'opacity', duration: MOTION.menuOut, easing: 'linear' }]),
      }}
    >
      <div
        className="wii-strip"
        data-page={page}
        style={{
          ...abs({ x: 0, y: 0, w: W, h: H }),
          transform: `translateX(${-page * PAGE_W}px)`,
          transition: motion(animate, [{ property: 'transform', duration: MOTION.pageTurn, easing: 'easeOutCubic' }]),
        }}
      >
        {slots.map((i) => {
          const p = Math.floor(i / PER_PAGE)
          const b = tileBox(i % PER_PAGE)
          return <Slot key={i} slot={i} box={{ ...b, x: b.x + p * PAGE_W }} focused={i === focusedSlot} />
        })}
      </div>
      {page > 0 ? <PageArrow side="left" /> : null}
      {page < PAGES - 1 ? <PageArrow side="right" /> : null}
      <Bar focus={focus} label={label} />
      {bubbleAt && GRID[focusedSlot] ? <Bubble key={focusedSlot} x={bubbleAt.x + 10} y={bubbleAt.y + bubbleAt.h + 8} label={CHANNELS[GRID[focusedSlot]!].title} /> : null}
    </div>
  )
}
