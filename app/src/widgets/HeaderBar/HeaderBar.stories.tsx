import type { Meta, StoryObj } from '@storybook/react-vite'
import { HeaderBar } from '.'
import { Clock } from '../Clock'

const meta = {
  title: 'Widgets/HeaderBar',
  component: HeaderBar,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof HeaderBar>

export default meta
type Story = StoryObj<typeof meta>

const stage = (children: React.ReactNode) => (
  <div style={{ position: 'relative', width: 640, height: 80, background: '#12141c' }}>{children}</div>
)

const box = { left: 0, top: 0, width: 640, height: 44 }

/** A wordmark split across two colours, with a clock on the right. */
const renderHeader: NonNullable<Story['render']> = (args) => stage(<HeaderBar {...args} />)

export const Wordmark: Story = {
  args: {
    box,
    title: 'Example',
    titleAccent: 'OS',
    titleFont: 18,
    color: '#e7e9f0',
    accentColor: '#4cc9f0',
    paddingX: 20,
    ruleHeight: 1,
    ruleInsetX: 20,
    right: <Clock box={{ left: 0, top: 0, width: 90, height: 44 }} font={14} color="#8b90a3" />,
  },
  render: renderHeader,
}

/** A drilled-in screen: back chevron, system name, and a count on the right. */
export const Subscreen: Story = {
  args: {
    box,
    title: 'Super Nintendo',
    leading: '‹',
    titleFont: 18,
    color: '#e7e9f0',
    accentColor: '#4cc9f0',
    paddingX: 20,
    ruleHeight: 1,
    ruleInsetX: 20,
    right: <span style={{ color: '#8b90a3', fontSize: 13 }}>7 games</span>,
  },
  render: renderHeader,
}

/** No rule, no right-hand slot. */
export const Bare: Story = {
  args: { box, title: 'Settings', titleFont: 18, color: '#e7e9f0', paddingX: 20 },
  render: renderHeader,
}

/** A title longer than the header, which ellipsises rather than pushing the right slot out. */
export const LongTitle: Story = {
  args: {
    ...Subscreen.args,
    title: 'Nintendo Entertainment System and other very long console names',
  },
  render: renderHeader,
}
