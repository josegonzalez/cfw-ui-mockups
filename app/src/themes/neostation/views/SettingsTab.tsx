/**
 * PORTING NOTES
 * CFW: NeoStation            Devices: odin2-mini, rg40xx
 * Source: lib/screens/settings_screen/new_settings_screen.dart, new_settings_options/*_content.dart,
 *         new_settings_options/widgets/{setting_row,setting_value_chip,settings_card_row,
 *         settings_action_button,settings_section_header}.dart, lib/widgets/theme_card.dart,
 *         language_picker_overlay.dart
 * Mode: reproduce
 *
 * Layout:        the menu is a quarter of the screen wide; the page beside it is always the page under
 *                the menu's cursor, so walking the menu previews every page. General and the other
 *                lists are rows 12.r apart under a pinned title; Themes is the three NeoGlass rows
 *                over a four-column grid of painted theme cards.
 * Focus & selection: the page's focused row takes a 2px `primary` border (cards 2.r); nothing
 *                animates - the source swaps highlights instantly.
 * Buttons:       menu - up/down wrap, right or A enter; page - up/down clamp (System Art wraps),
 *                A acts, B or left leave. Themes' grid wraps top to bottom and along a row.
 * Transitions:   none in the source beyond the list scroll (200ms easeInOut).
 * Notes:         rows that open the operating system - folder pickers, Android settings, All Files
 *                Access, the launcher chooser, the links on About - do nothing here. The
 *                General page follows each device's platform: the Odin gets the Android rows, the
 *                rg40xx Fullscreen and BarTOP Shutdown. Confirm Exit leaves the app, which the
 *                mockup draws as the black screen left behind; any button starts it again.
 */
import type { ReactNode } from 'react'
import { brand } from '../assets'
import { systemDef } from '../library'
import type { State } from '../machine'
import { PALETTES, alpha } from '../palette'
import {
  LANGUAGES,
  SETTINGS_PAGES,
  SFX_LEVELS,
  THEME_CELLS,
  THEME_COLUMNS,
  generalRows,
  settingsSystems,
  type GeneralRow,
  type SettingsPage,
} from '../settings'
import type { SymbolName } from '../symbols'
import { ConfirmBox } from './forms'
import { MasterDetail, PageTitle } from './ScraperTab'
import { Toggle } from './Overlays'
import { LINE, Sym, Txt, abs, useNeo } from './parts'

const PAGE_LOOK: Readonly<Record<SettingsPage, [SymbolName, string]>> = {
  general: ['settings_rounded', 'General'],
  directories: ['folder_rounded', 'Directories'],
  tools: ['build_rounded', 'Tools'],
  systems: ['sports_esports_rounded', 'Systems'],
  themes: ['palette_rounded', 'Themes'],
  systemArt: ['image_rounded', 'System Art'],
  about: ['info_rounded', 'About'],
  exit: ['exit_to_app_rounded', 'Exit'],
}

const GENERAL: Readonly<Record<GeneralRow, [string, string]>> = {
  androidSettings: ['System Settings', 'Open android system settings'],
  scanOnStartup: ['Scan folders on Startup', 'Automatically scan ROM folders when the application starts'],
  ignoreHidden: ['Ignore hidden items', 'Hide hidden files and folders during ROM scans'],
  autoUpdateApp: ['Auto-update App', 'Check for new app versions on startup and prompt to update'],
  autoUpdateSystems: ['Auto-update Systems & Emulators', 'Check for updated system and emulator configs on startup'],
  sfx: ['UI Navigation Sounds', 'Play sound effects for gamepad, keyboard and touch navigation'],
  sfxVolume: ['UI Sounds Volume', 'Adjust volume and play a preview sound'],
  use12h: ['Use 12-Hour Clock', 'Show the clock in 12-hour format with AM/PM instead of 24-hour'],
  subfolderAll: ['Show Subfolders in Every System', 'Apply the per-system Show Subfolders setting to every system at once'],
  cloudIcon: ['Cloud Save Icon', 'Show the cloud sync status beside the selected game'],
  achievementBadges: ['Achievement Badges', 'Show the achievement count on games matched to RetroAchievements'],
  raMatch: [
    'Match achievements on Startup',
    'Matches new ROMs after the startup scan. To match a whole library, run Match RetroAchievements Games in Tools first.',
  ],
  'tab:search': ['Show Search tab', 'Display the Search tab in the navigation bar'],
  'tab:sync': ['Show NeoSync tab', 'Display the NeoSync tab in the navigation bar'],
  'tab:achievements': ['Show Achievements tab', 'Display the RetroAchievements tab in the navigation bar'],
  'tab:scraper': ['Show Scraper tab', 'Display the Scraping tab in the navigation bar'],
  'tab:romm': ['Show RomM tab', 'Display the RomM tab in the navigation bar'],
  language: ['Language', 'Select preferred language for game metadata'],
  fullscreen: ['Fullscreen Mode', 'Display the app in fullscreen mode'],
  allFiles: ['All Files Access', 'Required for RetroArch config and Save Sync'],
  defaultLauncher: ['Default Launcher', 'NeoStation is your default launcher'],
  disableSecondary: ['Disable on secondary screen', 'It turns off the app on secondary display'],
  bartop: ['BarTOP Shutdown on Exit', 'Shut down the computer when exiting the application'],
}

