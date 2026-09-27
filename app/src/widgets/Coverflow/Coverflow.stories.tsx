import type { Meta, StoryObj } from '@storybook/react-vite'
import { Coverflow, type CoverflowItem, type CoverflowLayout, type CoverflowProps } from '.'
import { gradientArt } from '../GeneratedArt'

interface ArtItem extends CoverflowItem {
  readonly src: string
}

/** A concrete instantiation: Storybook's `typeof` cannot pin down a generic component. */
function ArtCoverflow(props: CoverflowProps<ArtItem>) {
  return <Coverflow<ArtItem> {...props} />
}

const meta = {
  title: 'Widgets/Coverflow',
  component: ArtCoverflow,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ArtCoverflow>

export default meta
type Story = StoryObj<typeof meta>

const PALETTE = [
  ['#C4443A', '#ff8c82'],
  ['#3E82D6', '#8cd5ff'],
  ['#816EBA', '#d9c9ff'],
  ['#7E9B47', '#d1ff82'],
  ['#E8641E', '#ffc27d'],
  ['#00B589', '#89ffdd'],
] as const

/** Box art is taller than it is wide; one wide cover shows the equal-area fit at work. */
const items: ArtItem[] = ['Contra', 'Comix Zone', 'Chrono Trigger', 'Tetris', 'Bonk', 'Columns', 'Shinobi'].map((label, i) => {
  const w = i === 2 ? 320 : 230
  const h = i === 2 ? 230 : 320
  return {
    key: label,
    width: w,
    height: h,
    src: gradientArt({ width: w, height: h, from: PALETTE[i % 6]![0], to: PALETTE[i % 6]![1], label }),
  }
})

/** TortOS's games row, at the Brick's resolution. */
const tilted: CoverflowLayout = {
  size: 0.6,
  aspect: 0.72,
  step: 0.74,
  sideScale: 0.62,
  centerY: 0.47,
  tilt: 0.82,
  reflect: 1.52,
  sideAlpha: 150,
  vertical: false,
  equalArea: true,
  wideArea: 0,
  reflectGap: 0,
}

const stage = (children: React.ReactNode) => (
  <div style={{ position: 'relative', width: 1024, height: 768, background: '#07080C', overflow: 'hidden' }}>
    {children}
  </div>
)

const args = {
  box: { left: 0, top: 0, width: 1024, height: 768 },
  layout: tilted,
  items,
  position: 2,
  renderArt: (item: ArtItem, size: { width: number; height: number }) => (
    <img src={item.src} alt={item.key} width={size.width} height={size.height} style={{ display: 'block' }} />
  ),
}

export const Tilted: Story = { args, render: (a) => stage(<ArtCoverflow {...a} />) }

/** Mid-move: a fractional position is a card partway between slots, turning as it goes. */
export const MidMove: Story = { args: { ...args, position: 2.4 }, render: (a) => stage(<ArtCoverflow {...a} />) }

/** No tilt and a big centre: TortOS's systems row. */
export const Flat: Story = {
  args: {
    ...args,
    layout: { ...tilted, size: 0.81, aspect: 0.78, step: 0.82, sideScale: 0.38, centerY: 0.415, tilt: 0, reflect: 1.34, sideAlpha: 140, equalArea: false },
  },
  render: (a) => stage(<ArtCoverflow {...a} />),
}

/** Stood on end, one card at a time, the neighbours past the edge. */
export const Vertical: Story = {
  args: { ...args, layout: { ...tilted, step: 1.5, sideScale: 1, tilt: 0, sideAlpha: 255, vertical: true } },
  render: (a) => stage(<ArtCoverflow {...a} />),
}
