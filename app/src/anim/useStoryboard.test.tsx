import { StrictMode } from 'react'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScreenProvider } from '../device/ScreenContext'
import { Animated } from './Animated'
import type { StoryboardMap } from './types'

/**
 * jsdom implements no Web Animations, so `animate` is stubbed and the assertions are about what
 * the hook asks for: how many animations, with what timing, how often it re-asks, and which of
 * them are still running afterwards.
 */
interface FakeAnimation {
  cancelled: boolean
  cancel: () => void
}

let created: FakeAnimation[] = []

const animate = vi.fn(() => {
  const anim: FakeAnimation = {
    cancelled: false,
    cancel() {
      anim.cancelled = true
    },
  }
  created.push(anim)
  return anim
})

/** Animations that were started and not subsequently cancelled. */
const live = () => created.filter((a) => !a.cancelled)

beforeEach(() => {
  animate.mockClear()
  created = []
  Element.prototype.animate = animate as unknown as Element['animate']
})

const ambientOnly: StoryboardMap = {
  _: { animations: [{ property: 'opacity', from: 0, to: 1, duration: 500 }] },
}

const perEvent: StoryboardMap = {
  open: { animations: [{ property: 'opacity', from: 0, to: 1, duration: 500 }] },
  activateNext: { animations: [{ property: 'offsetX', from: 0.05, to: 0, duration: 300 }] },
  activatePrev: { animations: [{ property: 'offsetX', from: -0.05, to: 0, duration: 300 }] },
}

function mount(ui: React.ReactNode, animateFlag = true) {
  return render(
    <ScreenProvider device="rg35xx" animate={animateFlag}>
      {ui}
    </ScreenProvider>,
  )
}

describe('useStoryboard with motion on', () => {
  it('plays one animation per channel', () => {
    mount(
      <Animated
        storyboard={{
          open: {
            animations: [
              { property: 'scale', from: 0.94, to: 1, duration: 300, mode: 'bump' },
              { property: 'offsetX', to: -0.003, duration: 150, autoreverse: true },
              { property: 'offsetY', to: -0.008, duration: 150, autoreverse: true },
            ],
          },
        }}
        event="open"
      />,
    )

    expect(animate).toHaveBeenCalledTimes(3)
  })

  it('marks the element so CSS can recompose the transform channels', () => {
    const { container } = mount(<Animated storyboard={perEvent} event="open" />)
    expect(container.querySelector('.px-anim')).not.toBeNull()
  })

  it('replays when the event changes', () => {
    const { rerender } = mount(<Animated storyboard={perEvent} event="open" />)
    expect(animate).toHaveBeenCalledTimes(1)

    rerender(
      <ScreenProvider device="rg35xx" animate>
        <Animated storyboard={perEvent} event="activateNext" />
      </ScreenProvider>,
    )
    expect(animate).toHaveBeenCalledTimes(2)
  })

  it('does not restart an ambient storyboard when the event changes', () => {
    // The guard that matters. An ambient track owns its own clock - a 5350ms ticker, a 30s
    // background drift - and replaying it on every cursor move restarts that clock on every
    // keypress.
    const { rerender } = mount(<Animated storyboard={ambientOnly} event="open" />)
    expect(animate).toHaveBeenCalledTimes(1)

    for (const event of ['activateNext', 'activatePrev', 'activateNext'] as const) {
      rerender(
        <ScreenProvider device="rg35xx" animate>
          <Animated storyboard={ambientOnly} event={event} />
        </ScreenProvider>,
      )
    }
    expect(animate).toHaveBeenCalledTimes(1)
  })

  it('still plays an ambient storyboard under StrictMode', () => {
    // StrictMode detaches and reattaches, which cancels the first play. If the "already
    // started" guard survived that, ambient elements would end up permanently frozen in the
    // real app while every test here still passed.
    render(
      <StrictMode>
        <ScreenProvider device="rg35xx" animate>
          <Animated storyboard={ambientOnly} event="open" />
        </ScreenProvider>
      </StrictMode>,
    )

    expect(live()).toHaveLength(1)
  })

  it('does nothing when no storyboard answers', () => {
    mount(<Animated storyboard={{ open: perEvent.open! }} event="activateNext" />)
    expect(animate).not.toHaveBeenCalled()
  })

  it('resolves length channels against the mounted device', () => {
    mount(
      <Animated
        storyboard={{ open: { animations: [{ property: 'offsetX', from: 0.5, to: 0, duration: 100 }] } }}
        event="open"
      />,
    )

    const [keyframes] = animate.mock.calls[0] as unknown as [Keyframe[]]
    expect(keyframes[0]).toMatchObject({ '--px-ox': '320.000px' })
  })
})

describe('useStoryboard with motion off', () => {
  it('creates no animations at all', () => {
    mount(<Animated storyboard={perEvent} event="open" />, false)
    expect(animate).not.toHaveBeenCalled()
  })

  it('writes the resting values as plain style instead', () => {
    const { container } = mount(<Animated storyboard={perEvent} event="open" />, false)
    const el = container.querySelector('.px-anim') as HTMLElement

    expect(el.style.opacity).toBe('1')
  })

  it('rests an autoreverse track where it began', () => {
    // A static screen that rests at `to` is permanently displaced by the outbound leg.
    const { container } = mount(
      <Animated
        storyboard={{
          open: { animations: [{ property: 'offsetX', to: -0.05, duration: 150, autoreverse: true }] },
        }}
        event="open"
      />,
      false,
    )
    const el = container.querySelector('.px-anim') as HTMLElement

    expect(el.style.getPropertyValue('--px-ox')).toBe('0.000px')
  })

  it('falls back to the open storyboard for an event it has no block for', () => {
    const { container } = mount(<Animated storyboard={perEvent} event="deactivateNext" />, false)
    const el = container.querySelector('.px-anim') as HTMLElement

    expect(el.style.opacity).toBe('1')
  })
})
