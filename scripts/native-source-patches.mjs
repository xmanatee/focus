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
  guard
    let afterTriggeredAt = getLastTriggeredTimeFromUserDefaults(
      activityName: afterActivityName,
      callbackName: afterCallbackName,
      eventName: afterEventName
    )
  else {
    return false
  }

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

export function patchDeviceMonitor(input) {
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

export function patchSharedSwift(input) {
  let output = input;

  output = output.replace(
    / {4}\/\/ [tT]odo: replace with general string\n/g,
    '',
  );
  output = output.replaceAll(
    'logger.log("encode error \\\\(error.localizedDescription, privacy: .public)")',
    'logger.log("encode error \\(error.localizedDescription, privacy: .public)")',
  );
  if (!output.includes('logger.log("encode error')) {
    output = replaceRequired(
      output,
      '  } catch {\n    return ""\n  }\n}\n\n@available(iOS 15.0, *)\nfunc enableBlockAllMode',
      '  } catch {\n    logger.log("encode error \\(error.localizedDescription, privacy: .public)")\n    return ""\n  }\n}\n\n@available(iOS 15.0, *)\nfunc enableBlockAllMode',
      'Shared.swift FamilyActivitySelection encode error logging',
    );
  }

  if (output.includes('func onlyIfTriggeredAfterConditionPasses')) {
    output = replaceRequiredPattern(
      output,
      /func onlyIfTriggeredAfterConditionPasses\(action: \[String: Any\]\) -> Bool \{[\s\S]*?\n\}\n\nfunc shouldExecuteAction\(/,
      `${ONLY_IF_TRIGGERED_AFTER_HELPER}func shouldExecuteAction(`,
      'Shared.swift onlyIfTriggeredAfter helper',
    );
  } else {
    output = replaceRequired(
      output,
      'func shouldExecuteAction(\n',
      `${ONLY_IF_TRIGGERED_AFTER_HELPER}func shouldExecuteAction(\n`,
      'Shared.swift onlyIfTriggeredAfter helper',
    );
  }

  return patchWebContentFilterDomainAction(output);
}
