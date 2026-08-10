import type { Meta, StoryObj } from '@storybook/react-vite'
import { Scrim } from '.'
import { RenderModeProvider } from '../../render/RenderModeProvider'
import { gradientArt } from '../GeneratedArt'

const meta = {
  title: 'Widgets/Scrim',
  component: Scrim,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Scrim>

export default meta
type Story = StoryObj<typeof meta>

const backdrop = gradientArt({ width: 420, height: 260, from: '#3689E6', to: '#8cd5ff' })
const box = { left: 0, top: 0, width: 420, height: 260 }

const stage = (children: React.ReactNode) => (
  <div style={{ position: 'relative', width: 420, height: 260, overflow: 'hidden' }}>
    <img src={backdrop} alt="" style={{ position: 'absolute', inset: 0 }} />
    <div style={{ position: 'absolute', left: 20, bottom: 20, color: '#fff', font: '700 22px sans-serif', zIndex: 5 }}>
      Legible over artwork
    </div>
    {children}
  </div>
)

export const Wash: Story = {
  args: { box, mode: 'wash', color: 'linear-gradient(to top, #16191D, transparent)' },
  render: (args) => stage(<Scrim {...args} />),
}

/**
 * Web and fallback, side by side. The fallback drops the mask for a soft gradient rather than
 * keeping a flat fill, which would paint a solid sheet over the content.
 */
export const MaskedVersusFallback: Story = {
  args: { box, mode: 'mask', color: '#16191D' },
  render: (args) => (
    <div style={{ display: 'flex', gap: 16 }}>
      <RenderModeProvider mode="web">{stage(<Scrim {...args} />)}</RenderModeProvider>
      <RenderModeProvider mode="fallback">{stage(<Scrim {...args} />)}</RenderModeProvider>
    </div>
  ),
}
