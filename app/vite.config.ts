import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

/*
 * The dev server root is `app/`, but the Playwright fidelity gate needs to load the
 * pre-React screens out of `legacy/` from this same origin so the two can be diffed
 * without a second server. `fs.allow` opens the repo root for that, and nothing else.
 */
const repoRoot = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    fs: { allow: [repoRoot] },
  },
  build: {
    // Relative asset URLs, so a built bundle can be served from any subpath.
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'jsdom',
    /*
     * A real origin, so the document gets a working `localStorage`. jsdom disables storage on an
     * opaque origin, and Node's own experimental `localStorage` global is inert without a
     * backing file - between them, anything reading storage silently sees nothing.
     */
    environmentOptions: { jsdom: { url: 'http://localhost:5173/' } },
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.{test,spec,stories}.{ts,tsx}', 'src/test/**'],
    },
  },
})
