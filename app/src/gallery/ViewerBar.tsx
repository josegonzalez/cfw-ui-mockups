import type { CSSProperties } from 'react'
import { DEVICES } from '../device/devices'
import { SCREEN_MANIFEST, screenId, type ScreenManifestEntry } from '../themes/manifest'
import { THEMES } from '../themes/catalogue'
import { SCREEN_TYPES, UI_ELEMENTS } from '../themes/taxonomy'
import { sameTypeElsewhere, viewsHref } from '../themes/views'

/**
 * Devices this screen also exists on.
 *
 * Same theme, same screen, different panel - which is the comparison the whole repo is for. A
 * 640x480 layout is not a 1280x720 layout, and seeing that costs nothing if switching is one
 * click rather than a trip back to the index.
 */
export function siblingDevices(route: ScreenManifestEntry): ScreenManifestEntry[] {
  return SCREEN_MANIFEST.filter((s) => s.theme === route.theme && s.screen === route.screen).sort(
    (a, b) => DEVICES[a.device].w * DEVICES[a.device].h - DEVICES[b.device].w * DEVICES[b.device].h,
  )
}

export interface ViewerBarProps {
  readonly route: ScreenManifestEntry
}

/**
 * The chrome above a screen: where you are, what kind of screen it is, what else it runs on,
 * how other sets draw the same view, and how to drive it.
 */
export function ViewerBar({ route }: ViewerBarProps) {
  const theme = THEMES.find((t) => t.slug === route.theme)
  const siblings = siblingDevices(route)
  const elsewhere = sameTypeElsewhere(route)

  return (
    <div className="gal-viewer__chrome">
      <div className="gal-viewer__bar">
        <a className="gal-btn" href="#">
          All sets
        </a>
        <a className="gal-btn" href={viewsHref()}>
          Compare views
        </a>

        <span className="gal-viewer__title">
          {theme?.name ?? route.theme} · {route.title}
        </span>

        {route.types.length + route.elements.length > 0 ? (
          <div className="gal-tags" role="group" aria-label="Tags">
            {route.types.map((slug) => (
              <a key={slug} className="gal-tag gal-tag--type" href={viewsHref('type', slug)}>
                {SCREEN_TYPES[slug].label}
              </a>
            ))}
            {route.elements.map((slug) => (
              <a key={slug} className="gal-tag gal-tag--element" href={viewsHref('element', slug)}>
                {UI_ELEMENTS[slug].label}
              </a>
            ))}
          </div>
        ) : null}

        <span className="gal-viewer__hint">
          {/* A console draws to a television and has no cluster to click, so it says so. */}
          {route.interactive
            ? DEVICES[route.device].shell.layout === 'console'
              ? 'arrows to move, Z is A, X is B'
              : 'arrows to move, Z is A, X is B - or click the buttons'
            : 'static snapshot'}
        </span>
      </div>

      {siblings.length > 1 ? (
        <div className="gal-viewer__row">
          <span className="gal-viewer__label">Device</span>
          <div className="gal-devices" role="group" aria-label="Device">
            {siblings.map((sibling) => {
              const device = DEVICES[sibling.device]
              const current = sibling.device === route.device

              return (
                <a
                  key={sibling.device}
                  className={current ? 'gal-devices__opt gal-devices__opt--on' : 'gal-devices__opt'}
                  href={`#${screenId(sibling)}`}
                  aria-current={current ? 'true' : undefined}
                  title={`${device.label} - ${device.w}x${device.h}, ${device.aspect}`}
                >
                  {device.label.replace(/^(Anbernic|Trimui) /, '').split(' / ')[0]}
                  <span className="gal-devices__res">
                    {device.w}x{device.h}
                  </span>
                </a>
              )
            })}
          </div>
        </div>
      ) : null}

      {elsewhere.length > 0 ? (
        <div className="gal-viewer__row">
          <span className="gal-viewer__label">Same view in</span>
          <div className="gal-devices" role="group" aria-label="Same view in other sets">
            {elsewhere.map((other) => {
              const set = THEMES.find((t) => t.slug === other.theme)
              return (
                <a
                  key={other.theme}
                  className="gal-devices__opt"
                  href={`#${screenId(other)}`}
                  title={`${set?.name ?? other.theme} · ${other.title}`}
                >
                  <span
                    className="gal-views__dot"
                    style={{ background: set?.accent } as CSSProperties}
                  />
                  {set?.name ?? other.theme}
                </a>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
