/**
 * PORTING NOTES
 * CFW: NextUI theme for N64FlashcartMenu
 * Devices: n64 (640x480, drawn to a television)
 * Source: src/menu/views/*.c - each screen names its own file in `library.ts`
 * Mode: reproduce
 *
 * All twenty-three views the theme touches, as twelve shapes.
 *
 * They are not twenty-three different screens. The menu draws one list, one settings row, one
 * label/value row, one hint bar and one box-art slot, and every view arranges those. Writing them
 * as shapes rather than as twenty-three components is what the source itself does - `nextui.c` is
 * 366 lines for the whole theme - and it means a change to how a row reads happens once.
 *
 * Layout:
 *   - Browser: nine 40px rows from the top of the visible area, art right, no title.
 *   - Titled lists: the same rows, dropped one pill height plus a margin to clear the title.
 *   - Settings: a full-width accent pill under a label-hugging main pill, value right, and the
 *     selected row's description centred above the hint bar.
 *   - Load: its own coordinate table - hero band at 92, art at 392, ledger at 289.
 * Focus & selection:
 *   - The pill is sized to the label, not to the row, on every list in the theme.
 * Buttons:
 *   - Per view, from each view's own source, in `library.ts`.
 * Transitions:
 *   - The marquee only. The palette picker re-renders live rather than transitioning.
 */
import { boxart } from '../art'
import { ICON_SIZE, ICONS, type IconName } from '../assets'
import {
  ART_CENTER_Y,
  ART_MAX,
  ART_X1,
  BODY_X,
  BODY_Y,
  BUTTON_MARGIN,
  BUTTON_PADDING,
  CENTER,
  COLORS_ROW_HEIGHT,
  EDITOR_SWATCH,
  FONT,
  HINT_Y,
  LIST_X,
  LIST_Y,
  LOAD,
  MUTED,
  PILL_HEIGHT,
  PREVIEW,
  ROW_COUNT,
  SETTINGS_ROW_HEIGHT,
  SWATCH,
  TITLED_LIST_Y,
  TITLE_MAX_WIDTH,
  VALUE_FIELD_WIDTH,
  VALUE_FIELD_X,
  VALUE_FIELD_Y,
  VISIBLE,
  forwardWindow,
  listWindow,
  visibleRows,
} from '../layout'
import {
  BODY_TEXT,
  BROWSER,
  CHEAT_CODES,
  COLLECTIONS,
  CPAK_NOTES,
  CPAK_STATE,
  FLASHCART_ROWS,
  HISTORY,
  LEDGER_LEFT,
  LEDGER_RIGHT,
  MUSIC_ROWS,
  RTC_ROW,
  SETTINGS_ROWS,
  SLOT_LABELS,
  type InfoRow,
  type LedgerRow,
  type RomEntry,
  type ViewDef,
} from '../library'
import { PALETTES, SLOT_ORDER, tokens, type Palette, type Tokens } from '../palette'
import { textWidth } from '../text'
import { Marquee, Panel, Pill, TextBox, Title } from './parts'

export interface ScreenProps {
  readonly view: ViewDef
  readonly selected: number
  readonly palette: Palette
  readonly titlePill: boolean
}

/** A tinted sprite: white art masked to the palette colour, exactly as the source modulates it. */
function Icon({
  name,
  x,
  y,
  size,
  color,
}: {
  name: IconName
  x: number
  y: number
  size?: number
  color: string
}) {
  const native = ICON_SIZE[name]
  const scale = size ? size / native.w : 1
  const url = `url(${ICONS[name]})`

  return (
    <div
      className="nx-icon"
      style={{
        left: x,
        top: y,
        width: native.w * scale,
        height: native.h * scale,
        background: color,
        WebkitMaskImage: url,
        maskImage: url,
      }}
    />
  )
}

/* ---- lists -------------------------------------------------------------- */

function entriesFor(slug: string): readonly RomEntry[] {
  if (slug === 'collections') return COLLECTIONS
  if (slug === 'history-favorites') return HISTORY
  return BROWSER
}

