import { useScreen } from '../../../device/ScreenContext'
import { menuImg } from '../assets'
import { ARROW, H, PANEL, PREVIEW_BUTTONS, W, tileBox } from '../layout'
import { CHANNELS, GRID, PER_PAGE } from '../library'
import { zoomedIn, type Zoom } from '../machine'
import { MOTION } from '../motion'
import { PALETTE } from '../palette'
import { ChannelBanner } from './Channel'
import { abs, Img, motion, Pill } from './parts'

/**
 * PORTING NOTES
 * CFW: Wii Menu (System Menu 4.3U)   Devices: rg35xx
 * Source: closed. Measured from `docs/themes/wii-menu/reference/frames/preview-*.png` and the
 *         zoom frames `zoom-in-a.png` and `zoom-in-b.png`.
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
 * Transitions:   The panel grows out of the channel's slot while the grid behind it fades to
 *                black (500ms); then the banner and buttons fade up (267ms). Wii Menu reverses
 *                it into the slot of the channel now showing.
 * Notes:         The arrows are pointer targets on the Wii; here - and + do their job.
 */

/** Where the panel starts and ends its zoom: the slot, as a transform of the full panel. */
function fromSlot(slot: number) {
  const b = tileBox(slot % PER_PAGE)
  const sx = b.w / PANEL.w
  const sy = b.h / PANEL.h
  return `translate(${b.x - PANEL.x}px, ${b.y - PANEL.y}px) scale(${sx}, ${sy})`
}

export function Preview({ slot, focus, zoom }: { slot: number; focus: 'menu' | 'start'; zoom: Zoom }) {
  const { animate } = useScreen()
  const id = GRID[slot]!
  const open = zoomedIn(zoom)
  const zoomMotion = motion(animate, [{ property: 'transform', duration: MOTION.zoom, easing: 'easeOutCubic' }])
  const content = motion(animate, [
    { property: 'opacity', duration: MOTION.zoomContent, easing: 'linear', delay: open ? MOTION.zoom : 0 },
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
        <div style={{ ...abs({ x: 0, y: 0, w: PANEL.w, h: PANEL.h }), opacity: open ? 1 : 0, transition: content }}>
          <ChannelBanner id={id} />
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
      <div style={{ opacity: open ? 1 : 0, transition: content }}>
        <Img src={menuImg('arrow-left')} box={{ x: ARROW.leftCx - ARROW.size / 2, y: ARROW.cy - ARROW.size / 2, w: ARROW.size, h: ARROW.size }} />
        <Img src={menuImg('arrow-right')} box={{ x: ARROW.rightCx - ARROW.size / 2, y: ARROW.cy - ARROW.size / 2, w: ARROW.size, h: ARROW.size }} />
      </div>
    </div>
  )
}

/**
 * The grid behind the preview fades to black as the panel grows, and is black once the preview is
 * open (`frames/zoom-in-*.png`). The real grid also swells towards the slot as it darkens; the port
 * keeps it still.
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
        transition: motion(animate, [{ property: 'opacity', duration: MOTION.zoom, easing: 'easeOutCubic' }]),
      }}
    />
  )
}

