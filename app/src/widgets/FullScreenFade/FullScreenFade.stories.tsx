import type { Meta, StoryObj } from '@storybook/react-vite'
import { FullScreenFade } from '.'

const meta = {
  title: 'Widgets/FullScreenFade',
  component: FullScreenFade,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof FullScreenFade>

export default meta
type Story = StoryObj<typeof meta>

const stage = (children: React.ReactNode) => (
  <div style={{ position: 'relative', width: 320, height: 240, background: '#28BCA3', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#161D1C', font: '700 20px sans-serif' }}>
      A screen
    </div>
    {children}
  </div>
)

export const Clear: Story = {
  args: { on: false, durationMs: 350 },
  render: (args) => stage(<FullScreenFade {...args} />),
}

export const Covering: Story = {
  args: { on: true, durationMs: 350 },
  render: (args) => stage(<FullScreenFade {...args} />),
}
