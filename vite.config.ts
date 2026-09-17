import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * `BASE_PATH` lets the same build serve from a domain root or from a GitHub
 * Pages project path (/DuoSemetics/). Everything the app references uses either
 * a relative URL or import.meta.env.BASE_URL, so no other file needs to know.
 */
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  build: {
    target: 'es2020',
    // The whole app is a few hundred KB; one chunk avoids a waterfall on a
    // cold mobile connection.
    chunkSizeWarningLimit: 800,
  },
});
