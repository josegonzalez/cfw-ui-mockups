import { useCallback, useState } from 'react'
import { DeviceFrame } from '../../device/DeviceFrame'
import type { DeviceSlug } from '../../device/devices'
import { SubsetPanel, type SubsetGroup } from '../../gallery/SubsetPanel'
import { useChromeKeys } from '../../input/InputProvider'
import { SpruceOS } from '.'
import { SPRUCEOS_SCREENS, seedFor } from './manifest'

/** The live build opens on the main menu, which is the `main-menu` still `settle.spec.ts` compares it with. */
export const DEFAULT_SCREEN = 'main-menu'

const step = (i: number, n: number, by: number) => (i + by + n) % n

function ChromeKeys({ onAction }: { onAction: (action: string) => void }) {
  useChromeKeys(useCallback((action) => onAction(action), [onAction]))
  return null
}

/**
 * The live build. The panel picks the still to start from - the same buttons pressed from a fresh
 * start - and then stands back: from there every screen is reached with the device's own buttons.
 */
export function SpruceOSInteractive({ device }: { device: DeviceSlug }) {
  const [screen, setScreen] = useState(DEFAULT_SCREEN)
  const slugs = SPRUCEOS_SCREENS.map((s) => s.slug)
  const onAction = useCallback(
    (action: string) =>
      setScreen((prev) => {
        const at = slugs.indexOf(prev)
        if (action === 'prevView') return slugs[step(at, slugs.length, -1)]!
        if (action === 'nextView') return slugs[step(at, slugs.length, 1)]!
        return prev
      }),
    [slugs],
  )
  const def = SPRUCEOS_SCREENS.find((s) => s.slug === screen) ?? SPRUCEOS_SCREENS[0]!
  const groups: SubsetGroup[] = [
    {
      title: 'Start from',
      keys: '[ ]',
      current: screen,
      options: SPRUCEOS_SCREENS.map((s) => ({ value: s.slug, label: s.title })),
      onSelect: setScreen,
    },
  ]
  return (
    <>
      <DeviceFrame device={device}>
        <ChromeKeys onAction={onAction} />
        <SpruceOS key={screen} device={device} {...seedFor(def, device)} />
      </DeviceFrame>
      <SubsetPanel groups={groups} />
    </>
  )
}
