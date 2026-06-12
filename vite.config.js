import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/ecoms/',
  plugins: [
    react(),
    {
      name: 'serve-dev-html-for-pages-base',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!['/', '/admin', '/admin/'].includes(req.url || '')) {
            return next();
          }

          const html = readFileSync(resolve(process.cwd(), 'dev.html'), 'utf8')
            .replaceAll('%BASE_URL%', '/ecoms/');
          const transformedHtml = await server.transformIndexHtml('/dev.html', html);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html');
          res.end(transformedHtml);
        });
      },
    },
  ],
  server: {
    port: 3000,
    open: '/dev.html'
  }
})
