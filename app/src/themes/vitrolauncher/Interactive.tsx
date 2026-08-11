import { useCallback, useState } from 'react'
import { DeviceFrame } from '../../device/DeviceFrame'
import { useChromeKeys } from '../../input/InputProvider'
import { SubsetPanel, type SubsetGroup } from '../../gallery/SubsetPanel'
import { VitroLauncher } from '.'
import { COLORS, defaults, type BackgroundTheme, type VitroSettings } from './library'
import type { DeviceSlug } from '../../device/devices'
import type { RenderMode } from '../../render/RenderModeProvider'

const THEMES: readonly BackgroundTheme[] = [
  'waves',
  'particles',
  'clouds',
  'simple-dark',
  'simple-light',
]

function step<T>(values: readonly T[], current: T, by: number): T {
  const index = values.indexOf(current)
  return values[(index + by + values.length) % values.length]!
}

export interface VitroSubsets {
  readonly theme: BackgroundTheme
  readonly color: number
  readonly transparency: boolean
  readonly renderMode: RenderMode
  readonly battery: number
  /**
   * Seconds of idle before the nav pill fades, or 0 to keep it. Surfaced here because it is the
   * one shipped default that makes the mockup look broken: the navigation quietly vanishes after
   * ten seconds and there is nothing on screen to say why. The value stays the launcher's own -
   * misrepresenting the default would be worse than the surprise - but it is now switchable
   * without having to find it on the Settings screen first.
   */
  readonly navAutohide: number
}

export const DEFAULT_SUBSETS: VitroSubsets = {
  theme: defaults().theme,
  color: defaults().color,
  transparency: true,
  renderMode: 'web',
  battery: 85,
  navAutohide: defaults().nav_autohide,
}

/**
 * Apply one mockup-only key.
 *
 * Deliberately thin. Unlike the other three themes, almost everything worth switching here is a
 * *launcher setting* rather than a mockup subset, and the launcher has a Settings screen for
 * exactly that - so the panel below the device seeds the same values the app owns rather than
 * shadowing them. What is genuinely mockup-only is the render mode, which no firmware has.
 */
export function applyChromeAction(prev: VitroSubsets, action: string): VitroSubsets {
  switch (action) {
    case 'prevView':
      return { ...prev, theme: step(THEMES, prev.theme, -1) }
    case 'nextView':
      return { ...prev, theme: step(THEMES, prev.theme, 1) }
    case 'prevSubsetA':
      return { ...prev, color: (prev.color - 1 + COLORS.length) % COLORS.length }
    case 'nextSubsetA':
      return { ...prev, color: (prev.color + 1) % COLORS.length }
    case 'toggleStyle':
      return { ...prev, transparency: !prev.transparency }
    case 'cycleSecondary':
      return { ...prev, renderMode: prev.renderMode === 'web' ? 'fallback' : 'web' }
    case 'prevSubsetB':
      return { ...prev, battery: Math.max(0, prev.battery - 20) }
    case 'nextSubsetB':
      return { ...prev, battery: Math.min(100, prev.battery + 20) }
    default:
      return prev
  }
}

function ChromeKeys({ onAction }: { onAction: (action: string) => void }) {
  useChromeKeys(useCallback((action) => onAction(action), [onAction]))
  return null
}

export interface VitroLauncherInteractiveProps {
  readonly device: DeviceSlug
}

/**
 * The live launcher.
 *
 * The subsets seed the launcher's own settings, which it then owns - change Theme on the Settings
 * screen and the panel below is out of step, and that is correct: the app is the authority on its
 * own configuration. Remounting on a seed change is what keeps the two from fighting.
 *
 * Keys: `[` `]` background theme, `,` `.` colour scheme, `\` transparency, `-` `=` battery,
 * `'` render mode.
 */
export function VitroLauncherInteractive({ device }: VitroLauncherInteractiveProps) {
  const [subsets, setSubsets] = useState<VitroSubsets>(DEFAULT_SUBSETS)

  const onAction = useCallback(
    (action: string) => setSubsets((prev) => applyChromeAction(prev, action)),
    [],
  )

  const seed: Partial<VitroSettings> = {
    theme: subsets.theme,
    color: subsets.color,
    transparency: subsets.transparency,
    nav_autohide: subsets.navAutohide,
  }

  const groups: SubsetGroup[] = [
    {
      title: 'Background',
      keys: '[ ]',
      current: subsets.theme,
      options: THEMES.map((t) => ({ value: t, label: t })),
      onSelect: (value) => setSubsets((p) => ({ ...p, theme: value as BackgroundTheme })),
    },
    {
      title: 'Colour',
      keys: ', .',
      current: String(subsets.color),
      options: COLORS.map((c, i) => ({ value: String(i), label: c.l })),
      onSelect: (value) => setSubsets((p) => ({ ...p, color: Number(value) })),
    },
    {
      title: 'Transparency',
      keys: '\\',
      current: subsets.transparency ? 'on' : 'off',
      options: [
        { value: 'on', label: 'On' },
        { value: 'off', label: 'Off' },
      ],
      onSelect: (value) => setSubsets((p) => ({ ...p, transparency: value === 'on' })),
    },
    {
      title: 'Auto-hide nav',
      current: String(subsets.navAutohide),
      options: [
        { value: '0', label: 'Never' },
        { value: '3', label: '3s' },
        { value: '5', label: '5s' },
        { value: '10', label: '10s' },
      ],
      onSelect: (value) => setSubsets((p) => ({ ...p, navAutohide: Number(value) })),
    },
    {
      title: 'Battery',
      keys: '- =',
      current: String(subsets.battery),
      options: [0, 12, 40, 85, 100].map((n) => ({ value: String(n), label: `${n}%` })),
      onSelect: (value) => setSubsets((p) => ({ ...p, battery: Number(value) })),
    },
    {
      title: 'Render mode',
      keys: "'",
      current: subsets.renderMode,
      options: [
        { value: 'web', label: 'Web' },
        { value: 'fallback', label: 'Fallback' },
      ],
      onSelect: (value) => setSubsets((p) => ({ ...p, renderMode: value as RenderMode })),
    },
  ]

  /* Remount on a seed change, so the launcher takes the new value rather than ignoring it. */
  const seedKey = `${subsets.theme}|${subsets.color}|${subsets.transparency}|${subsets.navAutohide}`

  return (
    <>
      <DeviceFrame device={device} renderMode={subsets.renderMode}>
        <ChromeKeys onAction={onAction} />
        <VitroLauncher key={seedKey} settings={seed} battery={subsets.battery} />
      </DeviceFrame>
      <SubsetPanel groups={groups} />
    </>
  )
}
