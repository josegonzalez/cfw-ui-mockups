import { useCallback, useState } from 'react'
import { DeviceFrame } from '../../device/DeviceFrame'
import type { DeviceSlug } from '../../device/devices'
import { SubsetPanel, type SubsetGroup } from '../../gallery/SubsetPanel'
import { useChromeKeys } from '../../input/InputProvider'
import { DreamcastBios } from '.'
import { DREAMCAST_BIOS_SCREENS } from './manifest'

/** The live build opens on the main menu - the `main` still `settle.spec.ts` compares it with. */
export const DEFAULT_SCREEN = 'main'

const step = (i: number, n: number, by: number) => (i + by + n) % n

/** One mockup-only key: `[` and `]` pick the still the live build starts from. */
export function applyChromeAction(prev: string, action: string): string {
  const slugs = DREAMCAST_BIOS_SCREENS.map((s) => s.slug)
  const at = slugs.indexOf(prev)
  if (action === 'prevView') return slugs[step(at, slugs.length, -1)]!
  if (action === 'nextView') return slugs[step(at, slugs.length, 1)]!
  return prev
}

function ChromeKeys({ onAction }: { onAction: (action: string) => void }) {
  useChromeKeys(useCallback((action) => onAction(action), [onAction]))
  return null
}

/**
 * The live build. The panel seeds the menu and then stands back; it also mutes it, since a reader
 * may want the screens without the BIOS's sounds.
 */
export function DreamcastBiosInteractive({ device }: { device: DeviceSlug }) {
  const [screen, setScreen] = useState(DEFAULT_SCREEN)
  const [sound, setSound] = useState(true)
  const onAction = useCallback((action: string) => setScreen((prev) => applyChromeAction(prev, action)), [])
  const def = DREAMCAST_BIOS_SCREENS.find((s) => s.slug === screen) ?? DREAMCAST_BIOS_SCREENS[0]!
  const groups: SubsetGroup[] = [
    {
      title: 'Start from',
      keys: '[ ]',
      current: screen,
      options: DREAMCAST_BIOS_SCREENS.map((s) => ({ value: s.slug, label: s.title })),
      onSelect: (value) => setScreen(value),
    },
    {
      title: 'Sound',
      current: sound ? 'on' : 'off',
      options: [
        { value: 'on', label: 'On' },
        { value: 'off', label: 'Off' },
      ],
      onSelect: (value) => setSound(value === 'on'),
    },
  ]
  return (
    <>
      <DeviceFrame device={device} sound={sound}>
        <ChromeKeys onAction={onAction} />
        <DreamcastBios key={def.slug} {...def.seed} />
      </DeviceFrame>
      <SubsetPanel groups={groups} />
    </>
  )
}
