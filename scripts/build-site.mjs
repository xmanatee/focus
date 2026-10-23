import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = join(root, 'site');
const output = join(root, 'dist/site');
const excluded = new Set(['package.json', 'package-lock.json', 'node_modules']);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of await readdir(source)) {
  if (!excluded.has(name))
    await cp(join(source, name), join(output, name), { recursive: true });
}
console.log('Built the static website in dist/site.');