/**
 * One row of a file list.
 *
 * Selected, the pill is sized to the label - so a short name gets a short pill, which is the
 * single most recognisable thing about how NextUI lists look. A label too long for the space
 * marquees inside the pill; unselected rows ellipsise instead.
 */
function FileRow({
  label,
  selected,
  y,
  height,
  available,
  t,
}: {
  label: string
  selected: boolean
  y: number
  height: number
  available: number
  t: Tokens
}) {
  const measured = textWidth(label, FONT.small)
  const clamped = measured > available
  const width = clamped ? available : measured

  if (!selected) {
    return (
      <TextBox
        x={LIST_X + BUTTON_PADDING}
        y={y}
        w={available}
        h={height}
        size={FONT.small}
        color={t.listText}
      >
        {label}
      </TextBox>
    )
  }

  return (
    <>
      <Pill x={LIST_X} y={y} w={width + BUTTON_PADDING * 2} h={height} color={t.main} />
      {clamped ? (
        <Marquee
          text={label}
          x={LIST_X + BUTTON_PADDING}
          y={y}
          w={available}
          h={height}
          size={FONT.small}
          color={t.listTextSelected}
        />
      ) : (
        <TextBox
          x={LIST_X + BUTTON_PADDING}
          y={y}
          h={height}
          size={FONT.small}
          color={t.listTextSelected}
        >
          {label}
        </TextBox>
      )}
    </>
  )
}

/** The art slot: a cover for a ROM, the tinted folder glyph for a folder. */
function BrowserArt({ entry, t }: { entry: RomEntry | undefined; t: Tokens }) {
  if (!entry) return null

  if (entry.folder) {
    const icon = ICON_SIZE.folder
    return (
      <Icon
        name="folder"
        x={ART_X1 - (ART_MAX + icon.w) / 2}
        y={ART_CENTER_Y - icon.h / 2}
        color={t.primaryAccent}
      />
    )
  }

  /* Covers are 3:4-ish, the shape a scraped N64 cover comes in, letterboxed into the 288 box. */
  const h = ART_MAX
  const w = Math.round(ART_MAX * 0.76)

  return (
    <img
      className="nx-art"
      style={{ left: ART_X1 - w, top: ART_CENTER_Y - h / 2, width: w, height: h }}
      src={boxart(entry.name, w, h)}
      alt=""
    />
  )
}

/** How much room the art leaves the list. `ui_components_browser_art_width` plus two margins. */
function artWidth(entry: RomEntry | undefined): number {
  if (!entry) return 0
  if (entry.folder) return (ART_MAX + ICON_SIZE.folder.w) / 2
  return Math.round(ART_MAX * 0.76)
}

/**
 * The browser, and its two titled relatives.
 *
 * The browser draws no title at all: its first row starts at the very top of the visible area and
 * the START/SETTINGS pill shares that line, which is why the top row alone gets a wider right
 * margin. Collections and Favorites draw a title and drop the whole list to clear it.
 */
function BrowserScreen({ view, selected, palette, titlePill }: ScreenProps) {
  const t = tokens(palette)
  const titled = view.kind === 'titled-browser'
  const entries = entriesFor(view.slug)

  const listY = titled ? TITLED_LIST_Y : LIST_Y
  const rows = titled ? visibleRows(PILL_HEIGHT) : ROW_COUNT
  const first = titled ? forwardWindow(selected, rows) : listWindow(selected, entries.length, rows)
  const current = entries[Math.min(selected, entries.length - 1)]

  const art = artWidth(current)
  const rightMargin = art > 0 ? art + BUTTON_MARGIN * 2 : 0
  const available = Math.max(BUTTON_PADDING, VISIBLE.x1 - rightMargin - LIST_X - BUTTON_PADDING * 2)

  /* The browser's top row shares its line with the START pill, so it yields to it. */
  const topWidth = view.topHints
    ? VISIBLE.x1 - LIST_X - BUTTON_PADDING * 2 - (topGroupWidth(view) + BUTTON_MARGIN)
    : available

  return (
    <>
      {titled ? (
        <Title
          text={view.title ?? ''}
          pill={titlePill}
          maxWidth={TITLE_MAX_WIDTH}
          accent={t.primaryAccent}
          hint={t.hintText}
        />
      ) : null}

      <BrowserArt entry={current} t={t} />

      {entries.slice(first, first + rows).map((entry, i) => (
        <FileRow
          key={entry.name}
          label={entry.name}
          selected={first + i === selected}
          y={listY + i * PILL_HEIGHT}
          height={PILL_HEIGHT}
          available={!titled && i === 0 ? Math.min(available, topWidth) : available}
          t={t}
        />
      ))}
    </>
  )
}

