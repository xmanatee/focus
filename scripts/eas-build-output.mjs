import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const PLATFORMS = new Set(['ANDROID', 'IOS']);
const ANDROID_ARTIFACT_EXTENSIONS = new Set(['.aab', '.apk']);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function extractFinishedBuild(builds, expectedPlatform) {
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

  return build;
}

export function extractBuildId(builds, expectedPlatform) {
  return extractFinishedBuild(builds, expectedPlatform).id;
}

export function extractArtifactUrl(
  builds,
  expectedPlatform,
  expectedExtension,
) {
  if (!ANDROID_ARTIFACT_EXTENSIONS.has(expectedExtension)) {
    throw new Error(`Unsupported Android artifact: ${expectedExtension}`);
  }
  const build = extractFinishedBuild(builds, expectedPlatform);
  const artifactUrl = build.artifacts?.applicationArchiveUrl;
  if (typeof artifactUrl !== 'string' || artifactUrl.length === 0) {
    throw new Error('EAS artifact URL is missing.');
  }

  const url = new URL(artifactUrl);
  if (url.protocol !== 'https:' || !url.pathname.endsWith(expectedExtension)) {
    throw new Error(`EAS artifact must be an HTTPS ${expectedExtension} URL.`);
  }

  return url.href;
}

function main([command, filePath, expectedValue, expectedExtension]) {
  if (command === 'build-id' && filePath && expectedValue) {
    console.log(extractBuildId(readJson(filePath), expectedValue));
    return;
  }
  if (
    command === 'artifact-url' &&
    filePath &&
    expectedValue &&
    expectedExtension
  ) {
    console.log(
      extractArtifactUrl(readJson(filePath), expectedValue, expectedExtension),
    );
    return;
  }
  throw new Error(
    'Usage: eas-build-output.mjs <build-id|artifact-url> <json-file> <platform> [extension]',
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
