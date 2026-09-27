import { menuImg, sdImg } from '../assets'
import { ARROW, H, PAGE_W, TILE, W, tileBox } from '../layout'
import { SD_PAGES, type SdFocus } from '../machine'
import { PALETTE } from '../palette'
import { barPath } from './Menu'
import { abs, Img, Pill, Text, type Box } from './parts'

/**
 * PORTING NOTES
 * CFW: Wii Menu (System Menu 4.3U)   Devices: rg35xx
 * Source: closed. `docs/themes/wii-menu/reference/frames/widescreen/sd-card-menu.png` and
 *         `sd-about.png` (the WM4K showcase, 16:9); WM4K's `SD Menu/` buttons.
 * Mode: reproduce
 *
 * Layout:        The Wii Menu's grid and bar, dark: empty glass slots on black, the page number in
 *                the bar's dip and "SD Card Menu" under it, the Wii button left and the help
 *                button right. With no SD card inserted every slot is empty.
 * Focus & selection: The Wii button or the help button; opens on the Wii button.
 * Buttons:       Left / Right between the two buttons. A on Wii goes back to the Wii Menu; A on
 *                the help button opens "About the SD Card Menu". L / SELECT and R / START turn the
 *                twenty pages. B goes back.
 * Transitions:   Fades in over the Wii Menu (283ms, not measured).
 * Notes:         Arranged from 16:9 captures, on the Wii Menu's own 4:3 grid. The About dialog's
 *                text is set in M PLUS 1p; the console sets it in a serif face. Its second page
 *                ("To view this information again...") is the one the first-run introduction ends
 *                with (`WUJeCy6QP8Q`); the port shows it after Next.
 */

function DarkSlot({ box }: { box: Box }) {
  return (
    <div
      style={{
        ...abs(box),
        borderRadius: TILE.radius,
        background: 'linear-gradient(#4a4c4e, #2c2e30 55%, #3a3c3e)',
        boxShadow: 'inset 0 0 0 2px #5d6063, inset 0 2px 0 3px rgba(255,255,255,0.08)',
      }}
    />
  )
}

function Dialog({ page, focus }: { page: 1 | 2; focus: SdFocus }) {
  const panel: Box = { x: 144, y: 54, w: 320, h: 336 }
  return (
    <>
      <div style={{ ...abs({ x: 0, y: 0, w: W, h: H }), background: 'rgba(0,0,0,0.5)' }} />
      <div
        className="wii-dialog"
        style={{ ...abs(panel), background: 'linear-gradient(#f7f7f7, #e8e9ea)', borderRadius: 8, border: '2px solid #c8cbcd', boxSizing: 'border-box' }}
      >
        {page === 1 ? (
          <>
            <Text box={{ x: 20, y: 22, w: panel.w - 40, h: 28 }} size={18} weight={500} color={PALETTE.ink}>
              About the SD Card Menu
            </Text>
            <Text box={{ x: 30, y: 74, w: panel.w - 60, h: 180 }} size={18} weight={500} color={PALETTE.ink} wrap lineHeight={30}>
              On the SD Card Menu, you can temporarily utilize the Wii System Memory to launch a channel stored on an SD Card.
            </Text>
          </>
        ) : (
          <>
            <Img src={sdImg('help-button')} box={{ x: (panel.w - 48) / 2, y: 22, w: 48, h: 48 }} />
            <Text box={{ x: 30, y: 90, w: panel.w - 60, h: 160 }} size={18} weight={500} color={PALETTE.ink} wrap lineHeight={30}>
              To view this information again, go to the SD Card Menu and select the button shown here.
            </Text>
          </>
        )}
        <Pill box={{ x: 14, y: 262, w: 140, h: 50 }} label="Back" focused={focus === 'back'} size={21} />
        <Pill box={{ x: 162, y: 262, w: 140, h: 50 }} label={page === 1 ? 'Next' : 'Close'} focused={focus === 'next' || focus === 'close'} size={21} />
      </div>
    </>
  )
}

export function Sd({ page, dialog, focus }: { page: number; dialog: 0 | 1 | 2; focus: SdFocus }) {
  // This page's slots, and the neighbouring pages' edges where there is a neighbour.
  const slots = Array.from({ length: 12 * 3 }, (_, i) => i).filter((i) => {
    const p = Math.floor(i / 12) - 1
    return page + p >= 0 && page + p < SD_PAGES
  })
  return (
    <div className="wii-sd" style={{ ...abs({ x: 0, y: 0, w: W, h: H }), background: 'linear-gradient(#050505, #1b1c1d)' }}>
      {slots.map((i) => {
        const p = Math.floor(i / 12) - 1
        const b = tileBox(i % 12)
        return <DarkSlot key={i} box={{ ...b, x: b.x + p * PAGE_W }} />
      })}
      {page > 0 ? <Img src={menuImg('arrow-left')} box={{ x: ARROW.leftCx - ARROW.size / 2, y: ARROW.cy - ARROW.size / 2, w: ARROW.size, h: ARROW.size }} /> : null}
      {page < SD_PAGES - 1 ? <Img src={menuImg('arrow-right')} box={{ x: ARROW.rightCx - ARROW.size / 2, y: ARROW.cy - ARROW.size / 2, w: ARROW.size, h: ARROW.size }} /> : null}
      <SdBar page={page} focus={dialog === 0 ? focus : null} />
      {dialog > 0 ? <Dialog page={dialog as 1 | 2} focus={focus} /> : null}
    </div>
  )
}

function SdBar({ page, focus }: { page: number; focus: SdFocus | null }) {
  const button = (cx: number, src: string, on: boolean) => {
    const size = on ? 70 : 64
    return (
      <div
        data-focused={on || undefined}
        style={{
          ...abs({ x: cx - size / 2, y: 385 - size / 2, w: size, h: size }),
          borderRadius: '50%',
          boxShadow: on ? `0 0 0 3px ${PALETTE.cyan}, 0 0 10px ${PALETTE.cyanSoft}` : 'none',
        }}
      >
        <Img src={src} box={{ x: 0, y: 0, w: size, h: size }} />
      </div>
    )
  }
  return (
    <>
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <path d={barPath()} fill={PALETTE.bar} />
        <path d={barPath(false)} fill="none" stroke="#9aa0a5" strokeWidth={2} />
      </svg>
      <Text box={{ x: 0, y: 342, w: W, h: 30 }} size={22} weight={500} color="#555a5e">
        {`${page + 1}/${SD_PAGES}`}
      </Text>
      <Text box={{ x: 0, y: 392, w: W, h: 30 }} size={22} weight={500} color="#7b8084">
        SD Card Menu
      </Text>
      {button(62, sdImg('wii-button'), focus === 'wii')}
      {button(546, sdImg('help-button'), focus === 'help')}
    </>
  )
}
