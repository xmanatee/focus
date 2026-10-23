import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const site = join(root, 'site');
const pages = readdirSync(site, { recursive: true }).filter((path) =>
  path.endsWith('.html'),
);
for (const page of pages) {
  const source = readFileSync(join(site, page), 'utf8');
  assert(source.includes('<title>'), `Missing title: ${page}`);
  for (const [, reference] of source.matchAll(
    /(?:href|src)=["']([^"']+)["']/g,
  )) {
    const url = new URL(reference, `https://focus.nemi.love/${page}`);
    if (url.origin !== 'https://focus.nemi.love') continue;
    const target = resolve(site, `.${decodeURIComponent(url.pathname)}`);
    assert(
      target.startsWith(`${site}/`) || target === site,
      `Escaping link: ${reference}`,
    );
    assert(existsSync(target), `Broken ${reference} in ${page}`);
    const file = statSync(target).isDirectory()
      ? join(target, 'index.html')
      : target;
    assert(existsSync(file), `Missing page: ${reference}`);
    if (url.hash && file.endsWith('.html')) {
      const id = decodeURIComponent(url.hash.slice(1));
      assert(
        readFileSync(file, 'utf8').includes(`id="${id}"`),
        `Missing anchor ${reference} in ${page}`,
      );
    }
  }
}
process.chdir(root);
await import('./check-release-distribution.mjs');
console.log(`Validated ${pages.length} website pages and their local links.`);
