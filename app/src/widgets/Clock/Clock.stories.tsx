import type { Meta, StoryObj } from '@storybook/react-vite'
import { Clock } from '.'

const meta = {
  title: 'Widgets/Clock',
  component: Clock,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Clock>

export default meta
type Story = StoryObj<typeof meta>

const stage = (children: React.ReactNode) => (
  <div style={{ position: 'relative', width: 300, height: 40, background: '#12141c' }}>{children}</div>
)

const box = { left: 0, top: 0, width: 300, height: 40 }

const renderClock: NonNullable<Story['render']> = (args) => stage(<Clock {...args} />)

export const TwelveHour: Story = {
  args: { box, font: 18, color: '#ffffff', time: { hours: 14, minutes: 7 } },
  render: renderClock,
}

export const TwentyFourHour: Story = {
  args: { ...TwelveHour.args, format: '24h' },
  render: renderClock,
}

/**
 * With no explicit time and no live screen, the clock renders a pinned value. That is what makes
 * a screenshot of a static screen reproducible - the original themes drew the real wall clock,
 * so no two captures ever matched.
 */
export const StaticDefault: Story = {
  args: { box, font: 18, color: '#ffffff' },
  render: renderClock,
}

export const Alignment: Story = {
  args: TwelveHour.args,
  render: (args) => (
    <div style={{ display: 'grid', gap: 8 }}>
      {(['left', 'center', 'right'] as const).map((align) => (
        <div key={align} style={{ position: 'relative', width: 300, height: 32, background: '#12141c' }}>
          <Clock {...args} box={{ ...box, height: 32 }} align={align} />
        </div>
      ))}
    </div>
  ),
}
