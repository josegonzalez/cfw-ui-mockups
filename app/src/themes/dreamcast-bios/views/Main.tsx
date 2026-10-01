/**
 * PORTING NOTES
 * CFW: Sega Dreamcast BIOS menu   Devices: dreamcast
 * Source: closed; boot ROM v1.01d for its models, textures, font and strings; recording c69qVhS_WOU
 * Mode: reproduce
 *
 * Layout:        The top bar (62px, light grey) with the ROM's logo left and the clock right; under
 *                it a 2x2 grid of models, each with a rounded pill naming it below and to its right
 *                (`frames/main.png`). Each model is placed by its own transform in the ROM. The sky
 *                shows through everything below the bar.
 * Focus & selection: The focused model plays the ROM's own focus motion for it - the controller and
 *                the clock rock, the memory card turns, the note bobs - and nothing else marks it:
 *                the pills do not change. Default focus Play. No wrap.
 * Buttons:       D-pad moves in the grid; A opens Play (the no-disc box), File, Music or Settings.
 * Transitions:   Opening an item fades the menu out, holds on the sky, and fades the next screen up.
 * Notes:         The models are the ROM's own Ninja chunk models and motions
 *                (`models/MenuModels.tsx`). The pills are drawn flat; the ROM has them as models
 *                too, but they carry the labels, which are the ROM's own strings in its font.
 */
import { CELL, MAIN } from '../layout'
import type { MainItem } from '../machine'
import { MenuModels } from '../models/MenuModels'
import { PALETTE } from '../palette'
import { S } from '../strings'
import { Text, TopBar, abs } from './parts'

const ITEMS = ['play', 'file', 'music', 'settings'] as const

export function MainMenu({ focus, clock }: { focus: MainItem; clock: string }) {
  return (
    <>
      <TopBar clock={clock} />
      {/* The models sit behind the pills, which overlap them (`main.png`, the clock and Settings). */}
      <MenuModels focus={focus} />
      {ITEMS.map((item, i) => {
        const { pill } = MAIN[item]
        const colours = PALETTE.pill[item]
        const focused = i === focus
        return (
          <div key={item} data-item={item} data-focused={focused || undefined}>
            <div
              style={{
                ...abs(pill),
                background: colours.fill,
                border: `4px solid ${colours.rim}`,
                borderRadius: pill.h / 2,
                boxSizing: 'border-box',
              }}
            />
            <Text box={{ x: pill.x, y: pill.y + (pill.h - CELL.h) / 2, w: pill.w, h: CELL.h }} align="center">
              {S.menu[i]!.trim()}
            </Text>
          </div>
        )
      })}
    </>
  )
}
