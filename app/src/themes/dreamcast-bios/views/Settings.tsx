/**
 * PORTING NOTES
 * CFW: Sega Dreamcast BIOS menu   Devices: dreamcast
 * Source: closed; strings from boot ROM v1.01d; layout from recording c69qVhS_WOU (56-100s)
 * Mode: reproduce
 *
 * Layout:        Four rows (`frames/settings.png`): a slate bar holding an icon and the item's name,
 *                right-aligned, and a lilac field with its value. The fourth row, Other, carries a
 *                second, taller field under it for the memory-card clock. BACK bottom-left.
 * Focus & selection: The focused field turns tan. Up and down move through the five fields and on
 *                to BACK; no wrap. Default focus Language.
 * Buttons:       A opens the field's box; B, or A on BACK, returns to the main menu.
 * Transitions:   A box opens over the rows at once and fades up; the rows stay drawn under it.
 * Notes:         Every box's options are green blobs; the focused one blinks yellow. Language's
 *                title names the focused language and Sound's the focused output, as the ROM's
 *                strings do; Cancel has none. Choosing a language changes the setting, but the port
 *                carries only the English string table, so the menu stays in English.
 */
import { useCallback, type ReactNode } from 'react'
import { BACK, CELL, DIALOG, H, SETTINGS, W } from '../layout'
import { FIELD_CELLS, formatClock, type Clock } from '../library'
import { CLOCK_CANCEL, CLOCK_SELECT, type Prefs } from '../machine'
import { PALETTE } from '../palette'
import { ModelScene, model } from '../models/MenuModels'
import { fitView, type Item } from '../models/scene'
import { LANGUAGE_NAMES, S } from '../strings'
import { ADVANCE, BackButton, DialogBox, Lines, Option, Text, abs } from './parts'

/** Each row's icon: the ROM's model for it, and the size it is drawn at in `frames/settings.png`. */
const ICONS = [
  { model: model('settings-language'), w: 36, h: 22 },
  { model: model('settings-clock'), w: 36, h: 36 },
  { model: model('settings-sound'), w: 32, h: 40 },
  { model: model('settings-other'), w: 28, h: 40 },
] as const

/** The rows' icons, the BIOS's own models, each fitted to its place in its row. */
function SettingsIcons() {
  const items = useCallback(
    (): Item[] =>
      ICONS.map((icon, i) => {
        const y = SETTINGS.rows[i]!
        const box = { x: SETTINGS.icon.x + (SETTINGS.icon.w - icon.w) / 2, y: y + (SETTINGS.rowH - icon.h) / 2, w: icon.w, h: icon.h }
        return { model: icon.model, ...fitView(icon.model, box), alpha: 1 }
      }),
    [],
  )
  return <ModelScene items={items} moving={false} />
}

export function SettingsList({ focus, prefs, clock }: { focus: number; prefs: Prefs; clock: Clock }) {
  const values = [
    LANGUAGE_NAMES[prefs.language]!,
    formatClock(clock),
    prefs.stereo ? S.stereoItem : S.monoItem,
    prefs.autoStart ? S.autoStartOn : S.autoStartOff,
  ]
  const { value, rowH } = SETTINGS
  const last = SETTINGS.rows.length - 1
  return (
    <>
      <OtherSlate />
      {SETTINGS.rows.map((y, i) => {
        return (
          <div key={i} data-row={i} data-focused={focus === i || undefined}>
            {/* Round at the left, where the icon sits; nearly square at the right, behind the field. */}
            {i === last ? null : (
              <div
                style={{
                  ...abs({ x: SETTINGS.x, y, w: SETTINGS.w, h: rowH }),
                  background: PALETTE.row,
                  borderRadius: `${rowH / 2}px 8px 8px ${rowH / 2}px`,
                }}
              />
            )}
            <Text box={{ x: SETTINGS.labelRight - 200, y: y + (rowH - CELL.h) / 2, w: 200, h: CELL.h }} align="right">
              {S.settings[i]!.trim()}
            </Text>
            <Field box={{ x: value.x, y: y + value.inset, w: value.w, h: rowH - 2 * value.inset }} focused={focus === i}>
              {values[i]!}
            </Field>
          </div>
        )
      })}
      <div data-row={4} data-focused={focus === 4 || undefined}>
        <Field box={SETTINGS.adjust} focused={focus === 4} top>
          {S.adjustClock}
        </Field>
      </div>
      <SettingsIcons />
      <BackButton {...BACK.settings} focused={focus === 5} />
    </>
  )
}

