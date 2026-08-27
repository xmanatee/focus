import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PLATFORMS = new Set(['ANDROID', 'IOS']);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function extractBuildId(builds, expectedPlatform) {
  if (!PLATFORMS.has(expectedPlatform)) {
    throw new Error(`Unsupported EAS platform: ${expectedPlatform}`);
  }
  if (!Array.isArray(builds) || builds.length !== 1) {
    throw new Error('EAS build output must contain exactly one build.');
  }

  const [build] = builds;
  if (build === null || typeof build !== 'object') {
    throw new Error('EAS build output is invalid.');
  }
  if (build.platform !== expectedPlatform) {
    throw new Error(`EAS build platform must be ${expectedPlatform}.`);
  }
  if (build.status !== 'FINISHED') {
    throw new Error('EAS build did not finish successfully.');
  }
  if (typeof build.id !== 'string' || build.id.length === 0) {
    throw new Error('EAS build ID is missing.');
  }

  return build.id;
}

export function extractArtifactPath(download, expectedExtension) {
  if (download === null || typeof download !== 'object') {
    throw new Error('EAS download output is invalid.');
  }
  if (typeof download.path !== 'string' || download.path.length === 0) {
    throw new Error('EAS artifact path is missing.');
  }
  if (path.extname(download.path) !== expectedExtension) {
    throw new Error(`EAS artifact must be a ${expectedExtension} file.`);
  }

  return download.path;
}

function main([command, filePath, expectedValue]) {
  if (command === 'build-id' && filePath && expectedValue) {
    console.log(extractBuildId(readJson(filePath), expectedValue));
    return;
  }
  if (command === 'artifact-path' && filePath && expectedValue) {
    console.log(extractArtifactPath(readJson(filePath), expectedValue));
    return;
  }
  throw new Error(
    'Usage: eas-build-output.mjs <build-id|artifact-path> <json-file> <expected-value>',
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
