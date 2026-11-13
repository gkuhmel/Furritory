import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

/** Identifiant de version affiché en jeu : commit court + heure du build (UTC). */
function buildId(): string {
  let sha = process.env.WORKERS_CI_COMMIT_SHA ?? '';
  if (!sha) {
    try {
      sha = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch {
      sha = '';
    }
  }
  const time = new Date().toISOString().slice(5, 16).replace('T', ' ');
  return `${sha.slice(0, 7) || 'local'} · ${time}`;
}

export default defineConfig({
  base: './',
  define: {
    __BUILD_ID__: JSON.stringify(buildId()),
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
  server: {
    host: true,
  },
});
