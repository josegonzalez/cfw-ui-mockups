import type { CSSProperties } from 'react'
import { transitionsToCss } from '../../anim/waapi'
import type { EasingName } from '../../anim/types'

export interface CarouselItem {
  readonly key: string
  readonly src: string
  readonly alt: string
}

export interface CarouselProps {
  /** The carousel box, which is usually wider than the screen so the row bleeds off both edges. */
  readonly box: { left: number; top: number; width: number; height: number }
  readonly items: readonly CarouselItem[]
  readonly selectedIndex: number
  /** Distance between one item's cell and the next, in device pixels. */
  readonly pitch: number
  /** Cell size for an unselected item. */
  readonly itemWidth: number
  readonly itemHeight: number
  /** Top-left of the selected item's cell, relative to the carousel box. */
  readonly selectedLeft: number
  readonly selectedTop: number
  /** How much the selected item grows, about its own centre. */
  readonly selectedScale?: number | undefined
  /** Opacity of the items either side. */
  readonly restOpacity?: number | undefined
  readonly transitionMs?: number | undefined
  readonly easing?: EasingName | undefined
  readonly z?: number | undefined
  readonly className?: string | undefined
  readonly itemClassName?: string | undefined
}

/**
 * A horizontal strip of items with one selected in place.
 *
 * The strip moves, not the selection: the selected item stays at a fixed point on screen and the
 * row slides underneath it. That is what makes the neighbours visible at both edges, and why the
 * box is deliberately wider than the screen.
 *
 * Selection is expressed as scale and opacity rather than as a separate highlight, because the
 * selected item is genuinely larger and brighter in the sources - drawing a box around it
 * instead would be a different design.
 */
export function Carousel({
  box,
  items,
  selectedIndex,
  pitch,
  itemWidth,
  itemHeight,
  selectedLeft,
  selectedTop,
  selectedScale = 1,
  restOpacity = 1,
  transitionMs = 0,
  easing = 'linear',
  z,
  className,
  itemClassName,
}: CarouselProps) {
  const motion = transitionMs
    ? transitionsToCss([
        { property: 'transform', duration: transitionMs, easing },
        { property: 'opacity', duration: transitionMs, easing },
      ])
    : undefined

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        left: `${box.left}px`,
        top: `${box.top}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
        overflow: 'hidden',
        ...(z != null ? { zIndex: z } : {}),
      }}
      data-widget="Carousel"
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          // The strip slides so that item `selectedIndex` lands on the selected cell.
          transform: `translateX(${-selectedIndex * pitch}px)`,
          ...(motion ? { transition: motion } : {}),
        }}
        data-part="strip"
      >
        {items.map((item, index) => {
          const selected = index === selectedIndex
          const style: CSSProperties = {
            position: 'absolute',
            left: `${selectedLeft + index * pitch}px`,
            top: `${selectedTop}px`,
            width: `${itemWidth}px`,
            height: `${itemHeight}px`,
            objectFit: 'contain',
            transformOrigin: 'center center',
            transform: `scale(${selected ? selectedScale : 1})`,
            opacity: selected ? 1 : restOpacity,
            ...(motion ? { transition: motion } : {}),
          }

          return (
            <img
              key={item.key}
              className={itemClassName}
              src={item.src}
              alt={item.alt}
              style={style}
              data-selected={selected || undefined}
            />
          )
        })}
      </div>
    </div>
  )
}
