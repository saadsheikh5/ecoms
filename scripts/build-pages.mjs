import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const indexPath = join(root, 'index.html');
const devIndexPath = join(root, 'dev.html');
const distPath = join(root, 'dist');
const distAssetsPath = join(distPath, 'assets');
const rootAssetsPath = join(root, 'assets');
const pages404Html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>JTS Beauty World - Luxury Wigs</title>
    <script>
      (function () {
        var basePath = '/ecoms';
        var path = window.location.pathname || '';
        var route = path.indexOf(basePath) === 0 ? path.slice(basePath.length) : path;
        route = route.replace(/^\\/+/, '');
        var hashRoute = route ? '#/' + route + window.location.search : window.location.hash || '#/';
        window.location.replace(basePath + '/' + hashRoute);
      }());
    </script>
  </head>
  <body></body>
</html>
`;

const sourceIndex = readFileSync(devIndexPath, 'utf8');
const originalIndex = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';

try {
  writeFileSync(indexPath, sourceIndex);
  execFileSync(process.execPath, [join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], {
    cwd: root,
    stdio: 'inherit',
  });

  const distIndexPath = join(distPath, 'index.html');

  mkdirSync(rootAssetsPath, { recursive: true });

  for (const fileName of readdirSync(rootAssetsPath)) {
    if (/^index-.*\.(js|css)$/.test(fileName)) {
      rmSync(join(rootAssetsPath, fileName), { force: true });
    }
  }

  for (const fileName of readdirSync(distAssetsPath)) {
    if (/^index-.*\.(js|css)$/.test(fileName)) {
      copyFileSync(join(distAssetsPath, fileName), join(rootAssetsPath, fileName));
    }
  }

  copyFileSync(distIndexPath, indexPath);
  writeFileSync(join(root, '404.html'), pages404Html);
  writeFileSync(join(distPath, '404.html'), pages404Html);
  writeFileSync(indexPath, sourceIndex);
} catch (error) {
  if (originalIndex) {
    writeFileSync(indexPath, originalIndex);
  }
  throw error;
}
