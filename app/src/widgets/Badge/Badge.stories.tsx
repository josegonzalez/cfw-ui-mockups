import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from '.'

const meta = {
  title: 'Widgets/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

const stage = (node: React.ReactNode) => (
  <div style={{ display: 'flex', gap: 12, padding: 20, background: '#0b1020' }}>{node}</div>
)

/** A plain glyph, which is how most of them are drawn. */
export const Plain: Story = {
  args: { kind: 'favorite', size: 26, color: '#F3C300', glyph: '★' },
  render: (a) => stage(<Badge {...a} />),
}

/** On a chip, for the ones that carry a label as well. */
export const Chip: Story = {
  args: {
    kind: 'multidisc',
    size: 26,
    color: '#020C29',
    background: '#F3C300',
    glyph: '⌾',
    label: 'Disc 1',
  },
  render: (a) => stage(<Badge {...a} />),
}

/** The vocabulary. Every value a renderer has to know how to draw. */
export const EveryKind: Story = {
  args: { kind: 'favorite', size: 24, color: '#DFDCDC', glyph: '★' },
  render: (a) =>
    stage(
      <>
        <Badge {...a} kind="favorite" glyph="★" />
        <Badge {...a} kind="cheevos" glyph="🏆" />
        <Badge {...a} kind="multidisc" glyph="⌾" />
        <Badge {...a} kind="manual" glyph="▤" />
        <Badge {...a} kind="savegame" glyph="⛁" />
        <Badge {...a} kind="kidGame" glyph="☺" />
        <Badge {...a} kind="gunGame" glyph="⌖" />
        <Badge {...a} kind="finished" glyph="✓" />
        <Badge {...a} kind="inProgress" glyph="◐" />
        <Badge {...a} kind="buggy" glyph="⚠" />
      </>,
    ),
}
