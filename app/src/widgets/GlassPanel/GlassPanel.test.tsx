import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { GlassPanel } from '.'
import { RenderModeProvider } from '../../render/RenderModeProvider'

const box = { left: 10, top: 20, width: 200, height: 40 }

function panel(node: React.ReactElement) {
  const { container } = render(node)
  return container.querySelector<HTMLElement>('[data-widget="GlassPanel"]')!
}

describe('GlassPanel', () => {
  it('blurs what is behind it in web mode', () => {
    const el = panel(<GlassPanel box={box} />)
    expect(el.style.backdropFilter).toBe('blur(12px)')
    expect(el.dataset.frosted).toBe('true')
  })

  it('goes solid when the launcher turns Transparency off', () => {
    // A real setting with a look the app ships, so this is a correct rendering, not a fallback.
    const el = panel(<GlassPanel box={box} transparent={false} />)
    expect(el.style.backdropFilter).toBe('')
    expect(el.style.background).toContain('linear-gradient')
    expect(el.style.outline).toContain('rgba(255,255,255, 0.5)')
  })

  it('goes solid in fallback mode even with transparency on', () => {
    const el = panel(
      <RenderModeProvider mode="fallback">
        <GlassPanel box={box} />
      </RenderModeProvider>,
    )
    expect(el.style.backdropFilter).toBe('')
    expect(el.dataset.frosted).toBeUndefined()
  })

  it('takes the light shadow and fill on a pale background', () => {
    expect(panel(<GlassPanel box={box} light />).style.boxShadow).toContain('rgba(0,0,0,0.10)')
    // jsdom normalises hex to rgb, so match on the resolved colour.
    expect(panel(<GlassPanel box={box} light transparent={false} />).style.background).toContain(
      'rgb(244, 244, 246)',
    )
  })

  it('is a stadium by default and takes a radius when asked', () => {
    expect(panel(<GlassPanel box={box} />).style.borderRadius).toBe('999px')
    expect(panel(<GlassPanel box={box} shape="rounded" radius={14} />).style.borderRadius).toBe(
      '14px',
    )
  })

  it('fills its parent when given no box', () => {
    const el = panel(<GlassPanel />)
    expect(el.style.inset).toBe('0px')
  })
})
