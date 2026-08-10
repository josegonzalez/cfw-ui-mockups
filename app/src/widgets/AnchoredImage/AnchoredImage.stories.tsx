import type { Meta, StoryObj } from '@storybook/react-vite'
import { AnchoredImage } from '.'
import { gradientArt } from '../GeneratedArt'

const meta = {
  title: 'Widgets/AnchoredImage',
  component: AnchoredImage,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof AnchoredImage>

export default meta
type Story = StoryObj<typeof meta>

const art = gradientArt({ width: 300, height: 120, from: '#ED5353', to: '#ff8c82', label: 'wordmark' })
const stage = (children: React.ReactNode) => (
  <div style={{ position: 'relative', width: 420, height: 260, background: '#1D1616' }}>
    {/* The cross marks the anchor point, so the origin is visible rather than inferred. */}
    <div style={{ position: 'absolute', left: 209, top: 0, width: 2, height: 260, background: '#ffffff30' }} />
    <div style={{ position: 'absolute', left: 0, top: 129, width: 420, height: 2, background: '#ffffff30' }} />
    {children}
  </div>
)

const render: NonNullable<Story['render']> = (args) => stage(<AnchoredImage {...args} />)

/** Centred on the anchor: the image's own centre sits on the crosshair. */
export const Centred: Story = {
  args: {
    box: { posX: 210, posY: 130, originX: 0.5, originY: 0.5, maxWidth: 260, maxHeight: 150 },
    src: art,
    alt: 'wordmark',
  },
  render,
}

/** Anchored by its top-left corner instead. */
export const TopLeft: Story = {
  args: { ...Centred.args, box: { posX: 210, posY: 130, originX: 0, originY: 0, maxWidth: 260, maxHeight: 150 } },
  render,
}

/**
 * A tall slot. The element shrinks to the fitted image rather than keeping the slot's height,
 * so the anchor still lands on the artwork and not on empty space above and below it.
 */
export const TallSlot: Story = {
  args: { ...Centred.args, box: { posX: 210, posY: 130, originX: 0.5, originY: 0.5, maxWidth: 260, maxHeight: 240 } },
  render,
}
