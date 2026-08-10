import type { CSSProperties } from 'react'

/**
 * One entry in a menu.
 *
 * A discriminated union rather than an open shape, because a settings menu is a closed set of
 * control types and leaving it open invites a row that no renderer knows how to draw.
 */
export type MenuEntry =
  | { readonly kind: 'group'; readonly key: string; readonly label: string }
  | {
      readonly kind: 'row'
      readonly key: string
      readonly label: string
      readonly icon?: string | undefined
      /** Current value, shown right-aligned. */
      readonly value?: string | undefined
      readonly toggle?: boolean | undefined
      readonly on?: boolean | undefined
      /** Renders as a bordered button rather than a plain row. */
      readonly button?: boolean | undefined
    }

export interface MenuColors {
  readonly panel: string
  readonly fg: string
  readonly mutedFg: string
  readonly selectedFg: string
  readonly selectedBg: string
  readonly groupFg: string
  readonly groupBg: string
  readonly groupRule: string
  readonly rowRule: string
  readonly shade: string
}

export interface MenuPanelProps {
  readonly left: number
  readonly width: number
  readonly maxHeight: number
  readonly screenWidth: number
  readonly screenHeight: number
  readonly title: string
  readonly footer?: string | undefined
  readonly entries: readonly MenuEntry[]
  readonly selectedIndex: number
  readonly colors: MenuColors
  readonly padding: number
  readonly radius: number
  readonly titleHeight: number
  readonly titleFont: number
  readonly rowHeight: number
  readonly rowFont: number
  readonly groupHeight: number
  readonly groupFont: number
  readonly footerHeight: number
  readonly footerFont: number
  readonly iconSize: number
  /** Resolves a row icon name to a URL. Icons are tinted, so they are drawn as masks. */
  readonly iconUrl?: ((name: string) => string) | undefined
  /** Artwork for the on and off states of a toggle. */
  readonly switchUrl?: ((on: boolean) => string) | undefined
}

/**
 * A modal settings menu over a dimmed screen.
 *
 * Drawn over whatever view was showing rather than replacing it, which is how these menus
 * behave: the list underneath stays visible through the shade, so it is still obvious what the
 * menu is a menu *of*.
 *
 * Row icons are drawn as masks rather than as images because they take the theme's foreground
 * colour and invert on the selected row. An `<img>` cannot be tinted.
 */
/**
 * How many entries the cursor can land on.
 *
 * Group headings are not stops, so a menu's cursor range is its row count rather than its entry
 * count. Exported because the screen owning the cursor needs the same number.
 */
export function selectableRows(entries: readonly MenuEntry[]): number {
  return entries.filter((entry) => entry.kind === 'row').length
}

