import type { CSSProperties } from 'react'

export interface AnchoredBoxSpec {
  /** The anchor point on screen, in device pixels. */
  readonly posX: number
  readonly posY: number
  /** Fraction of the element's *own* size that sits on the anchor. */
  readonly originX: number
  readonly originY: number
  readonly maxWidth: number
  readonly maxHeight: number
  readonly radius?: number | undefined
  readonly z?: number | undefined
}

export interface AnchoredImageProps {
  readonly box: AnchoredBoxSpec
  readonly src: string
  readonly alt: string
  readonly className?: string | undefined
  readonly style?: CSSProperties | undefined
}

/**
 * An image scaled to fit a slot, then shrunk to the size it actually became.
 *
 * This is not the same as a fixed box with `object-fit: contain`, and the difference is visible.
 * `contain` keeps the box at its declared size and letterboxes the image inside it, so an
 * anchor lands on the padding and a corner radius rounds the empty box. Sizing by `max-width`
 * and `max-height` instead lets the element shrink to the fitted image, so the anchor and the
 * radius act on the artwork's own edges.
 *
 * Both source themes that use this position artwork by anchor, so getting it wrong shifts every
 * marquee and cover by half its letterbox.
 */
export function AnchoredImage({ box, src, alt, className, style }: AnchoredImageProps) {
  const placed: CSSProperties = {
    position: 'absolute',
    left: `${box.posX}px`,
    top: `${box.posY}px`,
    maxWidth: `${box.maxWidth}px`,
    maxHeight: `${box.maxHeight}px`,
    width: 'auto',
    height: 'auto',
    transform: `translate(${-box.originX * 100}%, ${-box.originY * 100}%)`,
    ...(box.radius ? { borderRadius: `${box.radius}px` } : {}),
    ...(box.z != null ? { zIndex: box.z } : {}),
    ...style,
  }

  return <img className={className} src={src} alt={alt} style={placed} data-widget="AnchoredImage" />
}
