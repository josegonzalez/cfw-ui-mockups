import { describe, expect, it } from 'vitest'
import { compileStoryboard, restingValues } from './compile'
import { CHANNEL_CSS, channelToCss, restingStyle, tracksToWaapi, transitionsToCss } from './waapi'
import type { DeviceContext, Storyboard } from './types'

const ctx: DeviceContext = { w: 640, h: 480 }

describe('channelToCss', () => {
  it('suffixes length channels with px', () => {
    expect(channelToCss('offsetX', 320)).toBe('320.000px')
    expect(channelToCss('y', -12.5)).toBe('-12.500px')
  })

  it('leaves unitless channels unitless', () => {
    expect(channelToCss('opacity', 0.3)).toBe('0.3')
    expect(channelToCss('scale', 1.075)).toBe('1.075')
  })

  it('rounds z-index, since a fractional stacking order is meaningless', () => {
    expect(channelToCss('zIndex', 4.6)).toBe('5')
  })
})

describe('CHANNEL_CSS', () => {
  it('routes each transform channel to its own custom property', () => {
    // Two Web Animations cannot both target `transform`, and up to three of these run at once,
    // so each must own a distinct property for CSS to recompose.
    const transformChannels = ['offsetX', 'offsetY', 'x', 'y', 'scale', 'scaleX'] as const
    const props = transformChannels.map((c) => CHANNEL_CSS[c])

    expect(new Set(props).size).toBe(props.length)
    expect(props.every((p) => p.startsWith('--px-'))).toBe(true)
  })

  it('drives opacity and z-index as real CSS properties', () => {
    expect(CHANNEL_CSS.opacity).toBe('opacity')
    expect(CHANNEL_CSS.zIndex).toBe('z-index')
  })
})

describe('tracksToWaapi', () => {
  it('produces keyframes keyed by the channel property', () => {
    const sb: Storyboard = {
      animations: [{ property: 'offsetY', from: 0.78, to: 0, duration: 550, mode: 'easeOutCubic' }],
    }
    const [effect] = tracksToWaapi(compileStoryboard(sb, ctx))

    expect(effect!.keyframes[0]).toMatchObject({
      offset: 0,
      '--px-oy': '374.400px',
      easing: 'cubic-bezier(0.33,1,0.68,1)',
    })
    expect(effect!.timing).toMatchObject({ duration: 550, iterations: 1, fill: 'forwards' })
  })

  it('carries an infinite iteration count through to the timing', () => {
    const sb: Storyboard = {
      animations: [{ property: 'opacity', from: 1, to: 0.6, duration: 400, repeat: 'forever' }],
    }
    const [effect] = tracksToWaapi(compileStoryboard(sb, ctx))

    expect(effect!.timing.iterations).toBe(Infinity)
  })
})

describe('restingStyle', () => {
  it('writes settled values as inline custom properties', () => {
    const sb: Storyboard = {
      animations: [
        { property: 'opacity', from: 0, to: 1, duration: 500 },
        { property: 'offsetX', to: -0.003, duration: 150, autoreverse: true },
      ],
    }
    expect(restingStyle(restingValues(sb, ctx))).toEqual({
      opacity: '1',
      '--px-ox': '0.000px',
    })
  })
})

describe('transitionsToCss', () => {
  it('renders a shorthand per spec', () => {
    expect(
      transitionsToCss([
        { property: 'transform', duration: 500, easing: 'easeOutQuint' },
        { property: 'opacity', duration: 150, easing: 'linear' },
      ]),
    ).toBe('transform 500ms cubic-bezier(0.23,1,0.32,1), opacity 150ms linear')
  })

  it('includes a delay only when one is set', () => {
    expect(transitionsToCss([{ property: 'transform', duration: 250, easing: 'easeOut', delay: 150 }])).toBe(
      'transform 250ms cubic-bezier(0,0,0.58,1) 150ms',
    )
  })

  it('hyphenates multi-word CSS properties', () => {
    expect(transitionsToCss([{ property: 'borderRadius', duration: 300, easing: 'linear' }])).toBe(
      'border-radius 300ms linear',
    )
  })

  it('returns none for an empty list, so it can positively disable transitions', () => {
    expect(transitionsToCss([])).toBe('none')
  })
})
