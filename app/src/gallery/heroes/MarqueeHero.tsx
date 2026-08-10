import { HERO } from './content'
import { StatRow } from './StatRow'

/**
 * An arcade cabinet marquee.
 *
 * The most stylised of the four: centred, heavily scanlined, with the split-channel fringe of a
 * misconverged CRT. The fringe is a text-shadow rather than a filter so it stays crisp at any
 * size, and it is dropped under `prefers-reduced-motion` along with the flicker.
 */
export function MarqueeHero() {
  return (
    <header className="gal__hero hero-marquee">
      <div className="hero-marquee__cab">
        <span className="gal__eyebrow hero-marquee__eyebrow">{HERO.eyebrow}</span>

        <h1 className="gal__title hero-marquee__title">
          <span className="hero-marquee__line">The screens on your</span>
          <span className="hero-marquee__line hero-marquee__line--big">handheld</span>
          <span className="hero-marquee__line">rebuilt pixel for pixel</span>
        </h1>

        <div className="hero-marquee__glass" aria-hidden="true" />
      </div>

      <p className="gal__lede hero-marquee__lede">{HERO.lede}</p>

      <StatRow />
    </header>
  )
}
