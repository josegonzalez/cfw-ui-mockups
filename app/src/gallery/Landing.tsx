import type { CSSProperties } from 'react'
import { DEVICES } from '../device/devices'
import { SCREEN_MANIFEST, screenId } from '../themes/manifest'
import { THEMES, catalogueTotals, type ThemeEntry } from '../themes/catalogue'
import { BootHero } from './heroes/BootHero'
import { DeviceHero } from './heroes/DeviceHero'
import { HeroSwitcher } from './heroes/HeroSwitcher'
import { MarqueeHero } from './heroes/MarqueeHero'
import { NeonHero } from './heroes/NeonHero'
import { useHeroVariant } from './heroes/useHeroVariant'
import type { HeroVariant } from './heroes/types'
import './gallery.css'
import './heroes/heroes.css'

const HEROES: Record<HeroVariant, () => React.ReactElement> = {
  neon: NeonHero,
  boot: BootHero,
  device: DeviceHero,
  marquee: MarqueeHero,
}

function ThemeCard({ theme }: { theme: ThemeEntry }) {
  const screens = SCREEN_MANIFEST.filter((s) => s.theme === theme.slug && !s.interactive)
  const live = SCREEN_MANIFEST.find((s) => s.theme === theme.slug && s.interactive)

  // The card carries its subject's accent, so four cards read as four different firmwares
  // rather than four rows of the same page.
  const style = {
    '--card-accent': theme.accent,
    '--card-accent-wash': `linear-gradient(155deg,
      color-mix(in srgb, ${theme.accent} 22%, #0b0d13),
      color-mix(in srgb, ${theme.accent} 6%, #0b0d13))`,
  } as CSSProperties

  return (
    <article className="gal-card" style={style} aria-labelledby={`theme-${theme.slug}`}>
      <div className="gal-card__art">
        <div className="gal-card__screen">
          <img className="gal-card__img" src={theme.preview} alt={theme.previewAlt} loading="lazy" />
        </div>
      </div>

      <div className="gal-card__body">
        <div className="gal-card__kicker">
          <span>{theme.kind}</span>
          {theme.author ? <span aria-hidden="true">·</span> : null}
          {theme.author ? <span>by {theme.author}</span> : null}
        </div>

        <h3 className="gal-card__name" id={`theme-${theme.slug}`}>
          {theme.name}
        </h3>

        <p className="gal-card__summary">{theme.summary}</p>

        <ul className="gal-card__list">
          {theme.highlights.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>

        <div className="gal-swatches" role="img" aria-label={`${theme.name} palette`}>
          {theme.swatches.map((hex) => (
            <span key={hex} className="gal-swatch" style={{ background: hex }} />
          ))}
        </div>

        <div className="gal-card__meta">
          <span className="gal-chip gal-chip--status">
            {theme.ported ? 'Interactive' : 'Archived'}
          </span>
          <span className="gal-chip">
            {theme.views} {theme.views === 1 ? 'view' : 'views'}
          </span>
          {theme.devices.map((slug) => (
            <span key={slug} className="gal-chip">
              {/* Model name only. The full label lists every variant, which wraps a card's
                  chip row onto three lines without telling you anything the resolution does
                  not. */}
              {DEVICES[slug].label.replace(/^(Anbernic|Trimui) /, '').split(' / ')[0]} ·{' '}
              {DEVICES[slug].w}x{DEVICES[slug].h}
            </span>
          ))}
          <span className="gal-chip">{theme.fonts.join(', ')}</span>
        </div>

        <div className="gal-card__actions">
          {live ? (
            <a className="gal-btn gal-btn--primary" href={`#${screenId(live)}`}>
              Open the live build
            </a>
          ) : (
            <a className="gal-btn gal-btn--primary" href={`/${theme.legacyPath}`}>
              Open the original
            </a>
          )}

          {screens.length > 0 ? (
            <a className="gal-btn" href={`#${screenId(screens[0]!)}`}>
              Browse screens
            </a>
          ) : null}

          <a className="gal-btn" href={`/${theme.docPath}`}>
            Read the notes
          </a>
        </div>
      </div>
    </article>
  )
}

export function Landing() {
  const totals = catalogueTotals()
  const { variant, setVariant } = useHeroVariant()
  const Hero = HEROES[variant]

  return (
    <div className="gal" data-hero={variant}>
      <div className="gal__inner">
        <Hero />

        <section className="gal__section" aria-labelledby="themes-heading">
          <div className="gal__section-head">
            <h2 className="gal__section-title" id="themes-heading">
              The sets
            </h2>
            <span className="gal__section-note">
              {totals.ported} of {totals.themes} rebuilt in React so far - the rest are archived and
              still render
            </span>
          </div>

          <div className="gal__themes">
            {THEMES.map((theme) => (
              <ThemeCard key={theme.slug} theme={theme} />
            ))}
          </div>
        </section>

        <section className="gal__section" aria-labelledby="screens-heading">
          <div className="gal__section-head">
            <h2 className="gal__section-title" id="screens-heading">
              Every screen
            </h2>
            <span className="gal__section-note">
              Enumerated from the route registry, so nothing can go missing
            </span>
          </div>

          <div className="gal__screens">
            {SCREEN_MANIFEST.map((screen) => (
              <a className="gal-screen-link" key={screenId(screen)} href={`#${screenId(screen)}`}>
                <span>
                  {THEMES.find((t) => t.slug === screen.theme)?.name ?? screen.theme} ·{' '}
                  {screen.title}
                </span>
                <span className="gal-screen-link__meta">{screen.device}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="gal__section" aria-labelledby="about-heading">
          <div className="gal__section-head">
            <h2 className="gal__section-title" id="about-heading">
              What this is
            </h2>
          </div>

          <div className="gal__notes">
            <div className="gal__note">
              <h3>Specs, not firmware</h3>
              <p>
                Nothing here ships to a device. Each screen is a visual and interaction reference,
                built by reading the firmware's own source - its theme format, its layout
                definitions, its animation timings - rather than by eyeballing a screenshot.
              </p>
            </div>
            <div className="gal__note">
              <h3>Native resolution, then scaled</h3>
              <p>
                A screen lays out at the device's real pixel size and only the bezel is scaled for
                viewing. A 480x320 panel and a 1920x1152 one sit side by side on a desktop with
                every internal dimension still exact.
              </p>
            </div>
            <div className="gal__note">
              <h3>Motion is part of the spec</h3>
              <p>
                Transitions are reproduced rather than described: carousel easing, selection
                growth, boot fades and hold-to-power-off, at the durations read out of the source.
              </p>
            </div>
            <div className="gal__note">
              <h3>Built to be ported again</h3>
              <p>
                The screens are assembled from a shared widget vocabulary written to survive a
                renderer with no CSS and no DOM, so this can become a firmware UI toolkit rather
                than stopping at a web page.
              </p>
            </div>
          </div>
        </section>

        <footer className="gal__footer">
          Every set reproduces someone else's work. Elementerial is by mluizvitor, PlayStation X by
          pajarorrojo, Vitro Launcher by KevDoy. Documentation lives in{' '}
          <a href="/docs/README.md">docs/</a>; the original vanilla-JS mockups are archived under{' '}
          <a href="/legacy/index.html">legacy/</a> and still render.
        </footer>
      </div>

      <HeroSwitcher variant={variant} onChange={setVariant} />
    </div>
  )
}
