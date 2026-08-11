/**
 * PORTING NOTES
 * CFW: Vitro Launcher, a Love2D launcher for muOS by KevDoy
 * Devices: rg35xx, rg34xx
 * Source: the Settings screen
 * Mode: reproduce
 *
 * A scrolling list of rows, each a label on the left and a value on the right, with the focused
 * row backed by a glass stadium and flanked by the arrows that say it can be changed.
 *
 * Layout:
 *   - Rows 42 tall, inset 40 from each edge. Seven visible; the list translates by whole rows.
 * Focus & selection:
 *   - Up and down move the row. Left and right change the focused row's value.
 * Buttons:
 *   - A activates - only Reset Settings does anything. B leaves.
 * Transitions:
 *   - The list translates over 120ms linear; the focused row's glass fades in over 90ms.
 */
import { GlassPanel } from '../../../widgets/GlassPanel'
import { buttonPair, image } from '../assets'
import { SETTINGS_ROW_HEIGHT, SETTINGS_WINDOW } from '../layout'
import { COLORS, SETTINGS, type SettingDef, type VitroSettings } from '../library'
import type { VitroTokens } from '../palette'

export interface SettingsProps {
  readonly settings: VitroSettings
  readonly selected: number
  readonly tokens: VitroTokens
  /**
   * The window's first visible row. Owned by the screen rather than derived here, because the
   * window is sticky: it only moves when the cursor would leave it, so scrolling down and back up
   * returns through the same positions instead of snapping.
   */
  readonly top: number
}

/** The window's first visible row, given the cursor. Pure, so windowing is testable. */
export function scrollTop(selected: number, previous: number, count: number): number {
  const last = SETTINGS_WINDOW - 1
  let top = previous
  if (selected < top) top = selected
  if (selected > top + last) top = selected - last
  return Math.max(0, Math.min(top, Math.max(0, count - SETTINGS_WINDOW)))
}

export function Settings({ settings, selected, tokens, top }: SettingsProps) {
  return (
    <>
      <div className="settings-title">Settings</div>
      <div className="settings-list">
        <div
          className="settings-scroll"
          style={{ transform: `translateY(${-top * SETTINGS_ROW_HEIGHT}px)` }}
        >
          {SETTINGS.map((def, i) => (
            <SettingRow
              key={def.key}
              def={def}
              settings={settings}
              tokens={tokens}
              focused={i === selected}
            />
          ))}
        </div>
      </div>
      {top + SETTINGS_WINDOW < SETTINGS.length ? <div className="settings-more">more</div> : null}
    </>
  )
}

function SettingRow({
  def,
  settings,
  tokens,
  focused,
}: {
  def: SettingDef
  settings: VitroSettings
  tokens: VitroTokens
  focused: boolean
}) {
  const arrow = image('glass-arrow-right.png')
  const changeable = def.type !== 'action'

  return (
    <div className={`srow${focused ? ' is-focused' : ''}`}>
      <div className="srow-glass">
        <GlassPanel
          light={tokens.uiLight}
          transparent={settings.transparency}
          inkRgb={tokens.fgRgb}
        />
      </div>
      <div className="srow-label">{def.label}</div>
      <div className={`srow-value${changeable ? ' srow-changeable' : ''}`}>
        {arrow ? <img className="srow-arrow left invertible" src={arrow} alt="" /> : null}
        <div className="srow-mid">
          <SettingValue def={def} settings={settings} />
        </div>
        {arrow ? <img className="srow-arrow right invertible" src={arrow} alt="" /> : null}
      </div>
    </div>
  )
}

/**
 * A row's value, in whichever of the six shapes its type calls for.
 *
 * The colour row is the interesting one: a scheme whose background differs from its accent shows
 * both as a split dot, which is what makes Black & Blue and White & Blue legible as pairs rather
 * than as single colours.
 */
function SettingValue({ def, settings }: { def: SettingDef; settings: VitroSettings }) {
  const value = (settings as unknown as Record<string, unknown>)[def.key]

  if (def.type === 'action') return null

  if (def.type === 'color') {
    const c = COLORS[settings.color]!
    const split = c.light || c.bg !== c.accent
    return (
      <>
        <span
          className="srow-dot"
          style={{
            background: split
              ? `linear-gradient(90deg, ${c.bg} 50%, ${c.accent} 50%)`
              : c.accent,
          }}
        />
        {c.l}
      </>
    )
  }

  if (def.type === 'toggle') return <>{value ? 'Yes' : 'No'}</>
  if (def.type === 'percent') return <>{value != null ? `${value}%` : '--'}</>

  if (def.type === 'buttons') {
    const [a, b] = buttonPair(settings.button_style)
    return (
      <span className="srow-glyphs">
        {a ? <img src={a} alt="" /> : null}/{b ? <img src={b} alt="" /> : null}
      </span>
    )
  }

  const match = def.options?.find((o) => o.v === value)
  return <>{match ? match.l : String(value)}</>
}

/**
 * Apply a left/right press to the focused row.
 *
 * Pure and exported, so every branch is testable without a keyboard - including the percent
 * clamp, which is the only one that can leave the option list's range.
 */
export function changeSetting(
  settings: VitroSettings,
  def: SettingDef,
  dir: number,
): VitroSettings {
  if (def.type === 'action') return settings
  const next = { ...settings } as unknown as Record<string, unknown>

  if (def.type === 'color') {
    next.color = (settings.color + dir + COLORS.length) % COLORS.length
  } else if (def.type === 'toggle') {
    next[def.key] = !settings[def.key as keyof VitroSettings]
  } else if (def.type === 'percent') {
    const cur = (settings[def.key as keyof VitroSettings] as number) || 0
    next[def.key] = Math.max(0, Math.min(100, cur + dir * 10))
  } else if (def.options) {
    const cur = def.options.findIndex((o) => o.v === settings[def.key as keyof VitroSettings])
    const at = cur < 0 ? 0 : cur
    next[def.key] = def.options[(at + dir + def.options.length) % def.options.length]!.v
  }
  return next as unknown as VitroSettings
}
