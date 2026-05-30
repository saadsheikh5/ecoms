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
const apiCachePath = join(root, 'src', 'constants', 'apiCache.js');
const productionApiUrl = 'https://ecoms-lkswc2a9.b4a.run/api';
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

const normalizeApiUrl = (url) => {
  if (!url) return '';
  const trimmedUrl = String(url).trim();
  if (!trimmedUrl) return '';
  const absoluteUrl = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
  return absoluteUrl.replace(/\/+$/, '');
};

const updateApiCache = async () => {
  const apiUrl = normalizeApiUrl(process.env.VITE_API_URL || productionApiUrl);
  if (!apiUrl) return;

  try {
    const response = await fetch(`${apiUrl}/products`);
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const payload = await response.json();
    if (!payload?.success || !Array.isArray(payload.data)) {
      throw new Error('API products payload was invalid.');
    }

    writeFileSync(
      apiCachePath,
      `export const cachedProducts = ${JSON.stringify(payload.data, null, 2)};\nexport const cachedProductsUpdatedAt = ${JSON.stringify(new Date().toISOString())};\n`
    );
    console.log(`Cached ${payload.data.length} live products for offline browsing.`);
  } catch (error) {
    console.warn(`Unable to refresh live product cache. Keeping existing snapshot. ${error.message}`);
  }
};

try {
  await updateApiCache();
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
} catch (error) {
  if (originalIndex) {
    writeFileSync(indexPath, originalIndex);
  }
  throw error;
}
