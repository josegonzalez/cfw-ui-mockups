import type { CSSProperties } from 'react'

/**
 * Resolved geometry.
 *
 * Every screen in this repo lays out at its device's exact pixel resolution, and every position
 * is computed up front rather than derived from CSS flow. That was already true of all three
 * original themes; portability rule 2 keeps it true, because a renderer with no layout engine
 * needs the rectangle handed to it.
 *
 * All values are device pixels.
 */
export interface Box {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
  /** Font size for text drawn in this box. */
  readonly font?: number
  readonly radius?: number
  readonly z?: number
}

/**
 * A box positioned by an anchor point rather than by its top-left corner.
 *
 * `origin` is the fraction of the element's own size that sits at (`posX`, `posY`) - so
 * `[0.5, 0.5]` centres it on that point. This exists because the source formats anchor
 * auto-sized images this way, and a fixed box with `object-fit: contain` is not the same thing:
 * the anchored version has no letterbox, so neighbouring elements sit against the image rather
 * than against its padding.
 */
export interface AnchoredBox {
  readonly posX: number
  readonly posY: number
  readonly originX: number
  readonly originY: number
  readonly maxWidth: number
  readonly maxHeight: number
  readonly font?: number
  readonly radius?: number
  readonly z?: number
}

/** Absolute style for a resolved box. */
export function place(box: Box): CSSProperties {
  const style: CSSProperties = {
    position: 'absolute',
    left: `${box.left}px`,
    top: `${box.top}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
  }
  if (box.font !== undefined) style.fontSize = `${box.font}px`
  if (box.radius !== undefined) style.borderRadius = `${box.radius}px`
  if (box.z !== undefined) style.zIndex = box.z
  return style
}

/**
 * Absolute style for an anchor-positioned, auto-sized element.
 *
 * The element sizes itself to its content within `maxWidth`/`maxHeight`, then shifts by its own
 * origin fraction. Note the translate is on the element's own size, which is why this cannot be
 * expressed as a plain box.
 */
export function placeAnchored(box: AnchoredBox): CSSProperties {
  const style: CSSProperties = {
    position: 'absolute',
    left: `${box.posX}px`,
    top: `${box.posY}px`,
    maxWidth: `${box.maxWidth}px`,
    maxHeight: `${box.maxHeight}px`,
    width: 'auto',
    height: 'auto',
    transform: `translate(${-box.originX * 100}%, ${-box.originY * 100}%)`,
  }
  if (box.font !== undefined) style.fontSize = `${box.font}px`
  if (box.radius !== undefined) style.borderRadius = `${box.radius}px`
  if (box.z !== undefined) style.zIndex = box.z
  return style
}

/**
 * Scale `natural` to fit inside `max` without distorting it.
 *
 * Used for assets whose aspect must be preserved when the slot they sit in has a different one.
 */
export function fitInto(
  maxW: number,
  maxH: number,
  naturalW: number,
  naturalH: number,
): { width: number; height: number } {
  if (naturalW <= 0 || naturalH <= 0) return { width: maxW, height: maxH }
  const scale = Math.min(maxW / naturalW, maxH / naturalH)
  return { width: naturalW * scale, height: naturalH * scale }
}

/**
 * The largest square fitting in a slot.
 *
 * Square assets - pictograms, flags, avatars - are authored with a single size fraction, but a
 * fraction of width and a fraction of height differ by nearly 2x on a 16:9 panel. Taking the
 * smaller keeps them square instead of stretching them.
 */
export function square(maxW: number, maxH: number): number {
  return Math.min(maxW, maxH)
}

/** Clamp a value into a range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
