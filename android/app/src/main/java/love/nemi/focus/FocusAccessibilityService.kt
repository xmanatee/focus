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
  private val protectedPackages by lazy { protectedBlockingPackageIds() }

  private val guard = object : Runnable {
    override fun run() {
      lastForegroundPackage?.let(::blockIfNeeded)
      handler.postDelayed(this, millisUntilNextMinute())
    }
  }

  override fun onServiceConnected() {
    super.onServiceConnected()
    handler.removeCallbacks(guard)
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
    if (!isPackageBlockable(packageName, protectedPackages)) return
    val block = FocusBlockerStorage.blockingBlockForPackage(
      this,
      packageName,
      Calendar.getInstance(),
    ) ?: return

    if (BlockedActivity.ownsForeground) return
    BlockedActivity.markLaunchRequested()

    val intent = Intent(this, BlockedActivity::class.java)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
      .putExtra(BlockedActivity.EXTRA_BLOCK_NAME, block.name)
    startActivity(intent)
  }
}

internal fun millisUntilNextMinute(nowMillis: Long = System.currentTimeMillis()): Long =
  60_000L - nowMillis % 60_000L

private fun AccessibilityEvent.isForegroundWindowEvent(): Boolean =
  eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED ||
    eventType == AccessibilityEvent.TYPE_WINDOWS_CHANGED