/** `SettingRow`: the surface at 0.5, a 2px `primary` border when focused, title over subtitle, the control. */
function Row({ focused, title, subtitle, trailing, dim }: { focused: boolean; title: string; subtitle: ReactNode; trailing: ReactNode; dim?: boolean }) {
  const neo = useNeo()
  const { u, p } = neo
  return (
    <div
      style={{
        marginBottom: u.r(12),
        padding: `${u.r(6)}px ${u.r(12)}px`,
        background: alpha(p.surface, 0.5),
        borderRadius: u.r(8),
        border: `${u.px(2)}px solid ${focused ? p.primary : 'transparent'}`,
        display: 'flex',
        alignItems: 'center',
        gap: u.r(12),
        opacity: dim ? 0.4 : 1,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <Txt size={u.t(12)} color={focused ? p.primary : p.onSurface} weight={500}>
          {title}
        </Txt>
        <div style={{ marginTop: u.r(4), fontFamily: "'NeoStation Anta'", fontSize: u.t(9), lineHeight: 1.3, color: alpha(p.onSurface, 0.6) }}>{subtitle}</div>
      </div>
      {trailing}
    </div>
  )
}

/** `SettingValueChip`. */
function Chip({ label, drop }: { label: string; drop?: boolean }) {
  const neo = useNeo()
  const { u, p } = neo
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: u.r(2), padding: `${u.r(6)}px ${u.r(10)}px`, background: alpha(p.primary, 0.15), borderRadius: u.r(6), border: `${u.r(0.5)}px solid ${alpha(p.primary, 0.4)}`, flexShrink: 0 }}>
      <Txt size={u.t(9)} color={p.primary}>
        {label}
      </Txt>
      {drop && <Sym name="arrow_drop_down_rounded" size={u.r(14)} color={p.primary} />}
    </div>
  )
}

function InlineToggle({ value }: { value: boolean }) {
  const neo = useNeo()
  const { u } = neo
  return (
    <div style={{ position: 'relative', width: u.r(24) * 2 + u.r(16) + u.r(4), height: u.r(28), flexShrink: 0 }}>
      <Toggle value={value} left={0} top={0} />
    </div>
  )
}

