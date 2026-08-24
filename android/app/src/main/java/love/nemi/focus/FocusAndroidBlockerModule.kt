package love.nemi.focus

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.ComponentName
import android.content.Intent
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
    mutableMapOf("initialAuthorizationStatus" to authorizationStatus())

  @ReactMethod
  fun requestAuthorization(promise: Promise) {
    FocusBlockerStorage.prefs(reactContext).edit {
      putBoolean(AUTHORIZATION_REQUESTED_KEY, true)
    }

    val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
    val activity = reactContext.currentActivity
    if (activity != null) {
      activity.startActivity(intent)
    } else {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactContext.startActivity(intent)
    }
    promise.resolve(isAccessibilityEnabled())
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getAuthorizationStatus(): String = authorizationStatus()

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
    val ownPackage = reactContext.packageName
    val seenPackages = mutableSetOf<String>()
    val apps = packageManager
      .queryIntentActivities(intent, 0)
      .mapNotNull { info ->
        val packageName = info.activityInfo.packageName
        if (packageName == ownPackage || !seenPackages.add(packageName)) {
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

  private fun authorizationStatus(): String {
    if (isAccessibilityEnabled()) return "authorized"
    val requested = FocusBlockerStorage.prefs(reactContext)
      .getBoolean(AUTHORIZATION_REQUESTED_KEY, false)
    return if (requested) "denied" else "notDetermined"
  }

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
    private const val AUTHORIZATION_REQUESTED_KEY = "authorizationRequested"
  }
}
