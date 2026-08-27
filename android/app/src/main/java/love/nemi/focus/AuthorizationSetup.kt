package love.nemi.focus

internal enum class AuthorizationSetupStep(val wireValue: String) {
  ACCESSIBILITY_SETTINGS("authorizationSettings"),
  RESTRICTED_SETTINGS("restrictedSettings"),
}

internal fun resolveAuthorizationSetupStep(
  restrictedSettingsRequired: Boolean,
  accessibilityEverEnabled: Boolean,
  appInfoOpened: Boolean,
): AuthorizationSetupStep =
  if (
    restrictedSettingsRequired &&
    !accessibilityEverEnabled &&
    !appInfoOpened
  ) {
    AuthorizationSetupStep.RESTRICTED_SETTINGS
  } else {
    AuthorizationSetupStep.ACCESSIBILITY_SETTINGS
  }
