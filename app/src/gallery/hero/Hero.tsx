import { DeviceFrame } from '../../device/DeviceFrame'
import { DeviceShowcase } from './DeviceShowcase'
import { HERO } from './content'
import { StatRow } from './StatRow'

/**
 * The page's hero: a real device, booting.
 *
 * The frame on the right is the same component the gallery mounts, running the same theme - so
 * the hero shows the actual thing rather than a picture of it. It plays the sequence the
 * hardware does: a console on the panel, then the launcher.
 *
 * Deliberately not interactive. An interactive frame would attach a global key listener that
 * swallows the arrow keys, so the page would stop scrolling with the keyboard.
 */
export function Hero() {
  return (
    <header className="gal__hero hero">
      <div className="hero__copy">
        <span className="gal__eyebrow">
          <span className="gal__blip" aria-hidden="true" />
          {HERO.eyebrow}
        </span>

        <h1 className="gal__title hero__title">
          {HERO.headline.lead}
          <em>{HERO.headline.accent}</em>
          {HERO.headline.tail}
        </h1>

        <p className="gal__lede">{HERO.lede}</p>

        <div className="hero__actions">
          <a className="gal-btn gal-btn--primary" href="#example-cfw/rg35xx/interactive">
            Try a live screen
          </a>
          <a className="gal-btn" href="#themes-heading">
            See the sets
          </a>
        </div>
      </div>

      <div className="hero__stage" aria-hidden="true">
        <DeviceFrame device="rg35xx" animate={false} interactive={false} scale={0.76}>
          <DeviceShowcase />
        </DeviceFrame>
      </div>

      <div className="hero__stats">
        <StatRow />
      </div>
    </header>
  )
}
