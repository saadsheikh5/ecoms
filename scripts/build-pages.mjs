import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const require = createRequire(import.meta.url);
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

const fetchProductsFromMongo = async () => {
  const dotenv = require(join(root, 'server', 'node_modules', 'dotenv'));
  const mongoose = require(join(root, 'server', 'node_modules', 'mongoose'));
  const Product = require(join(root, 'server', 'models', 'Product'));

  dotenv.config({ path: join(root, 'server', '.env') });

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured.');
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  try {
    return await Product.find({}).sort('-createdAt').lean();
  } finally {
    await mongoose.disconnect();
  }
};

const writeProductCache = (products) => {
  writeFileSync(
    apiCachePath,
    `export const cachedProducts = ${JSON.stringify(products, null, 2)};\nexport const cachedProductsUpdatedAt = ${JSON.stringify(new Date().toISOString())};\n`
  );
  console.log(`Cached ${products.length} live products for offline browsing.`);
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

    writeProductCache(payload.data);
  } catch (error) {
    console.warn(`Unable to refresh live product cache from API. Trying MongoDB snapshot. ${error.message}`);
    try {
      const products = await fetchProductsFromMongo();
      writeProductCache(products);
    } catch (mongoError) {
      console.warn(`Unable to refresh live product cache from MongoDB. Keeping existing snapshot. ${mongoError.message}`);
    }
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
