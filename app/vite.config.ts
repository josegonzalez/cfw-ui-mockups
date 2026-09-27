import { defineConfig } from 'vitest/config'
import type { Plugin, PreviewServer, ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import sirv from 'sirv'
import { cp } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/*
 * The dev server root is `app/`, but the gallery links into `docs/`, which sits outside it.
 * `fs.allow` opens the repo root for that, and nothing else.
 */
const repoRoot = fileURLToPath(new URL('..', import.meta.url))

/** Repo directories the site links into: the documentation and the pre-React archive. */
const SHARED_DIRS = ['docs']

/**
 * Serve `docs/` alongside the app.
 *
 * It sits outside the Vite root, so without this the landing page's "Read the notes" link 404s.
 */
function serveRepoDirs(): Plugin {
  const appDir = fileURLToPath(new URL('.', import.meta.url))
  // The one output directory the copy is allowed to write into.
  const expectedOutDir = resolve(appDir, 'dist')
  let absOutDir = expectedOutDir

  const mount = (server: ViteDevServer | PreviewServer) => {
    for (const dir of SHARED_DIRS) {
      server.middlewares.use(
        `/${dir}`,
        sirv(resolve(repoRoot, dir), {
          dev: true,
          etag: true,
          setHeaders(res, pathname) {
            // Browsers download `text/markdown` rather than showing it. The notes are meant to
            // be read, so serve them as plain text and let them open in a tab.
            if (pathname.endsWith('.md')) {
              res.setHeader('Content-Type', 'text/plain; charset=utf-8')
            }
          },
        }),
      )
    }
  }

  return {
    name: 'cfw:serve-repo-dirs',
    configResolved(config) {
      absOutDir = resolve(config.root, config.build.outDir)
    },
    configureServer: mount,
    configurePreviewServer: mount,
    async closeBundle() {
      /*
       * Only the app's own build gets the copy.
       *
       * A Vite build runs this hook once per environment, and the ones that are not producing
       * the site resolve against placeholder paths - which is enough to scatter 15MB of copied
       * archive into a directory nobody asked for. Checking the resolved output directory is
       * what keeps the copy where it belongs.
       */
      if (absOutDir !== expectedOutDir) return

      for (const dir of SHARED_DIRS) {
        await cp(resolve(repoRoot, dir), resolve(absOutDir, dir), { recursive: true })
      }
    },
  }
}

export default defineConfig({
  // Relative asset URLs, so a built bundle can be served from any subpath - GitHub Pages serves
  // a project site from `/<repo>/`, where root-absolute URLs would 404.
  base: './',
  plugins: [react(), tailwindcss(), serveRepoDirs()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    fs: { allow: [repoRoot] },
  },
  build: {
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
