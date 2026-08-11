import type { CSSProperties, ReactNode } from 'react'
import { useWebEffects } from '../../render/RenderModeProvider'
import { place, type Box } from '../../layout/box'

export type GlassShape = 'stadium' | 'rounded'

export interface GlassPanelProps {
  /** Resolved pixels. Omit to fill the parent, which the nav pill and settings rows do. */
  readonly box?: Box | undefined
  /** `stadium` is a full-height pill; `rounded` takes an explicit radius. */
  readonly shape?: GlassShape
  readonly radius?: number | undefined
  /** Dark-on-light, which changes the shadow and the fallback fill. */
  readonly light?: boolean
  /**
   * The launcher's own Transparency setting. `false` is not the same as fallback mode: the user
   * asked for a solid panel, and the app has a designed look for it.
   */
  readonly transparent?: boolean
  /** `--fg-rgb`, for the outline the solid variant draws. */
  readonly inkRgb?: string
  readonly className?: string | undefined
  readonly children?: ReactNode
}

/**
 * A frosted glass panel.
 *
 * Vitro's whole chrome is these - the status pill, the nav pill and every settings row - and they
 * genuinely sample the animated background beneath them rather than approximating it with a
 * translucent fill.
 *
 * There are two separate reasons this can turn solid, and keeping them apart matters. The user's
 * **Transparency** setting is a real launcher option with a look the app itself ships
 * (`.no-transparency .glass`), so a solid panel is a correct rendering, not a degraded one.
 * **Fallback mode** is the renderer saying it has no blur to give; it borrows the same solid look
 * because the source already designed one, which is the happiest kind of fallback - authored
 * upstream rather than invented here.
 */
export function GlassPanel({
  box,
  shape = 'stadium',
  radius,
  light = false,
  transparent = true,
  inkRgb = '255,255,255',
  className,
  children,
}: GlassPanelProps) {
  const canBlur = useWebEffects()
  const frosted = transparent && canBlur

  const corner =
    shape === 'stadium' ? '999px' : `${radius ?? (box ? Math.min(box.width, box.height) * 0.2 : 12)}px`

  const style: CSSProperties = {
    ...(box ? place(box) : { position: 'absolute', inset: 0 }),
    borderRadius: corner,
    ...(frosted
      ? {
          background:
            'linear-gradient(to bottom, rgba(255,255,255,0.13), rgba(255,255,255,0.23))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: light
            ? '0 1.5px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.5)'
            : '0 3px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 0 0 1px rgba(255,255,255,0.10)',
        }
      : {
          background: light
            ? 'linear-gradient(to bottom, #f4f4f6, #dddee2)'
            : 'linear-gradient(to bottom, #333337, #202022)',
          outline: `1px solid rgba(${inkRgb}, 0.5)`,
          outlineOffset: '-1px',
        }),
  }

  return (
    <div className={className} style={style} data-widget="GlassPanel" data-frosted={frosted || undefined}>
      {children}
    </div>
  )
}
