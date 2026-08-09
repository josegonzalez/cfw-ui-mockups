import type { Preview } from '@storybook/react-vite'
import '../src/index.css'

/*
 * Widgets are documented against a dark ground because every theme in the repo is dark by
 * default, and against both render modes because a widget with a web-only effect must show
 * its fallback too. The render-mode decorator arrives with RenderModeProvider in phase 3.
 */
const preview: Preview = {
  parameters: {
    backgrounds: {
      options: {
        device: { name: 'device', value: '#0c0d12' },
        light: { name: 'light', value: '#ffffff' },
      },
    },
    controls: { expanded: true },
  },
  initialGlobals: {
    backgrounds: { value: 'device' },
  },
}

export default preview