/** `SettingsCardRow`, with its round action button or control. */
function Card({ focused, icon, title, subtitle, trailing, danger, disabled, mono }: { focused: boolean; icon: SymbolName; title: string; subtitle: string; trailing: ReactNode; danger?: boolean; disabled?: boolean; mono?: boolean }) {
  const neo = useNeo()
  const { u, p } = neo
  const accent = danger ? p.error : p.primary
  return (
    <div
      style={{
        marginBottom: u.r(8),
        padding: `${u.r(8)}px ${u.r(12)}px`,
        background: danger && focused ? alpha(p.error, 0.08) : alpha(p.background, 0.25),
        borderRadius: u.r(12),
        border: focused ? `${u.r(2)}px solid ${accent}` : `${u.r(1)}px solid ${alpha(p.outline, 0)}`,
        display: 'flex',
        alignItems: 'center',
        gap: u.r(12),
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Sym name={icon} size={u.r(20)} color={focused ? accent : p.onSurface} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Txt size={mono ? u.t(10) : u.t(12)} color={p.onSurface} weight={700} style={{ textOverflow: 'ellipsis', fontFamily: mono ? 'ui-monospace, Menlo, monospace' : undefined }}>
          {title}
        </Txt>
        <div style={{ marginTop: u.r(2), fontFamily: "'NeoStation Anta'", fontSize: u.t(9), lineHeight: 1.3, color: alpha(p.onSurface, danger && focused ? 0.7 : 0.6) }}>{subtitle}</div>
      </div>
      {trailing}
    </div>
  )
}

/** `SettingsActionButton`: a round button, full strength on the focused row. */
function Action({ icon, focused, danger }: { icon: SymbolName; focused: boolean; danger?: boolean }) {
  const neo = useNeo()
  const { u, p } = neo
  const c = danger ? p.error : p.primary
  return (
    <div style={{ padding: u.r(4), borderRadius: '50%', background: alpha(c, focused ? 1 : 0.8), boxShadow: `0 ${u.r(2)}px ${2 * (0.57735 * u.r(4) + u.px(0.5))}px ${alpha(c, 0.3)}`, flexShrink: 0 }}>
      <Sym name={icon} size={u.r(16)} color={p.onPrimary} />
    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  const neo = useNeo()
  const { u, p } = neo
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: u.r(8), padding: `${u.r(4)}px 0 ${u.r(8)}px ${u.r(2)}px` }}>
      <div style={{ width: u.r(3), height: u.r(14), background: p.primary, borderRadius: u.r(2) }} />
      <Txt size={u.t(11)} color={p.primary} weight={700} letterSpacing={0.5 * u.dpr}>
        {label}
      </Txt>
    </div>
  )
}

/** A list that keeps its focused row in view, by row pitch - the source's `AdaptiveScroller`, centred. */
function Scrolled({ pitch, focus, top, children }: { pitch: number; focus: number; top: number; children: ReactNode }) {
  const neo = useNeo()
  const { u } = neo
  const viewport = u.H - u.r(46) - u.r(16) * 2 - top
  const offset = Math.max(0, focus * pitch + pitch / 2 - viewport / 2)
  return (
    <div style={{ position: 'absolute', left: u.r(16), right: u.r(16), top: u.r(16) + top, bottom: 0, overflow: 'hidden' }}>
      <div style={{ transform: `translateY(${-offset}px)` }}>{children}</div>
    </div>
  )
}

