import type { Meta, StoryObj } from '@storybook/react-vite'
import { ListRow } from '.'

const meta = {
  title: 'Widgets/ListRow',
  component: ListRow,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ListRow>

export default meta
type Story = StoryObj<typeof meta>

const colors = {
  fg: '#e7e9f0',
  sublabelFg: '#8b90a3',
  selectedFg: '#0b0d13',
  selectedBg: '#4cc9f0',
  selectedSublabelFg: '#0b3b47',
  iconBg: '#2a2e40',
  iconFg: '#cfd3e0',
  selectedIconBg: '#0b0d13',
  selectedIconFg: '#4cc9f0',
}

const stage = (children: React.ReactNode) => (
  <div style={{ position: 'relative', width: 340, height: 200, background: '#12141c' }}>{children}</div>
)

const renderRow: NonNullable<Story['render']> = (args) => stage(<ListRow {...args} />)

export const Unselected: Story = {
  args: {
    box: { left: 0, top: 0, width: 340, height: 48 },
    label: 'Chrono Drifter',
    colors,
    labelFont: 16,
    paddingX: 12,
  },
  render: renderRow,
}

export const Selected: Story = {
  args: { ...Unselected.args, selected: true },
  render: renderRow,
}

/** Every state of the rich form, stacked so the colour swap is visible at a glance. */
export const States: Story = {
  args: Unselected.args,
  render: (args) =>
    stage(
      <>
        <ListRow
          {...args}
          box={{ left: 0, top: 0, width: 340, height: 68 }}
          label="Recents"
          sublabel="Jump back in"
          icon="R"
          labelFont={20}
          sublabelFont={13}
          iconSize={44}
          radius={8}
        />
        <ListRow
          {...args}
          box={{ left: 0, top: 72, width: 340, height: 68 }}
          label="Games"
          sublabel="Browse by system"
          icon="G"
          labelFont={20}
          sublabelFont={13}
          iconSize={44}
          radius={8}
          selected
          selectedShiftX={6}
        />
        <ListRow
          {...args}
          box={{ left: 0, top: 144, width: 340, height: 48 }}
          label="A title far too long to fit in this row"
          labelFont={16}
        />
      </>,
    ),
}
