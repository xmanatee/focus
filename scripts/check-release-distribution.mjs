import fs from 'node:fs';

const APK_NAME = 'focus-blocks-android.apk';
const RELEASE_BASE =
  'https://github.com/xmanatee/focus/releases/latest/download';
const APK_URL = `${RELEASE_BASE}/${APK_NAME}`;
const CHECKSUM_URL = `${APK_URL}.sha256`;

const read = (filePath) => fs.readFileSync(filePath, 'utf8');

function expectIncludes(content, value, label) {
  if (!content.includes(value)) {
    throw new Error(`${label} is missing "${value}".`);
  }
}

const eas = JSON.parse(read('eas.json'));
if (eas.cli.version !== '22.6.0') {
  throw new Error('EAS CLI must use the reviewed release version.');
}
if (eas.build.apk.distribution !== 'internal') {
  throw new Error('Android APK distribution must be internal.');
}
if (eas.build.apk.android.buildType !== 'apk') {
  throw new Error('Android APK profile must produce an APK.');
}
if (eas.build.apk.android.credentialsSource !== 'remote') {
  throw new Error('Android APK signing credentials must come from EAS.');
}
for (const profile of ['apk', 'production']) {
  if ('autoIncrement' in eas.build[profile].android) {
    throw new Error(`${profile} must use source-controlled Android versions.`);
  }
}

const releaseWorkflow = read('.github/workflows/release.yml');
for (const requirement of [
  'branches: [main]',
  'paths: [package.json]',
  'EAS_CLI_VERSION: 22.6.0',
  'PREVIOUS_SHA: ${{ github.event.before }}',
  'Determine release version',
  'Create release tag',
  '--profile apk',
  'apksigner',
  'actions/upload-artifact@v4',
  'gh release create',
  APK_NAME,
]) {
  expectIncludes(releaseWorkflow, requirement, 'Release workflow');
}

for (const removedEntryPoint of [
  'workflow_dispatch',
  'github.event.inputs',
  'GITHUB_REF_NAME',
  'Submit to Google Play',
]) {
  if (releaseWorkflow.includes(removedEntryPoint)) {
    throw new Error(`Release workflow still contains ${removedEntryPoint}.`);
  }
}

const landingPage = read('site/index.html');
expectIncludes(landingPage, APK_URL, 'Landing page');
expectIncludes(landingPage, CHECKSUM_URL, 'Landing page');

const supportPage = read('site/support/index.html');
expectIncludes(supportPage, APK_URL, 'Support page');
expectIncludes(supportPage, CHECKSUM_URL, 'Support page');

console.log('Android APK build, publication, and download links match.');
