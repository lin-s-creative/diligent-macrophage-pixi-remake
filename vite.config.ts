import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

function designerConfigWriter(): Plugin {
  return {
    name: 'designer-config-writer',
    configureServer(server) {
      server.middlewares.use('/__designer/save-config', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.setEncoding('utf8');
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body) as { path?: string; content?: unknown };
            const relativePath = parsed.path ?? 'src/config/designerConfig.json';
            if (!relativePath.startsWith('src/config/') || !relativePath.endsWith('.json')) {
              throw new Error('Only src/config/*.json files can be written by the designer panel.');
            }

            const target = resolve(server.config.root, relativePath);
            const content = typeof parsed.content === 'string'
              ? parsed.content
              : `${JSON.stringify(parsed.content, null, 2)}\n`;

            await mkdir(dirname(target), { recursive: true });
            await writeFile(target, content, 'utf8');

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, path: relativePath }));
          } catch (error) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), designerConfigWriter()],
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
