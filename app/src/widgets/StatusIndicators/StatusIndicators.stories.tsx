import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatusIndicators } from '.'

const meta = {
  title: 'Widgets/StatusIndicators',
  component: StatusIndicators,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof StatusIndicators>

export default meta
type Story = StoryObj<typeof meta>

const stage = (children: React.ReactNode) => (
  <div style={{ position: 'relative', width: 320, height: 48, background: '#12141c' }}>{children}</div>
)

const box = { left: 0, top: 8, width: 320, height: 32 }
const battery = { shell: '#e7e9f0', fill: '#4cc9f0', lowFill: '#ff6b6b', chargingFill: '#3ad29f' }

const renderStatus: NonNullable<Story['render']> = (args) => stage(<StatusIndicators {...args} />)

export const Battery: Story = {
  args: {
    box,
    size: 20,
    gap: 10,
    battery,
    items: [{ kind: 'battery', key: 'b', percent: 85 }],
  },
  render: renderStatus,
}

/** Full, low and charging, so the three colour branches are visible together. */
export const BatteryStates: Story = {
  args: Battery.args,
  render: (args) =>
    stage(
      <StatusIndicators
        {...args}
        items={[
          { kind: 'battery', key: 'full', percent: 92 },
          { kind: 'battery', key: 'low', percent: 12 },
          { kind: 'battery', key: 'charging', percent: 45, charging: true },
        ]}
      />,
    ),
}

/** Plain text, as a theme that shows a percentage rather than a drawn cell uses. */
export const Text: Story = {
  args: {
    box,
    size: 20,
    gap: 12,
    font: 14,
    color: '#8b90a3',
    items: [
      { kind: 'text', key: 'time', text: '12:34' },
      { kind: 'text', key: 'pct', text: '85%', color: '#4cc9f0' },
    ],
  },
  render: renderStatus,
}
