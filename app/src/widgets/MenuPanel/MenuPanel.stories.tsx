import type { Meta, StoryObj } from '@storybook/react-vite'
import { MenuPanel, type MenuEntry } from '.'

const meta = {
  title: 'Widgets/MenuPanel',
  component: MenuPanel,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MenuPanel>

export default meta
type Story = StoryObj<typeof meta>

const entries: MenuEntry[] = [
  { kind: 'group', key: 'g1', label: 'Settings' },
  { kind: 'row', key: 'display', label: 'Display', value: '640x480' },
  { kind: 'row', key: 'sound', label: 'Sound', toggle: true, on: true },
  { kind: 'row', key: 'network', label: 'Network', toggle: true, on: false },
  { kind: 'group', key: 'g2', label: 'System' },
  { kind: 'row', key: 'update', label: 'Update', button: true, value: 'CHECK' },
  { kind: 'row', key: 'restart', label: 'Restart' },
]

const colors = {
  panel: '#1D1616',
  fg: '#ffffff',
  mutedFg: '#ffffffcc',
  selectedFg: '#FFEBEB',
  selectedBg: '#ED5353',
  groupFg: '#ff8c82',
  groupBg: '#ff8c821a',
  groupRule: '#ff8c8299',
  rowRule: '#ffffff0d',
  shade: 'rgba(0, 0, 0, 0.6)',
}

const renderMenu: NonNullable<Story['render']> = (args) => (
  <div style={{ position: 'relative', width: 640, height: 480, background: '#16191D', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#ffffff40', font: '700 28px sans-serif' }}>
      the view underneath
    </div>
    <MenuPanel {...args} />
  </div>
)

export const Menu: Story = {
  args: {
    left: 121.6,
    width: 396.8,
    maxHeight: 374.4,
    screenWidth: 640,
    screenHeight: 480,
    title: 'MAIN MENU',
    footer: 'ELEMENTERIAL',
    entries,
    selectedIndex: 1,
    colors,
    padding: 15.9,
    radius: 15,
    titleHeight: 50.4,
    titleFont: 24,
    rowHeight: 33.6,
    rowFont: 16.8,
    groupHeight: 25.7,
    groupFont: 13.5,
    footerHeight: 27,
    footerFont: 13.5,
    iconSize: 19.3,
  },
  render: renderMenu,
}

/** A toggle row selected, so the inverted colours are visible. */
export const ToggleSelected: Story = {
  args: { ...Menu.args, selectedIndex: 2 },
  render: renderMenu,
}
