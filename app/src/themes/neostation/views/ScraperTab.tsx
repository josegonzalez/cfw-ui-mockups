/**
 * PORTING NOTES
 * CFW: NeoStation            Devices: odin2-mini, rg40xx
 * Source: lib/widgets/scraper_content.dart, lib/screens/scraper_screen/scraper_login_screen.dart,
 *         new_scraper_options_screen.dart, scraper_contents/{account,scraping,scrape_mode,media,region,
 *         language,systems}_content.dart, lib/widgets/custom_radio_button.dart, custom_toggle_switch.dart
 * Mode: reproduce
 *
 * Layout:        signed in, a menu a quarter of the screen wide beside the chosen page, 46.r below
 *                the top; each page opens with a 14.r title over a 9.r subtitle. Scraping, while it
 *                runs, is three stat cards over fifteen worker cards five a row, as `site-09.webp`.
 * Focus & selection: the menu row under the cursor is `primary` 0.15 whether or not the menu has
 *                focus; its 3.r bar and `primary` text only while it has. Page rows take a 2px
 *                `primary` border.
 * Buttons:       menu - up/down wrap, right enters the page. Page - up/down clamp (the systems grid
 *                moves in rows of five), left returns to the menu, A acts; B does nothing but drop a
 *                picked-up region.
 * Transitions:   the radio indicator is 200ms easeOut in the source; the region card 200ms. Neither is
 *                drawn mid-move here.
 * Notes:         a run is drawn at the moment `site-09` shows it: ten of the library scraped, three
 *                fetching, two idle slots. The mockup does not advance it.
 */
import type { ReactNode } from 'react'
import { gamesOf, systemDef } from '../library'
import type { State } from '../machine'
import { alpha } from '../palette'
import type { SymbolName } from '../symbols'
import { LANGUAGES, MEDIA_KEYS, SCRAPER_MENU, SCRAPE_SYSTEMS, type ScraperEntry } from '../tabs'
import { ConfirmBox, Field, FormCard, FormRow, InfoBox, SubmitButton } from './forms'
import { Toggle } from './Overlays'
import { LINE, Sym, Txt, motion, useNeo } from './parts'

const MENU_LOOK: Readonly<Record<ScraperEntry, [SymbolName, string]>> = {
  account: ['person_rounded', 'Account'],
  scraping: ['download_rounded', 'Scraping'],
  scrapeMode: ['filter_list_rounded', 'Scrape Mode'],
  media: ['perm_media_rounded', 'Media'],
  region: ['public_rounded', 'Region'],
  language: ['language_rounded', 'Language'],
  systems: ['videogame_asset_rounded', 'Systems'],
}

const REGION_NAMES: Readonly<Record<string, string>> = {
  wor: 'World',
  us: 'USA',
  eu: 'Europe',
  fr: 'France',
  sp: 'Spain',
  it: 'Italy',
  de: 'Germany',
  jp: 'Japan',
  kr: 'Korea',
  cn: 'China',
}

const LANGUAGE_NAMES: Readonly<Record<(typeof LANGUAGES)[number], string>> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
}

const MEDIA_LOOK: Readonly<Record<(typeof MEDIA_KEYS)[number], [string, string]>> = {
  fanart: ['Fanart', 'Download background artwork for games.'],
  ss: ['Screenshots', 'Download gameplay screenshots.'],
  wheel: ['Wheels', 'Download game logo wheels.'],
  box2D: ['Box Art 2D', 'Download 2D box cover art.'],
  video: ['Videos', 'Download video previews of the games.'],
}

