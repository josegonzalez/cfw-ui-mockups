import type { Meta, StoryObj } from '@storybook/react-vite'
import { GeneratedArt, gradientArt, paletteFor } from '.'

const meta = {
  title: 'Widgets/GeneratedArt',
  component: GeneratedArt,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof GeneratedArt>

export default meta
type Story = StoryObj<typeof meta>

const PALETTE = [
  ['#7b5cff', '#31d0ff'],
  ['#ff6b6b', '#ffb03a'],
  ['#3ad29f', '#4cc9f0'],
  ['#ff4d9d', '#7b5cff'],
  ['#ffd166', '#ff6b6b'],
  ['#4cc9f0', '#3ad29f'],
] as const

const TITLES = [
  'Chrono Drifter',
  'Pixel Knights',
  'Moon Circuit',
  'Neon Samurai',
  'Turbo Grove',
  'Crystal Vault',
]

export const Single: Story = {
  args: {
    box: { left: 0, top: 0, width: 160, height: 160 },
    src: gradientArt({ width: 160, height: 160, from: '#7b5cff', to: '#31d0ff' }),
    alt: 'Chrono Drifter',
    radius: 8,
    shadow: '0 8px 24px rgba(0,0,0,0.5)',
  },
  render: (args) => (
    <div style={{ position: 'relative', width: 200, height: 200, background: '#1b1e2b' }}>
      <GeneratedArt {...args} />
    </div>
  ),
}

/**
 * The same title always resolves to the same colours. That determinism is the point: a random
 * source would make every screenshot baseline fail on the next run.
 */
export const DeterministicFromTitle: Story = {
  args: Single.args,
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, width: 520 }}>
      {TITLES.map((title) => {
        const [from, to] = paletteFor(title, PALETTE)
        return (
          <div key={title} style={{ position: 'relative', width: 120, height: 150 }}>
            <GeneratedArt
              box={{ left: 0, top: 0, width: 120, height: 120 }}
              src={gradientArt({ width: 120, height: 120, from, to, label: title })}
              alt={title}
              radius={6}
            />
            <div
              style={{
                position: 'absolute',
                top: 126,
                width: 120,
                color: '#8b90a3',
                font: '12px ui-sans-serif, system-ui, sans-serif',
                textAlign: 'center',
              }}
            >
              {title}
            </div>
          </div>
        )
      })}
    </div>
  ),
}

/** Cover, contain and fill, against a slot with a different aspect to the art. */
export const FitModes: Story = {
  args: Single.args,
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      {(['cover', 'contain', 'fill'] as const).map((fit) => (
        <div key={fit} style={{ position: 'relative', width: 120, height: 160, background: '#1b1e2b' }}>
          <GeneratedArt
            box={{ left: 0, top: 0, width: 120, height: 160 }}
            src={gradientArt({ width: 300, height: 120, from: '#ff4d9d', to: '#7b5cff', label: fit })}
            alt={fit}
            fit={fit}
          />
        </div>
      ))}
    </div>
  ),
}
