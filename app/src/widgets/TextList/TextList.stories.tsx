import type { Meta, StoryObj } from '@storybook/react-vite'
import { TextList } from '.'

const meta = {
  title: 'Widgets/TextList',
  component: TextList,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof TextList>

export default meta
type Story = StoryObj<typeof meta>

const games = [
  'Chrono Drifter',
  'Pixel Knights',
  'Moon Circuit',
  'Neon Samurai',
  'Turbo Grove',
  'Crystal Vault',
  'Star Relay',
  'Iron Lantern',
  'Vector Bloom',
  'Echo Harbour',
].map((label, i) => ({ key: String(i), label }))

const colors = {
  fg: '#e7e9f0',
  selectedFg: '#0b0d13',
  selectedBg: '#4cc9f0',
}

const frame = { position: 'relative' as const, width: 320, height: 300, background: '#12141c' }

/** The plain form: a single-line row, full-width selection bar. */
const renderList: NonNullable<Story['render']> = (args) => (
    <div style={frame}>
      <TextList {...args} />
    </div>
  )

export const Plain: Story = {
  args: {
    box: { left: 0, top: 0, width: 320, height: 300 },
    items: games,
    selectedIndex: 0,
    rowHeight: 48,
    colors,
    labelFont: 16,
    rowPaddingX: 12,
  },
  render: renderList,
}

/** Scrolled: the window follows the selection by the minimum needed, never a whole page. */
export const Scrolled: Story = {
  args: { ...Plain.args, selectedIndex: 8 },
  render: renderList,
}

/** With an icon tile and a subtitle, as a main menu uses. */
export const Rich: Story = {
  args: {
    box: { left: 0, top: 0, width: 320, height: 300 },
    items: [
      { key: 'r', label: 'Recents', sublabel: 'Jump back in', icon: 'R' },
      { key: 'f', label: 'Favorites', sublabel: 'Your pinned games', icon: 'F' },
      { key: 'g', label: 'Games', sublabel: 'Browse by system', icon: 'G' },
      { key: 'a', label: 'Apps', sublabel: 'Tools and extras', icon: 'A' },
    ],
    selectedIndex: 2,
    rowHeight: 68,
    gap: 4,
    colors: {
      ...colors,
      sublabelFg: '#8b90a3',
      selectedSublabelFg: '#0b3b47',
      iconBg: '#2a2e40',
      iconFg: '#cfd3e0',
      selectedIconBg: '#0b0d13',
      selectedIconFg: '#4cc9f0',
    },
    labelFont: 20,
    sublabelFont: 13,
    iconSize: 44,
    rowPaddingX: 12,
    rowRadius: 8,
    selectedShiftX: 6,
  },
  render: renderList,
}

/** Long titles, showing both overflow rules side by side. */
export const Overflow: Story = {
  args: {
    ...Plain.args,
    items: [
      { key: '1', label: 'A title far too long to fit inside this narrow list box' },
      { key: '2', label: 'Another title that also runs well past the available width' },
    ],
    selectedIndex: 0,
    overflow: 'ellipsis',
  },
  render: (args) => (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={frame}>
        <TextList {...args} overflow="ellipsis" />
      </div>
      <div style={frame}>
        <TextList {...args} overflow="clip" />
      </div>
    </div>
  ),
}
