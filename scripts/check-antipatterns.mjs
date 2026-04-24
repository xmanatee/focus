import fs from 'node:fs';
import path from 'node:path';

const SCAN_ROOTS = ['./app', './src', './convex'];
const IGNORED_DIRS = new Set([
  'node_modules',
  '.expo',
  'dist',
  'ios',
  'android',
  '_generated',
]);
const FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

const rules = [
  {
    id: 'no-root-navigation-state',
    pattern: /\buseRootNavigationState\b/,
    message:
      'useRootNavigationState creates render-time chicken-and-egg deadlocks: ' +
      "the navigator's state only becomes defined after it mounts, so gating " +
      'rendering on it prevents the state from ever becoming defined. ' +
      'router.replace inside useEffect is already safe — no gate needed.',
  },
  {
    id: 'no-double-cast',
    pattern: /\bas\s+unknown\s+as\b/,
    message:
      '`as unknown as T` bypasses the type system. Fix the real signature or ' +
      'use a typed adapter. Banned by CODING_STANDARDS.md #3 ("No any").',
  },
  {
    id: 'no-any-cast',
    pattern: /\bas\s+any\b/,
    message: '`as any` is banned by CODING_STANDARDS.md #3 ("No any").',
  },
  {
    id: 'no-relative-router-path',
    pattern: /router\.(push|replace|navigate)\(\s*['"`]\.\.?\//,
    message:
      'Expo Router paths must be absolute. Relative paths like "../select-apps" ' +
      'are fragile across route group nesting. Use "/select-apps" instead.',
  },
  {
    id: 'no-legacy-store-path',
    pattern: /from\s+['"][^'"]*src\/store\/useBlockerStore['"]/,
    message:
      'useBlockerStore moved to src/features/blocker/useBlockerStore. ' +
      'Update the import to the feature-based path.',
  },
  {
    id: 'no-initialization-error-state',
    pattern: /\binitializationError\b/,
    message:
      'initializationError was a swallowed-error anti-pattern. Let initialize() ' +
      'throw; the "Grant Permissions" flow is the real recovery path.',
  },
];

const violations = [];

function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        scan(fullPath);
      }
      continue;
    }

    if (!FILE_EXTENSIONS.has(path.extname(entry.name))) {
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');

    for (const rule of rules) {
      lines.forEach((line, index) => {
        if (rule.pattern.test(line)) {
          violations.push({
            file: fullPath,
            line: index + 1,
            text: line.trim(),
            rule,
          });
        }
      });
    }
  }
}

console.log('🔍 Checking for banned anti-patterns...');

for (const root of SCAN_ROOTS) {
  if (fs.existsSync(root)) {
    scan(root);
  }
}

if (violations.length > 0) {
  for (const { file, line, text, rule } of violations) {
    console.error(`\n❌ ${rule.id} — ${file}:${line}`);
    console.error(`   ${text}`);
    console.error(`   ${rule.message}`);
  }
  console.error(
    `\n${violations.length} anti-pattern violation(s) found. Fix them or justify in AGENTS.md before committing.`,
  );
  process.exit(1);
}

console.log('✅ No banned anti-patterns found.');
