/**
 * PORTING NOTES
 * CFW: NeoStation            Devices: odin2-mini, rg40xx
 * Source: lib/screens/search_screen/search_screen.dart, search_filter.dart;
 *         lib/screens/retro_achievements_screen/ra_content.dart, ra_dashboard.dart;
 *         lib/screens/neo_sync_screen/login_screen/{neo_sync_content,save_list_view,plan_selection_view,
 *         custom_save_folders_view,neo_sync_shared}.dart, lib/widgets/auth_form.dart;
 *         lib/screens/romm_screen/romm_connect_content.dart
 * Mode: reproduce
 *
 * Layout:        every tab here opens 64.r below the top (52.r for NeoSync's signed-in views) under
 *                the header, with no footer of its own. Search is a search row over a list of 68.r
 *                result rows. The account tabs, signed out, are a login card beside an info box;
 *                signed in, Achievements is a dashboard of cards in one column (the two-column form
 *                needs 720 logical px) and NeoSync a header card beside a three-row menu.
 * Focus & selection: `primary` borders and 0.18 fills for Search's field, chips and rows; `primary`
 *                outlines and glows for form slots; `secondary` for NeoSync's menu and lists.
 * Buttons:       Search - down walks field, chips, results; left/right move along a band; A opens
 *                the result chooser (Go to game, Play); B steps back up. The forms - up/down move and
 *                wrap, A acts. Achievements - right selects Logout, A confirms. NeoSync - up/down
 *                wrap the menu, A opens a section, Y jumps to plans, X logs out; its lists take B back.
 * Transitions:   Search's list centres the focused row (140ms easeOut); NeoSync's lists move a
 *                `secondary` bar on the scroll's clock. Neither is animated here beyond the jump.
 * Notes:         there is no on-screen keyboard in the source - fields open the operating system's -
 *                so fields here are drawn at rest and a form's submit reports the empty-field error
 *                the source does. The RetroAchievements sample has earned nothing, so its dashboard
 *                shows the source's empty states; its one recently played game is the library's.
 */
import type { ReactNode } from 'react'
import { boxart } from '../art'
import { icon } from '../assets'
import { GAMES, playedOf, systemDef } from '../library'
import type { State } from '../machine'
import { alpha } from '../palette'
import type { SymbolName } from '../symbols'
import {
  PLANS,
  RA_USER,
  SYNC_USER,
  activeFilters,
  filterOptions,
  ratingOf,
  searchChips,
  searchResults,
  type FilterKey,
} from '../tabs'
import { textWidth } from '../text'
import { ConfirmBox, Field, FormCard, FormRow, InfoBox, LinkRow, SubmitButton } from './forms'
import { GamepadControl, LINE, Sym, Tinted, Txt, abs, controlHeight, controlWidth, shadow, useNeo } from './parts'

/* ---- Search ------------------------------------------------------------------------------------ */

const FILTER_LABEL: Readonly<Record<FilterKey, string>> = {
  platform: 'Platform',
  developer: 'Developer',
  genre: 'Genre',
  rating: 'Rating',
  year: 'Year',
  achievements: 'Achievements',
}

function filterValue(key: FilterKey, v: string | undefined): string {
  if (v === undefined) return 'Any'
  if (key === 'rating') return `★ ${v}`
  if (key === 'achievements') return v === 'matched' ? 'Yes' : v === 'noSet' ? 'No' : 'Unknown'
  return v
}

