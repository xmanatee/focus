package love.nemi.focus

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class FocusAndroidBlockerModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "FocusAndroidBlocker"

  override fun getConstants(): MutableMap<String, Any> =
    mutableMapOf("initialAuthorizationStatus" to authorizationStatus())

  @ReactMethod
  fun requestAuthorization(promise: Promise) {
    FocusBlockerStorage.prefs(reactContext)
      .edit()
      .putBoolean(AUTHORIZATION_REQUESTED_KEY, true)
      .apply()

    val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
    val activity = currentActivity
    if (activity != null) {
      activity.startActivity(intent)
    } else {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactContext.startActivity(intent)
    }
    promise.resolve(isAccessibilityEnabled())
  }

  @ReactMethod
  fun refreshAuthorizationStatus(promise: Promise) {
    promise.resolve(authorizationStatus())
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getSelectionSlotValue(slotId: String): String? =
    FocusBlockerStorage.prefs(reactContext)
      .getString(FocusBlockerStorage.slotKey(slotId), null)

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun setSelectionSlotValue(slotId: String, value: String): Boolean {
    val editor = FocusBlockerStorage.prefs(reactContext).edit()
    if (value.isEmpty()) {
      editor.remove(FocusBlockerStorage.slotKey(slotId))
    } else {
      editor.putString(FocusBlockerStorage.slotKey(slotId), value)
    }
    editor.apply()
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
    val enabled = Settings.Secure.getInt(
      reactContext.contentResolver,
      Settings.Secure.ACCESSIBILITY_ENABLED,
      0,
    ) == 1
    if (!enabled) return false

    val expected = ComponentName(
      reactContext,
      FocusAccessibilityService::class.java,
    ).flattenToString()
    val services = Settings.Secure.getString(
      reactContext.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
    ) ?: return false
    return services.split(':').any { it.equals(expected, ignoreCase = true) }
  }

  companion object {
    private const val AUTHORIZATION_REQUESTED_KEY = "authorizationRequested"
  }
}
