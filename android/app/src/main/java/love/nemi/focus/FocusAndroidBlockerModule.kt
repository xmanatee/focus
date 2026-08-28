package love.nemi.focus

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageInstaller
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import androidx.core.content.edit
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = FocusAndroidBlockerModule.NAME)
class FocusAndroidBlockerModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName() = NAME

  override fun getConstants(): MutableMap<String, Any> =
    mutableMapOf("initialAuthorizationState" to authorizationState())

  @ReactMethod
  fun requestAuthorization(promise: Promise) {
    val prefs = FocusBlockerStorage.prefs(reactContext)
    val step = currentAuthorizationSetupStep()
    val intent = when (step) {
      AuthorizationSetupStep.RESTRICTED_SETTINGS -> {
        Intent(
          Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
          Uri.fromParts("package", reactContext.packageName, null),
        )
      }
      AuthorizationSetupStep.ACCESSIBILITY_SETTINGS -> {
        Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
      }
    }

    if (intent.resolveActivity(reactContext.packageManager) == null) {
      promise.reject(
        "E_SETTINGS_UNAVAILABLE",
        "Android could not open the required system settings page.",
      )
      return
    }
    when (step) {
      AuthorizationSetupStep.RESTRICTED_SETTINGS ->
        prefs.edit { putBoolean(APP_INFO_OPENED_KEY, true) }
      AuthorizationSetupStep.ACCESSIBILITY_SETTINGS -> {
        val accessibilityEverEnabled = prefs.getBoolean(
          ACCESSIBILITY_EVER_ENABLED_KEY,
          false,
        )
        prefs.edit {
          putBoolean(AUTHORIZATION_REQUESTED_KEY, true)
          if (!accessibilityEverEnabled) remove(APP_INFO_OPENED_KEY)
        }
      }
    }
    val activity = reactContext.currentActivity
    if (activity != null) {
      activity.startActivity(intent)
    } else {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactContext.startActivity(intent)
    }
    promise.resolve(authorizationState())
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getAuthorizationState() = authorizationState()

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getSelectionSlotValue(slotId: String): String? =
    FocusBlockerStorage.prefs(reactContext)
      .getString(FocusBlockerStorage.slotKey(slotId), null)

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun setSelectionSlotValue(slotId: String, value: String): Boolean {
    FocusBlockerStorage.prefs(reactContext).edit {
      if (value.isEmpty()) {
        remove(FocusBlockerStorage.slotKey(slotId))
      } else {
        putString(FocusBlockerStorage.slotKey(slotId), value)
      }
    }
    return true
  }

  @ReactMethod
  fun listSelectableApplications(promise: Promise) {
    val packageManager = reactContext.packageManager
    val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    val protectedPackages = reactContext.protectedBlockingPackageIds()
    val seenPackages = mutableSetOf<String>()
    val apps = packageManager
      .queryIntentActivities(intent, 0)
      .mapNotNull { info ->
        val packageName = info.activityInfo.packageName
        if (
          !isPackageBlockable(packageName, protectedPackages) ||
          !seenPackages.add(packageName)
        ) {
          return@mapNotNull null
        }
        val label = info.loadLabel(packageManager).toString().trim()
        val app = Arguments.createMap()
        app.putString("id", packageName)
        app.putString("name", if (label.isEmpty()) packageName else label)
        app
      }
      .sortedBy { it.getString("name") }

    val result = Arguments.createArray()
    for (app in apps) result.pushMap(app)
    promise.resolve(result)
  }

  @ReactMethod
  fun reconcileRuntimeBlocks(payload: String, promise: Promise) {
    FocusBlockerStorage.saveRuntimePlan(reactContext, payload)
    promise.resolve(null)
  }

  private fun authorizationState() = Arguments.createMap().apply {
    val prefs = FocusBlockerStorage.prefs(reactContext)
    val accessibilityEnabled = isAccessibilityEnabled()
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
      accessibilityEnabled -> "authorized"
      prefs.getBoolean(AUTHORIZATION_REQUESTED_KEY, false) -> "denied"
      else -> "notDetermined"
    }
    val setupStep = resolveAuthorizationSetupStep(
      restrictedSettingsRequired = restrictedSettingsRequired(),
      accessibilityEverEnabled = accessibilityEverEnabled,
      appInfoOpened = prefs.getBoolean(APP_INFO_OPENED_KEY, false),
    )
    putString("status", status)
    putString("setupStep", setupStep.wireValue)
  }

  private fun currentAuthorizationSetupStep(): AuthorizationSetupStep {
    val prefs = FocusBlockerStorage.prefs(reactContext)
    return resolveAuthorizationSetupStep(
      restrictedSettingsRequired = restrictedSettingsRequired(),
      accessibilityEverEnabled = isAccessibilityEnabled() || prefs.getBoolean(
        ACCESSIBILITY_EVER_ENABLED_KEY,
        false,
      ),
      appInfoOpened = prefs.getBoolean(APP_INFO_OPENED_KEY, false),
    )
  }

  private fun restrictedSettingsRequired(): Boolean =
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      reactContext.packageManager
        .getInstallSourceInfo(reactContext.packageName)
        .packageSource != PackageInstaller.PACKAGE_SOURCE_STORE

  private fun isAccessibilityEnabled(): Boolean {
    val expected = ComponentName(reactContext, FocusAccessibilityService::class.java)
    val manager = reactContext.getSystemService(AccessibilityManager::class.java)
    return manager
      .getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
      .any { service ->
        val info = service.resolveInfo.serviceInfo
        ComponentName(info.packageName, info.name) == expected
      }
  }

  companion object {
    const val NAME = "FocusAndroidBlocker"
    private const val ACCESSIBILITY_EVER_ENABLED_KEY = "accessibilityEverEnabled"
    private const val APP_INFO_OPENED_KEY = "appInfoOpened"
    private const val AUTHORIZATION_REQUESTED_KEY = "authorizationRequested"
  }
}
