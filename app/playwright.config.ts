import { defineConfig, devices } from '@playwright/test'

/*
 * Screens render at exact device pixels inside a scaled bezel, so the browser window size is
 * irrelevant to fidelity - every spec screenshots the `.screen` element, not the viewport.
 * `deviceScaleFactor: 1` keeps those screenshots at native resolution so a diff against the
 * reference art in docs/themes/<cfw>/reference/ compares like with like.
 *
 * One server serves both the React app and the pre-React screens under legacy/, which is what
 * makes the A/B fidelity gate a same-origin comparison rather than a second harness.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Spread rather than `workers: undefined`, which exactOptionalPropertyTypes rejects.
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  expect: {
    toHaveScreenshot: {
      // Anti-aliasing on scaled bezels moves a few pixels between runs; real regressions
      // in a 640x480 screen are far larger than this.
      maxDiffPixelRatio: 0.002,
    },
  },
  use: {
    baseURL: 'http://localhost:5173',
    deviceScaleFactor: 1,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1 },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
