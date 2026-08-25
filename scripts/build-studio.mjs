import { bundle } from '@remotion/bundler';
import { cpSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outDir = join(root, 'build');
const publicDir = join(root, 'public');

// Build the Remotion studio bundle (HTML + JS assets at root of outDir).
await bundle({
  entryPoint: join(root, 'remotion/index.ts'),
  outDir,
  publicPath: '/',
  webpackOverride: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      // Some dependencies leak Node-only requires (e.g. source-map -> url)
      // into the graph; they are never exercised at runtime.
      fallback: { ...config.resolve?.fallback, url: false, fs: false, path: false },
    },
  }),
});

// Copy the studio bundle's static assets into Next.js public/ so they are
// served at root paths (e.g. /bundle.js, /index.html). The media assets
// under outDir/public are NOT copied — they are served from Vercel Blob via
// the /public/* rewrite in next.config.ts.
for (const name of readdirSync(outDir)) {
  if (name === 'public') continue;
  cpSync(join(outDir, name), join(publicDir, name), { recursive: true, force: true });
}

console.log('Studio bundle copied to public/');
