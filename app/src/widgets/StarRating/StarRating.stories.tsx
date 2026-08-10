import type { Meta, StoryObj } from '@storybook/react-vite'
import { StarRating } from '.'

const FILLED =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m22 9.74-7.19-0.62-2.81-6.62-2.81 6.63-7.19 0.61 5.46 4.73-1.64 7.03 6.18-3.73 6.18 3.73-1.63-7.03z"/></svg>'
const EMPTY =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m22 9.74-7.19-0.62-2.81-6.62-2.81 6.63-7.19 0.61 5.46 4.73-1.64 7.03 6.18-3.73 6.18 3.73-1.63-7.03zm-10 6.16-3.76 2.27 1-4.28-3.32-2.88 4.38-0.38 1.7-4.03 1.71 4.04 4.38 0.38-3.32 2.88 1 4.28z"/></svg>'

const meta = {
  title: 'Widgets/StarRating',
  component: StarRating,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof StarRating>

export default meta
type Story = StoryObj<typeof meta>

export const Ratings: Story = {
  args: {
    box: { left: 0, top: 0 },
    rating: 0.8,
    size: 28,
    color: '#ff8c82',
    filledSvg: FILLED,
    emptySvg: EMPTY,
  },
  render: (args) => (
    <div style={{ position: 'relative', width: 200, height: 220, background: '#1D1616', padding: 12 }}>
      {[0, 0.2, 0.4, 0.6, 0.8, 1].map((rating, i) => (
        <StarRating key={rating} {...args} rating={rating} box={{ left: 12, top: 12 + i * 34 }} />
      ))}
    </div>
  ),
}
