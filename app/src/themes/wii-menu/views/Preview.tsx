import type { ReactNode } from 'react'
import { Animated } from '../../../anim/Animated'
import type { StoryboardMap } from '../../../anim/types'
import { useScreen } from '../../../device/ScreenContext'
import { H, PANEL, PREVIEW_BUTTONS, W, tileBox } from '../layout'
import { CHANNELS, GRID, PER_PAGE } from '../library'
import { zoomedIn, type Zoom } from '../machine'
import { MOTION } from '../motion'
import { PALETTE } from '../palette'
import { ChannelBanner, type Reveal } from './Channel'
import { abs, motion, PageArrow, Pill } from './parts'

/**
 * PORTING NOTES
 * CFW: Wii Menu (System Menu 4.3U)   Devices: rg35xx
 * Source: closed. Measured from `docs/themes/wii-menu/reference/frames/preview-*.png`; motion from
 *         `9iT7IgLAgPc`, a 60fps recording of 4.3 (`v43` in the source notes).
 * Mode: reproduce
 *
 * Layout:        A rounded panel at (12, 8), 585x439, on black: the channel's banner above, and a
 *                grey band from y 340 holding two 237x63 buttons, Wii Menu and Start. The page
 *                arrows sit over the banner's edges.
 * Focus & selection: Wii Menu or Start; opens on Wii Menu. The Disc Channel's Start is disabled
 *                with no disc, and cannot be focused.
 * Buttons:       Left / Right move between the buttons. A presses the focused one; B is Wii Menu.
 *                L / SELECT and R / START are - and +, stepping to the previous or next channel.
 *                MENU is HOME.
 * Transitions:   The panel grows out of the channel's slot, 417ms easing in and out, while the
 *                grid behind swells 1.5x towards the slot and darkens to black (400ms). The band
 *                and its buttons come with the panel; the banner's content fades up once it has
 *                landed (333ms). Wii Menu shrinks the panel, banner and all, into the slot of the
 *                channel now showing (333ms), the grid unswelling and brightening from 167ms in
 *                (300ms). Stepping with - or + shows the next banner's background at once and
 *                fades its content up after 333ms (200ms). The page arrows bob inward and back.
 * Notes:         The arrows are pointer targets on the Wii; here - and + do their job.
 */

/** The banner's content after a zoom in, and after a step: stable, so re-rendering never restarts them. */
const ZOOM_REVEAL: Reveal = { delay: MOTION.zoomIn, duration: MOTION.zoomContent }
const STEP_REVEAL: Reveal = { delay: MOTION.step.delay, duration: MOTION.step.duration }

/** Where the panel starts and ends its zoom: the slot, as a transform of the full panel. */
function fromSlot(slot: number) {
  const b = tileBox(slot % PER_PAGE)
  const sx = b.w / PANEL.w
  const sy = b.h / PANEL.h
  return `translate(${b.x - PANEL.x}px, ${b.y - PANEL.y}px) scale(${sx}, ${sy})`
}

