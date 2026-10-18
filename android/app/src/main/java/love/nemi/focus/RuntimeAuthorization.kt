package love.nemi.focus

import android.app.AppOpsManager
import android.content.Context
import android.net.VpnService
import android.os.Process

internal enum class RuntimeAuthorizationStatus(val wireValue: String) {
  AUTHORIZED("authorized"),
  DENIED("denied"),
  NOT_DETERMINED("notDetermined"),
}

internal enum class RuntimeAccessKind(val wireValue: String) {
  DAILY_BUDGETS("dailyBudgets"),
  WEBSITE_BLOCKING("websiteBlocking");

  companion object {
    fun fromWireValue(value: String): RuntimeAccessKind =
      entries.firstOrNull { it.wireValue == value }
        ?: throw IllegalArgumentException("Unsupported runtime access: $value")
  }
}

internal fun resolveRuntimeAuthorizationStatus(
  granted: Boolean,
  requested: Boolean,
): RuntimeAuthorizationStatus = when {
  granted -> RuntimeAuthorizationStatus.AUTHORIZED
  requested -> RuntimeAuthorizationStatus.DENIED
  else -> RuntimeAuthorizationStatus.NOT_DETERMINED
}

internal fun Context.hasUsageAccess(): Boolean {
  val appOps = getSystemService(AppOpsManager::class.java)
  return appOps.checkOpNoThrow(
    AppOpsManager.OPSTR_GET_USAGE_STATS,
    Process.myUid(),
    packageName,
  ) == AppOpsManager.MODE_ALLOWED
}

internal fun Context.hasWebsiteBlockingAccess(): Boolean =
  VpnService.prepare(this) == null
