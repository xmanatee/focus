import fs from 'node:fs';
import path from 'node:path';

const MAX_LINES = 300;
const IGNORED_DIRS = ['node_modules', '.expo', 'dist', 'ios', 'android'];
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function checkLines(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!IGNORED_DIRS.includes(file)) {
        checkLines(fullPath);
      }
    } else if (FILE_EXTENSIONS.includes(path.extname(file))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;

      if (lines > MAX_LINES) {
        console.error(
          `❌ Error: File ${fullPath} is too long (${lines} lines). Max allowed is ${MAX_LINES}.`,
        );
        process.exit(1);
      }
    }
  }
}

console.log('🔍 Checking file length limits...');
checkLines('./src');
console.log('✅ All files are within the 300-line limit.');
