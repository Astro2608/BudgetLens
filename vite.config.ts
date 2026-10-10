import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { getFullStatus, launchOllamaEngine, handleSetupStream } from './src/server/localAiAutomation';

function localAiPlugin(): Plugin {
  return {
    name: 'budgetlens-local-ai',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/local-ai/status') {
          const status = await getFullStatus();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(status));
          return;
        }

        if (req.url === '/api/local-ai/launch' && req.method === 'POST') {
          const ok = await launchOllamaEngine();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: ok }));
          return;
        }

        if (req.url?.startsWith('/api/local-ai/setup-stream')) {
          await handleSetupStream(res);
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), localAiPlugin()],
  base: '/',
  server: {
    port: 5173,
    proxy: {
      '/ollama': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
