/**
 * PORTING NOTES
 * CFW: Sega Dreamcast BIOS menu   Devices: dreamcast
 * Source: closed; every texture on this screen is the boot ROM's own, and so is the disc's model;
 *         layout from recording c69qVhS_WOU (43-52s; with a disc, 260-275s)
 * Mode: reproduce
 *
 * Layout:        TRACK and TIME on cyan lozenges top left and right, each over its readout in large
 *                grey figures; BACK and five transport buttons along the bottom (`frames/music-empty.png`).
 * Focus & selection: The focused lozenge turns green. Left and right move along the row, BACK
 *                included; no wrap. Default focus play/pause.
 * Buttons:       A presses the focused button; A on BACK, or B, returns to the main menu. With a
 *                disc in, play/pause plays and pauses, stop stops, previous and next change track,
 *                and repeat cycles off, one track, all tracks; with none, only repeat does anything.
 * Transitions:   Fades like any screen. A disc stands up and turns while stopped, and tips over to
 *                lie back and spin while it plays (`models/Disc.tsx`).
 * Notes:         Stopped, the readouts show the disc's track count and total length (275s);
 *                playing, the track and its time, counting up. With no disc they read 00 and
 *                00:00. The disc is the ROM's own model, with the ROM's red label - an audio CD
 *                has none of its own, and which label the BIOS gives one is not in the recording.
 *                The visualiser the recording shows behind a playing disc is not drawn.
 */
import { bios } from '../assets'
import { BACK, CELL, MUSIC } from '../layout'
import { AUDIO_CD, AUDIO_CD_TOTAL, formatTime } from '../library'
import type { Player } from '../machine'
import { Disc } from '../models/Disc'
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

/** What the readouts show: the disc's count and length while stopped, the track and its time while playing. */
function readouts(p: Player): [string, string] {
  if (!p.disc) return ['00', '00:00']
  if (p.state === 'stopped') return [String(AUDIO_CD.length).padStart(2, '0'), formatTime(AUDIO_CD_TOTAL)]
  return [String(p.track).padStart(2, '0'), formatTime(p.elapsed)]
}

export function Music({ focus, repeat, player }: { focus: number; repeat: 0 | 1 | 2; player: Player }) {
  const [trackText, timeText] = readouts(player)
  const { track, time, lozenge, buttons } = MUSIC
  return (
    <>
      {[
        { at: track, label: 'label-track', value: trackText, pitch: MUSIC.digits.trackPitch },
        { at: time, label: 'label-time', value: timeText, pitch: MUSIC.digits.advance },
      ].map(({ at, label, value, pitch }) => (
        <div key={label}>
          <Lozenge cx={at.cx} cy={at.cy} w={lozenge.w} h={lozenge.h} />
          <Img src={bios(label)} box={{ x: at.cx - 64, y: at.cy - 8, w: 128, h: 16 }} />
          <Readout cx={at.cx} text={value} pitch={pitch} />
        </div>
      ))}
      {/* The disc is drawn over the readouts, as the recording's stands over TIME (275s). */}
      {player.disc ? <Disc state={player.state} /> : null}
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