/** The measured width of the top-right hint group, which the browser's first row must clear. */
function topGroupWidth(view: ViewDef): number {
  if (!view.topHints) return 0
  const hint = view.topHints[0]
  if (!hint) return 0
  return (
    BUTTON_MARGIN +
    textWidth(hint.button, FONT.small) +
    BUTTON_PADDING * 2 +
    BUTTON_MARGIN +
    textWidth(hint.label, FONT.small) +
    BUTTON_PADDING
  )
}

/* ---- settings-style rows ------------------------------------------------- */

/**
 * A row with a value on the right.
 *
 * Two pills when selected: a full-width accent bar, and a main-coloured pill hugging the label on
 * top of it. That pairing is what makes a settings list read differently from a file list despite
 * both being 40px rows with the same label pill.
 */
function ValueRow({
  label,
  value,
  selected,
  y,
  height,
  t,
  valueColor,
}: {
  label: string
  value: string
  selected: boolean
  y: number
  height: number
  t: Tokens
  valueColor?: string
}) {
  return (
    <>
      {selected ? (
        <>
          <Pill x={LIST_X} y={y} w={VISIBLE.w} h={height} color={t.primaryAccent} />
          <Pill
            x={LIST_X}
            y={y}
            w={textWidth(label, FONT.small) + BUTTON_PADDING * 2}
            h={height}
            color={t.main}
          />
        </>
      ) : null}
      <TextBox
        x={LIST_X + BUTTON_PADDING}
        y={y}
        h={height}
        size={FONT.small}
        color={selected ? t.listTextSelected : t.listText}
      >
        {label}
      </TextBox>
      {value ? (
        <TextBox
          x={VISIBLE.x1 - BUTTON_PADDING - textWidth(value, FONT.small)}
          y={y}
          h={height}
          size={FONT.small}
          color={valueColor ?? (selected ? t.listText : MUTED)}
        >
          {value}
        </TextBox>
      ) : null}
    </>
  )
}

/** The settings editor: the list, plus the selected row's description above the hint bar. */
function SettingsScreen({ view, selected, palette, titlePill }: ScreenProps) {
  const t = tokens(palette)
  const rows = visibleRows(SETTINGS_ROW_HEIGHT, SETTINGS_ROW_HEIGHT)
  const first = listWindow(selected, SETTINGS_ROWS.length, rows)
  const current = SETTINGS_ROWS[Math.min(selected, SETTINGS_ROWS.length - 1)]

  return (
    <>
      <Title text={view.title ?? ''} pill={titlePill} accent={t.primaryAccent} hint={t.hintText} />

      {SETTINGS_ROWS.slice(first, first + rows).map((row, i) => (
        <ValueRow
          key={row.label}
          label={row.label}
          value={row.value}
          selected={first + i === selected}
          y={TITLED_LIST_Y + i * SETTINGS_ROW_HEIGHT}
          height={SETTINGS_ROW_HEIGHT}
          t={t}
        />
      ))}

      {current ? (
        <TextBox
          x={CENTER.x - textWidth(current.description, FONT.small) / 2}
          y={HINT_Y - SETTINGS_ROW_HEIGHT - BUTTON_MARGIN}
          h={SETTINGS_ROW_HEIGHT}
          size={FONT.small}
          color={MUTED}
        >
          {current.description}
        </TextBox>
      ) : null}
    </>
  )
}

