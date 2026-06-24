import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const APP_CONFIG_PATH = 'app.json';
const PROJECT_PATH = 'ios/FocusBlocks.xcodeproj/project.pbxproj';
const MAIN_PLIST_PATH = 'ios/FocusBlocks/Info.plist';
const DEVICE_MONITOR_PATHS = [
  'node_modules/react-native-device-activity/targets/ActivityMonitorExtension/DeviceActivityMonitorExtension.swift',
  'targets/ActivityMonitorExtension/DeviceActivityMonitorExtension.swift',
];
const SHARED_SWIFT_PATHS = [
  'node_modules/react-native-device-activity/ios/Shared.swift',
  'targets/ActivityMonitorExtension/Shared.swift',
  'targets/ShieldAction/Shared.swift',
  'targets/ShieldConfiguration/Shared.swift',
];

function readPlistValue(key) {
  return execFileSync('plutil', ['-extract', key, 'raw', MAIN_PLIST_PATH], {
    encoding: 'utf8',
  }).trim();
}

function setPlistString(key, value) {
  if (readPlistValue(key) === value) {
    return;
  }

  execFileSync('plutil', ['-replace', key, '-string', value, MAIN_PLIST_PATH]);
}

function patchFile(path, patch) {
  if (!fs.existsSync(path)) {
    return;
  }

  const input = fs.readFileSync(path, 'utf8');
  const output = patch(input);
  if (output === input) {
    return;
  }
  fs.writeFileSync(path, output);
}

function replaceRequired(input, search, replacement, label) {
  if (!input.includes(search)) {
    throw new Error(`Could not patch ${label}; expected source was not found.`);
  }
  return input.replace(search, replacement);
}

function replaceRequiredPattern(input, pattern, replacement, label) {
  if (!pattern.test(input)) {
    throw new Error(`Could not patch ${label}; expected source was not found.`);
  }
  return input.replace(pattern, replacement);
}

function patchDeviceMonitor(input) {
  let output = input;
  if (!output.includes('onlyIfTriggeredAfterConditionPasses(action: action)')) {
    output = replaceRequired(
      output,
      '        if let action = actionRaw as? [String: Any] {\n',
      '        if let action = actionRaw as? [String: Any] {\n          if !onlyIfTriggeredAfterConditionPasses(action: action) {\n            return\n          }\n\n',
      'DeviceActivityMonitorExtension action guard',
    );
  }

  return replaceRequiredPattern(
    output,
    / {4}logger\.log\("intervalDidStart"\)\n[\s\S]*? {4}notifyAppWithName\(name: "intervalDidStart"\)/,
    `    logger.log("intervalDidStart")

    persistToUserDefaults(
      activityName: activity.rawValue,
      callbackName: "intervalDidStart"
    )

    self.executeActionsForEvent(
      activityName: activity.rawValue,
      callbackName: "intervalDidStart",
      eventName: nil
    )

    notifyAppWithName(name: "intervalDidStart")`,
    'DeviceActivityMonitorExtension interval start order',
  );
}

const ONLY_IF_TRIGGERED_AFTER_HELPER = `func onlyIfTriggeredAfterConditionPasses(action: [String: Any]) -> Bool {
  guard let condition = action["onlyIfTriggeredAfter"] as? [String: Any] else {
    return true
  }
  guard
    let activityName = condition["activityName"] as? String,
    let callbackName = condition["callbackName"] as? String,
    let eventName = condition["eventName"] as? String,
    let afterActivityName = condition["afterActivityName"] as? String,
    let afterCallbackName = condition["afterCallbackName"] as? String
  else {
    return false
  }

  guard
    let triggeredAt = getLastTriggeredTimeFromUserDefaults(
      activityName: activityName,
      callbackName: callbackName,
      eventName: eventName
    )
  else {
    return false
  }

  let afterEventName = condition["afterEventName"] as? String
  let afterTriggeredAt =
    getLastTriggeredTimeFromUserDefaults(
      activityName: afterActivityName,
      callbackName: afterCallbackName,
      eventName: afterEventName
    ) ?? Date.distantPast.timeIntervalSince1970 * 1000

  return triggeredAt > afterTriggeredAt
}

`;

