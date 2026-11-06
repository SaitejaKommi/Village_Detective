import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@shared': fileURLToPath(new URL('../shared', import.meta.url)) },
  },
  // host: true exposes the dev server on the LAN so a phone on the same Wi-Fi can test.
  server: { host: true, port: 5173, fs: { allow: ['..'] } },
  preview: { host: true, port: 4173 },
  build: { chunkSizeWarningLimit: 1800 },
});
