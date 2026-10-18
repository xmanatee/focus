package love.nemi.focus

import android.Manifest
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.core.content.edit

internal fun budgetWarningRemainingMinutes(limit: Int?, used: Int): Int? =
  if (limit != null && limit > 5 && used in (limit - 5) until limit) limit - used
  else null

internal fun Context.notifyBudgetWarning(
  block: RuntimeBlock,
  windowStart: Long,
  remaining: Int,
) {
  val notificationManager = NotificationManagerCompat.from(this)
  if (!notificationManager.areNotificationsEnabled()) return
  if (
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
    ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
    PackageManager.PERMISSION_GRANTED
  ) return
  val key = "budgetWarning.${block.id}"
  val prefs = FocusBlockerStorage.prefs(this)
  if (prefs.getLong(key, Long.MIN_VALUE) == windowStart) return

  ensureScheduleNotificationChannel()
  val openApp = PendingIntent.getActivity(
    this, 0, Intent(this, MainActivity::class.java),
    PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
  )
  val notification = NotificationCompat.Builder(this, SCHEDULE_NOTIFICATION_CHANNEL_ID)
    .setSmallIcon(R.drawable.notification_icon)
    .setContentTitle(getString(R.string.budget_warning_title))
    .setContentText(
      resources.getQuantityString(R.plurals.budget_warning_message, remaining, block.name, remaining),
    )
    .setContentIntent(openApp)
    .setAutoCancel(true)
    .build()
  notificationManager.notify("budget.${block.id}", 0, notification)
  prefs.edit { putLong(key, windowStart) }
}
