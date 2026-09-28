import type { Channel, DeviceContext } from './types'

/**
 * What each channel means, independent of any renderer.
 *
 * `axis` is how a fractional authored value becomes a device pixel: length channels are
 * authored as a fraction of screen width or height.
 *
 * `rest` is the channel's identity - the value at which the element is exactly where its
 * layout puts it. This is why an animation with `from` but no `to` works: upstream, that means
 * "animate to the element's authored value", and because authored position is expressed as
 * left/top rather than as a transform, the authored value *is* the channel identity. Getting
 * `rest` wrong does not fail loudly; it leaves elements quietly displaced.
 */
export const CHANNELS: Record<Channel, { readonly axis: 'w' | 'h' | null; readonly rest: number }> =
  {
    opacity: { axis: null, rest: 1 },
    offsetX: { axis: 'w', rest: 0 },
    offsetY: { axis: 'h', rest: 0 },
    x: { axis: 'w', rest: 0 },
    y: { axis: 'h', rest: 0 },
    scale: { axis: null, rest: 1 },
    // Horizontal only, on top of `scale`: a card or disc turning edge-on about its vertical axis.
    scaleX: { axis: null, rest: 1 },
    zIndex: { axis: null, rest: 0 },
  }

export function isChannel(value: string): value is Channel {
  return Object.hasOwn(CHANNELS, value)
}

/**
 * Resolve an authored value to its final number: device pixels for length channels, unitless
 * otherwise. `zIndex` rounds because a fractional stacking order is meaningless.
 */
export function resolveChannelValue(channel: Channel, value: number, ctx: DeviceContext): number {
  const { axis } = CHANNELS[channel]
  if (axis === 'w') return value * ctx.w
  if (axis === 'h') return value * ctx.h
  if (channel === 'zIndex') return Math.round(value)
  return value
}
