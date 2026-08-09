import type { Meta, StoryObj } from '@storybook/react-vite'
import { HelpBar } from '.'

const meta = {
  title: 'Widgets/HelpBar',
  component: HelpBar,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof HelpBar>

export default meta
type Story = StoryObj<typeof meta>

const stage = (children: React.ReactNode) => (
  <div style={{ position: 'relative', width: 640, height: 60, background: '#1b1e2b' }}>{children}</div>
)

const box = { left: 20, top: 10, width: 600, height: 40 }

/** The disc form: a filled circle with the letter knocked out. */
const renderHelp: NonNullable<Story['render']> = (args) => stage(<HelpBar {...args} />)

export const Circle: Story = {
  args: {
    box,
    items: [
      { glyph: 'a', label: 'Open' },
      { glyph: 'b', label: 'Back' },
      { glyph: 'start', label: 'Menu' },
    ],
    colors: { fg: '#e7e9f0', badgeBg: '#ff8c82', badgeFg: '#1d1616' },
    font: 16,
  },
  render: renderHelp,
}

/** The plain form: the letter alone, in the accent colour. */
export const Plain: Story = {
  args: {
    ...Circle.args,
    colors: { fg: '#8b90a3', badgeBg: '#4cc9f0' },
    badge: 'plain',
    font: 13,
    bold: true,
  },
  render: renderHelp,
}

/**
 * Start and Select have no letter moulded on them, so the disc form draws a three-bar pictogram
 * rather than inventing a marking the hardware does not have.
 */
export const Pictograms: Story = {
  args: {
    ...Circle.args,
    items: [
      { glyph: 'select', label: 'Options' },
      { glyph: 'start', label: 'Menu' },
      { glyph: 'a', label: 'Back' },
      { glyph: 'y', label: 'Search' },
    ],
    uppercase: true,
  },
  render: renderHelp,
}