export function Preview({ slot, focus, zoom, stepped }: { slot: number; focus: 'menu' | 'start'; zoom: Zoom; stepped: boolean }) {
  const { animate } = useScreen()
  const id = GRID[slot]!
  const open = zoomedIn(zoom)
  const zoomMotion = motion(animate, [
    { property: 'transform', duration: open ? MOTION.zoomIn : MOTION.zoomOut, easing: 'easeInOutCubic' },
  ])
  // The arrows come once the panel has landed, and go as soon as it starts to shrink.
  const arrows = motion(animate, [
    { property: 'opacity', duration: MOTION.zoomContent, easing: 'linear', delay: open ? MOTION.zoomIn : 0 },
  ])
  const band = PANEL.h - PANEL.split
  return (
    <div className="wii-preview" data-channel={id} style={{ ...abs({ x: 0, y: 0, w: W, h: H }) }}>
      <div
        className="wii-panel"
        style={{
          ...abs(PANEL),
          borderRadius: PANEL.radius,
          overflow: 'hidden',
          background: '#ffffff',
          transformOrigin: '0 0',
          transform: open ? 'none' : fromSlot(slot),
          transition: zoomMotion,
          boxShadow: '0 0 0 2px #d8dcdf',
        }}
      >
        <div style={abs({ x: 0, y: 0, w: PANEL.w, h: PANEL.h })}>
          {/* Keyed by slot: a new channel's banner comes up afresh. */}
          <ChannelBanner key={slot} id={id} reveal={stepped ? STEP_REVEAL : ZOOM_REVEAL} />
          <div
            style={{
              ...abs({ x: 0, y: PANEL.split, w: PANEL.w, h: band }),
              background: 'linear-gradient(#f3f4f4, #e2e4e5 30%, #d5d8da)',
              borderTop: '2px solid #cfd3d6',
            }}
          />
          <Pill
            box={{ x: PREVIEW_BUTTONS.left - PANEL.x, y: PREVIEW_BUTTONS.y - PANEL.y, w: PREVIEW_BUTTONS.w, h: PREVIEW_BUTTONS.h }}
            label="Wii Menu"
            focused={focus === 'menu'}
            size={27}
          />
          <Pill
            box={{ x: PREVIEW_BUTTONS.right - PANEL.x, y: PREVIEW_BUTTONS.y - PANEL.y, w: PREVIEW_BUTTONS.w, h: PREVIEW_BUTTONS.h }}
            label="Start"
            focused={focus === 'start'}
            disabled={!CHANNELS[id].startable}
            size={27}
          />
        </div>
      </div>
      <div style={{ opacity: open ? 1 : 0, transition: arrows }}>
        <PageArrow side="left" />
        <PageArrow side="right" />
      </div>
    </div>
  )
}

/**
 * The black over the grid: it darkens as the panel grows and is black once the preview is open
 * (`frames/zoom-in-*.png`); on the way back it clears from 167ms in, as the panel nears its slot.
 */
export function PreviewBackdrop({ zoom }: { zoom: Zoom }) {
  const { animate } = useScreen()
  const open = zoomedIn(zoom)
  return (
    <div
      className="wii-backdrop"
      style={{
        ...abs({ x: 0, y: 0, w: W, h: H }),
        background: PALETTE.black,
        opacity: open ? 1 : 0,
        transition: motion(animate, [
          open
            ? { property: 'opacity', duration: MOTION.zoomGrid, easing: 'linear' }
            : { property: 'opacity', duration: MOTION.zoomGridOut.duration, easing: 'linear', delay: MOTION.zoomGridOut.delay },
        ]),
      }}
    />
  )
}

/** The grid shrinking back to size about the slot as the preview closes. */
const UNSWELL: StoryboardMap = {
  open: {
    animations: [
      { property: 'scale', from: MOTION.zoomSwell, begin: MOTION.zoomGridOut.delay, duration: MOTION.zoomGridOut.duration, mode: 'easeOutCubic' },
    ],
  },
}

/**
 * The grid under a moving preview. It swells towards the slot as the panel grows out of it, and
 * shrinks back as the panel returns. It is only there while the zoom moves: an open preview has
 * nothing under its black.
 */
export function GridSwell({ slot, zoom, children }: { slot: number; zoom: Zoom; children: ReactNode }) {
  const { animate } = useScreen()
  const b = tileBox(slot % PER_PAGE)
  const origin = `${b.x + b.w / 2}px ${b.y + b.h / 2}px`
  if (zoom === 'leave') {
    return (
      <Animated storyboard={UNSWELL} event="open" style={{ ...abs({ x: 0, y: 0, w: W, h: H }), transformOrigin: origin }}>
        {children}
      </Animated>
    )
  }
  return (
    <div
      style={{
        ...abs({ x: 0, y: 0, w: W, h: H }),
        transformOrigin: origin,
        transform: zoom === 'opening' ? `scale(${MOTION.zoomSwell})` : 'none',
        transition: motion(animate, [{ property: 'transform', duration: MOTION.zoomGrid, easing: 'easeIn' }]),
      }}
    >
      {children}
    </div>
  )
}

