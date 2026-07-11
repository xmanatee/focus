package love.nemi.focus

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import java.util.Calendar

class FocusAccessibilityService : AccessibilityService() {
  private val handler = Handler(Looper.getMainLooper())
  private var lastForegroundPackage: String? = null
  private var lastBlockedPackage: String? = null
  private var lastBlockedAtMillis: Long = 0

  private val guard = object : Runnable {
    override fun run() {
      lastForegroundPackage?.let(::blockIfNeeded)
      handler.postDelayed(this, GUARD_INTERVAL_MS)
    }
  }

  override fun onServiceConnected() {
    super.onServiceConnected()
    handler.post(guard)
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null || !event.isForegroundWindowEvent()) return
    val packageName = event.packageName?.toString() ?: return
    lastForegroundPackage = packageName
    blockIfNeeded(packageName)
  }

  override fun onInterrupt() = Unit

  override fun onDestroy() {
    handler.removeCallbacks(guard)
    super.onDestroy()
  }

  private fun blockIfNeeded(packageName: String) {
    if (packageName == applicationContext.packageName) return
    val block = FocusBlockerStorage.blockingBlockForPackage(
      this,
      packageName,
      Calendar.getInstance(),
    ) ?: return

    val now = System.currentTimeMillis()
    if (
      packageName == lastBlockedPackage &&
      now - lastBlockedAtMillis < BLOCK_LAUNCH_THROTTLE_MS
    ) {
      return
    }
    lastBlockedPackage = packageName
    lastBlockedAtMillis = now

    performGlobalAction(GLOBAL_ACTION_HOME)
    val intent = Intent(this, BlockedActivity::class.java)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
      .putExtra(BlockedActivity.EXTRA_BLOCK_NAME, block.name)
    startActivity(intent)
  }

  companion object {
    private const val GUARD_INTERVAL_MS = 15_000L
    private const val BLOCK_LAUNCH_THROTTLE_MS = 2_000L
  }
}

private fun AccessibilityEvent.isForegroundWindowEvent(): Boolean =
  eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED ||
    eventType == AccessibilityEvent.TYPE_WINDOWS_CHANGED