/**
 * The colours hub.
 *
 * A tighter 36px pitch so all nine rows fit without scrolling, and the seven slot rows carry a
 * live swatch inside a neutral grey frame - neutral because a swatch showing the background colour
 * would otherwise be invisible against the background.
 */
function ColorsScreen({ view, selected, palette, titlePill }: ScreenProps) {
  const t = tokens(palette)
  /*
   * The slot rows show the stored hex, which `config.ini` keeps as `RRGGBB` without the hash -
   * so that is what the screen prints. The palette and title-pill rows are plain values.
   */
  const rows = [
    { label: 'Palette', value: palette.name, slot: null },
    ...SLOT_ORDER.map((slot, i) => ({
      label: SLOT_LABELS[i]!,
      value: t[slot].replace('#', '').toUpperCase(),
      slot,
    })),
    { label: 'Title Pills', value: titlePill ? 'On' : 'Off', slot: null },
  ]

  const swatchX = VISIBLE.x1 - BUTTON_PADDING - SWATCH.valueColumn - BUTTON_PADDING - SWATCH.w

  return (
    <>
      <Title text={view.title ?? ''} pill={titlePill} accent={t.primaryAccent} hint={t.hintText} />

      {rows.map((row, i) => {
        const y = TITLED_LIST_Y + i * COLORS_ROW_HEIGHT
        const swatchY = y + (COLORS_ROW_HEIGHT - SWATCH.h) / 2

        return (
          <span key={row.label}>
            <ValueRow
              label={row.label}
              value={row.value}
              selected={i === selected}
              y={y}
              height={COLORS_ROW_HEIGHT}
              t={t}
            />
            {row.slot ? (
              <>
                <Panel
                  x0={swatchX - 2}
                  y0={swatchY - 2}
                  x1={swatchX + SWATCH.w + 2}
                  y1={swatchY + SWATCH.h + 2}
                  color={SWATCH.frame}
                />
                <Panel
                  x0={swatchX}
                  y0={swatchY}
                  x1={swatchX + SWATCH.w}
                  y1={swatchY + SWATCH.h}
                  color={t[row.slot]}
                />
              </>
            ) : null}
          </span>
        )
      })}
    </>
  )
}

/**
 * The palette picker.
 *
 * A live preview rather than a transition: the whole screen re-renders in the highlighted palette
 * as the cursor moves - title, pill, list, hints and the background itself - with a strip of that
 * palette's seven colours beside the list. `A` applies it, `B` restores what you came in with.
 *
 * Its rows draw only the label pill, with no accent bar beneath: it is a file list that happens to
 * be listing palettes, not a settings list.
 */
function PaletteScreen({ view, selected, palette, titlePill }: ScreenProps) {
  const t = tokens(palette)
  const rows = visibleRows(SETTINGS_ROW_HEIGHT)
  const first = forwardWindow(selected, rows)
  const available = VISIBLE.w - BUTTON_PADDING * 4 - PREVIEW.size - PREVIEW.gap * 2

  const stripX = VISIBLE.x1 - BUTTON_PADDING - PREVIEW.size
  const stripTotal = 7 * PREVIEW.size + 6 * PREVIEW.gap
  const stripY = CENTER.y - stripTotal / 2

  return (
    <>
      <Title text={view.title ?? ''} pill={titlePill} accent={t.primaryAccent} hint={t.hintText} />

      {PALETTES.slice(first, first + rows).map((p, i) => (
        <FileRow
          key={p.id}
          label={p.name}
          selected={first + i === selected}
          y={TITLED_LIST_Y + i * SETTINGS_ROW_HEIGHT}
          height={SETTINGS_ROW_HEIGHT}
          available={available}
          t={t}
        />
      ))}

      <Panel
        x0={stripX - PREVIEW.gap}
        y0={stripY - PREVIEW.gap}
        x1={stripX + PREVIEW.size + PREVIEW.gap}
        y1={stripY + stripTotal + PREVIEW.gap}
        color={PREVIEW.frame}
      />
      {SLOT_ORDER.map((slot, i) => {
        const y = stripY + i * (PREVIEW.size + PREVIEW.gap)
        return (
          <Panel
            key={slot}
            x0={stripX}
            y0={y}
            x1={stripX + PREVIEW.size}
            y1={y + PREVIEW.size}
            color={t[slot]}
          />
        )
      })}
    </>
  )
}

