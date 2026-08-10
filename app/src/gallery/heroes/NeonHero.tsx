import { HERO } from './content'
import { StatRow } from './StatRow'

/**
 * Big type on a phosphor bloom.
 *
 * The loudest headline of the four and the least context - it says what this is and trusts the
 * cards below to show it.
 */
export function NeonHero() {
  return (
    <header className="gal__hero hero-neon">
      <span className="gal__eyebrow">
        <span className="gal__blip" aria-hidden="true" />
        {HERO.eyebrow}
      </span>

      <h1 className="gal__title">
        {HERO.headline.lead}
        <em>{HERO.headline.accent}</em>
        {HERO.headline.tail}
      </h1>

      <p className="gal__lede">{HERO.lede}</p>

      <StatRow />
    </header>
  )
}
