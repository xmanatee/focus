package love.nemi.focus

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import android.net.Uri
import android.provider.Settings
import androidx.core.content.edit
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import java.util.Calendar

@ReactModule(name = FocusAndroidBlockerModule.NAME)
class FocusAndroidBlockerModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  private var pendingRuntimePromise: Promise? = null
  private var pendingRuntimeRequestCode: Int? = null
  private val usageTracker by lazy { AndroidUsageTracker(reactContext) }
  private val authorizationStore by lazy {
    FocusAuthorizationState(reactContext)
  }

  private val activityListener = object : BaseActivityEventListener() {
    override fun onActivityResult(
      activity: Activity,
      requestCode: Int,
      resultCode: Int,
      data: Intent?,
    ) {
      if (requestCode != pendingRuntimeRequestCode) return
      try {
        FocusVpnController.reconcile(reactContext)
        pendingRuntimePromise?.resolve(accessState())
      } catch (error: Exception) {
        pendingRuntimePromise?.reject("E_RUNTIME_ACCESS", error.message, error)
      } finally {
        pendingRuntimePromise = null
        pendingRuntimeRequestCode = null
      }
    }
  }

  init {
    reactContext.addActivityEventListener(activityListener)
  }

  override fun getName() = NAME

  override fun invalidate() {
    reactContext.removeActivityEventListener(activityListener)
    pendingRuntimePromise?.reject("E_MODULE_CLOSED", "Blocking access request was interrupted.")
    pendingRuntimePromise = null
    pendingRuntimeRequestCode = null
    super.invalidate()
  }

  override fun getConstants(): MutableMap<String, Any> =
    mutableMapOf(
      "initialAccessState" to accessState(),
      "scheduleNotificationChannelId" to SCHEDULE_NOTIFICATION_CHANNEL_ID,
    )

  @ReactMethod
  fun requestAuthorization(promise: Promise) {
    val step = authorizationStore.currentSetupStep()
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
        authorizationStore.markAppInfoOpened()
      AuthorizationSetupStep.ACCESSIBILITY_SETTINGS ->
        authorizationStore.markAccessibilityRequested()
    }
    val activity = reactContext.currentActivity
    try {
      if (activity != null) {
        activity.startActivity(intent)
      } else {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactContext.startActivity(intent)
      }
      promise.resolve(authorizationState())
    } catch (error: Exception) {
      promise.reject("E_SETTINGS_UNAVAILABLE", error.message, error)
    }
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getAccessState() = accessState()

  @ReactMethod
  fun requestRuntimeAuthorization(kindValue: String, promise: Promise) {
    if (pendingRuntimePromise != null) {
      promise.reject(
        "E_ACCESS_REQUEST_ACTIVE",
        "Another Android access request is already active.",
      )
      return
    }
    val kind = try {
      RuntimeAccessKind.fromWireValue(kindValue)
    } catch (error: IllegalArgumentException) {
      promise.reject("E_ACCESS_KIND", error.message, error)
      return
    }
    val intent = when (kind) {
      RuntimeAccessKind.DAILY_BUDGETS ->
        Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
          data = Uri.fromParts("package", reactContext.packageName, null)
        }
      RuntimeAccessKind.WEBSITE_BLOCKING -> VpnService.prepare(reactContext)
    }
    if (intent == null) {
      promise.resolve(accessState())
      return
    }
    val activity = reactContext.currentActivity
    if (activity == null) {
      promise.reject(
        "E_ACTIVITY_UNAVAILABLE",
        "Android cannot request access without an active screen.",
      )
      return
    }
    if (intent.resolveActivity(reactContext.packageManager) == null) {
      promise.reject(
        "E_SETTINGS_UNAVAILABLE",
        "Android could not open the required system settings page.",
      )
      return
    }

    val requestCode = when (kind) {
      RuntimeAccessKind.DAILY_BUDGETS -> USAGE_ACCESS_REQUEST_CODE
      RuntimeAccessKind.WEBSITE_BLOCKING -> VPN_ACCESS_REQUEST_CODE
    }
    FocusBlockerStorage.prefs(reactContext).edit {
      putBoolean(runtimeAccessRequestedKey(kind), true)
    }
    pendingRuntimePromise = promise
    pendingRuntimeRequestCode = requestCode
    try {
      activity.startActivityForResult(intent, requestCode)
    } catch (error: Exception) {
      pendingRuntimePromise = null
      pendingRuntimeRequestCode = null
      promise.reject("E_SETTINGS_UNAVAILABLE", error.message, error)
    }
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getSelectionSlotValue(slotId: String): String? =
    FocusBlockerStorage.prefs(reactContext)
      .getString(FocusBlockerStorage.slotKey(slotId), null)

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun isBudgetThresholdReached(activityName: String): Boolean =
    FocusBlockerStorage.budgetThresholdReached(
      reactContext,
      activityName,
      Calendar.getInstance(),
      usageTracker,
    )

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
    try {
      promise.resolve(querySelectableApplications(reactContext))
    } catch (error: Exception) {
      promise.reject(
        "E_APPLICATION_QUERY",
        "Android could not read the installed app list.",
        error,
      )
    }
  }

  @ReactMethod
  fun reconcileRuntimeBlocks(payload: String, promise: Promise) {
    try {
      FocusBlockerStorage.saveRuntimePlan(reactContext, payload)
      reactContext.ensureScheduleNotificationChannel()
      FocusVpnController.reconcile(reactContext)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject(
        "E_RUNTIME_PLAN",
        "Android could not apply the blocking plan.",
        error,
      )
    }
  }

  private fun accessState() = Arguments.createMap().apply {
    putMap("authorization", authorizationState())
    putMap("runtimeAccess", Arguments.createMap().apply {
      putString(
        RuntimeAccessKind.DAILY_BUDGETS.wireValue,
        runtimeAuthorizationStatus(RuntimeAccessKind.DAILY_BUDGETS).wireValue,
      )
      putString(
        RuntimeAccessKind.WEBSITE_BLOCKING.wireValue,
        runtimeAuthorizationStatus(RuntimeAccessKind.WEBSITE_BLOCKING).wireValue,
      )
    })
  }

  private fun runtimeAuthorizationStatus(
    kind: RuntimeAccessKind,
  ): RuntimeAuthorizationStatus {
    val granted = when (kind) {
      RuntimeAccessKind.DAILY_BUDGETS -> reactContext.hasUsageAccess()
      RuntimeAccessKind.WEBSITE_BLOCKING ->
        reactContext.hasWebsiteBlockingAccess()
    }
    val requested = FocusBlockerStorage.prefs(reactContext)
      .getBoolean(runtimeAccessRequestedKey(kind), false)
    return resolveRuntimeAuthorizationStatus(granted, requested)
  }

  private fun runtimeAccessRequestedKey(kind: RuntimeAccessKind): String =
    "runtimeAccessRequested.${kind.wireValue}"

  private fun authorizationState() = Arguments.createMap().apply {
    val current = authorizationStore.current()
    putString("status", current.status.wireValue)
    putString("setupStep", current.setupStep.wireValue)
  }

  companion object {
    const val NAME = "FocusAndroidBlocker"
    private const val USAGE_ACCESS_REQUEST_CODE = 6_201
    private const val VPN_ACCESS_REQUEST_CODE = 6_202
  }
}