/** The master/detail frame the Scraper and Settings tabs share. */
export function MasterDetail({
  items,
  menu,
  inPane,
  children,
}: {
  items: readonly [SymbolName, string][]
  menu: number
  inPane: boolean
  children: ReactNode
}) {
  const neo = useNeo()
  const { u, p } = neo
  const menuW = u.px(u.lw * 0.25)
  // `AdaptiveScroller.ensureVisible` centres the cursor row (`lib/utils/adaptive_scroll.dart:61-73`).
  // Only the 360-high canvas needs it: eight Settings rows overflow there and fit at 480.
  const rowH = u.r(12) * 2 + Math.max(u.r(20), u.t(14) * LINE)
  const viewH = u.H - u.r(46)
  const scroll = Math.max(0, Math.min(items.length * rowH - viewH, menu * rowH + rowH / 2 - viewH / 2))
  return (
    <div style={{ position: 'absolute', left: 0, top: u.r(46), right: 0, bottom: 0, display: 'flex' }}>
      <div style={{ width: menuW, flexShrink: 0, background: alpha(p.background, 0.25), borderRight: `${u.r(1)}px solid ${alpha(p.primary, 0.1)}`, overflow: 'hidden' }}>
        <div
          style={{
            transform: `translateY(${-scroll}px)`,
            transition: motion(neo, [{ property: 'transform', duration: 200, easing: 'easeInOut' }]),
          }}
        >
        {items.map(([ic, label], i) => {
          const sel = i === menu
          const lit = sel && !inPane
          return (
            <div
              key={label}
              style={{
                padding: u.r(12),
                paddingLeft: u.r(12) - u.r(3),
                background: sel ? alpha(p.primary, 0.15) : 'transparent',
                borderLeft: `${u.r(3)}px solid ${lit ? p.primary : 'transparent'}`,
                display: 'flex',
                alignItems: 'center',
                gap: u.r(12),
              }}
            >
              <Sym name={ic} size={u.r(20)} color={lit ? p.primary : p.onSurface} />
              <Txt size={u.t(14)} color={lit ? p.primary : p.onSurface} weight={sel ? 600 : 400}>
                {label}
              </Txt>
            </div>
          )
        })}
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', padding: u.r(16), overflow: 'hidden' }}>{children}</div>
    </div>
  )
}

