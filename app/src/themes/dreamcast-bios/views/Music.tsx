/**
 * PORTING NOTES
 * CFW: Sega Dreamcast BIOS menu   Devices: dreamcast
 * Source: closed; everything on this screen is the boot ROM's own models and textures; layout from
 *         recording c69qVhS_WOU (43-52s; with a disc, 260-275s)
 * Mode: reproduce
 *
 * Layout:        TRACK and TIME on the ROM's lozenge models top left and right, each over its
 *                readout in the ROM's 3D figures; BACK and the five transport buttons along the
 *                bottom (`frames/music-empty.png`), each placed where the frames put it
 *                (`models/MusicModels.tsx`, `layout.ts`).
 * Focus & selection: The focused button plays its own motion from the ROM and its body turns green;
 *                BACK focused gains its red swirl and a blinking yellow ring. Left and right move
 *                along the row, BACK included; no wrap. Default focus play/pause.
 * Buttons:       A presses the focused button; A on BACK, or B, returns to the main menu. With a
 *                disc in, play/pause plays and pauses, stop stops, previous and next change track,
 *                and repeat cycles off, one track, all tracks; with none, only repeat does anything.
 * Transitions:   Fades like any screen. A disc stands up and turns while stopped, and tips over to
 *                lie back and spin while it plays (`models/Disc.tsx`).
 * Notes:         Stopped, the readouts show the disc's track count and total length (275s);
 *                playing, the track and its time, counting up. With no disc they read 00 and
 *                00:00. The disc is the ROM's own model, with the ROM's red label - an audio CD
 *                has none of its own, and which label the BIOS gives one is not in the recording.
 *                In the hidden 3D mode a playing disc has the visualiser behind it
 *                (`background/Visualizer.tsx`), and the water reflects the disc.
 */
import { AUDIO_CD, AUDIO_CD_TOTAL, formatTime } from '../library'
import type { Player } from '../machine'
import { Visualizer } from '../background/Visualizer'
import { Disc } from '../models/Disc'
import { MusicModels } from '../models/MusicModels'
import { RealModeView } from './parts'

/** What the readouts show: the disc's count and length while stopped, the track and its time while playing. */
function readouts(p: Player): [string, string] {
  if (!p.disc) return ['00', '00:00']
  if (p.state === 'stopped') return [String(AUDIO_CD.length).padStart(2, '0'), formatTime(AUDIO_CD_TOTAL)]
  return [String(p.track).padStart(2, '0'), formatTime(p.elapsed)]
}

export function Music({ focus, repeat, player, realMode }: { focus: number; repeat: 0 | 1 | 2; player: Player; realMode: boolean }) {
  const [track, time] = readouts(player)
  return (
    <>
      {/* The hidden 3D mode's visualiser, behind everything and over the whole screen, while a disc plays. */}
      {realMode && player.state === 'playing' ? <Visualizer elapsed={player.elapsed} /> : null}
      <RealModeView on={realMode}>
        <div data-focus={focus} data-repeat={repeat}>
          <MusicModels focus={focus} repeat={repeat} track={track} time={time} reflect={realMode} />
        </div>
        {/* The disc is drawn over the readouts, as the recording's stands over TIME (275s). */}
        {player.disc ? <Disc state={player.state} reflect={realMode} /> : null}
      </RealModeView>
    </>
  )
}
