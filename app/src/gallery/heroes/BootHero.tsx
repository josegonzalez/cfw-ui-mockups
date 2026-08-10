import { catalogueTotals } from '../../themes/catalogue'
import { HERO } from './content'
import { StatRow } from './StatRow'

/**
 * A firmware boot sequence, then the headline.
 *
 * The most on-theme of the four: booting one of these devices genuinely puts a log like this on
 * the panel before the launcher appears, so the page opens the way the hardware does.
 *
 * Every line is real - the counts come from the catalogue rather than being written in - because
 * a fake boot log that contradicts the page below it is worse than no boot log.
 */
export function BootHero() {
  const totals = catalogueTotals()

  const lines: Array<{ label: string; value: string; ok?: boolean }> = [
    { label: 'detecting panel', value: '640x480' },
    { label: 'loading themes', value: `${totals.themes} found` },
    { label: 'mounting widget kit', value: 'ok', ok: true },
    { label: 'resolving screens', value: `${totals.views} views` },
    { label: 'starting launcher', value: 'ok', ok: true },
  ]

  return (
    <header className="gal__hero hero-boot">
      <div className="hero-boot__panel" role="img" aria-label="Simulated firmware boot log">
        <div className="hero-boot__bar">
          <span className="hero-boot__dot" />
          <span>cfw-mockups</span>
          <span className="hero-boot__ver">v0.1.0</span>
        </div>

        <pre className="hero-boot__log">
          {lines.map((line, index) => (
            <span
              className="hero-boot__line"
              key={line.label}
              style={{ '--i': index } as React.CSSProperties}
            >
              <span className="hero-boot__prompt">&gt;</span> {line.label}
              <span className="hero-boot__dots" aria-hidden="true" />
              <span className={line.ok ? 'hero-boot__ok' : 'hero-boot__val'}>{line.value}</span>
            </span>
          ))}
          <span className="hero-boot__line" style={{ '--i': lines.length } as React.CSSProperties}>
            <span className="hero-boot__prompt">&gt;</span> ready
            <span className="hero-boot__caret" aria-hidden="true" />
          </span>
        </pre>
      </div>

      <h1 className="gal__title hero-boot__title">
        {HERO.headline.lead}
        <em>{HERO.headline.accent}</em>
        {HERO.headline.tail}
      </h1>

      <p className="gal__lede">{HERO.lede}</p>

      <StatRow />
    </header>
  )
}
