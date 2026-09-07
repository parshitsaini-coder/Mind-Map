import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Base path set to match the GitHub Pages repo: parshitsaini-coder/Mind-Map
// (Pages serves this at https://parshitsaini-coder.github.io/Mind-Map/,
// so every asset URL needs the '/Mind-Map/' prefix — that's what `base` does.)
export default defineConfig({
  base: '/Mind-Map/',
  plugins: [react(), tailwindcss()],
})
