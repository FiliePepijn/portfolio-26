import { existsSync, readdirSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

/** Optional artwork and models the 3D story looks for, so it never requests files that are not there. */
const publicFiles = ['models', 'images'].flatMap((dir) =>
  existsSync(`public/${dir}`) ? readdirSync(`public/${dir}`).map((file) => `${dir}/${file}`) : [],
)

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  define: {
    __PUBLIC_FILES__: JSON.stringify(publicFiles),
  },
  server: {
    host: '0.0.0.0',
  },
})
