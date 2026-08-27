import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const STABLE_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function parseVersion(value) {
  const match = STABLE_VERSION.exec(value);
  if (!match) {
    throw new Error(`${value} is not a stable semantic version.`);
  }

  const parts = match.slice(1).map(Number);
  if (parts.some((part) => !Number.isSafeInteger(part))) {
    throw new Error(`${value} is not a stable semantic version.`);
  }
  return parts;
}

function compareVersions(current, previous) {
  for (let index = 0; index < current.length; index += 1) {
    if (current[index] !== previous[index]) {
      return current[index] > previous[index] ? 1 : -1;
    }
  }
  return 0;
}

export function createReleasePlan(current, previous) {
  for (const identity of [current, previous]) {
    for (const [label, value] of [
      ['iOS build number', identity.iosBuildNumber],
      ['Android version code', identity.androidVersionCode],
    ]) {
      if (!Number.isSafeInteger(value) || value <= 0) {
        throw new Error(`${label} must be a positive integer.`);
      }
    }
  }

  const comparison = compareVersions(
    parseVersion(current.version),
    parseVersion(previous.version),
  );
  if (comparison === 0) {
    if (
      current.iosBuildNumber !== previous.iosBuildNumber ||
      current.androidVersionCode !== previous.androidVersionCode
    ) {
      throw new Error(
        'Build numbers cannot change without the release version.',
      );
    }
    return { shouldRelease: false };
  }
  if (comparison < 0) {
    throw new Error(
      `Release version ${current.version} must be greater than ${previous.version}.`,
    );
  }

  for (const [label, currentBuild, previousBuild] of [
    ['iOS build number', current.iosBuildNumber, previous.iosBuildNumber],
    [
      'Android version code',
      current.androidVersionCode,
      previous.androidVersionCode,
    ],
  ]) {
    if (currentBuild <= previousBuild) {
      throw new Error(`${label} must be greater than ${previousBuild}.`);
    }
  }

  return {
    shouldRelease: true,
    releaseTag: `v${current.version}`,
  };
}

function readIdentity(packagePath, appPath) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const app = JSON.parse(fs.readFileSync(appPath, 'utf8')).expo;
  if (packageJson.version !== app.version) {
    throw new Error('package.json and app.json versions must match.');
  }

  return {
    version: packageJson.version,
    iosBuildNumber: Number(app.ios.buildNumber),
    androidVersionCode: app.android.versionCode,
  };
}

function main(args) {
  if (args.length !== 4) {
    throw new Error(
      'Usage: release-version.mjs <current-package> <current-app> <previous-package> <previous-app>',
    );
  }
  const plan = createReleasePlan(
    readIdentity(args[0], args[1]),
    readIdentity(args[2], args[3]),
  );
  console.log(`should_release=${plan.shouldRelease}`);
  console.log(`release_tag=${plan.shouldRelease ? plan.releaseTag : ''}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