/** The RGB editor: a live swatch, its hex, and three channel fields with the edited one pilled. */
function EditorScreen({ view, selected, palette, titlePill }: ScreenProps) {
  const t = tokens(palette)
  const hex = t.main.replace('#', '').toUpperCase()
  const channels: [string, number][] = [
    ['R', Number.parseInt(hex.slice(0, 2), 16)],
    ['G', Number.parseInt(hex.slice(2, 4), 16)],
    ['B', Number.parseInt(hex.slice(4, 6), 16)],
  ]

  const swatchX = CENTER.x - EDITOR_SWATCH.w / 2
  const swatchY = VISIBLE.y0 + PILL_HEIGHT + BUTTON_MARGIN * 3

  return (
    <>
      <Title text={view.title ?? ''} pill={titlePill} accent={t.primaryAccent} hint={t.hintText} />

      <Panel
        x0={swatchX - 2}
        y0={swatchY - 2}
        x1={swatchX + EDITOR_SWATCH.w + 2}
        y1={swatchY + EDITOR_SWATCH.h + 2}
        color={SWATCH.frame}
      />
      <Panel
        x0={swatchX}
        y0={swatchY}
        x1={swatchX + EDITOR_SWATCH.w}
        y1={swatchY + EDITOR_SWATCH.h}
        color={t.main}
      />

      <TextBox
        x={CENTER.x - textWidth(hex, FONT.small) / 2}
        y={swatchY + EDITOR_SWATCH.h + BUTTON_MARGIN}
        h={SETTINGS_ROW_HEIGHT}
        size={FONT.small}
        color={t.listText}
      >
        {hex}
      </TextBox>

      {channels.map(([name, value], i) => {
        const x = VALUE_FIELD_X + i * VALUE_FIELD_WIDTH
        const active = i === selected % 3

        return (
          <span key={name}>
            {active ? (
              <Pill
                x={x + 2}
                y={VALUE_FIELD_Y + 20}
                w={VALUE_FIELD_WIDTH - 4}
                h={SETTINGS_ROW_HEIGHT}
                color={t.primaryAccent}
              />
            ) : null}
            <TextBox
              x={x}
              y={VALUE_FIELD_Y - 6}
              w={VALUE_FIELD_WIDTH}
              h={24}
              size={FONT.tiny}
              color={MUTED}
              align="center"
            >
              {name}
            </TextBox>
            <TextBox
              x={x}
              y={VALUE_FIELD_Y + 20}
              w={VALUE_FIELD_WIDTH}
              h={SETTINGS_ROW_HEIGHT}
              size={FONT.small}
              color={t.listText}
              align="center"
            >
              {value}
            </TextBox>
          </span>
        )
      })}
    </>
  )
}

/* ---- the load screen ----------------------------------------------------- */

const LOAD_DESCRIPTION =
  'Three… Two… One… GO! The signal light changes and you drop the pedal to the metal. Take on up to three'

const HERO_ROWS: readonly InfoRow[] = [
  { label: 'Developer', value: 'Nintendo' },
  { label: 'Publisher', value: 'Nintendo' },
  { label: 'Released', value: '1997' },
]

