import type { Meta, StoryObj } from '@storybook/react-vite'
import { TileGrid, type TileGridMetrics, type TileGridProps, type TileState } from '.'
import { gradientArt, paletteFor } from '../GeneratedArt'

/** A concrete instantiation: Storybook's `typeof` cannot pin down a generic component. */
function StringTileGrid(props: TileGridProps<string>) {
  return <TileGrid<string> {...props} />
}

const meta = {
  title: 'Widgets/TileGrid',
  component: StringTileGrid,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof StringTileGrid>

export default meta
type Story = StoryObj<typeof meta>

const PALETTE = [
  ['#ED5353', '#ff8c82'],
  ['#68B723', '#d1ff82'],
  ['#3689E6', '#8cd5ff'],
  ['#A56DE2', '#e4c6fa'],
] as const

const titles = Array.from({ length: 14 }, (_, i) => `Game ${i + 1}`)

const metrics: TileGridMetrics = {
  box: { left: 0, top: 0, width: 640, height: 348 },
  cols: 3,
  rows: 2,
  tileW: 170.7,
  tileH: 156,
  padding: [42.7, 12],
  margin: [21.3, 12],
}

const renderTile = (title: string, state: TileState) => {
  const [from, to] = paletteFor(title, PALETTE)
  return (
    <div style={{ position: 'absolute', inset: 0, borderRadius: 6, overflow: 'hidden', outline: state.selected ? '3px solid #ED5353' : 'none' }}>
      <img
        src={gradientArt({ width: Math.round(state.box.width), height: Math.round(state.box.height), from, to, label: title })}
        alt={title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: state.selected ? 'none' : 'brightness(0.7)' }}
      />
    </div>
  )
}

const stage = (children: React.ReactNode) => (
  <div style={{ position: 'relative', width: 640, height: 348, background: '#16191D' }}>{children}</div>
)

export const Paged: Story = {
  args: { metrics, items: titles, selectedIndex: 1, renderTile, keyOf: (t) => t, scroll: 'page', transitionMs: 300 },
  render: (a) => stage(<StringTileGrid {...a} />),
}

/** Selecting past the last cell turns a whole page rather than scrolling by a row. */
export const SecondPage: Story = {
  args: { ...Paged.args, selectedIndex: 7 },
  render: (a) => stage(<StringTileGrid {...a} />),
}

/** A single row that slides to keep the selection near the middle. */
export const Strip: Story = {
  args: {
    ...Paged.args,
    metrics: { ...metrics, rows: 1, box: { ...metrics.box, height: 220 }, tileH: 199 },
    selectedIndex: 5,
    scroll: 'strip',
  },
  render: (a) => (
    <div style={{ position: 'relative', width: 640, height: 220, background: '#16191D' }}>
      <StringTileGrid {...a} />
    </div>
  ),
}
