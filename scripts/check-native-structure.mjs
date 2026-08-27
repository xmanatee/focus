import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

function expectIncludes(content, value, label) {
  if (!content.includes(value)) {
    throw new Error(`${label} is missing "${value}".`);
  }
}

function expectExcludes(content, value, label) {
  if (content.includes(value)) {
    throw new Error(`${label} must not contain "${value}".`);
  }
}

function expectMatch(content, pattern, label) {
  const match = content.match(pattern);
  if (!match) {
    throw new Error(`${label} is missing.`);
  }
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

  expectEqual(packageJson.dependencies.expo, '~57.0.17', 'Expo SDK');
  expectEqual(
    packageJson.dependencies['react-native'],
    '0.86.3',
    'React Native',
  );
  expectEqual(packageJson.engines.node, '>=22.13.0', 'Node.js engine');
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
  const settings = read('android/settings.gradle');
  const build = read('android/app/build.gradle');
  const properties = read('android/gradle.properties');
  const wrapper = read('android/gradle/wrapper/gradle-wrapper.properties');
  const manifest = read('android/app/src/main/AndroidManifest.xml');
  const javaRoot = 'android/app/src/main/java/love/nemi/focus';
  const application = read(`${javaRoot}/MainApplication.kt`);
  const activity = read(`${javaRoot}/MainActivity.kt`);
  const blockerModule = read(`${javaRoot}/FocusAndroidBlockerModule.kt`);
  const authorizationSetup = read(`${javaRoot}/AuthorizationSetup.kt`);
  const styles = read('android/app/src/main/res/values/styles.xml');
  const lint = read('android/app/lint.xml');

  expectIncludes(settings, 'expo-autolinking-settings', 'Android settings');
  expectIncludes(
    settings,
    'expoAutolinking.useExpoModules()',
    'Android settings',
  );
  expectIncludes(wrapper, 'gradle-9.3.1-bin.zip', 'Gradle wrapper');
  expectIncludes(properties, 'newArchEnabled=true', 'Android properties');
  expectIncludes(properties, 'hermesEnabled=true', 'Android properties');
  expectExcludes(
    build,
    'release {\n            signingConfig',
    'Android release',
  );
  expectIncludes(
    application,
    'ExpoReactHostFactory.getDefaultReactHost',
    'MainApplication',
  );
  expectIncludes(
    application,
    'add(FocusAndroidBlockerPackage())',
    'MainApplication',
  );
  expectIncludes(
    activity,
    'SplashScreenManager.registerOnActivity(this)',
    'MainActivity',
  );
  expectIncludes(
    blockerModule,
    'fun getAuthorizationState() = authorizationState()',
    'FocusAndroidBlockerModule',
  );
  for (const requirement of [
    'ACTION_APPLICATION_DETAILS_SETTINGS',
    'ACTION_ACCESSIBILITY_SETTINGS',
    'getInstallSourceInfo',
    'PACKAGE_SOURCE_STORE',
  ]) {
    expectIncludes(blockerModule, requirement, 'FocusAndroidBlockerModule');
  }
  expectIncludes(
    authorizationSetup,
    'resolveAuthorizationSetupStep',
    'AuthorizationSetup',
  );
  expectIncludes(styles, 'parent="Theme.SplashScreen"', 'Android splash theme');
  expectIncludes(styles, '@drawable/splashscreen_logo', 'Android splash theme');

  expectIncludes(
    manifest,
    'android.permission.BIND_ACCESSIBILITY_SERVICE',
    'Android manifest',
  );
  expectIncludes(manifest, 'android:scheme="focusblocks"', 'Android manifest');
  for (const permission of ['POST_NOTIFICATIONS', 'QUERY_ALL_PACKAGES']) {
    expectExcludes(manifest, permission, 'Android manifest');
  }
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
  expectExcludes(lint, 'severity="ignore"', 'Android lint config');

  for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
    const asset = `android/app/src/main/res/drawable-${density}/splashscreen_logo.png`;
    if (!fs.existsSync(asset)) {
      throw new Error(`Android splash asset is missing: ${asset}.`);
    }
    const duplicate = `android/app/src/main/res/drawable-night-${density}/splashscreen_logo.png`;
    if (fs.existsSync(duplicate)) {
      throw new Error(
        `Duplicate Android night splash asset exists: ${duplicate}.`,
      );
    }
  }
}

function checkIos() {
  const appDelegate = read('ios/FocusBlocks/AppDelegate.swift');
  const info = read('ios/FocusBlocks/Info.plist');
  const storyboard = read('ios/FocusBlocks/SplashScreen.storyboard');
  const oldEntrypoints = [
    'ios/FocusBlocks/AppDelegate.h',
    'ios/FocusBlocks/AppDelegate.mm',
    'ios/FocusBlocks/main.m',
    'ios/FocusBlocks/noop-file.swift',
  ];

  expectIncludes(
    appDelegate,
    'class AppDelegate: ExpoAppDelegate',
    'AppDelegate',
  );
  expectIncludes(appDelegate, 'ExpoReactNativeFactory', 'AppDelegate');
  expectIncludes(
    info,
    '<key>RCTNewArchEnabled</key>\n\t<true/>',
    'iOS Info.plist',
  );
  expectIncludes(storyboard, '<imageView id="EXPO-SplashScreen"', 'iOS splash');
  expectIncludes(
    storyboard,
    '<color key="backgroundColor" name="SplashScreenBackground"/>',
    'iOS splash',
  );
  if (
    !fs.existsSync(
      'ios/FocusBlocks/Images.xcassets/SplashScreenLogo.imageset/Contents.json',
    )
  ) {
    throw new Error('iOS splash image set is missing.');
  }
  for (const path of oldEntrypoints) {
    if (fs.existsSync(path)) {
      throw new Error(`Legacy iOS entrypoint still exists: ${path}.`);
    }
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
