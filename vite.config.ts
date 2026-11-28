import { existsSync, readdirSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

/** List optional artwork at build time so the story never requests a missing image. */
const publicFiles = existsSync('public/images')
  ? readdirSync('public/images').map((file) => `images/${file}`)
  : []

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  define: {
    __PUBLIC_FILES__: JSON.stringify(publicFiles),
  },
  server: {
    host: '0.0.0.0',
  },
})
