package love.nemi.focus

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.ComponentName
import android.content.Context
import android.view.accessibility.AccessibilityManager
import androidx.core.content.edit

internal enum class BlockerAuthorizationStatus(val wireValue: String) {
  AUTHORIZED("authorized"),
  DENIED("denied"),
  NOT_DETERMINED("notDetermined"),
}

internal data class BlockerAuthorizationState(
  val status: BlockerAuthorizationStatus,
  val setupStep: AuthorizationSetupStep,
)

internal class FocusAuthorizationState(private val context: Context) {
  fun current(): BlockerAuthorizationState {
    val prefs = FocusBlockerStorage.prefs(context)
    val accessibilityEnabled = context.isFocusAccessibilityEnabled()
    val wasAccessibilityEverEnabled = prefs.getBoolean(
      ACCESSIBILITY_EVER_ENABLED_KEY,
      false,
    )
    val accessibilityEverEnabled = accessibilityEnabled ||
      wasAccessibilityEverEnabled
    if (accessibilityEnabled && !wasAccessibilityEverEnabled) {
      prefs.edit {
        putBoolean(ACCESSIBILITY_EVER_ENABLED_KEY, true)
        remove(APP_INFO_OPENED_KEY)
      }
    }

    val status = when {
      accessibilityEnabled -> BlockerAuthorizationStatus.AUTHORIZED
      prefs.getBoolean(AUTHORIZATION_REQUESTED_KEY, false) ->
        BlockerAuthorizationStatus.DENIED
      else -> BlockerAuthorizationStatus.NOT_DETERMINED
    }
    return BlockerAuthorizationState(
      status = status,
      setupStep = resolveSetupStep(accessibilityEverEnabled),
    )
  }

  fun currentSetupStep(): AuthorizationSetupStep {
    val prefs = FocusBlockerStorage.prefs(context)
    return resolveSetupStep(
      context.isFocusAccessibilityEnabled() || prefs.getBoolean(
        ACCESSIBILITY_EVER_ENABLED_KEY,
        false,
      ),
    )
  }

  fun markAppInfoOpened() {
    FocusBlockerStorage.prefs(context).edit {
      putBoolean(APP_INFO_OPENED_KEY, true)
    }
  }

  fun markAccessibilityRequested() {
    val prefs = FocusBlockerStorage.prefs(context)
    val accessibilityEverEnabled = prefs.getBoolean(
      ACCESSIBILITY_EVER_ENABLED_KEY,
      false,
    )
    prefs.edit {
      putBoolean(AUTHORIZATION_REQUESTED_KEY, true)
      if (!accessibilityEverEnabled) remove(APP_INFO_OPENED_KEY)
    }
  }

  private fun resolveSetupStep(
    accessibilityEverEnabled: Boolean,
  ): AuthorizationSetupStep {
    val prefs = FocusBlockerStorage.prefs(context)
    return resolveAuthorizationSetupStep(
      restrictedSettingsRequired = context.restrictedSettingsRequired(),
      accessibilityEverEnabled = accessibilityEverEnabled,
      appInfoOpened = prefs.getBoolean(APP_INFO_OPENED_KEY, false),
    )
  }

  private companion object {
    const val ACCESSIBILITY_EVER_ENABLED_KEY = "accessibilityEverEnabled"
    const val APP_INFO_OPENED_KEY = "appInfoOpened"
    const val AUTHORIZATION_REQUESTED_KEY = "authorizationRequested"
  }
}

private fun Context.isFocusAccessibilityEnabled(): Boolean {
  val expected = ComponentName(this, FocusAccessibilityService::class.java)
  val manager = getSystemService(AccessibilityManager::class.java)
  return manager
    .getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
    .any { service ->
      val info = service.resolveInfo.serviceInfo
      ComponentName(info.packageName, info.name) == expected
    }
}
