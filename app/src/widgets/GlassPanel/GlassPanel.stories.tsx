import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { GlassPanel } from '.'
import { RenderModeProvider } from '../../render/RenderModeProvider'

const meta = {
  title: 'Widgets/GlassPanel',
  component: GlassPanel,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof GlassPanel>

export default meta
type Story = StoryObj<typeof meta>

/** A busy backdrop, because a glass panel over a flat colour proves nothing. */
const stage = (node: ReactNode, light = false) => (
  <div
    style={{
      position: 'relative',
      width: 420,
      height: 140,
      background: light
        ? 'repeating-linear-gradient(45deg,#e9edf2 0 18px,#cfd8e3 18px 36px)'
        : 'repeating-linear-gradient(45deg,#0e141b 0 18px,#1a9fff 18px 36px)',
    }}
  >
    {node}
  </div>
)

const box = { left: 40, top: 45, width: 340, height: 50 }

export const Frosted: Story = {
  args: { box },
  render: (a) => stage(<GlassPanel {...a} />),
}

/** The launcher's own Transparency = off. A designed look, not a degraded one. */
export const Solid: Story = {
  args: { box, transparent: false },
  render: (a) => stage(<GlassPanel {...a} />),
}

export const OnLight: Story = {
  args: { box, light: true, inkRgb: '31,36,46' },
  render: (a) => stage(<GlassPanel {...a} />, true),
}

/** Fallback mode borrows the solid look, because the source already authored one. */
export const FallbackMode: Story = {
  args: { box },
  render: (a) => (
    <RenderModeProvider mode="fallback">{stage(<GlassPanel {...a} />)}</RenderModeProvider>
  ),
}
