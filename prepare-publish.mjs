import { cp, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(root, '../kilim-site-public');
const files = ['index.html', 'download.html', 'help.html', 'releases.html', 'privacy.html', 'credits.html',
  'styles.css', 'site.js', 'LICENSE', 'CNAME', 'robots.txt', 'sitemap.xml', 'vercel.json'];
const downloads = ['Kilim-Windows-source.zip', 'Kilim-Windows-0.3.0-beta-win-x64.zip.sha256'];
const assets = (await readdir(path.join(root, 'assets'))).filter(name => /^(favicon\.svg|social-preview\.png|bricolage-grotesque-latin\.woff2|bricolage-grotesque-OFL\.txt|kilim-demo\.mp4|kilim-demo-poster\.webp|rug-(flat|fold|roll)\.webp|theme-[a-z]+\.webp)$/.test(name));
const allowed = new Set([...files, ...downloads.map(name => 'downloads/' + name), ...assets.map(name => 'assets/' + name)]);
await mkdir(output, { recursive: true });
for (const name of await readdir(output, { recursive: true, withFileTypes: true })) {
  const relative = path.relative(output, path.join(name.parentPath || name.path, name.name)).split(path.sep).join('/');
  if (name.isSymbolicLink() || (name.isFile() && !allowed.has(relative)) || (name.isDirectory() && !['assets', 'downloads'].includes(relative))) {
    throw new Error('Unexpected file in publish directory: ' + relative + '. Move it outside the publish folder and retry.');
  }
}
for (const file of allowed) {
  await mkdir(path.dirname(path.join(output, file)), { recursive: true });
  await cp(path.join(root, file), path.join(output, file));
}
console.log('Publish this directory: ' + output);
