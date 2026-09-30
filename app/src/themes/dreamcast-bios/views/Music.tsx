/**
 * PORTING NOTES
 * CFW: Sega Dreamcast BIOS menu   Devices: dreamcast
 * Source: closed; every texture on this screen is the boot ROM's own; layout from recording
 *         c69qVhS_WOU (43-52s)
 * Mode: reproduce
 *
 * Layout:        TRACK and TIME on cyan lozenges top left and right, each over its readout in large
 *                grey figures; BACK and five transport buttons along the bottom (`frames/music-empty.png`).
 * Focus & selection: The focused lozenge turns green. Left and right move along the row, BACK
 *                included; no wrap. Default focus play/pause.
 * Buttons:       A presses the focused button; A on BACK, or B, returns to the main menu.
 * Transitions:   Fades like any screen.
 * Notes:         The port has no disc in, as the recording's first visit does: the readouts stay
 *                00 and 00:00 and the transport has nothing to play. Repeat still cycles off, one
 *                track, all tracks, each with the ROM's icon for it. The disc textures the ROM
 *                carries, and the visualiser the recording shows with a disc in, are not drawn.
 */
import { bios } from '../assets'
import { BACK, CELL, MUSIC } from '../layout'
import { PALETTE } from '../palette'
import { BackButton, Img, Text, abs } from './parts'

const BUTTONS = ['prev', 'stop', 'play-pause', 'next'] as const
const REPEAT = ['repeat', 'repeat-one', 'repeat-all'] as const

function Lozenge({ cx, cy, w, h, focused }: { cx: number; cy: number; w: number; h: number; focused?: boolean }) {
  const edge = focused ? PALETTE.lozengeFocus : PALETTE.lozenge
  return (
    <div
      style={{
        ...abs({ x: cx - w / 2, y: cy - h / 2, w, h }),
        borderRadius: '50%',
        background: `radial-gradient(ellipse at center, ${PALETTE.lozengeCore} 0%, ${edge} 80%, ${edge} 100%)`,
      }}
    />
  )
}

/**
 * A readout's figures: the system font drawn twice the size in grey, its halo in the same grey so
 * the strokes come out heavy. Each figure is placed on its own `pitch`, because TRACK's two sit
 * further apart than TIME's five: "00" spans 72 pixels and "00:00" 142 (`music-empty.png`).
 */
function Readout({ cx, text, pitch }: { cx: number; text: string; pitch: number }) {
  const h = CELL.h * 2
  const x0 = cx - ((text.length - 1) * pitch) / 2
  return (
    <>
      {[...text].map((ch, i) => (
        <Text
          key={i}
          box={{ x: x0 + i * pitch - pitch / 2, y: MUSIC.digits.y, w: pitch, h }}
          align="center"
          scale={2}
          advance={MUSIC.digits.advance}
          fill={PALETTE.digits}
          edge={PALETTE.digits}
        >
          {ch}
        </Text>
      ))}
    </>
  )
}

export function Music({ focus, repeat }: { focus: number; repeat: 0 | 1 | 2 }) {
  const { track, time, lozenge, buttons } = MUSIC
  return (
    <>
      {[
        { at: track, label: 'label-track', value: '00', pitch: MUSIC.digits.trackPitch },
        { at: time, label: 'label-time', value: '00:00', pitch: MUSIC.digits.advance },
      ].map(({ at, label, value, pitch }) => (
        <div key={label}>
          <Lozenge cx={at.cx} cy={at.cy} w={lozenge.w} h={lozenge.h} />
          <Img src={bios(label)} box={{ x: at.cx - 64, y: at.cy - 8, w: 128, h: 16 }} />
          <Readout cx={at.cx} text={value} pitch={pitch} />
        </div>
      ))}
      <BackButton {...BACK.music} focused={focus === 0} />
      {[...BUTTONS, REPEAT[repeat]].map((name, i) => {
        const cx = buttons.cx[i]!
        const focused = focus === i + 1
        return (
          <div key={i} data-button={i === 4 ? 'repeat' : name} data-focused={focused || undefined}>
            <Lozenge cx={cx} cy={buttons.cy} w={buttons.w} h={buttons.h} focused={focused} />
            <Img src={bios(name)} box={{ x: cx - 16, y: buttons.cy - 16, w: 32, h: 32 }} />
          </div>
        )
      })}
    </>
  )
}
