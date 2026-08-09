import type { Meta, StoryObj } from '@storybook/react-vite'
import { DeviceFrame } from './DeviceFrame'
import { DEVICE_SLUGS, getDevice } from './devices'

/**
 * The shell every screen renders inside.
 *
 * It is mockup-only chrome and deliberately outside the widget vocabulary - real hardware has a
 * real bezel - but it is also the composition root, so device size, motion, input and render
 * mode all enter through it.
 */
const meta = {
  title: 'Device/DeviceFrame',
  component: DeviceFrame,
  parameters: { layout: 'centered' },
  // Every story supplies its own screen content through `render`; this satisfies the required
  // prop without putting a control for it in the panel.
  args: { children: null },
  argTypes: {
    children: { table: { disable: true } },
    device: { control: 'select', options: DEVICE_SLUGS },
    renderMode: { control: 'inline-radio', options: ['web', 'fallback'] },
    scale: { control: { type: 'range', min: 0.3, max: 2.5, step: 0.05 } },
  },
} satisfies Meta<typeof DeviceFrame>

export default meta
type Story = StoryObj<typeof meta>

/** A placeholder that makes the panel's exact pixel dimensions visible. */
function Ruler({ device }: { device: (typeof DEVICE_SLUGS)[number] }) {
  const d = getDevice(device)
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'repeating-linear-gradient(45deg, #1b2430 0 12px, #202b3a 12px 24px)',
        color: '#7fd1ff',
        font: '600 16px/1.4 ui-monospace, monospace',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
      }}
    >
      <div>
        <div style={{ fontSize: 22 }}>{d.label}</div>
        <div>
          {d.w} x {d.h} - {d.aspect}
        </div>
        <div style={{ opacity: 0.7 }}>viewing scale {d.viewScale}x</div>
      </div>
    </div>
  )
}

const renderFrame: NonNullable<Story['render']> = (args) => (
  <DeviceFrame {...args}>
    <Ruler device={args.device} />
  </DeviceFrame>
)

export const Default: Story = {
  args: { device: 'rg35xx' },
  render: renderFrame,
}

/**
 * Press a button, or use the keyboard: arrows for the D-pad, Z and X for A and B, A and S for
 * X and Y, Q and W for the shoulders, Enter for Start, right shift for Select.
 */
export const Interactive: Story = {
  args: { device: 'rg35xx', interactive: true },
  render: renderFrame,
}

/** With input off, the cluster still renders but nothing responds. */
export const NotInteractive: Story = {
  args: { device: 'rg35xx', interactive: false },
  render: renderFrame,
}

/** What the screenshot specs capture: the panel alone, with no bezel or controls. */
export const Bare: Story = {
  args: { device: 'rg35xx', bare: true },
  render: renderFrame,
}

/**
 * Every registered device at its own viewing scale, which is what keeps a 480x320 panel and a
 * 1920x1152 one comparable on a desktop while both stay pixel-exact internally.
 */
export const AllDevices: Story = {
  args: { device: 'rg35xx' },
  parameters: { layout: 'padded' },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
      {DEVICE_SLUGS.map((slug) => (
        <DeviceFrame key={slug} device={slug} interactive={false}>
          <Ruler device={slug} />
        </DeviceFrame>
      ))}
    </div>
  ),
}
