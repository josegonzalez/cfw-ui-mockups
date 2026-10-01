import { useCallback } from 'react'
import { MUSIC } from '../layout'
import { ModelScene } from './MenuModels'
import { poseAt, type Item, type ModelData, type View } from './scene'

const files = import.meta.glob<ModelData>('../assets/models/music/*.json', { eager: true, import: 'default' })

/** A model's nodes, by the name `extract-assets.py` gives it: `<name>-<node>` for each node with geometry. */
function nodes(name: string): ModelData[] {
  const found = Object.entries(files)
    .filter(([path]) => new RegExp(`/${name}-\\d+\\.json$`).test(path))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, m]) => m)
  if (!found.length) throw new Error(`Dreamcast BIOS model missing: ${name}`)
  return found
}

const DIGITS = Array.from({ length: 10 }, (_, d) => nodes(`digit-${d}`))
const COLON = nodes('digit-colon')
const LOZENGES = { track: nodes('lozenge-track'), time: nodes('lozenge-time') }
/** Left to right, as `MUSIC.buttons` places them. */
const BUTTONS = ['prev', 'stop', 'play-pause', 'next', 'repeat'].map((b) => nodes(`button-${b}`))
/** BACK's frame and its texture; then the red swirl and the yellow ring it gains while focused. */
const [BACK_FRAME, BACK_SWIRL, BACK_RING] = nodes('back')

/** The repeat button's icon by the repeat mode: off, one track, all tracks. */
const REPEAT_ICON = ['repeat', 'repeat-one', 'repeat-all'] as const

/**
 * The focused button's body turns green and nearly solid, a material the BIOS sets in code over the
 * model's own (#02b2b2 at 89 alpha): its cloud texture still shows through (`frames/music-disc.png`,
 * the focused play/pause, against the others).
 */
const FOCUS = { tint: [0.55, 1, 0.65] as const, alpha: 2.4 }

/** BACK's yellow ring blinks while it is focused: 0.27 s on, 0.27 s off (43-52s). */
const RING_BLINK = 0.27

const view = (x: number, y: number, ppu: number): View => ({ ppu, ox: x, oy: y })

function at(models: readonly ModelData[], v: View, t: number | null = null, extra: Partial<Item> = {}): Item[] {
  return models.map((m) => ({ model: m, pose: poseAt(m, t), view: v, alpha: 1, ...extra }))
}

/** A readout's figures, each on its own slot: a character per slot, from the right where it is right-aligned. */
function figures(text: string, slots: readonly number[], rightAligned = false): Item[] {
  const chars = [...text]
  const xs = rightAligned && chars.length > slots.length ? [slots[0]! - (slots[1]! - slots[0]!), ...slots] : slots
  return chars.flatMap((ch, i) => at(DIGITS[Number(ch)] ?? [], view(xs[i]!, MUSIC.digits.y, MUSIC.digits.ppu)))
}

export interface MusicModelsProps {
  /** BACK, then the five buttons left to right. */
  readonly focus: number
  readonly repeat: 0 | 1 | 2
  readonly track: string
  /** `MM:SS`, or more minutes than two. */
  readonly time: string
  readonly reflect: boolean
}

/**
 * The CD player, drawn from the BIOS's own models: the TRACK and TIME lozenges, the 3D figures of
 * the readouts, BACK, and the five transport buttons. The focused button plays its own motion from
 * the ROM - its icon shrinks as its body widens and swings - and its body goes green; BACK focused
 * gains its red swirl and its blinking yellow ring.
 */
export function MusicModels({ focus, repeat, track, time, reflect }: MusicModelsProps) {
  const items = useCallback(
    (t: number | null): Item[] => {
      const [mins, secs] = time.split(':') as [string, string]
      const d = MUSIC.digits
      const list: Item[] = [
        ...at(LOZENGES.track, view(MUSIC.lozenge.track.x, MUSIC.lozenge.track.y, MUSIC.lozenge.ppu)),
        ...at(LOZENGES.time, view(MUSIC.lozenge.time.x, MUSIC.lozenge.time.y, MUSIC.lozenge.ppu)),
        ...figures(track, d.track),
        ...figures(mins, d.minutes, true),
        ...at(COLON, view(d.colon.x, d.colon.y, d.ppu)),
        ...figures(secs, d.seconds),
        ...at([BACK_FRAME!], view(MUSIC.back.x, MUSIC.back.y, MUSIC.back.ppu)),
      ]
      if (focus === 0) {
        list.push(...at([BACK_SWIRL!], view(MUSIC.back.x, MUSIC.back.y, MUSIC.back.ppu)))
        if (t === null || Math.floor(t / RING_BLINK) % 2 === 0) list.push(...at([BACK_RING!], view(MUSIC.back.x, MUSIC.back.y, MUSIC.back.ppu)))
      }
      BUTTONS.forEach((button, i) => {
        const focused = focus === i + 1
        const v = view(MUSIC.buttons.x[i]!, MUSIC.buttons.y, MUSIC.buttons.ppu)
        const textures = i === 4 ? { repeat: REPEAT_ICON[repeat] } : undefined
        const [icon, body] = button
        list.push(...at([icon!], v, focused ? t : null, textures ? { textures } : {}))
        list.push(...at([body!], v, focused ? t : null, focused ? { tint: FOCUS.tint, alpha: FOCUS.alpha } : {}))
      })
      return list
    },
    [focus, repeat, track, time],
  )
  return <ModelScene items={items} moving reflect={reflect} />
}