export function SettingsTab({ state }: { state: State }) {
  const neo = useNeo()
  const { u, p } = neo
  const st = state.settings
  const page = SETTINGS_PAGES[st.menu]!
  const f = (i: number) => st.inPane && st.item === i
  const titleH = u.t(14) * LINE + u.r(8) + u.t(9) * LINE + u.r(12)
  const rowPitch = u.r(12) + u.t(12) * LINE + u.r(4) + u.t(9) * 1.3 + u.px(4) + u.r(12)
  const cardPitch = u.r(16) + Math.max(u.r(20), u.t(12) * LINE + u.r(2) + u.t(9) * 1.3) + u.r(4) + u.r(8)
  return (
    <>
      <MasterDetail items={SETTINGS_PAGES.map((pg) => PAGE_LOOK[pg])} menu={st.menu} inPane={st.inPane}>
        {page === 'general' && (
          <>
            <PageTitle title="General Settings" />
            <Scrolled pitch={rowPitch} focus={st.inPane ? st.item : 0} top={u.t(14) * LINE + u.r(12)}>
              {generalRows(state.platform).map((row, i) => {
                const [title, sub] = GENERAL[row]
                const trailing =
                  row === 'sfxVolume' ? (
                    <Chip label={SFX_LEVELS[st.sfxVolume]!} />
                  ) : row === 'language' ? (
                    <Chip label={LANGUAGES[st.language]!} drop />
                  ) : row === 'androidSettings' ? (
                    <Sym name="open_in_new_rounded" size={u.r(18)} color={alpha(p.onSurface, 0.7)} />
                  ) : (
                    <InlineToggle value={row.startsWith('tab:') ? !state.hidden.includes(row.slice(4) as never) : !!st.toggles[row]} />
                  )
                const subtitle =
                  row === 'allFiles' ? (
                    <>
                      <span style={{ color: '#4caf50', fontWeight: 700 }}>Permission granted</span>
                      <div style={{ fontSize: u.t(8), color: alpha(p.onSurface, 0.5), marginTop: u.r(2) }}>{sub}</div>
                    </>
                  ) : (
                    sub
                  )
                return <Row key={row} focused={f(i)} title={title} subtitle={subtitle} trailing={trailing} dim={row === 'sfxVolume' && !st.toggles.sfx} />
              })}
            </Scrolled>
          </>
        )}
        {page === 'directories' && (
          <>
            <PageTitle title="Directories" subtitle="Configure ROMs folder" />
            <Scrolled pitch={cardPitch} focus={st.inPane ? st.item : 0} top={titleH}>
              <Card focused={f(0)} icon="folder_special_rounded" title="User Data Location" subtitle="Choose where scraped media, system art packs, and app data are stored" trailing={<Action icon="edit_rounded" focused={f(0)} />} />
              <Card focused={f(1)} icon="refresh_rounded" title="Rescan All ROM Folders" subtitle="Manually scan for new systems and ROMs" trailing={<Action icon="refresh_rounded" focused={f(1)} />} />
              <SectionLabel label="ROM Directories" />
              <Card focused={f(2)} icon="folder_rounded" title="Add ROM Folder" subtitle="Add a folder containing your ROM files" trailing={<Action icon="add_rounded" focused={f(2)} />} />
              <Card
                focused={f(3)}
                mono
                danger
                icon="folder_rounded"
                title={state.platform === 'android' ? '/storage/emulated/0/ROMs' : '/roms'}
                subtitle="Press confirm to remove this folder"
                trailing={<Action icon="delete_outline_rounded" focused={f(3)} danger />}
              />
              <SectionLabel label="ES-DE Import" />
              <Card focused={f(4)} icon="folder_special_rounded" title="Select ES-DE Folder" subtitle="Choose the ES-DE folder containing gamelists and downloaded_media" trailing={<Action icon="folder_special_rounded" focused={f(4)} />} />
              <Card focused={f(5)} disabled icon="download_rounded" title="Import from ES-DE" subtitle="Fill in missing metadata and use ES-DE artwork as fallback" trailing={<Action icon="download_rounded" focused={f(5)} />} />
              <Card focused={f(6)} danger icon="restart_alt_rounded" title="Reset ES-DE Import" subtitle="Remove imported metadata and media links so the import can be re-run" trailing={<Action icon="restart_alt_rounded" focused={f(6)} danger />} />
            </Scrolled>
          </>
        )}
        {page === 'tools' && (
          <>
            <PageTitle title="Tools" subtitle="Tools to help organise your ROMs" />
            <Card focused={f(0)} icon="emoji_events_rounded" title="Match RetroAchievements Games" subtitle="Check your whole library for achievement sets, instead of one game at a time" trailing={<Action icon="emoji_events_rounded" focused={f(0)} />} />
            <Card focused={f(1)} icon="cleaning_services_rounded" title="Clean Orphaned Metadata" subtitle="Remove metadata and media left behind by deleted ROMs" trailing={<Action icon="cleaning_services_rounded" focused={f(1)} />} />
            <Card focused={f(2)} icon="folder_managed_rounded" title="Organize Multi-Disc Games" subtitle="Automatically creates .m3u files for multi disc games and organises them into folders" trailing={<Action icon="folder_managed_rounded" focused={f(2)} />} />
          </>
        )}
        {page === 'systems' && (
          <>
            <PageTitle title="Systems" subtitle="Show or hide systems from your library" />
            <Scrolled pitch={cardPitch} focus={st.inPane ? st.item : 0} top={titleH}>
              <Card focused={f(0)} icon="access_time_rounded" title="Recent Games Card" subtitle="Show the recently played card in the systems grid" trailing={<InlineToggle value={st.recentCard} />} />
              <Card focused={f(1)} disabled={!st.recentCard} icon="aspect_ratio_rounded" title="Recent Card Size" subtitle="Size of the recently played card in the systems grid" trailing={<Chip label={st.recentCompact ? 'Compact' : 'Default'} />} />
              <Card focused={f(2)} icon="favorite_rounded" title="Favorite" subtitle="favorites" trailing={<InlineToggle value={st.favoritesCard} />} />
              {settingsSystems().map((id, i) => (
                <Card key={id} focused={f(3 + i)} icon="videogame_asset_rounded" title={systemDef(id).name} subtitle={id} trailing={<InlineToggle value={!st.hiddenSystems.includes(id)} />} />
              ))}
            </Scrolled>
          </>
        )}
        {page === 'themes' && <ThemesPage state={state} />}
        {page === 'systemArt' && (
          <>
            <PageTitle title="System Art" subtitle="Customize system card backgrounds with System Art packs" />
            <Row
              focused={f(0)}
              title="Hide system logos"
              subtitle="Hide the logo on system cards when the background already includes one"
              trailing={<InlineToggle value={st.hideLogos} />}
            />
            <div
              style={{
                margin: `${u.r(4)}px 0`,
                padding: u.r(8),
                background: p.background,
                borderRadius: u.r(12),
                border: f(1) ? `${u.r(2)}px solid ${p.primary}` : `${u.r(1)}px solid rgba(105,240,174,0.7)`,
                display: 'flex',
                alignItems: 'center',
                gap: u.r(12),
              }}
            >
              <div style={{ width: u.r(64), height: u.r(64), borderRadius: u.r(8), background: p.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sym name="block_rounded" size={u.r(28)} color={alpha(p.onSurface, 0.3)} />
              </div>
              <div style={{ flex: 1 }}>
                <Txt size={u.t(14)} color={p.onSurface} weight={700}>
                  None
                </Txt>
                <Txt size={u.t(10)} color={alpha(p.onSurface, 0.65)} style={{ marginTop: u.r(4) }}>
                  Default appearance
                </Txt>
              </div>
              <Sym name="check_circle_rounded" size={u.r(18)} color="#69f0ae" />
            </div>
          </>
        )}
        {page === 'about' && <AboutPage state={state} />}
        {page === 'exit' && (
          <>
            <PageTitle title="Exit Application" subtitle="Are you sure you want to exit NeoStation?" />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: u.r(120),
                  boxSizing: 'border-box',
                  padding: `${u.r(8)}px ${u.r(12)}px`,
                  borderRadius: u.r(6),
                  background: f(0) ? p.error : alpha(p.error, 0.1),
                  border: f(0) ? `${u.r(2)}px solid ${p.error}` : `${u.r(1)}px solid ${p.error}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: u.r(8),
                }}
              >
                <Sym name="power_settings_new_rounded" size={u.r(16)} color={f(0) ? '#ffffff' : p.error} />
                <Txt size={u.t(8)} color={f(0) ? '#ffffff' : p.error} weight={700}>
                  Confirm Exit
                </Txt>
              </div>
            </div>
          </>
        )}
      </MasterDetail>
      {st.picker !== null && <LanguagePicker cursor={st.picker} current={st.language} />}
      {st.dialog && (
        <ConfirmBox
          title={st.dialog.title}
          body={st.dialog.body}
          confirm={st.dialog.confirm}
          icon={st.dialog.icon as SymbolName}
          accent={st.dialog.accent}
          info={st.dialog.kind === 'info'}
        />
      )}
    </>
  )
}

/** A theme's card: a painted miniature of the app in its colours (`theme_card.dart:203-360`). */
function ThemeCard({ id, focused, active }: { id: string; focused: boolean; active: boolean }) {
  const neo = useNeo()
  const { u, p } = neo
  const label = id === 'system' ? 'System' : id === 'import' ? 'Import Theme' : PALETTES[id as keyof typeof PALETTES].name
  const pal = id === 'system' ? PALETTES.dark : id === 'import' ? null : PALETTES[id as keyof typeof PALETTES]
  return (
    <div>
      <div
        style={{
          aspectRatio: '4 / 3',
          margin: `${u.h(4)}px 0`,
          boxSizing: 'border-box',
          borderRadius: u.r(8),
          border: `${u.r(2)}px solid ${focused ? p.primary : pal ? 'transparent' : alpha(p.onSurface, 0.25)}`,
          boxShadow: focused ? `0 0 ${2 * (0.57735 * u.r(8) + u.px(0.5))}px ${u.r(1)}px ${alpha(p.primary, 0.3)}` : undefined,
          background: pal ? pal.background : alpha(p.surface, 0.35),
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {pal ? (
          <>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '15%', background: pal.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4%' }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ width: '5%', aspectRatio: '1', borderRadius: '50%', background: i === 1 ? pal.primary : alpha(pal.onSurface, 0.4) }} />
              ))}
            </div>
            <div style={{ position: 'absolute', left: '8%', right: '8%', top: '26%', height: '42%', display: 'flex', gap: '6%', alignItems: 'center' }}>
              {[0.7, 1, 0.7].map((sc, i) => (
                <div key={i} style={{ flex: 1, height: `${sc * 100}%`, borderRadius: u.r(3), background: i === 1 ? pal.primary : pal.surface, opacity: i === 1 ? 1 : 0.8 }} />
              ))}
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '22%', background: pal.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2%' }}>
              {Array.from({ length: 11 }, (_, i) => (
                <div key={i} style={{ width: '6%', height: '30%', borderRadius: u.r(2), background: i === 5 ? pal.secondary : alpha(pal.onSurface, 0.3) }} />
              ))}
            </div>
            {active && (
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: u.r(36), height: u.r(36), borderRadius: u.r(18), background: '#69f0ae', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sym name="check_rounded" size={u.r(24)} color="#000000" />
              </div>
            )}
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sym name="add_rounded" size={u.r(32)} color={focused ? p.primary : alpha(p.onSurface, 0.6)} />
          </div>
        )}
      </div>
      <Txt size={u.t(12)} color={focused || active ? p.onSurface : alpha(p.onSurface, 0.7)} weight={active ? 700 : 400} style={{ marginTop: u.r(4), textAlign: 'center', textOverflow: 'ellipsis' }}>
        {label}
      </Txt>
    </div>
  )
}

function ThemesPage({ state }: { state: State }) {
  const neo = useNeo()
  const { u, p } = neo
  const st = state.settings
  const f = (i: number) => st.inPane && st.item === i
  const cols = THEME_COLUMNS
  const width = u.W - u.px(u.lw * 0.25) - u.r(32)
  const cell = (width - u.r(8) * (cols - 1)) / cols
  const cellH = cell / 1.05
  const head = u.t(14) * LINE + u.r(8) + u.t(9) * LINE + u.r(12) + u.t(13) * LINE + u.r(8) + 3 * (u.r(12) + u.t(12) * LINE + u.r(4) + u.t(9) * 1.3 + u.px(4)) + 2 * u.r(8) + u.r(20)
  const row = st.item >= 3 ? Math.floor((st.item - 3) / cols) : -1
  const viewport = u.H - u.r(46) - u.r(32)
  const offset = row < 0 ? 0 : Math.max(0, head + row * (cellH + u.r(8)) + cellH / 2 - viewport / 2)
  const blur = st.glassBlur === 0 ? 'Off' : String(st.glassBlur)
  const border = st.glassBorder === 0 ? 'Off' : String(st.glassBorder)
  return (
    <div style={{ transform: `translateY(${-offset}px)` }}>
      <PageTitle title="Themes" subtitle="Personalize the appearance of your NeoStation" />
      <Txt size={u.t(13)} color={p.onSurface} weight={600} style={{ marginBottom: u.r(8) }}>
        NeoGlass
      </Txt>
      {(
        [
          ['Glass Blur', 'Frost strength: Off, 1 or 2', blur],
          ['Glass Transparency', '0 = no transparency, 30 = 50% transparency', String(st.glassTransparency)],
          ['Glass Border', 'Width of the glass edge', border],
        ] as const
      ).map(([title, sub, value], i) => (
        <div key={title} style={{ marginBottom: i < 2 ? u.r(8) - u.r(12) : -u.r(12) }}>
          <Row focused={f(i)} title={title} subtitle={sub} trailing={<Chip label={value} />} />
          {i === 0 && st.glassBlur > 0 && (
            <p style={{ margin: `${u.r(4) - u.r(12)}px 0 ${u.r(12)}px`, padding: `0 ${u.r(12)}px`, fontFamily: "'NeoStation Anta'", fontSize: u.t(9), color: alpha(p.onSurface, 0.6) }}>
              Only enable on a powerful GPU - on low-end hardware the frosted blur may not stay smooth.
            </p>
          )}
        </div>
      ))}
      <div style={{ height: u.r(20) + u.r(12) }} />
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gap: u.r(8) }}>
        {THEME_CELLS.map((id, i) => (
          <ThemeCard key={id} id={id} focused={f(3 + i)} active={id === state.themeName} />
        ))}
      </div>
    </div>
  )
}

function AboutPage({ state }: { state: State }) {
  const neo = useNeo()
  const { u, p } = neo
  const st = state.settings
  const f = (i: number) => st.inPane && st.item === i
  const cards: [string, string][] = [
    ['Open Source Project', 'Licensed under GPLv3'],
    ['Support us on Ko-fi', 'ko-fi.com/neostation'],
    ['Support us on Patreon', 'patreon.com/NeoStation'],
    ['Join our community and get support', 'discord.gg/xE2kgKsRVq'],
    ['Visit our official website', 'neostation.dev'],
    ['Export logs', 'For bug reports. Includes file paths and game names.'],
  ]
  return (
    <>
      <PageTitle title="Thank you for using NeoStation!" />
      <div style={{ display: 'flex', gap: u.r(16), padding: `0 ${u.r(6)}px` }}>
        <div style={{ width: u.r(90), textAlign: 'center', flexShrink: 0 }}>
          <img alt="" src={brand('logo_transparent.png')} style={{ width: u.r(64), height: u.r(64), objectFit: 'contain' }} />
          <Txt size={u.t(12)} color={p.onSurface} weight={700} style={{ marginTop: u.r(6) }}>
            NeoStation
          </Txt>
          <Txt size={u.t(9)} color={alpha(p.onSurface, 0.6)} style={{ marginTop: u.h(1) }}>
            Beta v1.0.0
          </Txt>
          <Txt size={u.t(8)} color={alpha(p.onSurface, 0.4)} style={{ marginTop: u.h(1) }}>
            Systems vbundled
          </Txt>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: u.h(8) }}>
          {cards.map(([title, value], i) => (
            <div
              key={title}
              style={{
                padding: u.r(6),
                background: alpha(p.background, 0.25),
                borderRadius: u.r(12),
                border: `${u.px(2)}px solid ${f(i) ? p.primary : 'transparent'}`,
                display: 'flex',
                alignItems: 'center',
                gap: u.r(8),
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <Txt size={u.t(12)} color={p.onSurface} weight={700}>
                  {title}
                </Txt>
                <Txt size={u.t(9)} color={p.primary} weight={500} style={{ marginTop: u.r(2), textOverflow: 'ellipsis' }}>
                  {value}
                </Txt>
              </div>
              <Sym name={i === 5 ? (state.platform === 'android' ? 'share_rounded' : 'download_rounded') : 'open_in_new_rounded'} size={u.r(14)} color={alpha(p.onSurface, 0.4)} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

/** The language picker (`language_picker_overlay.dart`): its row's right edge, the current language checked. */
function LanguagePicker({ cursor, current }: { cursor: number; current: number }) {
  const neo = useNeo()
  const { u, p } = neo
  const item = u.r(24)
  const h = item * LANGUAGES.length + u.r(16)
  const w = u.r(180)
  const top = Math.max(u.px(8), Math.min(u.H - h - u.px(8), (u.H - h) / 2))
  return (
    <div
      style={{
        ...abs({ left: u.W - u.r(32) - w, top, width: w, height: h }),
        boxSizing: 'border-box',
        padding: `${u.r(8)}px 0`,
        background: p.surface,
        borderRadius: u.r(12),
        border: `${u.px(1)}px solid ${alpha(p.primary, 0.2)}`,
        boxShadow: `0 ${u.px(5)}px ${2 * (0.57735 * u.px(15) + u.px(0.5))}px rgba(0,0,0,0.25)`,
      }}
    >
      <div
        style={{
          ...abs({ left: u.r(6), top: u.r(8) - u.px(1) + cursor * item, width: w - u.r(10) - u.px(2), height: item }),
          boxSizing: 'border-box',
          background: alpha(p.primary, 0.15),
          borderRadius: u.r(8),
          border: `${u.r(0.5)}px solid ${alpha(p.primary, 0.3)}`,
        }}
      />
      {LANGUAGES.map((l, i) => (
        <div key={l} style={{ position: 'relative', height: item, padding: `0 ${u.r(12)}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt size={u.t(10)} color={i === current ? p.secondary : p.onSurface} weight={i === current ? 600 : 400}>
            {l}
          </Txt>
          {i === current && <Sym name="check_rounded" size={u.r(12)} color={p.secondary} />}
        </div>
      ))}
    </div>
  )
}
