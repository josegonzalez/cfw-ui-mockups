import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { IconRow } from '.'
import { Badge } from '../Badge'

const meta = {
  title: 'Widgets/IconRow',
  component: IconRow,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof IconRow>

export default meta
type Story = StoryObj<typeof meta>

const stage = (node: ReactNode) => (
  <div style={{ position: 'relative', width: 460, height: 60, background: '#0b1020' }}>{node}</div>
)

const box = { left: 16, top: 14, width: 420, height: 30 }

/** A well-decorated game: six markers, and they do not push anything around. */
export const Full: Story = {
  args: { box, gap: 10, children: null },
  render: (a) =>
    stage(
      <IconRow {...a}>
        <Badge kind="favorite" size={24} glyph="★" color="#F3C300" />
        <Badge kind="cheevos" size={24} glyph="🏆" color="#F3C300" />
        <Badge kind="manual" size={24} glyph="▤" color="#3CAEFB" />
        <Badge kind="savegame" size={24} glyph="⛁" color="#3CAEFB" />
        <Badge kind="finished" size={24} glyph="✓" color="#00AC97" />
        <Badge kind="multidisc" size={24} glyph="⌾" color="#020C29" background="#F3C300" label="Disc 1" />
      </IconRow>,
    ),
}

/**
 * The same row with nothing in it. The left edge is identical to the story above, which is the
 * whole reason this is a widget rather than a flex container written out at each use site.
 */
export const Empty: Story = {
  args: { box, gap: 10, children: null },
  render: (a) => stage(<IconRow {...a} />),
}
