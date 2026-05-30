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

const sourceIndex = readFileSync(devIndexPath, 'utf8');
const originalIndex = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';

try {
  writeFileSync(indexPath, sourceIndex);
  execFileSync(process.execPath, [join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], {
    cwd: root,
    stdio: 'inherit',
  });

  const distIndexPath = join(distPath, 'index.html');
  const fixedDistIndex = readFileSync(distIndexPath, 'utf8')
    .replace('href="/vite.svg"', 'href="/ecoms/vite.svg"');
  writeFileSync(distIndexPath, fixedDistIndex);

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
  copyFileSync(distIndexPath, join(root, '404.html'));
  copyFileSync(distIndexPath, join(distPath, '404.html'));
} catch (error) {
  if (originalIndex) {
    writeFileSync(indexPath, originalIndex);
  }
  throw error;
}