function LedgerColumn({ rows, x, t }: { rows: readonly LedgerRow[]; x: number; t: Tokens }) {
  return (
    <>
      {rows.map((row, i) => {
        const y = LOAD.ledgerY + i * LOAD.ledgerRowH
        const tint = row.dimmed ? MUTED : t.hintText
        const color = row.dimmed ? MUTED : t.listText
        const labelX = x + LOAD.iconSize + LOAD.iconGap
        const valueX = labelX + textWidth(row.label, FONT.tiny) + 8

        return (
          <span key={row.label}>
            <Icon name={row.icon} x={x} y={y} color={tint} />
            <TextBox x={labelX} y={y} h={LOAD.ledgerRowH} size={FONT.tiny} color={color}>
              {row.label}
            </TextBox>
            {row.value ? (
              <TextBox
                x={valueX}
                y={y}
                w={x + LOAD.ledgerColW - valueX}
                h={LOAD.ledgerRowH}
                size={FONT.tiny}
                color={color}
                align="right"
              >
                {row.value}
              </TextBox>
            ) : null}
          </span>
        )
      })}
    </>
  )
}

/** The Players row's value: four slots, the supported ones tinted and the rest muted. */
function PlayerSlots({ players, t }: { players: number; t: Tokens }) {
  const step = LOAD.playerIconSize + LOAD.playerIconGap
  const x = LOAD.margin + LOAD.ledgerColW - 4 * step + LOAD.playerIconGap
  const y = LOAD.ledgerY + (LOAD.ledgerRowH - LOAD.playerIconSize) / 2

  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <Icon
          key={i}
          name="players"
          x={x + i * step}
          y={y}
          size={LOAD.playerIconSize}
          color={i < players ? t.hintText : MUTED}
        />
      ))}
    </>
  )
}

/**
 * The load screen.
 *
 * Its own table of coordinates rather than the browser's: a title, a hard-cut three-line
 * description, a byline block, art at a fixed 216x153, and a two-column icon ledger of the ROM's
 * header fields. The staged progress the source runs across the first frames is I/O scheduling,
 * not an animation, so nothing here moves.
 */
function LoadScreen({ view, palette, titlePill }: ScreenProps) {
  const t = tokens(palette)
  const heroRowsY = LOAD.heroY + LOAD.descLines * LOAD.descLineH + LOAD.bylineGap

  return (
    <>
      <Title
        text={view.title ?? ''}
        pill={titlePill}
        maxWidth={TITLE_MAX_WIDTH}
        accent={t.primaryAccent}
        hint={t.hintText}
      />

      <div
        className="nx-body"
        style={{
          left: LOAD.margin,
          top: LOAD.heroY,
          width: LOAD.descW,
          height: LOAD.descLines * LOAD.descLineH + 8,
          fontSize: FONT.small,
          lineHeight: `${LOAD.descLineH}px`,
          color: t.listText,
        }}
      >
        {LOAD_DESCRIPTION}
      </div>

      {HERO_ROWS.map((row, i) => {
        const y = heroRowsY + i * LOAD.ledgerRowH
        return (
          <span key={row.label}>
            <TextBox x={LOAD.margin} y={y} h={LOAD.ledgerRowH} size={FONT.tiny} color={MUTED}>
              {row.label}
            </TextBox>
            <TextBox
              x={LOAD.margin + LOAD.descW - textWidth(row.value, FONT.tiny)}
              y={y}
              h={LOAD.ledgerRowH}
              size={FONT.tiny}
              color={t.listText}
            >
              {row.value}
            </TextBox>
          </span>
        )
      })}

      <img
        className="nx-art"
        style={{ left: LOAD.artX, top: LOAD.heroY, width: LOAD.artW, height: LOAD.artH }}
        src={boxart(view.title ?? '', LOAD.artW, LOAD.artH)}
        alt=""
      />

      <TextBox
        x={LOAD.artX + (LOAD.artW - textWidth('Left / Right: more images', FONT.tiny)) / 2}
        y={LOAD.heroY + LOAD.artH + 8}
        h={LOAD.ledgerRowH}
        size={FONT.tiny}
        color={MUTED}
      >
        Left / Right: more images
      </TextBox>

      <LedgerColumn rows={LEDGER_LEFT} x={LOAD.margin} t={t} />
      <PlayerSlots players={4} t={t} />
      <LedgerColumn rows={LEDGER_RIGHT} x={LOAD.ledgerCol2X} t={t} />
    </>
  )
}

