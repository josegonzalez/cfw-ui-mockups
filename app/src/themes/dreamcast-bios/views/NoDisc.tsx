/**
 * PORTING NOTES
 * CFW: Sega Dreamcast BIOS menu   Devices: dreamcast
 * Source: closed; strings from boot ROM v1.01d; layout from recording c69qVhS_WOU (36.65-40s, 134s)
 * Mode: reproduce
 *
 * Layout:        A message box: its message along the top and a single blob under it with no label,
 *                in a rim of the screen's colour - orange for Play's "Please insert game disc.",
 *                green for File's "File was deleted.", magenta for Settings' "Set all memory
 *                cards to / Date/Time of main console.", which opens over the box that asked.
 * Focus & selection: The blob is the only thing to focus, and it blinks.
 * Buttons:       A or B dismisses it: back to the main menu for Play, to the list for File, and
 *                to Settings, past the box under it, for the memory-card clock.
 * Transitions:   Play fades the menu out and this up, as any screen. The File box opens over the
 *                list at once.
 * Notes:         With a disc in, Play checks it ("Please wait / while disc is being checked.") and
 *                boots it; the port has no disc, which is the recording's first press of Play.
 */
import { DIALOG, FILES, type Box } from '../layout'
import { PALETTE } from '../palette'
import { S } from '../strings'
import { Blob, DialogBox, Lines } from './parts'

interface Message {
  readonly box: Box
  readonly title: readonly number[]
  readonly blob: { readonly cx: number; readonly cy: number }
}

function MessageBox({ at, rim, lines }: { at: Message; rim: string; lines: readonly string[] }) {
  const { box, title, blob } = at
  return (
    <DialogBox box={box} rim={rim}>
      <Lines x={0} cy={title[0]! - box.y} w={box.w} pitch={title.length > 1 ? title[1]! - title[0]! : 0} lines={lines} />
      <Blob cx={blob.cx - box.x} cy={blob.cy - box.y} focused />
    </DialogBox>
  )
}

export function NoDisc() {
  return <MessageBox at={DIALOG.noDisc} rim={PALETTE.rimPlay} lines={[S.insertDisc]} />
}

export function Deleted() {
  return <MessageBox at={FILES.deleted} rim={PALETTE.rimFile} lines={[S.fileDeleted]} />
}

export function CardsSet() {
  return <MessageBox at={DIALOG.cardsSet} rim={PALETTE.rimSettings} lines={[S.cardsSet, S.cardsSet2]} />
}
