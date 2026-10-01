import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { SCREEN_MANIFEST, screenId, type ScreenManifestEntry } from '../themes/manifest'
import { SCREEN_TYPES, type ScreenType } from '../themes/taxonomy'
import { coverage, viewsHref } from '../themes/views'
import { THEMES, THEME_GROUPS, type ThemeEntry, type ThemeGroup } from '../themes/catalogue'
import { NOTES_PREFIX } from './NotesViewer'

/** Where a set's own links go. Shared by its tile and its matrix row, so the two agree. */
function setLinks(theme: ThemeEntry) {
  const live = SCREEN_MANIFEST.find((s) => s.theme === theme.slug && s.interactive)
  const first = SCREEN_MANIFEST.find((s) => s.theme === theme.slug && !s.interactive)
  return {
    live: live ? `#${screenId(live)}` : undefined,
    screens: first ? `#${screenId(first)}` : undefined,
    notes: `#${NOTES_PREFIX}${theme.docPath}`,
  }
}

function accentStyle(theme: ThemeEntry): CSSProperties {
  return { '--set-accent': theme.accent } as CSSProperties
}

function SetTile({ theme }: { theme: ThemeEntry }) {
  const links = setLinks(theme)

  return (
    <article className="gal-set" style={accentStyle(theme)} aria-labelledby={`set-${theme.slug}`}>
      <div className="gal-set__art">
        <img className="gal-set__img" src={theme.preview} alt={theme.previewAlt} loading="lazy" />
      </div>
      <div className="gal-set__body">
        <h3 className="gal-set__name" id={`set-${theme.slug}`}>
          {theme.name}
        </h3>
        <p className="gal-set__kind">{theme.kind}</p>
        {theme.author ? <p className="gal-set__author">by {theme.author}</p> : null}
        <p className="gal-set__meta">
          {theme.views} {theme.views === 1 ? 'view' : 'views'} · {theme.devices.length}{' '}
          {theme.devices.length === 1 ? 'device' : 'devices'}
        </p>
        <div className="gal-set__links">
          {links.live ? (
            <a className="gal-set__link gal-set__link--primary" href={links.live}>
              Live build
            </a>
          ) : null}
          {links.screens ? (
            <a className="gal-set__link" href={links.screens}>
              Screens
            </a>
          ) : null}
          <a className="gal-set__link" href={links.notes}>
            Notes
          </a>
        </div>
      </div>
    </article>
  )
}

type Filter = ThemeGroup | 'all'

function SetGrid() {
  // Local, like the views page's set toggles: a filter is a way of looking, not a place.
  const [filter, setFilter] = useState<Filter>('all')
  const shown = THEMES.filter((t) => filter === 'all' || t.group === filter)
  const chips: [Filter, string][] = [['all', 'All'], ...(Object.entries(THEME_GROUPS) as [ThemeGroup, string][])]

  return (
    <>
      <div className="gal-browse__tools">
        <span className="gal-browse__count" aria-live="polite">
          {shown.length} of {THEMES.length} shown
        </span>
        <div className="gal-filter" role="group" aria-label="Filter sets">
          {chips.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className="gal-filter__chip"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="gal-sets">
        {shown.map((theme) => (
          <SetTile key={theme.slug} theme={theme} />
        ))}
      </div>
    </>
  )
}

function CoverageMatrix() {
  const cells = coverage()
  const types = Object.entries(SCREEN_TYPES) as [ScreenType, (typeof SCREEN_TYPES)[ScreenType]][]

  const cell = (theme: ThemeEntry, label: string, entry?: ScreenManifestEntry) =>
    entry ? (
      <a
        className="gal-matrix__mark"
        href={`#${screenId(entry)}`}
        aria-label={`${theme.name} - ${label}`}
        title={`${theme.name} - ${entry.title}`}
      />
    ) : (
      <span className="gal-matrix__none">
        <span className="gal-sr">Not drawn</span>
      </span>
    )

  return (
    <div className="gal-matrix">
      <table className="gal-matrix__table">
        <caption className="gal-matrix__caption">
          A row opens a set. A column compares that view across every set that has it.
        </caption>
        <thead>
          <tr>
            <th scope="col" className="gal-matrix__corner">
              <span className="gal-sr">Set</span>
            </th>
            {types.map(([slug, term]) => (
              <th key={slug} scope="col" className="gal-matrix__type">
                <a href={viewsHref('type', slug)}>{term.label}</a>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {THEMES.map((theme) => {
            const links = setLinks(theme)
            return (
              <tr key={theme.slug} style={accentStyle(theme)}>
                <th scope="row" className="gal-matrix__set">
                  <a href={links.live ?? links.notes}>
                    <span className="gal-matrix__dot" aria-hidden="true" />
                    <span>{theme.name}</span>
                    <span className="gal-matrix__views">{theme.views}</span>
                  </a>
                </th>
                {types.map(([slug, term]) => (
                  <td key={slug} className="gal-matrix__cell">
                    {cell(theme, term.label, cells.get(slug)?.get(theme.slug))}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const TABS = [
  { id: 'sets', label: 'Browse by set' },
  { id: 'views', label: 'Compare by view' },
] as const

type Tab = (typeof TABS)[number]['id']

/**
 * The two ways into the catalogue: every set at a glance, or every view across the sets.
 *
 * Tabs rather than two stacked sections, because stacking is what buried the comparison under
 * thirteen cards before. The arrow keys are handled on the tab list alone - never on the
 * document - so the page still scrolls with the keyboard.
 */
export function Browse() {
  const [tab, setTab] = useState<Tab>('sets')
  const refs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({})

  const onKeyDown = (event: KeyboardEvent) => {
    const at = TABS.findIndex((t) => t.id === tab)
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : null
    const to =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? TABS.length - 1
          : step === null
            ? null
            : (at + step + TABS.length) % TABS.length
    if (to === null) return
    event.preventDefault()
    const next = TABS[to]!.id
    setTab(next)
    refs.current[next]?.focus()
  }

  return (
    <section className="gal__section gal-browse" id="browse" aria-labelledby="browse-heading">
      <div className="gal__section-head">
        <h2 className="gal__section-title" id="browse-heading">
          Browse
        </h2>
        <a className="gal__section-link" href={viewsHref()}>
          Compare by UI element
        </a>
      </div>

      <div className="gal-tabs" role="tablist" aria-label="Browse" onKeyDown={onKeyDown}>
        {TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el
            }}
            type="button"
            role="tab"
            id={`browse-tab-${t.id}`}
            className="gal-tabs__tab"
            aria-selected={tab === t.id}
            // Only the selected tab's panel is mounted, so only it can be pointed at.
            aria-controls={tab === t.id ? `browse-panel-${t.id}` : undefined}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        className="gal-browse__panel"
        role="tabpanel"
        id={`browse-panel-${tab}`}
        aria-labelledby={`browse-tab-${tab}`}
      >
        {tab === 'sets' ? <SetGrid /> : <CoverageMatrix />}
      </div>
    </section>
  )
}
