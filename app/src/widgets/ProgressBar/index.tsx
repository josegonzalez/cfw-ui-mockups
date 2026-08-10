import { place, type Box } from '../../layout/box'

export interface ProgressBarProps {
  readonly box: Box
  /** 0 to 1. Values outside the range are clamped rather than overflowing the track. */
  readonly value: number
  readonly trackColor: string
  readonly fillColor: string
  /** A second fill colour makes the bar a gradient, which two of the sources use. */
  readonly fillColorEnd?: string | undefined
  readonly radius?: number | undefined
  readonly className?: string | undefined
}

/**
 * A determinate progress bar.
 *
 * Clamped rather than trusting its input: a boot progress that briefly reports 1.02 would draw
 * a fill wider than its track and, with a radius, a visibly wrong shape at the right end.
 *
 * The fill is a width rather than a transform, because the rounded right end has to travel with
 * it. A scaled fill would stretch the corner radius along with the bar.
 */
export function ProgressBar({
  box,
  value,
  trackColor,
  fillColor,
  fillColorEnd,
  radius,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value))
  const corner = radius ?? box.height / 2

  return (
    <div
      className={className}
      style={{
        ...place(box),
        background: trackColor,
        borderRadius: `${corner}px`,
        overflow: 'hidden',
      }}
      data-widget="ProgressBar"
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          borderRadius: `${corner}px`,
          background: fillColorEnd
            ? `linear-gradient(to right, ${fillColor}, ${fillColorEnd})`
            : fillColor,
        }}
        data-part="fill"
      />
    </div>
  )
}
