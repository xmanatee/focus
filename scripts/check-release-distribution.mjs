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
const cliVersion = releaseWorkflow.match(
  /^\s+EAS_CLI_VERSION:\s*(\S+)\s*$/m,
)?.[1];
if (cliVersion !== eas.cli.version) {
  throw new Error(
    'Release workflow and EAS profiles must use the same CLI version.',
  );
}

const landingPage = read('site/index.html');
expectIncludes(landingPage, APK_URL, 'Landing page');
expectIncludes(landingPage, CHECKSUM_URL, 'Landing page');
expectIncludes(landingPage, 'Allow restricted settings', 'Landing page');
expectIncludes(landingPage, 'Play Protect may block', 'Landing page');
expectIncludes(landingPage, 'Do not disable Play Protect', 'Landing page');

const supportPage = read('site/support/index.html');
expectIncludes(supportPage, APK_URL, 'Support page');
expectIncludes(supportPage, CHECKSUM_URL, 'Support page');
expectIncludes(supportPage, 'Allow restricted settings', 'Support page');
expectIncludes(supportPage, 'Background autostart', 'Support page');
expectIncludes(
  supportPage,
  'Play Protect automatically blocks',
  'Support page',
);
expectIncludes(supportPage, 'Do not disable Play Protect', 'Support page');

console.log('Android release artifacts and installation guidance match.');
