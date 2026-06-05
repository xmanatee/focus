import { spawn } from 'node:child_process';

const METADATA_UPLOAD_ERROR_PATTERNS = [
  /Store configuration upload encountered \d+ errors?\b/i,
  /\bFailed (creating|updating|deleting)\b/i,
];
const ANSI_ESCAPE_PATTERN = new RegExp(
  `${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`,
  'g',
);

function stripAnsi(value) {
  return value.replace(ANSI_ESCAPE_PATTERN, '');
}

export function metadataPushOutputHasUploadErrors(output) {
  const cleanOutput = stripAnsi(output);
  return METADATA_UPLOAD_ERROR_PATTERNS.some((pattern) =>
    pattern.test(cleanOutput),
  );
}

function runEasMetadataPush() {
  const command = 'npm';
  const args = [
    'exec',
    '--yes',
    '--package',
    'eas-cli',
    '--',
    'eas',
    'metadata:push',
    '--non-interactive',
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env: process.env });
    let output = '';

    child.stdout.on('data', (chunk) => {
      output += chunk;
      process.stdout.write(chunk);
    });

    child.stderr.on('data', (chunk) => {
      output += chunk;
      process.stderr.write(chunk);
    });

    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ code, output });
    });
  });
}

async function main() {
  const result = await runEasMetadataPush();

  if (result.code !== 0) {
    process.exit(result.code);
  }

  if (metadataPushOutputHasUploadErrors(result.output)) {
    console.error(
      'EAS metadata push reported App Store upload errors. Failing before build/submit so the release cannot hide partial metadata.',
    );
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
