import type { Meta, StoryObj } from '@storybook/react-vite'
import { Carousel } from '.'
import { gradientArt } from '../GeneratedArt'

const meta = {
  title: 'Widgets/Carousel',
  component: Carousel,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Carousel>

export default meta
type Story = StoryObj<typeof meta>

const PALETTE = [
  ['#ED5353', '#ff8c82'],
  ['#F37329', '#ffc27d'],
  ['#F9C440', '#fff394'],
  ['#68B723', '#d1ff82'],
  ['#28BCA3', '#89ffdd'],
  ['#3689E6', '#8cd5ff'],
] as const

const items = ['NES', 'SNES', 'Game Boy', 'Mega Drive', 'PlayStation', 'Arcade'].map((label, i) => ({
  key: label,
  alt: label,
  src: gradientArt({
    width: 240,
    height: 180,
    from: PALETTE[i % PALETTE.length]![0],
    to: PALETTE[i % PALETTE.length]![1],
    label,
  }),
}))

// The box is wider than the stage, which is the point: the row bleeds off both edges.
const args = {
  box: { left: -32, top: 0, width: 704, height: 300 },
  items,
  selectedIndex: 2,
  pitch: 176,
  itemWidth: 160,
  itemHeight: 120,
  selectedLeft: 105.6,
  selectedTop: 90,
  selectedScale: 1.4,
  restOpacity: 0.5,
  transitionMs: 500,
  easing: 'easeOutQuint',
} as const

const stage = (children: React.ReactNode) => (
  <div style={{ position: 'relative', width: 640, height: 300, background: '#16191D', overflow: 'hidden' }}>
    {children}
  </div>
)

export const Selected: Story = { args, render: (a) => stage(<Carousel {...a} />) }

/** Moving the selection slides the strip; the selected cell stays where it is. */
export const Stepped: Story = {
  args: { ...args, selectedIndex: 4 },
  render: (a) => stage(<Carousel {...a} />),
}
