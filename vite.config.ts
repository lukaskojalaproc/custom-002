import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `--mode single` inlines all JS/CSS into one index.html that opens straight from disk
// (double-click / email to a client) – no server needed.
export default defineConfig(({ mode }) => ({
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react()],
  base: './',
  server: { port: 5173 },
  build: mode === 'single' ? { outDir: 'dist-single' } : undefined,
}));
