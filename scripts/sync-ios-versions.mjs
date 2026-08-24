import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import {
  patchDeviceMonitor,
  patchSharedSwift,
} from './native-source-patches.mjs';

const APP_CONFIG_PATH = 'app.json';
const PROJECT_PATH = 'ios/FocusBlocks.xcodeproj/project.pbxproj';
const MAIN_PLIST_PATH = 'ios/FocusBlocks/Info.plist';
const EXTENSION_PLIST_PATHS = [
  'targets/ActivityMonitorExtension/Info.plist',
  'targets/ShieldAction/Info.plist',
  'targets/ShieldConfiguration/Info.plist',
];
const UPSTREAM_DEVICE_MONITOR_PATH =
  'node_modules/react-native-device-activity/targets/ActivityMonitorExtension/DeviceActivityMonitorExtension.swift';
const TARGET_DEVICE_MONITOR_PATH =
  'targets/ActivityMonitorExtension/DeviceActivityMonitorExtension.swift';
const UPSTREAM_SHARED_SWIFT_PATH =
  'node_modules/react-native-device-activity/ios/Shared.swift';
const TARGET_SHARED_SWIFT_PATH = 'targets/Shared.swift';

function readPlistValue(path, key) {
  const value = readPlistValueIfPresent(path, key);
  if (value === null) {
    throw new Error(`${path} is missing ${key}.`);
  }
  return value;
}

function readPlistValueIfPresent(path, key) {
  const result = spawnSync('plutil', ['-extract', key, 'raw', path], {
    encoding: 'utf8',
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

function setPlistString(path, key, value) {
  if (readPlistValue(path, key) === value) {
    return;
  }

  execFileSync('plutil', ['-replace', key, '-string', value, path]);
}

function ensurePlistString(path, key, value) {
  if (!fs.existsSync(path)) {
    return;
  }
  if (readPlistValueIfPresent(path, key) === value) {
    return;
  }

  execFileSync('plutil', ['-replace', key, '-string', value, path]);
}

function syncPatchedSource(upstreamPath, targetPath, patch) {
  if (!fs.existsSync(upstreamPath)) {
    throw new Error(`Missing native dependency source: ${upstreamPath}`);
  }
  const output = patch(fs.readFileSync(upstreamPath, 'utf8'));
  fs.writeFileSync(upstreamPath, output);
  if (
    !fs.existsSync(targetPath) ||
    fs.readFileSync(targetPath, 'utf8') !== output
  ) {
    fs.writeFileSync(targetPath, output);
  }
}

const appConfig = JSON.parse(fs.readFileSync(APP_CONFIG_PATH, 'utf8'));
const version = appConfig.expo.version;
const buildNumber = appConfig.expo.ios.buildNumber;

if (typeof version !== 'string' || version.length === 0) {
  throw new Error('app.json expo.version must be a non-empty string.');
}

if (typeof buildNumber !== 'string' || buildNumber.length === 0) {
  throw new Error('app.json expo.ios.buildNumber must be a non-empty string.');
}

const project = fs.readFileSync(PROJECT_PATH, 'utf8');
const syncedProject = project
  .replaceAll(
    /CURRENT_PROJECT_VERSION = [^;]+;/g,
    `CURRENT_PROJECT_VERSION = ${buildNumber};`,
  )
  .replaceAll(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`);

if (syncedProject !== project) {
  fs.writeFileSync(PROJECT_PATH, syncedProject);
}

setPlistString(MAIN_PLIST_PATH, 'CFBundleShortVersionString', version);
setPlistString(MAIN_PLIST_PATH, 'CFBundleVersion', buildNumber);

for (const path of EXTENSION_PLIST_PATHS) {
  ensurePlistString(path, 'CFBundleShortVersionString', version);
  ensurePlistString(path, 'CFBundleVersion', buildNumber);
}

syncPatchedSource(
  UPSTREAM_DEVICE_MONITOR_PATH,
  TARGET_DEVICE_MONITOR_PATH,
  patchDeviceMonitor,
);
syncPatchedSource(
  UPSTREAM_SHARED_SWIFT_PATH,
  TARGET_SHARED_SWIFT_PATH,
  patchSharedSwift,
);

console.log(`Synced iOS native versions to ${version} (${buildNumber}).`);
