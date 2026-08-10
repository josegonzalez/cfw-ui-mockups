import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { ProgressBar } from '.'

const meta = {
  title: 'Widgets/ProgressBar',
  component: ProgressBar,
  parameters: { layout: 'centered' },
  argTypes: { value: { control: { type: 'range', min: 0, max: 1, step: 0.01 } } },
} satisfies Meta<typeof ProgressBar>

export default meta
type Story = StoryObj<typeof meta>

const stage = (node: ReactNode) => (
  <div style={{ position: 'relative', width: 520, height: 80, background: '#0b1020' }}>{node}</div>
)

const args = {
  box: { left: 20, top: 30, width: 480, height: 18 },
  value: 0.6,
  trackColor: 'rgba(255,255,255,0.5)',
  fillColor: '#0070d1',
} satisfies Story['args']

export const Default: Story = {
  args,
  render: (a) => stage(<ProgressBar {...a} />),
}

/** Two fill colours make it a gradient, which the boot screens use. */
export const Gradient: Story = {
  args: { ...args, fillColorEnd: '#003791' },
  render: (a) => stage(<ProgressBar {...a} />),
}

/**
 * Out of range, clamped. Left alone this would draw a fill wider than its track, and with a
 * radius that is a visibly wrong shape rather than a slightly long bar.
 */
export const OutOfRange: Story = {
  args: { ...args, value: 1.4 },
  render: (a) => stage(<ProgressBar {...a} />),
}

export const Empty: Story = {
  args: { ...args, value: 0 },
  render: (a) => stage(<ProgressBar {...a} />),
}
