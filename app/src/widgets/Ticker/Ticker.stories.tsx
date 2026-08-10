import type { Meta, StoryObj } from '@storybook/react-vite'
import { Ticker } from '.'

const meta = {
  title: 'Widgets/Ticker',
  component: Ticker,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Ticker>

export default meta
type Story = StoryObj<typeof meta>

const stage = (node: React.ReactNode) => (
  <div style={{ position: 'relative', width: 520, height: 90, background: '#0b1020' }}>{node}</div>
)

const items = [
  { key: 'a', content: <span>66 games · 16 favourites</span> },
  { key: 'b', content: <span>Most played: Final Fantasy VII</span> },
]

const args = {
  box: { left: 20, top: 20, width: 480, height: 50, font: 22 },
  items,
  activeIndex: 0,
  color: '#DFDCDC',
} satisfies Story['args']

/** The first block showing. Both occupy the same box; only opacity distinguishes them. */
export const First: Story = {
  args,
  render: (a) => stage(<Ticker {...a} />),
}

/** The second. Note the box has not moved or resized - that is the point of the widget. */
export const Second: Story = {
  args: { ...args, activeIndex: 1 },
  render: (a) => stage(<Ticker {...a} />),
}