const ADD_WEB_CONTENT_FILTER_DOMAINS_ACTION = `  } else if type == "addWebContentFilterDomains" {
    if let domains = action["domains"] as? [String] {
      do {
        try addWebContentFilterDomains(
          rawDomains: domains,
          triggeredBy: triggeredBy
        )
      } catch {
        setWebContentFilterPolicyErrorMetadata(
          triggeredBy: triggeredBy,
          error: error,
          action: action
        )
        logger.error(
          "Failed to add web content filter domains in action pipeline: \\(error.localizedDescription, privacy: .public)"
        )
      }
    } else {
      setWebContentFilterPolicyErrorMetadata(
        triggeredBy: triggeredBy,
        error: WebContentFilterPolicyError.invalidStringArray(fieldName: "domains"),
        action: action
      )
      logger.error("addWebContentFilterDomains action is missing domains payload")
    }
`;

const ADD_WEB_CONTENT_FILTER_DOMAINS_HELPER = `func webContentFilterDomainsFromLastUpdateMetadata() -> [String] {
  guard
    let metadata = userDefaults?.dictionary(forKey: WEB_CONTENT_FILTER_POLICY_LAST_UPDATE_KEY),
    let domains = metadata["domains"] as? [String]
  else {
    return []
  }

  return domains
}

@available(iOS 15.0, *)
func addWebContentFilterDomains(
  rawDomains: [String],
  triggeredBy: String
) throws {
  if rawDomains.isEmpty {
    throw WebContentFilterPolicyError.missingRequiredDomains(fieldName: "domains")
  }

  let domains = try parseWebDomains(
    rawDomains: webContentFilterDomainsFromLastUpdateMetadata() + rawDomains,
    fieldName: "domains"
  )

  store.webContent.blockedByFilter = .specific(domains)
  clearWebContentFilterPolicyErrorMetadata()

  userDefaults?.set(
    [
      "triggeredBy": triggeredBy,
      "updatedAt": Date.now.ISO8601Format(),
      "type": "specific",
      "domains": sortedDomainStrings(domains: domains),
      "exceptDomains": []
    ],
    forKey: WEB_CONTENT_FILTER_POLICY_LAST_UPDATE_KEY
  )
}

`;

function patchWebContentFilterDomainAction(input) {
  let output = input;

  if (!output.includes('type == "addWebContentFilterDomains"')) {
    output = replaceRequired(
      output,
      '  } else if type == "clearWebContentFilterPolicy" {\n    clearWebContentFilterPolicy(triggeredBy: triggeredBy)\n',
      `  } else if type == "clearWebContentFilterPolicy" {\n    clearWebContentFilterPolicy(triggeredBy: triggeredBy)\n${ADD_WEB_CONTENT_FILTER_DOMAINS_ACTION}`,
      'Shared.swift addWebContentFilterDomains action',
    );
  }

  if (!output.includes('func addWebContentFilterDomains')) {
    output = replaceRequired(
      output,
      '@available(iOS 15.0, *)\nfunc clearWebContentFilterPolicy(\n',
      `${ADD_WEB_CONTENT_FILTER_DOMAINS_HELPER}@available(iOS 15.0, *)\nfunc clearWebContentFilterPolicy(\n`,
      'Shared.swift addWebContentFilterDomains helper',
    );
  }

  return output;
}

function patchSharedSwift(input) {
  let output = input;

  if (!output.includes('func onlyIfTriggeredAfterConditionPasses')) {
    output = replaceRequired(
      output,
      'func shouldExecuteAction(\n',
      `${ONLY_IF_TRIGGERED_AFTER_HELPER}func shouldExecuteAction(\n`,
      'Shared.swift onlyIfTriggeredAfter helper',
    );
  }

  return patchWebContentFilterDomainAction(output);
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

setPlistString('CFBundleShortVersionString', version);
setPlistString('CFBundleVersion', buildNumber);

for (const path of DEVICE_MONITOR_PATHS) patchFile(path, patchDeviceMonitor);
for (const path of SHARED_SWIFT_PATHS) patchFile(path, patchSharedSwift);

console.log(`Synced iOS native versions to ${version} (${buildNumber}).`);
