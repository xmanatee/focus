package love.nemi.focus

import android.content.Context
import android.content.pm.PackageInstaller
import android.os.Build

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

internal fun Context.restrictedSettingsRequired(): Boolean =
  Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
    packageManager.getInstallSourceInfo(packageName).packageSource !=
    PackageInstaller.PACKAGE_SOURCE_STORE
