import type { CSSProperties } from 'react'
import { place, type Box } from '../../layout/box'
import { useWebEffects } from '../../render/RenderModeProvider'

/**
 * How a scrim is drawn.
 *
 * - `mask`  - a flat colour shown through a soft mask, so the tint fades where the mask does.
 * - `image` - a pre-composited overlay image, drawn as-is.
 * - `wash`  - a plain gradient or flat colour with no mask at all.
 */
export type ScrimMode = 'mask' | 'image' | 'wash'

export interface ScrimProps {
  readonly box: Box
  readonly mode: ScrimMode
  /** The tint for `mask` and `wash`. */
  readonly color?: string | undefined
  /** The mask for `mask` mode, or the overlay for `image` mode. */
  readonly src?: string | undefined
  readonly opacity?: number | undefined
  readonly z?: number | undefined
  /** Mirrors the mask horizontally, for a pair of opposing edge fades. */
  readonly flipX?: boolean | undefined
  readonly className?: string | undefined
}

/**
 * A tint over the screen, softened by a mask.
 *
 * Every theme in the repo darkens part of a screen so text stays legible over artwork, and each
 * does it differently: one masks a flat colour, one composites an overlay image, one lays down
 * a plain gradient.
 *
 * **Fallback.** `mask` needs arbitrary image masking, which a simple renderer may not have. In
 * fallback mode the mask is dropped and the tint is drawn as a soft gradient instead - the
 * screen stays legible, and it fails toward "slightly wrong shading" rather than toward a solid
 * block over the content. That specific failure is not hypothetical: an unmasked tint that
 * inherited its colour once painted solid over every view in this theme.
 */
export function Scrim({
  box,
  mode,
  color,
  src,
  opacity,
  z,
  flipX = false,
  className,
}: ScrimProps) {
  const webEffects = useWebEffects()

  const style: CSSProperties = {
    ...place(box),
    pointerEvents: 'none',
    ...(opacity != null ? { opacity } : {}),
    ...(z != null ? { zIndex: z } : {}),
  }

  if (mode === 'image' && src) {
    style.backgroundImage = `url(${src})`
    style.backgroundSize = '100% 100%'
  } else if (mode === 'mask' && src && webEffects) {
    style.background = color
    style.maskImage = `url(${src})`
    style.maskSize = '100% 100%'
    style.WebkitMaskImage = `url(${src})`
    style.WebkitMaskSize = '100% 100%'
    if (flipX) style.transform = 'scaleX(-1)'
  } else if (mode === 'mask' && color) {
    // No masking available: a soft gradient in the same colour, rather than a solid sheet.
    style.background = `linear-gradient(to bottom, ${color}, transparent)`
    if (flipX) style.transform = 'scaleX(-1)'
  } else {
    style.background = color
    if (flipX) style.transform = 'scaleX(-1)'
  }

  return <div className={className} style={style} data-widget="Scrim" aria-hidden="true" />
}