export function PageTitle({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  const neo = useNeo()
  const { u, p } = neo
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: u.r(24), marginBottom: u.r(12) }}>
      <div style={{ flex: 1 }}>
        <Txt size={u.t(14)} color={p.onSurface}>
          {title}
        </Txt>
        {subtitle && (
          <p style={{ margin: `${u.r(8)}px 0 0`, fontFamily: "'NeoStation Anta'", fontSize: u.t(9), lineHeight: 1.3, color: alpha(p.onSurface, 0.6) }}>{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  )
}

/** A selectable row: the page colour at 0.25, a 2px `primary` border when focused (`custom_radio_button.dart`). */
export function OptionRow({ focused, title, subtitle, trailing, gap = 8 }: { focused: boolean; title: string; subtitle?: string; trailing?: ReactNode; gap?: number }) {
  const neo = useNeo()
  const { u, p } = neo
  return (
    <div
      style={{
        marginBottom: u.r(gap),
        padding: `${u.r(6)}px ${u.r(12)}px`,
        background: alpha(p.background, 0.25),
        borderRadius: u.r(8),
        border: `${u.px(2)}px solid ${focused ? p.primary : 'transparent'}`,
        display: 'flex',
        alignItems: 'center',
        gap: u.r(16),
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <Txt size={u.t(12)} color={focused ? p.primary : p.onSurface} weight={500}>
          {title}
        </Txt>
        {subtitle && (
          <p style={{ margin: `${u.r(4)}px 0 0`, fontFamily: "'NeoStation Anta'", fontSize: u.t(9), lineHeight: 1.3, color: alpha(p.onSurface, 0.6) }}>{subtitle}</p>
        )}
      </div>
      {trailing}
    </div>
  )
}

function Radio({ on }: { on: boolean }) {
  const neo = useNeo()
  const { u, p } = neo
  return (
    <div
      style={{
        width: u.r(24),
        height: u.r(24),
        flexShrink: 0,
        boxSizing: 'border-box',
        borderRadius: u.r(12),
        border: `${u.px(2)}px solid ${on ? p.primary : alpha(p.outline, 0.5)}`,
        background: on ? p.primary : alpha(p.background, 0.2),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {on && <div style={{ width: u.r(10), height: u.r(10), borderRadius: u.r(5), background: p.onPrimary }} />}
    </div>
  )
}

/** The toggle as a flow item: `Toggle` draws at a position, so it gets a box of its own size. */
function InlineToggle({ value }: { value: boolean }) {
  const neo = useNeo()
  const { u } = neo
  return (
    <div style={{ position: 'relative', width: u.r(24) * 2 + u.r(16) + u.r(4), height: u.r(28), flexShrink: 0 }}>
      <Toggle value={value} left={0} top={0} />
    </div>
  )
}

export function ScraperTab({ state }: { state: State }) {
  const neo = useNeo()
  const { u, p } = neo
  const sc = state.scraper
  if (!sc.signedIn) {
    return (
      <FormRow centre>
        <FormCard title="ScreenScraper Login">
          <Field label="Username" selected={sc.slot === 0} />
          <Field label="Password" selected={sc.slot === 1} eye />
          <SubmitButton label="Login" selected={sc.slot === 2} />
        </FormCard>
        <InfoBox
          icon="info_rounded"
          title="What is ScreenScraper?"
          body="ScreenScraper is a collaborative database that provides high-quality metadata, covers, and videos for your games."
          points={[
            ['auto_awesome_rounded', 'Automatic metadata & media'],
            ['storage_rounded', 'Massive community database'],
            ['verified_user_rounded', 'Requires a free account'],
          ]}
          footer="Create an account at "
          link="screenscraper.fr"
          after=" to get your Account credentials."
        />
      </FormRow>
    )
  }
  const entry = SCRAPER_MENU[sc.menu]!
  const f = (i: number) => sc.inContent && sc.item === i
  return (
    <>
      <MasterDetail items={SCRAPER_MENU.map((m) => MENU_LOOK[m])} menu={sc.menu} inPane={sc.inContent}>
        {entry === 'account' && (
          <div style={{ padding: `${u.r(12)}px ${u.r(14)}px`, background: alpha(p.background, 0.25), borderRadius: u.r(12), border: `${u.r(1)}px solid ${alpha(p.primary, 0.15)}`, display: 'flex', alignItems: 'center', gap: u.r(12) }}>
            <div style={{ width: u.r(48), height: u.r(48), borderRadius: u.r(24), background: alpha(p.primary, 0.2), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Txt size={u.t(18)} color={p.primary} weight={700}>
                K
              </Txt>
            </div>
            <div style={{ flex: 1 }}>
              <Txt size={u.t(14)} color={p.onSurface} weight={700}>
                Kezona
              </Txt>
              <div style={{ display: 'flex', gap: u.r(8), marginTop: u.r(4) }}>
                {(
                  [
                    ['workspace_premium_rounded', 'Member'],
                    ['lan_rounded', 'Max Threads: 10'],
                  ] as const
                ).map(([ic, label]) => (
                  <div key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: u.r(4), padding: `${u.r(4)}px ${u.r(8)}px`, background: alpha(p.primary, 0.12), borderRadius: u.r(999), border: `${u.px(1)}px solid ${alpha(p.primary, 0.22)}` }}>
                    <Sym name={ic} size={u.r(10)} color={p.primary} />
                    <Txt size={u.t(8)} color={p.primary} weight={700}>
                      {label}
                    </Txt>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderRadius: u.r(8), border: `${u.r(2)}px solid ${f(0) ? p.primary : 'transparent'}`, padding: u.r(8) }}>
              <Sym name="logout_rounded" size={u.r(20)} color={p.error} />
            </div>
          </div>
        )}
        {entry === 'scraping' && <ScrapingPage state={state} focused={f(0)} />}
        {entry === 'scrapeMode' && (
          <>
            <PageTitle title="Scrape Mode" subtitle="Choose what content to scrape" />
            <OptionRow focused={f(0)} title="New content only" subtitle="Only scrape games that haven't been fully scraped yet" trailing={<Radio on={sc.mode === 'new_only'} />} />
            <OptionRow focused={f(1)} title="All content" subtitle="Scrape all games, including those already scraped" trailing={<Radio on={sc.mode === 'all'} />} />
          </>
        )}
        {entry === 'media' && (
          <>
            <PageTitle title="Media" subtitle="Choose what content types to download" />
            {MEDIA_KEYS.map((k, i) => (
              <OptionRow key={k} focused={f(i)} title={MEDIA_LOOK[k][0]} subtitle={MEDIA_LOOK[k][1]} trailing={<InlineToggle value={sc.media[k]} />} gap={0} />
            ))}
          </>
        )}
        {entry === 'region' && (
          <>
            <PageTitle
              title="Region Priority"
              subtitle="Higher priority regions are preferred when selecting game names, dates and media. Press A to pick up, Up/Down to move, B to drop."
            />
            {sc.regions.map((code, i) => {
              const on = f(i)
              const moving = on && sc.moving
              return (
                <div
                  key={code}
                  style={{
                    marginBottom: u.h(4),
                    padding: `${u.r(6)}px ${u.r(12)}px`,
                    borderRadius: u.r(8),
                    border: `${u.px(2)}px solid ${on ? p.primary : 'transparent'}`,
                    background: moving ? alpha(p.primary, 0.2) : alpha(p.background, 0.25),
                    display: 'flex',
                    alignItems: 'center',
                    gap: u.r(12),
                  }}
                >
                  <div style={{ width: u.r(28), height: u.r(28), borderRadius: u.r(14), background: moving ? p.primary : alpha(p.onSurface, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Txt size={u.t(10)} color={moving ? p.onPrimary : alpha(p.onSurface, 0.6)} weight={700}>
                      {String(i + 1)}
                    </Txt>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Txt size={u.t(12)} color={on ? p.primary : p.onSurface} weight={500}>
                      {REGION_NAMES[code]!}
                    </Txt>
                    <Txt size={u.t(9)} color={alpha(p.onSurface, 0.4)} style={{ marginTop: u.r(4) }}>
                      {code.toUpperCase()}
                    </Txt>
                  </div>
                  {moving ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: u.r(4) }}>
                      <Sym name="swap_vert_rounded" size={u.r(20)} color={p.primary} />
                      <Txt size={u.t(10)} color={p.primary} weight={700}>{`${i + 1}/${sc.regions.length}`}</Txt>
                    </div>
                  ) : (
                    <Sym name="drag_indicator_rounded" size={u.r(20)} color={alpha(p.onSurface, on ? 0.5 : 0.2)} />
                  )}
                </div>
              )
            })}
          </>
        )}
        {entry === 'language' && (
          <>
            <PageTitle title="Preferred Language" subtitle="Select preferred language for game metadata" />
            {LANGUAGES.map((l, i) => (
              <OptionRow key={l} focused={f(i)} title={LANGUAGE_NAMES[l]} trailing={<Radio on={sc.language === l} />} />
            ))}
          </>
        )}
        {entry === 'systems' && <SystemsPage state={state} />}
      </MasterDetail>
      {sc.confirm && (
        <ConfirmBox title="Logout" body="Are you sure you want to disconnect from ScreenScraper?" confirm="Logout" icon="logout_rounded" />
      )}
    </>
  )
}

function ScrapingPage({ state, focused }: { state: State; focused: boolean }) {
  const neo = useNeo()
  const { u, p } = neo
  const running = state.scraper.running
  const all = gamesOf('all', state.lib)
  const processed = Math.min(10, all.length)
  const start = (
    <div style={{ borderRadius: u.r(8), border: `${u.px(2)}px solid ${focused ? p.primary : 'transparent'}`, flexShrink: 0 }}>
      <div style={{ minHeight: u.r(32), padding: `${u.r(6)}px ${u.r(16)}px`, boxSizing: 'border-box', background: running ? p.error : p.primary, borderRadius: u.r(6), display: 'flex', alignItems: 'center', gap: u.r(8) }}>
        <Sym name={running ? 'stop_rounded' : 'play_arrow_rounded'} size={u.r(16)} color="#ffffff" />
        <Txt size={u.t(10)} color="#ffffff">
          {running ? 'Stop' : 'Start'}
        </Txt>
      </div>
    </div>
  )
  if (!running) return <PageTitle title="Scraping" subtitle="Download game metadata from ScreenScraper">{start}</PageTitle>
  const stats: [SymbolName, string, string, number][] = [
    ['games_rounded', 'Total Games', `${processed} / ${all.length}`, processed / all.length],
    ['check_circle_outline_rounded', 'Success / Failed', `${processed} / 0`, 1],
    ['cloud_sync_rounded', 'Request', '91 / 100000', 91 / 100000],
  ]
  // Fifteen worker cards whatever the thread count (`scraping_provider.dart:173-180`): the games in
  // hand, the three still fetching, then idle slots.
  const workers = all.slice(0, 13).map((g, i) => ({ name: `${g.title} (${systemDef(g.system).short})`, fetching: i >= 10 }))
  const cardW = (u.px(u.lw * 0.75) - u.r(24) * 2 - u.r(32)) / 5
  return (
    <>
      <PageTitle title="Scraping" subtitle="Scraping in progress with 10 threads">
        <div>
          {start}
        </div>
      </PageTitle>
      <Txt size={u.t(8)} color={alpha(p.onSurface, 0.4)} style={{ fontStyle: 'italic', marginTop: -u.r(8) }}>
        Estimated time left: ~20s
      </Txt>
      <div style={{ display: 'flex', gap: u.r(8), marginTop: u.r(12) }}>
        {stats.map(([ic, title, value, frac]) => (
          <div key={title} style={{ flex: 1, padding: u.r(8), background: alpha(p.background, 0.25), borderRadius: u.r(8) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: u.w(4) }}>
              <Sym name={ic} size={u.sp(10)} color={p.primary} />
              <Txt size={u.t(7)} color={alpha(p.onSurface, 0.6)} weight={500}>
                {title}
              </Txt>
            </div>
            <Txt size={u.t(10)} color={p.onSurface} weight={700} style={{ marginTop: u.r(2) }}>
              {value}
            </Txt>
            <div style={{ height: u.h(4), marginTop: u.r(2), borderRadius: u.r(2), background: alpha(p.surface, 0.3), overflow: 'hidden' }}>
              <div style={{ width: `${Math.round(frac * 100)}%`, height: '100%', background: frac > 0.8 ? '#ff9800' : p.primary }} />
            </div>
            <Txt size={u.t(7)} color={alpha(p.onSurface, 0.6)} weight={500} style={{ marginTop: u.h(2) }}>{`${Math.round(frac * 100)}%`}</Txt>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: u.r(8), marginTop: u.r(8) }}>
        {Array.from({ length: 15 }, (_, i) => {
          const w = workers[i]
          const done = w && !w.fetching
          const color = done ? '#4caf50' : w ? p.primary : '#9e9e9e'
          return (
            <div
              key={i}
              style={{
                width: cardW,
                boxSizing: 'border-box',
                padding: u.r(6),
                borderRadius: u.r(6),
                border: `${u.r(1)}px solid ${alpha(color, done ? 0.5 : w ? 0.4 : 0.2)}`,
                background: done ? 'rgba(76,175,80,0.1)' : alpha(p.background, w ? 0.5 : 0.25),
                textAlign: 'center',
              }}
            >
              {w ? (
                <>
                  <Txt size={u.t(8)} color={alpha(p.onSurface, 0.9)} weight={600} style={{ textOverflow: 'ellipsis' }}>
                    {w.name}
                  </Txt>
                  <div style={{ height: u.r(3), marginTop: u.r(2), borderRadius: u.r(2), background: 'rgba(158,158,158,0.2)', overflow: 'hidden' }}>
                    <div style={{ width: done ? '100%' : '0%', height: '100%', background: alpha(color, 0.9) }} />
                  </div>
                  <Txt size={u.t(8)} color={alpha(color, 0.8)} weight={500} style={{ marginTop: u.r(2), fontStyle: 'italic' }}>
                    {done ? 'OK' : 'Fetching Metadata'}
                  </Txt>
                </>
              ) : (
                <Txt size={u.t(20)} color="rgba(158,158,158,0.6)" weight={500} style={{ fontStyle: 'italic' }}>
                  Idle
                </Txt>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

function SystemsPage({ state }: { state: State }) {
  const neo = useNeo()
  const { u, p } = neo
  const sc = state.scraper
  const systems = SCRAPE_SYSTEMS()
  const allOn = sc.disabledSystems.length === 0
  const cardW = (u.px(u.lw * 0.75) - u.r(24) * 2 - u.r(24)) / 5
  const focus = sc.inContent ? sc.item : -1
  // The grid keeps the focused row centred (`systems_content.dart:142-183`): rows 50.r + 8.r under a 60.r header.
  const row = focus > 0 ? Math.floor((focus - 1) / 5) : 0
  const offset = Math.max(0, row * u.r(58) + u.r(60) - u.r(120))
  return (
    <div style={{ transform: `translateY(${-offset}px)` }}>
      <PageTitle title="Systems" subtitle="Select which systems to scrape">
        <div style={{ borderRadius: u.r(8), border: `${u.r(2)}px solid ${focus === 0 ? p.primary : 'transparent'}` }}>
          <div style={{ minHeight: u.r(32), boxSizing: 'border-box', padding: `${u.r(6)}px ${u.r(16)}px`, background: p.primary, borderRadius: u.r(6), display: 'flex', alignItems: 'center', gap: u.r(8) }}>
            <Sym name={allOn ? 'deselect_rounded' : 'select_all_rounded'} size={u.r(18)} color="#ffffff" />
            <Txt size={u.t(10)} color="#ffffff">
              {allOn ? 'Disable All' : 'Enable All'}
            </Txt>
          </div>
        </div>
      </PageTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: u.r(6) }}>
        {systems.map((id, i) => {
          const on = !sc.disabledSystems.includes(id)
          const f = focus === i + 1
          return (
            <div
              key={id}
              style={{
                width: cardW,
                boxSizing: 'border-box',
                padding: u.r(4),
                borderRadius: u.r(8),
                background: alpha(p.background, on ? 0.6 : 0.3),
                border: `${u.r(1.5)}px solid ${f ? p.secondary : on ? '#69f0ae' : alpha(p.outline, 0.1)}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: u.r(2),
              }}
            >
              <div
                style={{
                  width: u.r(24),
                  height: u.r(24),
                  boxSizing: 'border-box',
                  borderRadius: u.r(12),
                  background: on ? 'rgba(105,240,174,0.25)' : alpha(p.background, 0.25),
                  border: `${u.r(1.5)}px solid ${on ? '#69f0ae' : alpha(p.outline, 0.4)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sym name={on ? 'check_rounded' : 'add_rounded'} size={u.r(14)} color={on ? '#69f0ae' : alpha(p.onSurface, 0.5)} />
              </div>
              <Txt size={u.t(9)} color={alpha(p.onSurface, on ? 0.9 : 0.5)} weight={on ? 600 : 400} style={{ maxWidth: '100%', textOverflow: 'ellipsis' }}>
                {systemDef(id).name}
              </Txt>
            </div>
          )
        })}
      </div>
    </div>
  )
}
