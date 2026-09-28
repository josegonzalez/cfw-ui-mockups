import { useCallback, useState } from 'react'
import { DeviceFrame } from '../../device/DeviceFrame'
import type { DeviceSlug } from '../../device/devices'
import { useChromeKeys } from '../../input/InputProvider'
import { SubsetPanel, type SubsetGroup } from '../../gallery/SubsetPanel'
import { WiiMenu } from '.'
import { WII_MENU_SCREENS } from './manifest'

/** The live build opens at power-on, on Health & Safety - the `health` still `settle.spec.ts` compares it with. */
export const DEFAULT_SCREEN = 'health'

const step = (i: number, n: number, by: number) => (i + by + n) % n

/** One mockup-only key: `[` and `]` pick the still the live build starts from. */
export function applyChromeAction(prev: string, action: string): string {
  const slugs = WII_MENU_SCREENS.map((s) => s.slug)
  const at = slugs.indexOf(prev)
  if (action === 'prevView') return slugs[step(at, slugs.length, -1)]!
  if (action === 'nextView') return slugs[step(at, slugs.length, 1)]!
  return prev
}

function ChromeKeys({ onAction }: { onAction: (action: string) => void }) {
  useChromeKeys(useCallback((action) => onAction(action), [onAction]))
  return null
}

/** The live build. The panel seeds the menu and then stands back. */
export function WiiMenuInteractive({ device }: { device: DeviceSlug }) {
  const [screen, setScreen] = useState(DEFAULT_SCREEN)
  const onAction = useCallback((action: string) => setScreen((prev) => applyChromeAction(prev, action)), [])
  const def = WII_MENU_SCREENS.find((s) => s.slug === screen) ?? WII_MENU_SCREENS[0]!
  const groups: SubsetGroup[] = [
    {
      title: 'Start from',
      keys: '[ ]',
      current: screen,
      options: WII_MENU_SCREENS.map((s) => ({ value: s.slug, label: s.title })),
      onSelect: (value) => setScreen(value),
    },
  ]
  return (
    <>
      <DeviceFrame device={device}>
        <ChromeKeys onAction={onAction} />
        <WiiMenu key={def.slug} {...def.seed} />
      </DeviceFrame>
      <SubsetPanel groups={groups} />
    </>
  )
}
