import { useState, type CSSProperties } from 'react'
import { DEVICES } from '../device/devices'
import { THEMES } from '../themes/catalogue'
import { screenId } from '../themes/manifest'
import { ROUTES } from '../themes/registry'
import { findRoute } from '../routes'
import { SCREEN_TYPES, UI_ELEMENTS, facetTerms, type Facet } from '../themes/taxonomy'
import { facetSummary, screensFor, viewsHref, type ViewsTarget } from '../themes/views'
import { LazyStill } from './LazyStill'
import './gallery.css'

/** Tiles are a fixed width so a still's scale is known before it is laid out. */
const TILE_WIDTH = 288

function themeName(slug: string): string {
  return THEMES.find((t) => t.slug === slug)?.name ?? slug
}

function themeAccent(slug: string): string {
  return THEMES.find((t) => t.slug === slug)?.accent ?? '#4cc9f0'
}

export interface FacetCardProps {
  readonly facet: Facet
  readonly slug: string
}

/**
 * One term as a card: what it means, which sets have it, and how many screens. Shared by the
 * views index and the landing page, so the two entry points say the same thing.
 */
export function FacetCard({ facet, slug }: FacetCardProps) {
  const term = facetTerms(facet)[slug]!
  const summary = facetSummary(facet, slug)

  return (
    <a className="gal-facet-card" href={viewsHref(facet, slug)}>
      <span className="gal-facet-card__sets" aria-hidden="true">
        {summary.themes.map((theme) => (
          <span
            key={theme}
            className="gal-facet-card__set"
            style={{ background: themeAccent(theme) } as CSSProperties}
          />
        ))}
      </span>
      <span className="gal-facet-card__label">{term.label}</span>
      <span className="gal-facet-card__desc">{term.description}</span>
      <span className="gal-facet-card__meta">
        {summary.sets} {summary.sets === 1 ? 'set' : 'sets'} · {summary.screens}{' '}
        {summary.screens === 1 ? 'screen' : 'screens'}
      </span>
    </a>
  )
}

function FacetNav({ target }: { target: ViewsTarget }) {
  return (
    <nav className="gal-views__nav" aria-label="Facets">
      <div className="gal-views__facet">
        <h2 className="gal-views__facet-title">Screen type</h2>
        {Object.entries(SCREEN_TYPES).map(([slug, term]) => {
          const on = target.facet === 'type' && target.slug === slug
          return (
            <a
              key={slug}
              className={on ? 'gal-views__type gal-views__type--on' : 'gal-views__type'}
              href={viewsHref('type', slug)}
              aria-current={on ? 'page' : undefined}
            >
              <span>{term.label}</span>
              <span className="gal-views__count">{facetSummary('type', slug).sets} sets</span>
            </a>
          )
        })}
      </div>

      <div className="gal-views__facet">
        <h2 className="gal-views__facet-title">UI element</h2>
        <div className="gal-views__elements">
          {Object.entries(UI_ELEMENTS).map(([slug, term]) => {
            const on = target.facet === 'element' && target.slug === slug
            return (
              <a
                key={slug}
                className={on ? 'gal-views__element gal-views__element--on' : 'gal-views__element'}
                href={viewsHref('element', slug)}
                aria-current={on ? 'page' : undefined}
              >
                {term.label}
              </a>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

function Comparison({ facet, slug }: { facet: Facet; slug: string }) {
  const term = facetTerms(facet)[slug]!
  const screens = screensFor(facet, slug)
  const themes = [...new Set(screens.map((s) => s.theme))]
  // Sets switched off. Local only: a filter is a way of looking, not a place worth a URL.
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set())

  const toggle = (theme: string) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(theme)) next.delete(theme)
      else next.add(theme)
      return next
    })

  return (
    <>
      <div className="gal-views__head">
        <h1 className="gal-views__title">{term.label}</h1>
        <p className="gal-views__desc">{term.description}</p>
      </div>

      <div className="gal-views__sets" role="group" aria-label="Sets">
        {themes.map((theme) => {
          const on = !hidden.has(theme)
          return (
            <button
              key={theme}
              type="button"
              className={on ? 'gal-views__set gal-views__set--on' : 'gal-views__set'}
              aria-pressed={on}
              onClick={() => toggle(theme)}
            >
              <span
                className="gal-views__dot"
                style={{ background: themeAccent(theme) } as CSSProperties}
              />
              {themeName(theme)}
            </button>
          )
        })}
      </div>

      <div className="gal-views__grid">
        {screens.map((entry) => {
          const route = findRoute(ROUTES, screenId(entry))
          const device = DEVICES[entry.device]
          return (
            <a
              key={screenId(entry)}
              className="gal-tile"
              href={`#${screenId(entry)}`}
              // `hidden` rather than unmounted: a switched-off set keeps its links in the
              // document, and its stills stay mounted for when it is switched back on.
              hidden={hidden.has(entry.theme)}
            >
              {route ? <LazyStill route={route} width={TILE_WIDTH} /> : null}
              <span className="gal-tile__title">{entry.title}</span>
              <span className="gal-tile__meta">
                {themeName(entry.theme)} · {device.w}x{device.h}
              </span>
            </a>
          )
        })}
      </div>
    </>
  )
}

function Overview() {
  return (
    <>
      <div className="gal-views__head">
        <h1 className="gal-views__title">Compare views</h1>
        <p className="gal-views__desc">
          The same screen as each set draws it. Pick what a screen is for, or what it is built from.
        </p>
      </div>
      <h2 className="gal-views__subhead">Screen types</h2>
      <div className="gal-facet-cards">
        {Object.keys(SCREEN_TYPES).map((slug) => (
          <FacetCard key={slug} facet="type" slug={slug} />
        ))}
      </div>
      <h2 className="gal-views__subhead">UI elements</h2>
      <div className="gal-facet-cards">
        {Object.keys(UI_ELEMENTS).map((slug) => (
          <FacetCard key={slug} facet="element" slug={slug} />
        ))}
      </div>
    </>
  )
}

/**
 * Every set's take on a common view, side by side - the Game UI Database's idea applied to
 * handheld firmware. A sidebar of facets, and a wall of live stills for the one picked.
 */
export function ViewsPage({ target }: { target: ViewsTarget }) {
  return (
    <div className="gal-views">
      <header className="gal-views__bar">
        <a className="gal-btn" href="#">
          All sets
        </a>
        <span className="gal-views__name">Compare views</span>
      </header>

      <div className="gal-views__body">
        <FacetNav target={target} />
        <main className="gal-views__main">
          {target.facet === null ? (
            <Overview />
          ) : (
            // Keyed so switching facet resets the set filter rather than carrying it over.
            <Comparison
              key={`${target.facet}/${target.slug}`}
              facet={target.facet}
              slug={target.slug}
            />
          )}
        </main>
      </div>
    </div>
  )
}
