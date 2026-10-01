import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { getDevice, panelCount, panelGap } from '../device/devices'
import { ViewOverridesProvider, type ViewOverrides } from '../device/ViewOverrides'
import type { ScreenRoute } from '../routes'

/*
 * A still is the live build with motion settled - the same rule the screenshot suite keeps - so
 * a tile can never drift from the screen it links to. Silent and bezel-less on top, because a
 * wall of twelve device bodies would compare the hardware rather than the view.
 */
const TILE_OVERRIDES: ViewOverrides = { animate: false, sound: false, bare: true }

/** How far outside the viewport a tile starts rendering, so scrolling rarely meets a blank. */
const ROOT_MARGIN = '600px 0px'

export interface LazyStillProps {
  readonly route: ScreenRoute
  /** The tile's width in CSS pixels. The height follows the device's own aspect. */
  readonly width: number
}

/** The screen's own size, both panels and the hinge included on a clamshell. */
export function nativeSize(route: Pick<ScreenRoute, 'device'>): { w: number; h: number } {
  const info = getDevice(route.device)
  return { w: info.w, h: info.h * panelCount(info.shell) + panelGap(info.shell) }
}

/**
 * One screen, scaled down to a tile, mounted only once it is near the viewport.
 *
 * The comparison page for a common type holds forty-odd screens, each a full React tree with its
 * own fonts and art. Mounting them all up front costs seconds before the first one paints, so a
 * tile is a sized placeholder until it scrolls close. Once mounted it stays mounted: unmounting
 * on the way back up would pay the cost again for a screen that has not changed.
 *
 * Laid out at native size and scaled with a transform, the same as the device frame does, so
 * every internal dimension stays the one the source specifies.
 */
export function LazyStill({ route, width }: LazyStillProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const { w, h } = nativeSize(route)
  const scale = width / w

  useEffect(() => {
    const el = ref.current
    // No observer (jsdom, a very old engine): stay a placeholder rather than mount everything.
    if (!el || mounted || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true)
          observer.disconnect()
        }
      },
      { rootMargin: ROOT_MARGIN },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [mounted])

  const frame = { width, height: Math.round(h * scale) } as CSSProperties
  const inner = {
    width: w,
    height: h,
    transform: `scale(${scale})`,
  } as CSSProperties

  return (
    <div ref={ref} className="gal-still" style={frame} data-mounted={mounted ? 'true' : 'false'}>
      {mounted ? (
        <div className="gal-still__inner" style={inner} aria-hidden="true">
          <ViewOverridesProvider overrides={TILE_OVERRIDES}>{route.render()}</ViewOverridesProvider>
        </div>
      ) : null}
    </div>
  )
}