/* ---- rows, body text and the rest ---------------------------------------- */

/** `ui_components_nextui_row_draw`: a label left, a value right, at a 30px pitch. */
function InfoRows({
  rows,
  y0,
  pitch,
  t,
  gapAfter,
}: {
  rows: readonly InfoRow[]
  y0: number
  pitch: number
  t: Tokens
  /** The flashcart screen leaves half a row's gap after its first two rows. */
  gapAfter?: number
}) {
  return (
    <>
      {rows.map((row, i) => {
        const offset = gapAfter !== undefined && i >= gapAfter ? i + 0.5 : i
        const y = y0 + offset * pitch
        return (
          <span key={row.label}>
            <TextBox x={LIST_X + BUTTON_MARGIN} y={y} h={30} size={FONT.small} color={t.listText}>
              {row.label}
            </TextBox>
            <TextBox
              x={VISIBLE.x1 - BUTTON_PADDING - textWidth(row.value, FONT.small)}
              y={y}
              h={30}
              size={FONT.small}
              color={MUTED}
            >
              {row.value}
            </TextBox>
          </span>
        )
      })}
    </>
  )
}

function RowsScreen({ view, palette, titlePill }: ScreenProps) {
  const t = tokens(palette)
  return (
    <>
      <Title text={view.title ?? ''} pill={titlePill} accent={t.primaryAccent} hint={t.hintText} />
      <InfoRows rows={FLASHCART_ROWS} y0={BODY_Y} pitch={30} t={t} gapAfter={2} />
    </>
  )
}

/**
 * Body text on the background.
 *
 * `ui_components_nextui_body_text_draw` word-wraps one block into the space between the title and
 * the hint bar. The RTC screen adds a label/value row under its block, which is the only reason
 * this shape takes a row list at all.
 */
function BodyScreen({ view, palette, titlePill }: ScreenProps) {
  const t = tokens(palette)
  const body = BODY_TEXT[view.slug] ?? []
  const size = view.slug === 'credits' ? FONT.tiny : FONT.small

  return (
    <>
      {view.title ? (
        <Title text={view.title} pill={titlePill} accent={t.primaryAccent} hint={t.hintText} />
      ) : null}

      <div
        className="nx-body"
        style={{
          left: BODY_X,
          top: view.title ? BODY_Y : VISIBLE.y0 + BUTTON_MARGIN,
          width: VISIBLE.w - BUTTON_MARGIN * 2,
          fontSize: size,
          lineHeight: `${Math.round(size * 1.45)}px`,
          color: t.listText,
        }}
      >
        {body.join('\n')}
      </div>

      {view.slug === 'rtc' ? (
        <InfoRows rows={[RTC_ROW]} y0={BODY_Y + 130} pitch={30} t={t} />
      ) : null}

      {view.footnote ? (
        <TextBox x={LIST_X + BUTTON_PADDING} y={HINT_Y - 34} h={30} size={FONT.small} color={MUTED}>
          {view.footnote}
        </TextBox>
      ) : null}
    </>
  )
}

/** The Datel editor: settings-shaped rows whose value is green when on and red when off. */
function CheatsScreen({ view, selected, palette, titlePill }: ScreenProps) {
  const t = tokens(palette)
  const rows = visibleRows(SETTINGS_ROW_HEIGHT)
  const first = listWindow(selected, CHEAT_CODES.length, rows)

  return (
    <>
      <Title text={view.title ?? ''} pill={titlePill} accent={t.primaryAccent} hint={t.hintText} />
      {CHEAT_CODES.slice(first, first + rows).map((entry, i) => (
        <ValueRow
          key={entry.code}
          label={entry.code}
          value={entry.enabled ? 'On' : 'Off'}
          selected={first + i === selected}
          y={TITLED_LIST_Y + i * SETTINGS_ROW_HEIGHT}
          height={SETTINGS_ROW_HEIGHT}
          t={t}
          /* `STL_GREEN` and `STL_RED` are fixed styles, not palette slots. */
          valueColor={entry.enabled ? '#00C000' : '#FF4040'}
        />
      ))}
    </>
  )
}

