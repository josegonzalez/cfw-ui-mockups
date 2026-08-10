import { DeviceFrame } from '../../device/DeviceFrame'
import { ExampleOs } from '../../themes/example-cfw'
import { HERO } from './content'
import { StatRow } from './StatRow'

/**
 * Leads with a real screen in a real bezel.
 *
 * The most product-like of the four, and the only one that shows the actual thing rather than a
 * picture of it - the frame on the right is the same component the gallery mounts, rendering
 * the same theme.
 *
 * Deliberately not interactive. An interactive frame would attach a global key listener that
 * swallows the arrow keys, so the page would stop scrolling with the keyboard.
 */
export function DeviceHero() {
  return (
    <header className="gal__hero hero-device">
      <div className="hero-device__copy">
        <span className="gal__eyebrow">
          <span className="gal__blip" aria-hidden="true" />
          {HERO.eyebrow}
        </span>

        <h1 className="gal__title hero-device__title">
          {HERO.headline.lead}
          <em>{HERO.headline.accent}</em>
          {HERO.headline.tail}
        </h1>

        <p className="gal__lede">{HERO.ledeShort}</p>

        <div className="hero-device__actions">
          <a className="gal-btn gal-btn--primary" href="#example-cfw/rg35xx/interactive">
            Try a live screen
          </a>
          <a className="gal-btn" href="#themes-heading">
            See the sets
          </a>
        </div>
      </div>

      <div className="hero-device__stage" aria-hidden="true">
        <DeviceFrame device="rg35xx" animate={false} interactive={false} scale={0.76}>
          <ExampleOs view="main-menu" />
        </DeviceFrame>
      </div>

      <div className="hero-device__stats">
        <StatRow />
      </div>
    </header>
  )
}