/**
 * The Other row's slate and the slate under it, as one shape: round at the left like every row,
 * square where the two meet, and rounded only at its outer corners. Two see-through boxes would show
 * a seam where they touched, and darken where they overlapped.
 */
function OtherSlate() {
  const { x, w, rowH, rows } = SETTINGS
  const { x: bx, y: by, h: bh } = SETTINGS.adjustBacking
  const top = rows[rows.length - 1]!
  const r = rowH / 2
  const right = x + w
  const bottom = by + bh
  const c = 8
  const d = [
    `M ${x + r} ${top}`,
    `H ${right - c} Q ${right} ${top} ${right} ${top + c}`,
    `V ${bottom - c} Q ${right} ${bottom} ${right - c} ${bottom}`,
    `H ${bx + c} Q ${bx} ${bottom} ${bx} ${bottom - c}`,
    `V ${top + rowH} H ${x + r}`,
    `A ${r} ${r} 0 0 1 ${x + r} ${top} Z`,
  ].join(' ')
  return (
    <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
      <path d={d} fill={PALETTE.row} />
    </svg>
  )
}

/** A lilac value field, tan when focused. `top` sets its text on its first line rather than its middle. */
function Field({ box, focused, top = false, children }: { box: { x: number; y: number; w: number; h: number }; focused: boolean; top?: boolean; children: string }) {
  const y = top ? 12 : (box.h - CELL.h) / 2
  return (
    <>
      <div style={{ ...abs(box), background: focused ? PALETTE.valueFocus : PALETTE.value, borderRadius: 4 }} />
      <Text box={{ x: box.x + 10, y: box.y + y, w: box.w - 20, h: CELL.h }} advance={ADVANCE.value}>
        {children}
      </Text>
    </>
  )
}

/** Options down a box, from `first`, `pitch` apart. */
function Options({ labels, focus, first, pitch, blobX }: { labels: readonly string[]; focus: number; first: number; pitch: number; blobX: number }) {
  return (
    <>
      {labels.map((label, i) => (
        <Option key={i} x={blobX} cy={first + i * pitch} label={label} focused={i === focus} />
      ))}
    </>
  )
}

const LANGUAGE_OPTIONS = [...LANGUAGE_NAMES, S.cancel]

export function LanguageBox({ focus }: { focus: number }) {
  const d = DIALOG.language
  const title = focus < 6 ? [S.messages, S.inLanguage[focus]!] : []
  return (
    <DialogBox box={d.box} rim={PALETTE.rimSettings}>
      <Lines x={0} cy={d.title[0] - d.box.y} w={d.box.w} pitch={d.title[1] - d.title[0]} lines={title} />
      <Offset box={d.box}>
        <Options labels={LANGUAGE_OPTIONS} focus={focus} first={d.first} pitch={d.pitch} blobX={d.blobX} />
      </Offset>
    </DialogBox>
  )
}

export function SoundBox({ focus }: { focus: number }) {
  const d = DIALOG.sound
  const title = focus === 0 ? [S.stereo, S.audioOutput] : focus === 1 ? [S.mono, S.audioOutput] : []
  return (
    <DialogBox box={d.box} rim={PALETTE.rimSettings}>
      <Lines x={0} cy={d.title[0] - d.box.y} w={d.box.w} pitch={d.title[1] - d.title[0]} lines={title} />
      <Offset box={d.box}>
        <Options labels={[S.stereoItem, S.monoItem, S.cancel]} focus={focus} first={d.first} pitch={d.pitch} blobX={d.blobX} />
      </Offset>
    </DialogBox>
  )
}

