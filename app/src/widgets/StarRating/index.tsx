import { place, type Box } from '../../layout/box'

export interface StarRatingProps {
  /** Top-left of the row of stars. */
  readonly box: Pick<Box, 'left' | 'top'>
  /** 0 to 1. */
  readonly rating: number
  /** Height of one star, in device pixels. */
  readonly size: number
  readonly color: string
  readonly count?: number | undefined
  /** Inline SVG for a filled and an empty star. */
  readonly filledSvg: string
  readonly emptySvg: string
  readonly z?: number | undefined
}

/**
 * Whether star `index` is filled for a 0-1 rating.
 *
 * The epsilon matters: without it a rating of exactly 0.8 leaves the fourth of five stars empty
 * through floating-point error, on one of the commonest ratings there is.
 */
export function isStarFilled(rating: number, index: number, count = 5): boolean {
  return rating >= (index + 1) / count - 0.001
}

/**
 * A row of rating stars.
 *
 * The star artwork is passed in as inline SVG rather than referenced as a file, so it can be
 * tinted with the theme's accent - a themed star has to take its colour from the palette, and an
 * `<img>` cannot.
 */
export function StarRating({
  box,
  rating,
  size,
  color,
  count = 5,
  filledSvg,
  emptySvg,
  z,
}: StarRatingProps) {
  return (
    <div
      style={{
        ...place({ left: box.left, top: box.top, width: size * count, height: size }),
        display: 'flex',
        fill: color,
        ...(z != null ? { zIndex: z } : {}),
      }}
      data-widget="StarRating"
      role="img"
      aria-label={`${Math.round(rating * count)} out of ${count}`}
    >
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          style={{ width: `${size}px`, height: `${size}px`, display: 'block' }}
          // Inline SVG so `fill` above tints it. First-party artwork from the theme's own files.
          dangerouslySetInnerHTML={{
            __html: isStarFilled(rating, index, count) ? filledSvg : emptySvg,
          }}
        />
      ))}
    </div>
  )
}
