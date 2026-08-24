import fs from 'node:fs';
import path from 'node:path';

const MAX_LINES = 300;
const ROOTS = [
  'app',
  'src',
  'scripts',
  'android/app/src/main/java',
  'ios/FocusBlocks',
];
const FILE_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.kt',
  '.mjs',
  '.swift',
  '.ts',
  '.tsx',
]);

function checkLines(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      checkLines(fullPath);
    } else if (FILE_EXTENSIONS.has(path.extname(file.name))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;

      if (lines > MAX_LINES) {
        throw new Error(
          `${fullPath} has ${lines} lines; the maximum is ${MAX_LINES}.`,
        );
      }
    }
  }
}

for (const root of ROOTS) {
  checkLines(root);
}

console.log(`All authored source files are within ${MAX_LINES} lines.`);
