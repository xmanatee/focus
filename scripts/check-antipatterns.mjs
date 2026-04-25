import fs from 'node:fs';
import path from 'node:path';

const SCAN_ROOTS = ['./app', './src'];
const IGNORED_DIRS = new Set([
  'node_modules',
  '.expo',
  'dist',
  'ios',
  'android',
]);
const FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

const rules = [
  {
    id: 'no-root-navigation-state',
    pattern: /\buseRootNavigationState\b/,
    message:
      'useRootNavigationState creates render-time chicken-and-egg deadlocks. ' +
      'router.replace inside useEffect is already safe.',
  },
  {
    id: 'no-double-cast',
    pattern: /\bas\s+unknown\s+as\b/,
    message:
      '`as unknown as T` bypasses the type system. Fix the real signature.',
  },
  {
    id: 'no-any-cast',
    pattern: /\bas\s+any\b/,
    message: '`as any` bypasses type safety. Fix the type instead.',
  },
  {
    id: 'no-relative-router-path',
    pattern: /router\.(push|replace|navigate)\(\s*['"`]\.\.?\//,
    message:
      'Expo Router paths must be absolute. Use "/select-apps" not "../select-apps".',
  },
  {
    id: 'no-console-in-runtime',
    pattern: /\bconsole\.(log|warn|error|info|debug)\s*\(/,
    message:
      'No console.* in runtime code. Errors surface via useAsyncAction; ' +
      'unhandled rejections in non-critical paths are intentional.',
    exceptions: new Set(['scripts/']),
  },
  {
    id: 'no-bare-haptics',
    pattern: /\bHaptics\.\w+/,
    message:
      'Call haptics through the `haptic` vocabulary in src/shared/design/haptics.ts. ' +
      'Never touch expo-haptics directly in app/src.',
    exceptions: new Set(['src/shared/design/haptics.ts']),
  },
  {
    id: 'no-bare-symbolview',
    pattern: /\bSymbolView\b/,
    message:
      'Use the <Icon /> wrapper from src/shared/components/Icon.tsx. ' +
      'Never use SymbolView directly outside the wrapper.',
    exceptions: new Set(['src/shared/components/Icon.tsx']),
  },
  {
    id: 'no-swallow-catch',
    pattern: /\.catch\s*\(\s*\(\s*\)\s*=>\s*\{?\s*\}?\s*\)/,
    message:
      'Empty .catch(() => {}) silently swallows errors. ' +
      'Either let it throw (void promise) or handle explicitly via useAsyncAction.',
  },
  {
    id: 'no-catch-console',
    pattern: /\.catch\s*\(\s*console\.(log|warn|error)\b/,
    message:
      '.catch(console.error) is a swallow pattern. ' +
      'Use useAsyncAction for user-facing errors; fire-and-forget (`void promise`) otherwise.',
  },
  {
    id: 'no-empty-catch',
    pattern: /catch\s*(?:\([^)]*\))?\s*\{\s*\}/,
    message: 'Empty catch block silently swallows errors.',
  },
  {
    id: 'no-keyboard-avoiding-view',
    pattern: /\bKeyboardAvoidingView\b/,
    message:
      'KeyboardAvoidingView fights iOS formSheet keyboardLayoutGuide and freezes ' +
      'the JS thread on TextInput focus. All form screens here use formSheet ' +
      'presentation, which adjusts for the keyboard natively. Use ' +
      'keyboardShouldPersistTaps + keyboardDismissMode on the ScrollView instead.',
  },
  {
    id: 'no-bare-router-back',
    pattern: /\brouter\.back\s*\(/,
    message:
      'Use useDismiss() from src/shared/hooks/useDismiss.ts. Bare router.back() ' +
      'warns "GO_BACK was not handled" when the stack is empty (deep link, or a ' +
      'second pop racing with state-driven dismissal). useDismiss guards with ' +
      'canGoBack().',
    exceptions: new Set(['src/shared/hooks/useDismiss.ts']),
  },
];

const violations = [];

function fileAllowedForRule(fullPath, rule) {
  if (!rule.exceptions) {
    return true;
  }
  const normalized = fullPath.replace(/^\.\//, '');
  for (const prefix of rule.exceptions) {
    if (normalized.startsWith(prefix) || normalized === prefix) {
      return false;
    }
  }
  return true;
}

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
      if (!fileAllowedForRule(fullPath, rule)) {
        continue;
      }
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

console.log('Checking for banned anti-patterns...');

for (const root of SCAN_ROOTS) {
  if (fs.existsSync(root)) {
    scan(root);
  }
}

if (violations.length > 0) {
  for (const { file, line, text, rule } of violations) {
    console.error(`\nX ${rule.id} -- ${file}:${line}`);
    console.error(`   ${text}`);
    console.error(`   ${rule.message}`);
  }
  console.error(
    `\n${violations.length} anti-pattern violation(s) found. Fix them before committing.`,
  );
  process.exit(1);
}

console.log('OK: No banned anti-patterns found.');
