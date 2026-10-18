import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

function expectIncludes(content, value, label) {
  if (!content.includes(value)) {
    throw new Error(`${label} is missing "${value}".`);
  }
}

function expectMatch(content, pattern, label) {
  const match = content.match(pattern);
  if (!match) throw new Error(`${label} is missing.`);
  return match[1];
}

function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} is "${actual}", expected "${expected}".`);
  }
}

function plistString(content, key, label) {
  return expectMatch(
    content,
    new RegExp(`<key>${key}</key>\\s*<string>([^<]+)</string>`),
    `${label} ${key}`,
  );
}

function checkVersioning() {
  const appConfig = JSON.parse(read('app.json')).expo;
  const packageJson = JSON.parse(read('package.json'));
  const androidBuild = read('android/app/build.gradle');
  const iosProject = read('ios/FocusBlocks.xcodeproj/project.pbxproj');
  const iosInfo = read('ios/FocusBlocks/Info.plist');

  expectEqual(packageJson.version, appConfig.version, 'Package version');
  expectEqual(
    expectMatch(
      androidBuild,
      /versionName\s*=\s*"([^"]+)"/,
      'Android versionName',
    ),
    appConfig.version,
    'Android versionName',
  );
  expectEqual(
    Number(
      expectMatch(
        androidBuild,
        /versionCode\s*=\s*(\d+)/,
        'Android versionCode',
      ),
    ),
    appConfig.android.versionCode,
    'Android versionCode',
  );
  expectEqual(
    expectMatch(
      androidBuild,
      /applicationId\s*=\s*'([^']+)'/,
      'Android application ID',
    ),
    appConfig.android.package,
    'Android application ID',
  );
  expectEqual(
    plistString(iosInfo, 'CFBundleShortVersionString', 'iOS Info.plist'),
    appConfig.version,
    'iOS version',
  );
  expectEqual(
    plistString(iosInfo, 'CFBundleVersion', 'iOS Info.plist'),
    appConfig.ios.buildNumber,
    'iOS build number',
  );

  for (const value of iosProject.matchAll(/MARKETING_VERSION = ([^;]+);/g)) {
    expectEqual(value[1], appConfig.version, 'Xcode marketing version');
  }
  for (const value of iosProject.matchAll(
    /CURRENT_PROJECT_VERSION = ([^;]+);/g,
  )) {
    expectEqual(value[1], appConfig.ios.buildNumber, 'Xcode build number');
  }
  expectIncludes(
    iosProject,
    `PRODUCT_BUNDLE_IDENTIFIER = ${appConfig.ios.bundleIdentifier};`,
    'Xcode project',
  );
}

function checkAndroid() {
  const build = read('android/app/build.gradle');
  const manifest = read('android/app/src/main/AndroidManifest.xml');
  const lint = read('android/app/lint.xml');

  if (/release\s*\{[^}]*signingConfig\s+signingConfigs\.debug/s.test(build)) {
    throw new Error('Android release must not use the debug signing key.');
  }

  expectIncludes(
    manifest,
    'android.permission.BIND_ACCESSIBILITY_SERVICE',
    'Android manifest',
  );
  expectIncludes(manifest, 'android:scheme="focusblocks"', 'Android manifest');
  if (manifest.includes('QUERY_ALL_PACKAGES')) {
    throw new Error(
      'Android must not request access to all installed packages.',
    );
  }
  for (const permission of [
    'ACCESS_NETWORK_STATE',
    'FOREGROUND_SERVICE_SPECIAL_USE',
    'PACKAGE_USAGE_STATS',
    'POST_NOTIFICATIONS',
    'RECEIVE_BOOT_COMPLETED',
  ]) {
    expectIncludes(manifest, permission, 'Android manifest');
  }
  for (const component of [
    'FocusAccessibilityService',
    'FocusDnsVpnService',
    'FocusRuntimeReceiver',
  ]) {
    expectIncludes(manifest, component, 'Android manifest');
  }
  expectIncludes(
    manifest,
    'android.permission.BIND_VPN_SERVICE',
    'Android manifest',
  );
  for (const permission of [
    'READ_EXTERNAL_STORAGE',
    'WRITE_EXTERNAL_STORAGE',
  ]) {
    expectIncludes(
      manifest,
      `android.permission.${permission}" tools:ignore="ScopedStorage" tools:node="remove"`,
      'Android manifest',
    );
  }
  expectIncludes(
    lint,
    'regexp="react_native_dev_server_(ip|port)"',
    'Android lint config',
  );
  if (lint.includes('severity="ignore"')) {
    throw new Error('Android lint issues must not be globally ignored.');
  }

  for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
    const asset = `android/app/src/main/res/drawable-${density}/splashscreen_logo.png`;
    if (!fs.existsSync(asset)) {
      throw new Error(`Android splash asset is missing: ${asset}.`);
    }
  }
}

function checkIos() {
  if (
    !fs.existsSync(
      'ios/FocusBlocks/Images.xcassets/SplashScreenLogo.imageset/Contents.json',
    )
  ) {
    throw new Error('iOS splash image set is missing.');
  }
  for (const target of [
    'ActivityMonitorExtension',
    'ShieldAction',
    'ShieldConfiguration',
  ]) {
    const path = `targets/${target}/Shared.swift`;
    if (!fs.lstatSync(path).isSymbolicLink()) {
      throw new Error(`${path} must link to the canonical Shared.swift.`);
    }
    expectEqual(fs.readlinkSync(path), '../Shared.swift', `${path} symlink`);
  }
}

function checkReleaseAssets() {
  const eas = JSON.parse(read('eas.json'));
  expectEqual(
    eas.build.production.android.buildType,
    'app-bundle',
    'Android production build type',
  );
  for (const path of [
    'play-store/accessibility-declaration.md',
    'play-store/data-safety.md',
    'play-store/en-US/full-description.txt',
    'site/privacy/index.html',
    'site/support/index.html',
    'styles.d.ts',
  ]) {
    if (!fs.existsSync(path)) {
      throw new Error(`Required release asset is missing: ${path}.`);
    }
  }
  expectIncludes(
    read('styles.d.ts'),
    "declare module '*.css';",
    'CSS module declaration',
  );
}

checkVersioning();
checkAndroid();
checkIos();
checkReleaseAssets();

console.log('Native projects and release assets match the application config.');