export function MenuPanel(props: MenuPanelProps) {
  const { colors, entries, selectedIndex } = props

  // Row positions are computed up front rather than counted while rendering: a counter mutated
  // inside the JSX map is order-dependent in a way React does not guarantee.
  const rowIndex = new Map<string, number>()
  let ordinal = 0
  for (const entry of entries) {
    if (entry.kind === 'row') rowIndex.set(entry.key, ordinal++)
  }

  const bodyHeight = entries.reduce(
    (sum, entry) => sum + (entry.kind === 'group' ? props.groupHeight : props.rowHeight),
    0,
  )
  const panelHeight = Math.min(
    props.maxHeight,
    props.titleHeight + bodyHeight + props.footerHeight + props.padding,
  )

  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: colors.shade,
          zIndex: 90,
        }}
        aria-hidden="true"
      />

      <div
        style={{
          position: 'absolute',
          left: `${props.left}px`,
          top: `${(props.screenHeight - panelHeight) / 2}px`,
          width: `${props.width}px`,
          maxHeight: `${props.maxHeight}px`,
          borderRadius: `${props.radius}px`,
          background: colors.panel,
          color: colors.fg,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 91,
        }}
        data-widget="MenuPanel"
        role="menu"
        aria-label={props.title}
      >
        <div
          style={{
            height: `${props.titleHeight}px`,
            paddingLeft: `${props.padding}px`,
            paddingRight: `${props.padding}px`,
            display: 'flex',
            alignItems: 'center',
            fontSize: `${props.titleFont}px`,
            fontWeight: 700,
            flex: '0 0 auto',
          }}
        >
          {props.title}
        </div>

        <div style={{ flex: '1 1 auto', overflow: 'hidden' }}>
          {entries.map((entry) => {
            if (entry.kind === 'group') {
              return (
                <div
                  key={entry.key}
                  style={{
                    height: `${props.groupHeight}px`,
                    paddingLeft: `${props.padding}px`,
                    paddingRight: `${props.padding}px`,
                    display: 'flex',
                    alignItems: 'center',
                    background: colors.groupBg,
                    color: colors.groupFg,
                    borderBottom: `1px solid ${colors.groupRule}`,
                    fontSize: `${props.groupFont}px`,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {entry.label}
                </div>
              )
            }

            const selected = rowIndex.get(entry.key) === selectedIndex

            return (
              <MenuRow
                key={entry.key}
                entry={entry}
                selected={selected}
                colors={colors}
                height={props.rowHeight}
                font={props.rowFont}
                padding={props.padding}
                iconSize={props.iconSize}
                iconUrl={props.iconUrl}
                switchUrl={props.switchUrl}
              />
            )
          })}
        </div>

        {props.footer ? (
          <div
            style={{
              height: `${props.footerHeight}px`,
              paddingLeft: `${props.padding}px`,
              paddingRight: `${props.padding}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              color: colors.mutedFg,
              fontSize: `${props.footerFont}px`,
              fontWeight: 700,
              flex: '0 0 auto',
            }}
          >
            {props.footer}
          </div>
        ) : null}
      </div>
    </>
  )
}

function MenuRow({
  entry,
  selected,
  colors,
  height,
  font,
  padding,
  iconSize,
  iconUrl,
  switchUrl,
}: {
  entry: Extract<MenuEntry, { kind: 'row' }>
  selected: boolean
  colors: MenuColors
  height: number
  font: number
  padding: number
  iconSize: number
  iconUrl?: ((name: string) => string) | undefined
  switchUrl?: ((on: boolean) => string) | undefined
}) {
  const fg = selected ? colors.selectedFg : colors.fg

  const style: CSSProperties = {
    height: `${height}px`,
    paddingLeft: `${padding}px`,
    paddingRight: `${padding}px`,
    display: 'flex',
    alignItems: 'center',
    gap: `${font * 0.6}px`,
    fontSize: `${font}px`,
    color: fg,
    background: selected ? colors.selectedBg : undefined,
    borderBottom: `1px solid ${selected ? 'transparent' : colors.rowRule}`,
    boxSizing: 'border-box',
  }

  return (
    <div style={style} role="menuitem" data-selected={selected || undefined}>
      {entry.icon && iconUrl ? (
        <span
          style={{
            width: `${iconSize}px`,
            height: `${iconSize}px`,
            flex: '0 0 auto',
            // Masked rather than an <img>, so the icon takes the row's colour and inverts with
            // the selection.
            background: fg,
            maskImage: `url(${iconUrl(entry.icon)})`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskImage: `url(${iconUrl(entry.icon)})`,
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
          }}
        />
      ) : null}

      <span style={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {entry.label}
      </span>

      {entry.toggle && switchUrl ? (
        <img
          src={switchUrl(!!entry.on)}
          alt={entry.on ? 'on' : 'off'}
          style={{ height: `${font * 1.25}px`, flex: '0 0 auto' }}
        />
      ) : null}

      {entry.button ? (
        <span
          style={{
            padding: `${font * 0.15}px ${font * 0.6}px`,
            border: `2px solid ${selected ? colors.selectedFg : '#666666'}`,
            borderRadius: '5px',
            background: selected ? colors.selectedFg : 'transparent',
            color: selected ? colors.selectedBg : fg,
            flex: '0 0 auto',
          }}
        >
          {entry.value}
        </span>
      ) : entry.value && !entry.toggle ? (
        <span style={{ color: selected ? fg : colors.mutedFg, flex: '0 0 auto' }}>
          {entry.value}
        </span>
      ) : null}
    </div>
  )
}