export function SearchTab({ state }: { state: State }) {
  const neo = useNeo()
  const { u, p } = neo
  const s = state.search
  const results = searchResults(state.lib, s)
  const chips = searchChips(state.lib, s)
  const left = u.r(12)
  const width = u.W - u.r(24)
  const top = u.r(64)
  const rowH = u.r(40)
  const count = `${results.length} results`
  const countW = textWidth(count, u.t(12))
  const n = activeFilters(s)
  const togW = u.r(12) * 2 + u.r(18) + u.r(6) + textWidth('Filters', u.t(13)) + (n ? u.r(6) + u.r(12) + u.r(6) * 2 : 0) + u.r(4) + u.r(16) + u.r(4)
  const togLeft = left + width - togW
  const fieldW = togLeft - u.r(10) - countW - u.r(10) - left
  const fieldOn = s.region === 'search' && s.item === 0
  const togOn = s.region === 'search' && s.item === 1
  const accent = (on: boolean, active: boolean) => (on || active ? p.primary : p.onSurface)
  const chipTop = top + rowH + u.r(6)
  const chipH = u.r(8) * 2 + u.t(13) * LINE
  const listTop = (s.expanded ? chipTop + chipH : top + rowH) + u.r(8)
  const listH = u.H - listTop
  const ext = u.r(68)
  const offset = Math.max(0, Math.min(results.length * ext - listH, s.row * ext - (listH - ext) / 2))

  return (
    <div data-part="search">
      <div
        style={{
          ...abs({ left, top, width: fieldW, height: rowH }),
          boxSizing: 'border-box',
          borderRadius: u.r(12),
          border: `${u.r(2)}px solid ${fieldOn ? p.primary : 'transparent'}`,
          background: alpha(p.surface, 0.5),
          display: 'flex',
          alignItems: 'center',
          gap: u.r(12),
          paddingLeft: u.r(12),
        }}
      >
        <Sym name="search_rounded" size={u.r(24)} color={alpha(p.onSurface, 0.7)} />
        <Txt size={u.t(16)} color={alpha(p.onSurface, 0.5)}>
          Search...
        </Txt>
      </div>
      <Txt size={u.t(12)} color={alpha(p.onSurface, 0.6)} weight={600} style={{ position: 'absolute', left: left + fieldW + u.r(10), top: top + (rowH - u.t(12) * LINE) / 2 }}>
        {count}
      </Txt>
      <div
        style={{
          ...abs({ left: togLeft, top: top + (rowH - (u.r(9) * 2 + Math.max(u.r(18), u.t(13) * LINE))) / 2, width: togW, height: u.r(9) * 2 + Math.max(u.r(18), u.t(13) * LINE) }),
          boxSizing: 'border-box',
          borderRadius: u.r(12),
          border: `${u.r(2)}px solid ${togOn ? p.primary : n ? alpha(p.primary, 0.5) : 'transparent'}`,
          background: togOn ? alpha(p.primary, 0.18) : n ? alpha(p.primary, 0.1) : alpha(p.surface, 0.5),
          display: 'flex',
          alignItems: 'center',
          padding: `0 ${u.r(12) - u.r(2)}px`,
          gap: u.r(6),
        }}
      >
        <Sym name="tune_rounded" size={u.r(18)} color={accent(togOn, n > 0)} />
        <Txt size={u.t(13)} color={accent(togOn, n > 0)} weight={700}>
          Filters
        </Txt>
        {n > 0 && (
          <div style={{ padding: `${u.r(1)}px ${u.r(6)}px`, background: p.primary, borderRadius: u.r(8) }}>
            <Txt size={u.t(11)} color={p.onPrimary} weight={800}>
              {String(n)}
            </Txt>
          </div>
        )}
        <Sym name={s.expanded ? 'expand_less_rounded' : 'expand_more_rounded'} size={u.r(16)} color={alpha(p.onSurface, togOn ? 0.9 : 0.5)} />
      </div>

      {s.expanded && (
        <div style={{ ...abs({ left, top: chipTop, width, height: chipH }), overflow: 'hidden', display: 'flex', gap: u.r(8) }}>
          {chips.map((c, i) => {
            const on = s.region === 'filters' && s.chip === i
            const active = c !== 'clear' && s.filters[c] !== undefined
            return (
              <div
                key={c}
                style={{
                  flexShrink: 0,
                  boxSizing: 'border-box',
                  height: chipH,
                  padding: `0 ${u.r(12) - u.r(2)}px`,
                  borderRadius: u.r(12),
                  border: `${u.r(2)}px solid ${on ? p.primary : active ? alpha(p.primary, 0.5) : 'transparent'}`,
                  background: on ? alpha(p.primary, 0.18) : active ? alpha(p.primary, 0.1) : alpha(p.surface, 0.5),
                  display: 'flex',
                  alignItems: 'center',
                  gap: u.r(4),
                }}
              >
                {c === 'clear' ? (
                  <>
                    <Sym name="filter_alt_off_rounded" size={u.r(16)} color={p.onSurface} />
                    <Txt size={u.t(13)} color={p.onSurface} weight={700} style={{ marginLeft: u.r(2) }}>
                      Clear filters
                    </Txt>
                  </>
                ) : (
                  <>
                    <Txt size={u.t(13)} color={alpha(p.onSurface, 0.7)} weight={600}>{`${FILTER_LABEL[c]}: `}</Txt>
                    <Txt size={u.t(13)} color={active || on ? p.primary : p.onSurface} weight={700} style={{ maxWidth: u.r(140), textOverflow: 'ellipsis' }}>
                      {filterValue(c, s.filters[c])}
                    </Txt>
                    <Sym name="expand_more_rounded" size={u.r(16)} color={alpha(p.onSurface, on ? 0.9 : 0.4)} />
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ ...abs({ left, top: listTop, width, height: listH }), overflow: 'hidden' }}>
        {results.length === 0 ? (
          <Txt size={u.t(14)} color={alpha(p.onSurface, 0.6)} style={{ position: 'absolute', left: 0, width, top: listH / 2 - u.t(14), textAlign: 'center' }}>
            No games found
          </Txt>
        ) : (
          results.map((g, i) => {
            const y = i * ext - offset
            if (y < -ext || y > listH) return null
            const on = s.region === 'results' && s.row === i
            const sub = [systemDef(g.system).short, g.scraped?.year, g.scraped?.developer].filter(Boolean).join('  •  ')
            const rating = ratingOf(g)
            return (
              <div
                key={g.id}
                style={{
                  ...abs({ left: 0, top: y + u.r(3), width, height: ext - u.r(6) }),
                  boxSizing: 'border-box',
                  padding: `${u.r(6)}px ${u.r(10)}px`,
                  borderRadius: u.r(12),
                  border: `${u.r(2)}px solid ${on ? p.primary : 'transparent'}`,
                  background: on ? alpha(p.primary, 0.18) : alpha(p.surface, 0.5),
                  display: 'flex',
                  alignItems: 'center',
                  gap: u.r(10),
                }}
              >
                <div style={{ width: u.r(36), height: u.r(46), flexShrink: 0, borderRadius: u.r(6), overflow: 'hidden', background: alpha(p.surface, 0.4), border: `${u.r(1)}px solid ${alpha(p.onSurface, 0.12)}`, boxSizing: 'border-box' }}>
                  <img alt="" src={boxart(g)} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Txt size={u.t(13)} color={p.onSurface} weight={700} style={{ textOverflow: 'ellipsis' }}>
                    {g.title}
                  </Txt>
                  <Txt size={u.t(11)} color={alpha(p.onSurface, 0.6)} style={{ textOverflow: 'ellipsis' }}>
                    {sub}
                  </Txt>
                </div>
                {rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: u.r(2), marginLeft: u.r(8) - u.r(10) }}>
                    <Sym name="star_rounded" size={u.r(14)} color={p.primary} />
                    <Txt size={u.t(12)} color={alpha(p.onSurface, 0.8)} weight={600}>
                      {String(rating)}
                    </Txt>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {s.region === 'menu' && s.menu && <FilterMenu state={state} fkey={s.menu.key} />}
      {s.region === 'action' && results[s.row] && <ActionChooser title={results[s.row]!.title} focus={s.action} />}
    </div>
  )
}

function FilterMenu({ state, fkey }: { state: State; fkey: FilterKey }) {
  const neo = useNeo()
  const { u, p } = neo
  const s = state.search
  const values = [undefined, ...filterOptions(state.lib, { ...s, filters: { ...s.filters, [fkey]: undefined } }, fkey)]
  const item = u.r(44)
  const titleH = u.r(8) + u.t(15) * LINE
  const maxH = u.H - (u.r(46) + u.r(12)) - u.r(12)
  const h = Math.min(maxH, u.r(12) * 2 + titleH + values.length * item)
  const w = u.r(320)
  const topMin = u.r(46) + u.r(12)
  const top = Math.max(topMin, (u.H - h) / 2)
  const sel = values.indexOf(s.filters[fkey])
  const listH = h - u.r(24) - titleH
  const offset = Math.max(0, Math.min(values.length * item - listH, sel * item - (listH - item) / 2))
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div
        style={{
          ...abs({ left: (u.W - w) / 2, top, width: w, height: h }),
          boxSizing: 'border-box',
          padding: u.r(12),
          background: p.surface,
          borderRadius: u.r(16),
          border: `${u.r(1)}px solid ${alpha(p.primary, 0.4)}`,
        }}
      >
        <Txt size={u.t(15)} color={p.onSurface} weight={700} style={{ paddingLeft: u.r(4) }}>
          {FILTER_LABEL[fkey]}
        </Txt>
        <div style={{ position: 'absolute', left: u.r(12), right: u.r(12), top: u.r(12) + titleH, height: listH, overflow: 'hidden' }}>
          {values.map((v, i) => {
            const on = i === sel
            return (
              <div
                key={v ?? 'any'}
                style={{
                  ...abs({ left: 0, top: i * item - offset + u.r(2), width: w - u.r(24) - u.r(2), height: item - u.r(4) }),
                  boxSizing: 'border-box',
                  padding: `0 ${u.r(12) - u.r(2)}px`,
                  borderRadius: u.r(10),
                  border: `${u.r(2)}px solid ${on ? p.primary : 'transparent'}`,
                  background: on ? alpha(p.primary, 0.18) : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Txt size={u.t(13)} color={on ? p.primary : p.onSurface} weight={600}>
                  {filterValue(fkey, v)}
                </Txt>
                {on && <Sym name="check_rounded" size={u.r(16)} color={p.primary} />}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

function ActionChooser({ title, focus }: { title: string; focus: number }) {
  const neo = useNeo()
  const { u, p } = neo
  const w = u.r(320)
  const options: [SymbolName, string][] = [
    ['my_location_rounded', 'Go to game'],
    ['play_arrow_rounded', 'Play'],
  ]
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div
        style={{
          position: 'absolute',
          left: (u.W - w) / 2,
          top: '50%',
          transform: 'translateY(-50%)',
          width: w,
          boxSizing: 'border-box',
          padding: u.r(16),
          background: p.surface,
          borderRadius: u.r(16),
          border: `${u.r(1)}px solid ${alpha(p.primary, 0.4)}`,
        }}
      >
        <Txt size={u.t(15)} color={p.onSurface} weight={700} style={{ textOverflow: 'ellipsis' }}>
          {title}
        </Txt>
        <div style={{ height: u.r(12) }} />
        {options.map(([ic, label], i) => {
          const on = i === focus
          const c = on ? p.primary : p.onSurface
          return (
            <div
              key={label}
              style={{
                margin: `${u.r(4)}px 0`,
                padding: u.r(12) - u.r(2),
                borderRadius: u.r(12),
                border: `${u.r(2)}px solid ${on ? p.primary : 'transparent'}`,
                background: on ? alpha(p.primary, 0.18) : alpha(p.surface, 0.5),
                display: 'flex',
                alignItems: 'center',
                gap: u.r(8),
              }}
            >
              <Sym name={ic} size={u.r(18)} color={c} />
              <Txt size={u.t(14)} color={c} weight={700}>
                {label}
              </Txt>
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ---- RetroAchievements ---------------------------------------------------------------------------- */

function Pill({ ic, label, color }: { ic: SymbolName; label: string; color: string }) {
  const neo = useNeo()
  const { u } = neo
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: u.r(4),
        padding: `${u.r(4)}px ${u.r(8)}px`,
        background: alpha(color, 0.12),
        borderRadius: u.r(999),
        border: `${u.px(1)}px solid ${alpha(color, 0.22)}`,
      }}
    >
      <Sym name={ic} size={u.r(10)} color={color} />
      <Txt size={u.t(8)} color={color} weight={700}>
        {label}
      </Txt>
    </div>
  )
}

function Section({ ic, title, trailing, minH, children }: { ic: SymbolName; title: string; trailing?: string; minH: number; children: ReactNode }) {
  const neo = useNeo()
  const { u, p } = neo
  return (
    <div
      style={{
        boxSizing: 'border-box',
        padding: u.r(14),
        background: alpha(p.background, 0.25),
        borderRadius: u.r(12),
        border: `${u.r(1)}px solid ${alpha(p.primary, 0.15)}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: u.r(8) }}>
        <Sym name={ic} size={u.r(18)} color={p.primary} />
        <Txt size={u.t(11)} color={p.primary} weight={700} style={{ flex: 1 }}>
          {title}
        </Txt>
        {trailing && (
          <Txt size={u.t(8)} color={alpha(p.onSurface, 0.58)}>
            {trailing}
          </Txt>
        )}
      </div>
      <div style={{ minHeight: u.r(minH), marginTop: u.r(12), display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>{children}</div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  const neo = useNeo()
  return (
    <Txt size={neo.u.t(9)} color={alpha(neo.p.onSurface, 0.6)} style={{ textAlign: 'center', whiteSpace: 'normal', height: 'auto' }}>
      {text}
    </Txt>
  )
}

export function AchievementsTab({ state }: { state: State }) {
  const neo = useNeo()
  const { u, p } = neo
  const ra = state.ra
  if (!ra.signedIn) {
    return (
      <FormRow centre>
        <FormCard title="RetroAchievements Login">
          <Field label={ra.savedUser || 'Username'} selected={ra.slot === 0} />
          <Field label="API Key" selected={ra.slot === 1} eye />
          <div
            style={{
              alignSelf: 'stretch',
              height: u.r(32),
              boxSizing: 'border-box',
              border: `${u.px(1)}px solid ${alpha(p.primary, 0.6)}`,
              borderRadius: u.r(8),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: u.r(6),
              boxShadow: ra.slot === 2 ? `0 0 ${2 * (0.57735 * u.r(8) + u.px(0.5))}px ${u.r(1)}px ${alpha(p.primary, 0.35)}` : undefined,
            }}
          >
            <Sym name="key_rounded" size={u.r(14)} color={p.primary} />
            <Txt size={u.t(11)} color={p.primary} weight={600}>
              Get API Key
            </Txt>
          </div>
          <p style={{ margin: `${u.r(4)}px 0 ${u.r(6)}px`, fontFamily: "'NeoStation Anta'", fontSize: u.t(8), lineHeight: 1.3, textAlign: 'center', color: alpha(p.onSurface, 0.65) }}>
            Open your RetroAchievements control panel to copy your personal Web API key.
          </p>
          <SubmitButton label="Login" selected={ra.slot === 3} />
        </FormCard>
        <InfoBox
          icon="emoji_events_rounded"
          title="What is RetroAchievements?"
          body="RetroAchievements is a community effort to provide achievements for classic games using emulators."
          points={[
            ['star_outline_rounded', 'Earn hardcore points and showcase them'],
            ['public_rounded', 'Global leaderboards and rankings'],
            ['history_rounded', 'Detailed gameplay history and progress'],
          ]}
          footer="Create an account at "
          link="retroachievements.org"
          after=" to start earning."
        />
      </FormRow>
    )
  }
  const played = GAMES.filter((g) => playedOf(state.lib, g) > 0 && g.cheevos?.total)
  return (
    <>
      <div style={{ position: 'absolute', left: u.r(12), right: u.r(12), top: u.r(64), bottom: 0, overflow: 'hidden' }}>
        <div style={{ transform: `translateY(${-ra.scroll * u.r(160)}px)`, display: 'flex', flexDirection: 'column', gap: u.r(12), paddingBottom: u.r(16) }}>
          <div
            style={{
              boxSizing: 'border-box',
              padding: `${u.r(12)}px ${u.r(14)}px`,
              background: alpha(p.background, 0.25),
              borderRadius: u.r(12),
              border: `${u.r(1)}px solid ${alpha(p.primary, 0.15)}`,
              display: 'flex',
              alignItems: 'center',
              gap: u.r(12),
            }}
          >
            <div style={{ width: u.r(48), height: u.r(48), boxSizing: 'border-box', borderRadius: u.r(24), border: `${u.r(2)}px solid ${alpha(p.primary, 0.28)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sym name="account_circle_rounded" size={u.r(28)} color={p.primary} />
            </div>
            <div style={{ flex: 1 }}>
              <Txt size={u.t(14)} color={p.onSurface} weight={700}>
                {RA_USER}
              </Txt>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${u.r(6)}px ${u.r(8)}px`, marginTop: u.r(4) }}>
                <Pill ic="shield_rounded" label="Registered" color={p.primary} />
                <Pill ic="stars_rounded" label="0 pts" color={p.primary} />
                <Pill ic="sports_esports_rounded" label={`${played.length} games played`} color={p.primary} />
                <Pill ic="flag_rounded" label="0 games beaten" color={p.secondary} />
                <Pill ic="workspace_premium_rounded" label="0 Masteries" color={p.dark ? '#ffd700' : '#b8860b'} />
              </div>
            </div>
            <div style={{ borderRadius: u.r(8), border: `${u.r(2)}px solid ${ra.logout ? p.primary : 'transparent'}`, padding: u.r(8) }}>
              <Sym name="logout_rounded" size={u.r(20)} color={p.error} />
            </div>
          </div>
          <Section ic="emoji_events_rounded" title="ACHIEVEMENT OF THE WEEK" minH={138}>
            <Empty text="No current Achievement of the Week" />
          </Section>
          <Section ic="notifications_active_rounded" title="Recent Unlocks" trailing="30 days" minH={138}>
            <Empty text="No recent unlocks in the last 30 days" />
          </Section>
          <Section ic="workspace_premium_rounded" title="Recent Masteries" trailing="0 tracked games" minH={120}>
            <Empty text="No masteries yet" />
          </Section>
          <Section ic="history_rounded" title="Recently Played" minH={120}>
            {played.slice(0, 5).map((g) => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: u.r(10), paddingBottom: u.r(10) }}>
                <div style={{ width: u.r(40), height: u.r(40), borderRadius: u.r(8), overflow: 'hidden', flexShrink: 0 }}>
                  <img alt="" src={boxart(g)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Txt size={u.t(10)} color={p.onSurface} weight={700}>
                    {g.title}
                  </Txt>
                  <Txt size={u.t(8)} color={alpha(p.onSurface, 0.65)} style={{ marginTop: u.r(3) }}>
                    {`${systemDef(g.system).name} • 0/${g.cheevos!.total} achievements`}
                  </Txt>
                </div>
                <Txt size={u.t(8)} color={alpha(p.onSurface, 0.6)}>
                  2026-09-26
                </Txt>
              </div>
            ))}
          </Section>
        </div>
      </div>
      {ra.confirm && (
        <ConfirmBox
          title="Disconnect RetroAchievements"
          body="This will sign you out and remove your saved RetroAchievements credentials from this device."
          confirm="Logout"
          icon="logout_rounded"
        />
      )}
    </>
  )
}

/* ---- NeoSync -------------------------------------------------------------------------------------- */

function SectionHeader({ ic, title, subtitle, trailing }: { ic: SymbolName; title: string; subtitle?: string; trailing?: ReactNode }) {
  const neo = useNeo()
  const { u, p } = neo
  return (
    <div
      style={{
        padding: u.r(10),
        background: p.surface,
        borderRadius: neo.radius.external,
        border: `${u.r(1)}px solid ${p.outline}`,
        boxShadow: shadow(neo, alpha(p.shadow, 0.1), u.r(4), u.r(2), u.r(2)),
      }}
    >
      <div
        style={{
          borderRadius: neo.radius.internal,
          padding: `${u.r(8)}px ${u.r(10)}px`,
          background: `linear-gradient(to bottom right, ${alpha(p.primary, 0.15)}, ${alpha(p.primary, 0.05)})`,
          display: 'flex',
          alignItems: 'center',
          gap: u.r(8),
        }}
      >
        <Sym name={ic} size={u.r(18)} color={p.primary} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Txt size={u.t(13)} color={p.onSurface} weight={700} style={{ textOverflow: 'ellipsis' }}>
            {title}
          </Txt>
          {subtitle && (
            <Txt size={u.t(8)} color={alpha(p.onSurface, 0.6)} style={{ marginTop: u.r(2), textOverflow: 'ellipsis' }}>
              {subtitle}
            </Txt>
          )}
        </div>
        {trailing}
      </div>
    </div>
  )
}

/** A `GamepadControl` in a flow row: the part draws itself at a position, so it gets a box of its own size. */
function Hint({ glyph, label, bg, fg }: { glyph: string; label: string; bg: string; fg: string }) {
  const neo = useNeo()
  return (
    <div style={{ position: 'relative', width: controlWidth(neo, label), height: controlHeight(neo) }}>
      <GamepadControl glyph={glyph} label={label} bg={bg} fg={fg} left={0} top={0} />
    </div>
  )
}

export function SyncTab({ state }: { state: State }) {
  const neo = useNeo()
  const { u, p } = neo
  const sy = state.sync
  if (!sy.signedIn) {
    return (
      <FormRow centre={false}>
        <FormCard title="NeoSync Login" solid>
          <Field label="Email" selected={sy.slot === 0} />
          <Field label="Password" selected={sy.slot === 1} eye gap={14} />
          <SubmitButton label="Login" selected={sy.slot === 2} />
          <LinkRow label="Don't have an account? Sign Up" selected={sy.slot === 3} />
          <LinkRow label="Forgot Password?" selected={sy.slot === 4} />
        </FormCard>
        <InfoBox
          solid
          icon="cloud_rounded"
          title="What is NeoSync Cloud?"
          body="NeoSync is your unified cloud companion for NeoStation. It securely synchronizes your game saves, and game states across all your devices, ensuring your progress is never lost."
          points={[
            ['cloud_upload_rounded', 'Save files will be synced with NeoSync'],
            ['devices_rounded', 'Pick up exactly where you left off on any device running NeoStation.'],
            ['security_rounded', 'Your data is encrypted and only accessible by you.'],
          ]}
          footer="Learn more about the ecosystem at "
          link="neosync.cloud"
        />
      </FormRow>
    )
  }
  const frame = { position: 'absolute' as const, left: u.r(8), right: u.r(8), top: u.r(52), bottom: u.r(8) }
  const confirm = sy.confirm && (
    <ConfirmBox
      {...(sy.confirm === 'logout'
        ? { title: 'Logout', body: 'This will sign you out of your NeoSync account on this device.', confirm: 'Logout', icon: 'logout_rounded' as const }
        : sy.confirm === 'delete'
          ? { title: 'Delete Cloud Save', body: 'Permanently delete this save file from the cloud?', confirm: 'Delete', icon: 'delete_forever_rounded' as const }
          : {
              title: 'Cancel Subscription',
              body: 'Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period.',
              confirm: 'Cancel Subscription',
              cancel: 'Keep Subscription',
              icon: 'cancel_rounded' as const,
            })}
    />
  )

  if (sy.section === 'saves') {
    const rowH = u.r(56)
    return (
      <>
        <div style={{ ...frame, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: u.r(10) }}>
            <div style={{ flex: 1, height: u.r(40), boxSizing: 'border-box', borderRadius: u.r(12), background: alpha(p.surface, 0.5), display: 'flex', alignItems: 'center', gap: u.r(8), paddingLeft: u.r(12) }}>
              <Sym name="search_rounded" size={u.r(18)} color={alpha(p.onSurface, 0.6)} />
              <Txt size={u.t(13)} color={alpha(p.onSurface, 0.5)}>
                Search saves...
              </Txt>
            </div>
            <div style={{ height: u.r(40), boxSizing: 'border-box', padding: `0 ${u.r(12)}px`, borderRadius: u.r(12), background: alpha(p.surface, 0.5), display: 'flex', alignItems: 'center', gap: u.r(6) }}>
              <Sym name="tune_rounded" size={u.r(18)} color={p.onSurface} />
              <Txt size={u.t(13)} color={p.onSurface} weight={700}>
                Filters
              </Txt>
              <Sym name="expand_less_rounded" size={u.r(16)} color={alpha(p.onSurface, 0.5)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: u.r(8), marginTop: u.r(6) }}>
            {['Scope: All', 'System: All', 'Emulator: All', 'Sort: modified desc'].map((c) => (
              <div key={c} style={{ padding: `${u.r(8)}px ${u.r(12)}px`, borderRadius: u.r(12), background: alpha(p.surface, 0.5), display: 'flex', alignItems: 'center', gap: u.r(4) }}>
                <Txt size={u.t(13)} color={p.onSurface} weight={600}>
                  {c}
                </Txt>
                <Sym name="expand_more_rounded" size={u.r(16)} color={alpha(p.onSurface, 0.4)} />
              </div>
            ))}
          </div>
          <div style={{ flex: 1, marginTop: u.r(8), position: 'relative', padding: u.r(6), background: alpha(p.background, 0.25), borderRadius: u.r(12), border: `${u.r(1)}px solid ${alpha(p.primary, 0.15)}`, overflow: 'hidden' }}>
            <div style={{ ...abs({ left: u.r(4), top: u.r(4) + sy.saveRow * (rowH + u.r(4)), width: 0, height: rowH }), right: u.r(4), width: 'auto', background: p.secondary, borderRadius: u.r(12) }} />
            {sy.saves.map((sv, i) => {
              const on = i === sy.saveRow
              const fg = on ? p.onSecondary : p.onSurface
              return (
                <div
                  key={sv.path}
                  style={{
                    position: 'relative',
                    height: rowH,
                    boxSizing: 'border-box',
                    marginBottom: u.r(4),
                    padding: u.r(6),
                    borderRadius: u.r(12),
                    border: `${u.r(0.5)}px solid ${on ? 'transparent' : alpha(p.outline, 0.2)}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: u.r(8),
                  }}
                >
                  <div style={{ width: u.r(44), height: u.r(44), borderRadius: u.r(10), background: on ? alpha(p.onSecondary, 0.2) : alpha(p.primary, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sym name="save_rounded" size={u.r(22)} color={on ? p.onSecondary : p.primary} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Txt size={u.t(10)} color={fg} weight={on ? 700 : 600} style={{ textOverflow: 'ellipsis' }}>
                      {sv.path.split('/').pop()}
                    </Txt>
                    <Txt size={u.t(8)} color={alpha(fg, on ? 0.8 : 0.6)} style={{ marginTop: u.r(2), textOverflow: 'ellipsis' }}>
                      {`${sv.path} • ${sv.size}`}
                    </Txt>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ height: u.r(6) }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: u.r(8) }}>
            <Hint glyph="Xbox_X_button" label={sy.refreshed ? 'Refreshed' : 'Refresh'} bg={p.tertiaryFixed} fg={p.onTertiaryFixed} />
            <Hint glyph="Xbox_View_button" label="Delete" bg={p.error} fg={p.onError} />
            <Hint glyph="Xbox_B_button" label="Back" bg={p.tertiary} fg={p.onTertiary} />
          </div>
        </div>
        {confirm}
      </>
    )
  }

  if (sy.section === 'plans' || sy.section === 'folders') {
    const plans = sy.section === 'plans'
    // The plan list keeps the focused row centred (`plan_selection_view.dart:489-527`): the panel is
    // what is left under the section header and above the footer, less its 12.r padding.
    const headerH = u.r(10) * 2 + u.r(8) * 2 + u.t(13) * LINE
    const panelH = u.H - u.r(52) - u.r(8) - headerH - u.r(8) * 2 - controlHeight(neo) - u.r(12) * 2
    const pitch = u.r(64) + u.r(8)
    const planOffset = Math.max(0, Math.min(PLANS.length * pitch - u.r(8) - panelH, sy.planRow * pitch + u.r(32) - panelH / 2))
    return (
      <>
        <div style={{ ...frame, display: 'flex', flexDirection: 'column', gap: u.r(8) }}>
          {plans ? (
            <SectionHeader ic="payment_rounded" title={`Manage Your ${SYNC_USER.plan.toUpperCase()} Plan`} />
          ) : (
            <SectionHeader
              ic="folder_special_rounded"
              title="Standalone save folders"
              subtitle="Add a folder from a standalone emulator so its saves are synced too."
              trailing={
                <div style={{ padding: `${u.r(2)}px ${u.r(6)}px`, background: p.secondary, borderRadius: u.r(6) }}>
                  <Txt size={u.t(8)} color={p.onSecondary} weight={700}>
                    0 configured
                  </Txt>
                </div>
              }
            />
          )}
          <div style={{ flex: 1, position: 'relative', padding: u.r(12), background: alpha(p.background, 0.25), borderRadius: u.r(12), border: `${u.r(1)}px solid ${alpha(p.primary, 0.15)}`, overflow: 'hidden' }}>
            {plans ? (
              <div style={{ transform: `translateY(${-planOffset}px)` }}>
              {PLANS.map((pl, i) => {
                const on = i === sy.planRow
                const current = pl.id === SYNC_USER.plan
                const fg = on ? p.onSecondary : p.onSurface
                const accent = on ? p.onSecondary : p.primary
                const dim = on ? alpha(p.onSecondary, 0.8) : alpha(p.onSurface, 0.6)
                return (
                  <div key={pl.id} style={{ height: u.r(64), marginBottom: u.r(8), boxSizing: 'border-box', padding: `0 ${u.r(12)}px`, borderRadius: u.r(12), background: on ? p.secondary : 'transparent', display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: u.r(6) }}>
                        <Txt size={u.t(12)} color={fg} weight={on ? 700 : 600}>
                          {pl.name}
                        </Txt>
                        {current && (
                          <div style={{ padding: `${u.r(1)}px ${u.r(5)}px`, background: alpha(accent, 0.15), borderRadius: u.r(5) }}>
                            <Txt size={u.t(6)} color={accent} weight={900} letterSpacing={u.r(0.4)}>
                              CURRENT
                            </Txt>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: u.r(4), marginTop: u.r(2) }}>
                        <Sym name="cloud_rounded" size={u.r(9)} color={dim} />
                        <Txt size={u.t(9)} color={dim}>
                          {pl.storage}
                        </Txt>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Txt size={u.t(15)} color={accent} weight={700}>{`$${pl.price}`}</Txt>
                      <Txt size={u.t(8)} color={dim}>
                        /monthly
                      </Txt>
                    </div>
                    {current && (
                      <div style={{ marginLeft: u.r(8) }}>
                        <Sym name="check_circle_rounded" size={u.r(18)} color={accent} />
                      </div>
                    )}
                  </div>
                )
              })}
              </div>
            ) : (
              <div style={{ padding: u.r(12), textAlign: 'center' }}>
                <Sym name="folder_special_rounded" size={u.r(40)} color={alpha(p.onSurface, 0.4)} style={{ margin: '0 auto' }} />
                <Txt size={u.t(12)} color={alpha(p.onSurface, 0.6)} style={{ marginTop: u.r(8) }}>
                  No standalone folders configured
                </Txt>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: u.r(8) }}>
            {plans ? (
              (() => {
                const pl = PLANS[sy.planRow]!
                const cur = PLANS.findIndex((x) => x.id === SYNC_USER.plan)
                return pl.id === SYNC_USER.plan ? (
                  <Hint glyph="Xbox_A_button" label="End Subscription" bg={p.error} fg={p.onError} />
                ) : sy.planRow > cur ? (
                  <Hint glyph="Xbox_A_button" label="Upgrade" bg={p.primary} fg={p.onPrimary} />
                ) : (
                  <Hint glyph="Xbox_A_button" label="Downgrade" bg={p.tertiary} fg={p.onTertiary} />
                )
              })()
            ) : (
              <>
                <Hint glyph="Xbox_Y_button" label="Configure" bg={p.tertiaryFixed} fg={p.onTertiaryFixed} />
                <Hint glyph="Xbox_View_button" label="Delete" bg={p.error} fg={p.onError} />
              </>
            )}
            <Hint glyph="Xbox_B_button" label="Back" bg={p.tertiary} fg={p.onTertiary} />
          </div>
        </div>
        {confirm}
      </>
    )
  }

  // The dashboard: the header card beside the menu, Logout at the foot.
  const menu: [SymbolName, string, string][] = [
    ['cloud_rounded', 'Save List', 'Online Saves'],
    ['folder_special_rounded', 'Standalone Save Folders', 'Standalone save folders'],
    ['payment_rounded', 'Update Your Plan', 'Manage Your  Plan'],
  ]
  const last = sy.saves[0]
  return (
    <>
      <div style={{ ...frame, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', gap: u.r(12), alignItems: 'flex-start' }}>
          <div
            style={{
              width: u.w(240),
              flexShrink: 0,
              boxSizing: 'border-box',
              padding: u.r(8),
              background: p.surface,
              borderRadius: neo.radius.external,
              border: `${u.r(1)}px solid ${p.outline}`,
              boxShadow: shadow(neo, alpha(p.shadow, 0.1), u.r(4), u.r(2), u.r(2)),
            }}
          >
            <div style={{ borderRadius: neo.radius.internal, padding: u.r(10), background: `linear-gradient(to bottom right, ${alpha(p.primary, 0.18)}, ${alpha(p.primary, 0.04)})` }}>
              <Txt size={u.t(13)} color={p.onSurface} weight={700}>{`Hello, ${SYNC_USER.name}!`}</Txt>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: u.r(3), marginTop: u.r(3), padding: `${u.r(2)}px ${u.r(7)}px`, background: p.secondary, borderRadius: u.r(6) }}>
                <Sym name="storage_rounded" size={u.r(9)} color={p.onSecondary} />
                <Txt size={u.t(7)} color={p.onSecondary} weight={700}>
                  {`${SYNC_USER.plan.toUpperCase()} QUOTA`}
                </Txt>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: u.r(10) }}>
                <Txt size={u.t(8)} color={alpha(p.onSurface, 0.8)} weight={600}>
                  {SYNC_USER.used}
                </Txt>
                <Txt size={u.t(8)} color={p.primary} weight={700}>{`${SYNC_USER.pct}%`}</Txt>
                <Txt size={u.t(8)} color={alpha(p.onSurface, 0.8)} weight={600}>
                  {SYNC_USER.total}
                </Txt>
              </div>
              <div style={{ height: u.r(8), marginTop: u.r(4), borderRadius: u.r(4), background: alpha(p.surface, 0.5), overflow: 'hidden' }}>
                <div style={{ width: `${SYNC_USER.pct}%`, height: '100%', background: p.primary }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: u.r(6), marginTop: u.r(10) }}>
                {(
                  [
                    ['cloud_rounded', String(sy.saves.length), 'Online Saves'],
                    ['storage_rounded', `${Math.round(SYNC_USER.pct)}%`, 'Storage'],
                  ] as const
                ).map(([ic, value, label]) => (
                  <div key={label} style={{ padding: `${u.r(5)}px ${u.r(8)}px`, background: alpha(p.surface, 0.7), borderRadius: u.r(8), border: `${u.r(1)}px solid ${alpha(p.primary, 0.2)}`, display: 'flex', alignItems: 'center', gap: u.r(6) }}>
                    <Sym name={ic} size={u.r(12)} color={p.primary} />
                    <div>
                      <Txt size={u.t(11)} color={p.onSurface} weight={700}>
                        {value}
                      </Txt>
                      <Txt size={u.t(7)} color={alpha(p.onSurface, 0.6)}>
                        {label}
                      </Txt>
                    </div>
                  </div>
                ))}
                <div style={{ padding: `${u.r(5)}px ${u.r(8)}px`, background: alpha(p.surface, 0.7), borderRadius: u.r(8), border: `${u.r(1)}px solid ${alpha(p.primary, 0.2)}`, display: 'flex', alignItems: 'center', gap: u.r(6) }}>
                  <div style={{ width: u.r(24), height: u.r(24), borderRadius: u.r(6), background: alpha(p.primary, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sym name="videogame_asset_rounded" size={u.r(12)} color={p.primary} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <Txt size={u.t(9)} color={p.onSurface} weight={700} style={{ textOverflow: 'ellipsis' }}>
                      {last ? last.path.split('/').pop()! : '—'}
                    </Txt>
                    <Txt size={u.t(7)} color={alpha(p.onSurface, 0.6)}>
                      Last synced save
                    </Txt>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {menu.map(([ic, title, sub], i) => {
              const on = i === sy.menu
              return (
                <div key={title} style={{ paddingBottom: u.r(6) }}>
                  <div
                    style={{
                      boxSizing: 'border-box',
                      padding: `${u.r(8)}px ${u.r(12)}px`,
                      background: on ? alpha(p.secondary, 0.12) : p.surface,
                      borderRadius: neo.radius.external,
                      border: on ? `${u.r(2)}px solid ${alpha(p.secondary, 0.6)}` : `${u.r(1)}px solid ${p.outline}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: u.r(10),
                    }}
                  >
                    <div style={{ padding: u.r(6), background: alpha(p.primary, 0.1), borderRadius: u.r(8) }}>
                      <Sym name={ic} size={u.r(18)} color={on ? p.secondary : p.primary} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Txt size={u.t(12)} color={p.onSurface} weight={700}>
                        {title}
                      </Txt>
                      <Txt size={u.t(9)} color={alpha(p.onSurface, 0.6)} style={{ marginTop: u.r(1) }}>
                        {sub}
                      </Txt>
                    </div>
                    <Sym name="chevron_right_rounded" size={u.r(16)} color={alpha(p.onSurface, 0.4)} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div style={{ height: u.r(8) }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Hint glyph="Xbox_X_button" label="Logout" bg={p.error} fg={p.onError} />
        </div>
      </div>
      {confirm}
    </>
  )
}

/* ---- RomM ------------------------------------------------------------------------------------------ */

export function RommTab({ state }: { state: State }) {
  const neo = useNeo()
  const { u, p } = neo
  const r = state.romm
  const pw = r.mode === 'password'
  const n = pw ? 5 : 4
  return (
    <FormRow centre>
      <FormCard title="RomM Login">
        <Field label="Server URL" selected={r.slot === 0} gap={10} />
        <div
          style={{
            width: u.r(220),
            boxSizing: 'border-box',
            padding: u.r(4) - (r.slot === 1 ? u.r(2) : u.r(1)),
            marginBottom: u.r(10),
            background: alpha(p.onSurface, 0.05),
            borderRadius: u.r(8),
            border: r.slot === 1 ? `${u.r(2)}px solid ${p.primary}` : `${u.r(1)}px solid ${alpha(p.primary, 0.1)}`,
            display: 'flex',
          }}
        >
          {(
            [
              ['password', 'Password'],
              ['apikey', 'API key'],
            ] as const
          ).map(([m, label]) => (
            <div key={m} style={{ flex: 1, padding: `${u.r(6)}px 0`, borderRadius: u.r(6), background: r.mode === m ? p.primary : 'transparent', textAlign: 'center' }}>
              <Txt size={u.t(9)} color={r.mode === m ? p.onPrimary : alpha(p.onSurface, 0.7)} weight={r.mode === m ? 700 : 400}>
                {label}
              </Txt>
            </div>
          ))}
        </div>
        {pw ? (
          <>
            <Field label="Username" selected={r.slot === 2} gap={8} />
            <Field label="Password" selected={r.slot === 3} eye gap={12} />
          </>
        ) : (
          <Field label="API key" selected={r.slot === 2} eye gap={12} />
        )}
        <SubmitButton label="Login" selected={r.slot === n - 1} />
      </FormCard>
      <InfoBox
        iconNode={
          <div style={{ position: 'relative', width: u.r(24), height: u.r(24) }}>
            <Tinted src={icon('romm-light.svg')} box={{ left: 0, top: 0, width: u.r(24), height: u.r(24) }} color={p.primary} />
          </div>
        }
        title="What is RomM?"
        body="RomM is a self-hosted ROM manager. Connect to your server to browse your library, download games straight to this device, and sync your saves."
        points={[
          ['grid_view_rounded', 'Browse and download your full game library'],
          ['cloud_sync_rounded', 'Sync save files across your devices'],
          ['dns_rounded', 'Self-hosted: your collection, your server'],
        ]}
        footer="Learn more at "
        link="romm.app"
      />
    </FormRow>
  )
}
