import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DeviceFrame } from '../device/DeviceFrame'
import { ViewOverridesProvider, parseViewOverrides } from '../device/ViewOverrides'
import { useSound } from './SoundProvider'

function Probe() {
  return <div data-sound={useSound().enabled ? 'on' : 'off'} />
}

const soundOf = (el: HTMLElement) => el.querySelector('[data-sound]')!.getAttribute('data-sound')

describe('sound', () => {
  it('is live in a live build and silent in a still', () => {
    const live = render(
      <DeviceFrame device="dreamcast">
        <Probe />
      </DeviceFrame>,
    )
    expect(soundOf(live.container)).toBe('on')
    const still = render(
      <DeviceFrame device="dreamcast" animate={false} interactive={false}>
        <Probe />
      </DeviceFrame>,
    )
    expect(soundOf(still.container)).toBe('off')
  })

  it('mutes a live build by prop or by ?sound=off, and the prop wins', () => {
    const muted = render(
      <DeviceFrame device="dreamcast" sound={false}>
        <Probe />
      </DeviceFrame>,
    )
    expect(soundOf(muted.container)).toBe('off')
    expect(parseViewOverrides('?sound=off')).toEqual({ sound: false })
    expect(parseViewOverrides('?sound=on')).toEqual({})
    const overridden = render(
      <ViewOverridesProvider overrides={{ sound: false }}>
        <DeviceFrame device="dreamcast">
          <Probe />
        </DeviceFrame>
        <DeviceFrame device="dreamcast" sound>
          <Probe />
        </DeviceFrame>
      </ViewOverridesProvider>,
    )
    const [a, b] = overridden.container.querySelectorAll('[data-sound]')
    expect(a!.getAttribute('data-sound')).toBe('off')
    expect(b!.getAttribute('data-sound')).toBe('on')
  })
})
