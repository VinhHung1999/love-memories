import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// T289 — iOS Universal Link AASA file lives at
// /.well-known/apple-app-site-association (no file extension). sirv defaults
// to application/octet-stream for unknown extensions; iOS still accepts that
// on iOS 14+, but Apple's docs recommend application/json. Force the header
// in both dev and preview so deployed builds behave the same as local.
function aasaContentType(): Plugin {
  const setHeader = (req: { url?: string }, res: { setHeader: (k: string, v: string) => void }) => {
    if (req.url === '/.well-known/apple-app-site-association') {
      res.setHeader('Content-Type', 'application/json');
    }
  };
  return {
    name: 'aasa-content-type',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        setHeader(req, res);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        setHeader(req, res);
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), aasaContentType()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 3338,
    allowedHosts: ['love-scrum.hungphu.work', 'dev-love-scrum.hungphu.work', 'memoura.app', 'dev.memoura.app'],
    proxy: {
      '/api': 'http://localhost:5006',
      '/uploads': 'http://localhost:5006',
    },
  },
  preview: {
    port: 3337,
    proxy: {
      '/api': 'http://localhost:5005',
      '/uploads': 'http://localhost:5005',
    },
  },
});