export function AutoStartBox({ focus }: { focus: number }) {
  const d = DIALOG.auto
  const title = focus === 0 ? [S.autoOn, S.autoOn2] : focus === 1 ? [S.autoOff, S.autoOff2] : []
  return (
    <DialogBox box={d.box} rim={PALETTE.rimSettings}>
      <Lines x={0} cy={d.title[0] - d.box.y} w={d.box.w} pitch={d.title[1] - d.title[0]} lines={title} />
      <Offset box={d.box}>
        <Options labels={[S.autoStartOn, S.autoStartOff, S.cancel]} focus={focus} first={d.first} pitch={d.pitch} blobX={d.blobX} />
      </Offset>
    </DialogBox>
  )
}

export function CardClockBox({ focus, clock }: { focus: number; clock: Clock }) {
  const d = DIALOG.cardClock
  return (
    <DialogBox box={d.box} rim={PALETTE.rimSettings}>
      <Lines x={0} cy={d.title[0] - d.box.y} w={d.box.w} pitch={d.title[1] - d.title[0]} lines={[S.cardClock, S.cardClock2, S.cardClock3]} />
      <Offset box={d.box}>
        <Lines x={d.current.x} cy={d.current.cy[0]} w={300} pitch={d.current.cy[1] - d.current.cy[0]} lines={[S.currentClock, S.currentClock2]} align="left" advance={ADVANCE.label} />
        <Text box={{ x: d.date.x, y: d.date.cy - CELL.h / 2, w: 240, h: CELL.h }} advance={ADVANCE.dialogDate}>
          {formatClock(clock)}
        </Text>
        <Option x={d.blobX} cy={d.select} label={S.select} focused={focus === 0} />
        <Option x={d.blobX} cy={d.cancel} label={S.cancel} focused={focus === 1} />
      </Offset>
    </DialogBox>
  )
}

/**
 * The clock editor, in Settings with Select and Cancel, and at first boot with Select alone.
 * The field being changed has a green arrow over and under it.
 */
export function ClockBox({ focus, draft, boot }: { focus: number; draft: Clock; boot: boolean }) {
  const d = DIALOG.clock
  const onField = focus < CLOCK_SELECT
  const [start, len] = FIELD_CELLS[Math.min(focus, 4)]!
  const fieldCx = d.date.x + (start + len / 2) * ADVANCE.dialogDate
  const { w: aw, h: ah, gap } = d.arrow
  const arrow = (up: boolean) => (
    <svg
      width={aw}
      height={ah}
      style={{ position: 'absolute', left: fieldCx - aw / 2, top: up ? d.date.cy - gap - ah / 2 : d.date.cy + gap - ah / 2 }}
    >
      <polygon points={up ? `${aw / 2},0 ${aw},${ah} 0,${ah}` : `0,0 ${aw},0 ${aw / 2},${ah}`} fill={PALETTE.arrow} />
    </svg>
  )
  return (
    <DialogBox box={d.box} rim={PALETTE.rimSettings}>
      <Lines x={0} cy={d.title[0] - d.box.y} w={d.box.w} pitch={25} lines={[S.setClock, S.setClock2, S.setClock3, S.setClock4]} />
      <Offset box={d.box}>
        <Text box={{ x: d.date.x, y: d.date.cy - CELL.h / 2, w: 240, h: CELL.h }} advance={ADVANCE.dialogDate}>
          {formatClock(draft)}
        </Text>
        {onField ? (
          <div data-field={focus}>
            {arrow(true)}
            {arrow(false)}
          </div>
        ) : null}
        <Option x={d.blobX} cy={boot ? d.bootSelect : d.select} label={S.select} focused={focus === CLOCK_SELECT} />
        {boot ? null : <Option x={d.blobX} cy={d.cancel} label={S.cancel} focused={focus === CLOCK_CANCEL} />}
      </Offset>
    </DialogBox>
  )
}

/** Children placed in frame coordinates inside a box that is itself placed at `box`. */
function Offset({ box, children }: { box: { x: number; y: number }; children: ReactNode }) {
  return <div style={{ position: 'absolute', left: -box.x, top: -box.y }}>{children}</div>
}