/**
 * The Controller Pak manager.
 *
 * A header row, two status lines, then the notes on the pak. The source notes that the theme's
 * proportional font collapses the space-run alignment the classic screen relies on, so it draws
 * proper rows here instead - one of the few places the two themes differ structurally rather than
 * only in colour.
 */
function CpakScreen({ view, selected, palette, titlePill }: ScreenProps) {
  const t = tokens(palette)
  const rowY = BODY_Y

  return (
    <>
      <Title text={view.title ?? ''} pill={titlePill} accent={t.primaryAccent} hint={t.hintText} />

      <InfoRows
        rows={[{ label: 'Controller', value: CPAK_STATE.controller }]}
        y0={rowY}
        pitch={30}
        t={t}
      />
      <TextBox x={LIST_X + BUTTON_MARGIN} y={rowY + 32} h={30} size={FONT.small} color={t.listText}>
        {CPAK_STATE.status}
      </TextBox>
      <TextBox x={LIST_X + BUTTON_MARGIN} y={rowY + 64} h={30} size={FONT.small} color={MUTED}>
        {CPAK_STATE.free}
      </TextBox>

      {CPAK_NOTES.map((note, i) => (
        <FileRow
          key={note.name}
          label={note.name}
          selected={i === selected}
          y={rowY + 110 + i * PILL_HEIGHT}
          height={PILL_HEIGHT}
          available={VISIBLE.w - BUTTON_PADDING * 2}
          t={t}
        />
      ))}

      {view.footnote ? (
        <TextBox
          x={CENTER.x - textWidth(view.footnote, FONT.small) / 2}
          y={HINT_Y - 34}
          h={30}
          size={FONT.small}
          color={MUTED}
        >
          {view.footnote}
        </TextBox>
      ) : null}
    </>
  )
}

/** The music player: three rows and the seekbar, which is two stacked stadiums. */
function MusicScreen({ view, palette, titlePill }: ScreenProps) {
  const t = tokens(palette)
  const seek = { w: 524, h: 24, progress: 0.32 }
  const seekX = CENTER.x - seek.w / 2
  const seekY = VISIBLE.y1 - seek.h - 80

  return (
    <>
      <Title text={view.title ?? ''} pill={titlePill} accent={t.primaryAccent} hint={t.hintText} />
      <InfoRows rows={MUSIC_ROWS} y0={BODY_Y} pitch={32} t={t} />
      <Pill x={seekX} y={seekY} w={seek.w} h={seek.h} color={t.primaryAccent} />
      <Pill x={seekX} y={seekY} w={seek.w * seek.progress} h={seek.h} color={t.main} />
    </>
  )
}

/** The image viewer: the picture centred on the screen, with nothing over it but the hints. */
function ImageScreen({ palette }: ScreenProps) {
  const t = tokens(palette)
  const w = 288
  const h = 288

  return (
    <img
      className="nx-art"
      style={{ left: CENTER.x - w / 2, top: CENTER.y - h / 2, width: w, height: h }}
      src={boxart('boxart_front', w, h)}
      alt=""
      data-tint={t.hintText}
    />
  )
}

/** Pick the shape a view draws in. */
export function Screen(props: ScreenProps) {
  switch (props.view.kind) {
    case 'browser':
    case 'titled-browser':
      return <BrowserScreen {...props} />
    case 'settings':
      return <SettingsScreen {...props} />
    case 'colors':
      return <ColorsScreen {...props} />
    case 'palette':
      return <PaletteScreen {...props} />
    case 'editor':
      return <EditorScreen {...props} />
    case 'load':
      return <LoadScreen {...props} />
    case 'rows':
      return <RowsScreen {...props} />
    case 'cheats':
      return <CheatsScreen {...props} />
    case 'cpak':
      return <CpakScreen {...props} />
    case 'music':
      return <MusicScreen {...props} />
    case 'image':
      return <ImageScreen {...props} />
    default:
      return <BodyScreen {...props} />
  }
}
