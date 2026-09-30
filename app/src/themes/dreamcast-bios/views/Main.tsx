/**
 * PORTING NOTES
 * CFW: Sega Dreamcast BIOS menu   Devices: dreamcast
 * Source: closed; boot ROM v1.01d for textures, font and strings; recording c69qVhS_WOU for the rest
 * Mode: reproduce
 *
 * Layout:        The top bar (62px, light grey) with the ROM's logo left and the clock right; under
 *                it a 2x2 grid of models, each with a rounded pill naming it below and to its right
 *                (`frames/main.png`). The sky shows through everything below the bar.
 * Focus & selection: The focused model turns slowly one way and the other; nothing else marks it -
 *                the pills do not change (`frames/main-*.png`). Default focus Play. No wrap.
 * Buttons:       D-pad moves in the grid; A opens Play (the no-disc box), File, Music or Settings.
 * Transitions:   Opening an item fades the menu out, holds on the sky, and fades the next screen up.
 * Notes:         The four models are 3D in the BIOS, and the ROM holds their geometry rather than
 *                textures, so each is a redrawn SVG. The labels are the ROM's own strings.
 */
import { Animated } from '../../../anim/Animated'
import { drawn } from '../assets'
import { CELL, MAIN } from '../layout'
import type { MainItem } from '../machine'
import { ROCK } from '../motion'
import { PALETTE } from '../palette'
import { S } from '../strings'
import { Img, Text, TopBar, abs } from './parts'

const MODEL_OPACITY = 0.82

const ITEMS = [
  { key: 'play', model: 'controller' },
  { key: 'file', model: 'vmu' },
  { key: 'music', model: 'note' },
  { key: 'settings', model: 'alarm' },
] as const

export function MainMenu({ focus, clock }: { focus: MainItem; clock: string }) {
  return (
    <>
      <TopBar clock={clock} />
      {ITEMS.map((item, i) => {
        const { model, pill } = MAIN[item.key]
        const colours = PALETTE.pill[item.key]
        const focused = i === focus
        // The models are a little see-through: the sky shows in them (`main.png`).
        const img = <Img src={drawn(item.model)} box={{ x: 0, y: 0, w: model.w, h: model.h }} style={{ opacity: MODEL_OPACITY }} />
        return (
          <div key={item.key} data-item={item.key} data-focused={focused || undefined}>
            {focused ? (
              <Animated storyboard={ROCK} event="_" style={abs(model)}>
                {img}
              </Animated>
            ) : (
              <div style={abs(model)}>{img}</div>
            )}
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
