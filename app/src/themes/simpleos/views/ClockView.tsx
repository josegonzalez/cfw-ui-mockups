/**
 * PORTING NOTES
 * CFW: SimpleOS            Devices: rg-ds
 * Source: boorngos/SimpleOS - the `simpleos` binary's strings (`CLOCK`, `YEAR`, `HOUR`, the
 *         legend), CHANGELOG.txt 20260911 ("up/down arrows on date and time")
 * Mode: design-new
 *
 * Layout:        Top panel: the title bar and card, `CLOCK` at 3x, the draft date and time at 3x,
 *                and the legend. Bottom panel: the five fields as settings-row cards at 3x -
 *                day, month and year on one line, hour and minute on the next - with an arrow
 *                above and below the field being set.
 * Focus & selection: The field being set fills pale yellow, as a settings row does. Left and
 *                right move between fields and wrap.
 * Buttons:       Up/down change the field; A saves and returns home; B cancels. The legend is the
 *                binary's `tap arrows      A  save      B  cancel`: the arrows are the touch
 *                targets on the device.
 * Transitions:   None.
 * Notes:         Not in the trailer. The timezone picker (`Pick a region, then a city.`) is not
 *                drawn. The arrows are drawn as triangles because the font has no up or down one.
 */
import type { CSSProperties } from 'react'
import { Panels } from '../../../device/Panels'
import { MONTHS, SCREEN_COPY, formatDate, formatTime } from '../library'
import { FONT, TOP } from '../layout'
import { PALETTE } from '../palette'
import { CLOCK_FIELDS, type Clock } from '../machine'
import { Card, Fill, PixelText, TitleBar, Wash } from './parts'

export interface ClockViewProps {
  readonly clock: Clock
  readonly draft: Clock
  readonly field: number
}

const FIELD_H = 64
const FIELD_GAP = 16

/** Each field's text and width in characters, laid out in two centred lines. */
function fields(d: Clock) {
  return {
    day: String(d.day).padStart(2, '0'),
    month: MONTHS[d.month - 1]!,
    year: String(d.year),
    hour: String(d.hour).padStart(2, '0'),
    minute: String(d.minute).padStart(2, '0'),
  }
}

function Arrow({ x, y, up }: { x: number; y: number; up: boolean }) {
  const size = 12
  const style: CSSProperties = {
    position: 'absolute',
    left: `${x - size}px`,
    top: `${y}px`,
    width: 0,
    height: 0,
    borderLeft: `${size}px solid transparent`,
    borderRight: `${size}px solid transparent`,
    ...(up
      ? { borderBottom: `${size}px solid ${PALETTE.accent}` }
      : { borderTop: `${size}px solid ${PALETTE.accent}` }),
  }
  return <div style={style} aria-hidden="true" />
}

function Fields({ draft, field }: { draft: Clock; field: number }) {
  const text = fields(draft)
  const lines: (typeof CLOCK_FIELDS)[number][][] = [
    ['day', 'month', 'year'],
    ['hour', 'minute'],
  ]
  const tops = [120, 290]
  const active = CLOCK_FIELDS[field]

  return (
    <>
      <Wash from={PALETTE.listBgFrom} to={PALETTE.listBgTo} />
      {lines.map((line, li) => {
        const widths = line.map((f) => text[f].length * FONT.large + 40)
        const total = widths.reduce((a, b) => a + b, 0) + FIELD_GAP * (line.length - 1)
        let x = 320 - total / 2
        return line.map((f, i) => {
          const left = x
          const width = widths[i]!
          x += width + FIELD_GAP
          const selected = f === active
          const top = tops[li]!
          return (
            <div key={f} data-selected={selected || undefined}>
              <Fill
                box={{ left, top, width, height: FIELD_H, radius: 8 }}
                color={selected ? PALETTE.rowSelected : PALETTE.row}
                shadow={selected ? undefined : `0 2px 0 ${PALETTE.rowShadow}`}
              />
              <PixelText
                text={text[f]}
                x={left + width / 2}
                top={top + (FIELD_H - FONT.large) / 2}
                font={FONT.large}
                color={PALETTE.rowText}
                align="center"
              />
              {selected ? (
                <>
                  <Arrow x={left + width / 2} y={top - 24} up />
                  <Arrow x={left + width / 2} y={top + FIELD_H + 12} up={false} />
                </>
              ) : null}
            </div>
          )
        })
      })}
    </>
  )
}

export function ClockView({ clock, draft, field }: ClockViewProps) {
  const copy = SCREEN_COPY.clock!
  return (
    <Panels
      top={
        <>
          <Wash from={PALETTE.topBgFrom} to={PALETTE.topBgTo} />
          <TitleBar time={formatTime(clock)} />
          <Card box={TOP.screenCard} />
          <PixelText text={copy.title} x={320} top={TOP.screenTitleTop} font={FONT.large} color={PALETTE.accent} align="center" />
          <PixelText text={formatDate(draft)} x={320} top={TOP.noteTop - 20} font={FONT.large} color={PALETTE.text} align="center" />
          <PixelText text={formatTime(draft)} x={320} top={TOP.noteTop + 24} font={FONT.large} color={PALETTE.text} align="center" />
          <PixelText text={copy.legend} x={320} top={TOP.screenLegendTop} font={FONT.body} color={PALETTE.legend} align="center" />
        </>
      }
      bottom={<Fields draft={draft} field={field} />}
    />
  )
}
