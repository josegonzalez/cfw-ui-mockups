import { useCallback, useState } from 'react'
import { DeviceFrame } from '../../device/DeviceFrame'
import { useChromeKeys } from '../../input/InputProvider'
import { SubsetPanel, type SubsetGroup } from '../../gallery/SubsetPanel'
import { NextUi } from '.'
import { VIEWS } from './library'
import { PALETTES } from './palette'
import type { DeviceSlug } from '../../device/devices'

export interface NextUiSubsets {
  readonly view: string
  readonly palette: string
  readonly titlePill: boolean
  /** A `bg.png` in the folder's `.media`. Off is the stock look: a flat background colour. */
  readonly background: boolean
}

export const DEFAULT_SUBSETS: NextUiSubsets = {
  view: 'browser',
  palette: 'Default',
  titlePill: false,
  background: false,
}

function step(length: number, index: number, by: number): number {
  return (index + by + length) % length
}

/**
 * Apply one mockup-only key.
 *
 * The palette is a genuine setting the menu owns, but reaching it in the live build means walking
 * Settings, Menu Colors, Palette - three screens deep - which makes comparing two palettes on the
 * *browser* impossible. So it is surfaced here as well, seeding what the theme draws with.
 */
export function applyChromeAction(prev: NextUiSubsets, action: string): NextUiSubsets {
  const viewIndex = VIEWS.findIndex((v) => v.slug === prev.view)
  const paletteIndex = PALETTES.findIndex((p) => p.id === prev.palette)

  switch (action) {
    case 'prevView':
      return { ...prev, view: VIEWS[step(VIEWS.length, viewIndex, -1)]!.slug }
    case 'nextView':
      return { ...prev, view: VIEWS[step(VIEWS.length, viewIndex, 1)]!.slug }
    case 'prevSubsetA':
      return { ...prev, palette: PALETTES[step(PALETTES.length, paletteIndex, -1)]!.id }
    case 'nextSubsetA':
      return { ...prev, palette: PALETTES[step(PALETTES.length, paletteIndex, 1)]!.id }
    case 'toggleStyle':
      return { ...prev, titlePill: !prev.titlePill }
    case 'cycleSecondary':
      return { ...prev, background: !prev.background }
    default:
      return prev
  }
}

function ChromeKeys({ onAction }: { onAction: (action: string) => void }) {
  useChromeKeys(useCallback((action) => onAction(action), [onAction]))
  return null
}

export interface NextUiInteractiveProps {
  readonly device: DeviceSlug
}

/**
 * The live menu.
 *
 * The menu navigates itself: `A` opens, `B` goes back, `R` opens a view's options menu and
 * `START` opens Settings. The subsets below pose the opening screen and its configuration; the
 * menu owns both from there.
 *
 * Keys: `[` `]` view, `,` `.` palette, `\` title pills.
 */
export function NextUiInteractive({ device }: NextUiInteractiveProps) {
  const [subsets, setSubsets] = useState<NextUiSubsets>(DEFAULT_SUBSETS)

  const onAction = useCallback(
    (action: string) => setSubsets((prev) => applyChromeAction(prev, action)),
    [],
  )

  const groups: SubsetGroup[] = [
    {
      title: 'View',
      keys: '[ ]',
      current: subsets.view,
      options: VIEWS.map((v) => ({ value: v.slug, label: v.label })),
      onSelect: (value) => setSubsets((p) => ({ ...p, view: value })),
    },
    {
      title: 'Palette',
      keys: ', .',
      current: subsets.palette,
      options: PALETTES.map((p) => ({ value: p.id, label: p.name })),
      onSelect: (value) => setSubsets((p) => ({ ...p, palette: value })),
    },
    {
      title: 'Title pills',
      keys: '\\',
      current: subsets.titlePill ? 'on' : 'off',
      options: [
        { value: 'off', label: 'Off' },
        { value: 'on', label: 'On' },
      ],
      onSelect: (value) => setSubsets((p) => ({ ...p, titlePill: value === 'on' })),
    },
    {
      title: 'Background image',
      keys: "'",
      current: subsets.background ? 'on' : 'off',
      options: [
        { value: 'off', label: 'None' },
        { value: 'on', label: 'bg.png' },
      ],
      onSelect: (value) => setSubsets((p) => ({ ...p, background: value === 'on' })),
    },
  ]

  /*
   * Remount on any seed change, so the menu takes the new value rather than ignoring it.
   *
   * The panel seeds and then stands back: once mounted, the menu owns its own view, palette,
   * title pills and background, because `A` on the Menu Colors screen genuinely changes them.
   * Change a palette in-app and the panel below is out of step, and that is correct - the app is
   * the authority on its own configuration. Vitro's Settings screen has the same arrangement.
   */
  const seedKey = `${subsets.view}|${subsets.palette}|${subsets.titlePill}|${subsets.background}`

  return (
    <>
      <DeviceFrame device={device}>
        <ChromeKeys onAction={onAction} />
        <NextUi
          key={seedKey}
          view={subsets.view}
          palette={subsets.palette}
          titlePill={subsets.titlePill}
          background={subsets.background}
        />
      </DeviceFrame>
      <SubsetPanel groups={groups} />
    </>
  )
}
