import { place, type Box } from '../../layout/box'

/**
 * One item in the status cluster.
 *
 * A discriminated union rather than an open shape, so the set of things a status bar can show
 * stays enumerable. The three themes between them show icons, plain text, and a drawn battery.
 */
export type StatusItem =
  | { readonly kind: 'icon'; readonly key: string; readonly src: string; readonly alt: string }
  | { readonly kind: 'text'; readonly key: string; readonly text: string; readonly color?: string | undefined }
  | {
      readonly kind: 'battery'
      readonly key: string
      /** 0 to 100. */
      readonly percent: number
      readonly charging?: boolean | undefined
    }

export interface BatteryColors {
  readonly shell: string
  readonly fill: string
  /** Applied below `lowThreshold`. Falls back to `fill`. */
  readonly lowFill?: string | undefined
  readonly chargingFill?: string | undefined
}

export interface StatusIndicatorsProps {
  readonly box: Box
  readonly items: readonly StatusItem[]
  /** Icon and battery height in device pixels. */
  readonly size: number
  readonly gap: number
  readonly font?: number | undefined
  readonly color?: string | undefined
  readonly battery?: BatteryColors | undefined
  readonly lowThreshold?: number | undefined
  readonly align?: 'left' | 'right' | undefined
}

/** A drawn battery, for themes that do not ship a battery image. */
function Battery({
  percent,
  charging = false,
  height,
  colors,
  low,
}: {
  percent: number
  charging?: boolean | undefined
  height: number
  colors: BatteryColors
  low: number
}) {
  const width = height * 1.9
  const clamped = Math.max(0, Math.min(100, percent))
  const fill = charging
    ? (colors.chargingFill ?? colors.fill)
    : clamped <= low
      ? (colors.lowFill ?? colors.fill)
      : colors.fill

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${height * 0.12}px`,
        flex: '0 0 auto',
      }}
      aria-label={`battery ${clamped}%`}
    >
      <span
        style={{
          position: 'relative',
          width: `${width}px`,
          height: `${height}px`,
          border: `${Math.max(1, height * 0.09)}px solid ${colors.shell}`,
          borderRadius: `${height * 0.2}px`,
          boxSizing: 'border-box',
          padding: `${height * 0.12}px`,
        }}
      >
        <span
          style={{
            display: 'block',
            width: `${clamped}%`,
            height: '100%',
            background: fill,
            borderRadius: `${height * 0.08}px`,
          }}
        />
      </span>
      <span
        style={{
          width: `${height * 0.12}px`,
          height: `${height * 0.4}px`,
          background: colors.shell,
          borderRadius: `0 ${height * 0.08}px ${height * 0.08}px 0`,
        }}
      />
    </span>
  )
}

/**
 * The status cluster: wifi, battery, and whatever else a theme puts in its corner.
 *
 * Themes that ship artwork for these pass `icon` items and get their own assets; themes that do
 * not pass a `battery` item and get one drawn to the same dimensions.
 */
export function StatusIndicators({
  box,
  items,
  size,
  gap,
  font,
  color,
  battery,
  lowThreshold = 20,
  align = 'right',
}: StatusIndicatorsProps) {
  return (
    <div
      style={{
        ...place(box),
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        gap: `${gap}px`,
        color,
        fontSize: font ? `${font}px` : undefined,
        whiteSpace: 'nowrap',
      }}
      data-widget="StatusIndicators"
    >
      {items.map((item) => {
        if (item.kind === 'icon') {
          return (
            <img
              key={item.key}
              src={item.src}
              alt={item.alt}
              style={{ height: `${size}px`, width: 'auto', flex: '0 0 auto' }}
            />
          )
        }
        if (item.kind === 'text') {
          return (
            <span key={item.key} style={{ color: item.color ?? color, flex: '0 0 auto' }}>
              {item.text}
            </span>
          )
        }
        return (
          <Battery
            key={item.key}
            percent={item.percent}
            charging={item.charging}
            height={size}
            colors={battery ?? { shell: color ?? '#ffffff', fill: color ?? '#ffffff' }}
            low={lowThreshold}
          />
        )
      })}
    </div>
  )
}
