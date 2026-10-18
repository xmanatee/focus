package love.nemi.focus

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build

internal const val SCHEDULE_NOTIFICATION_CHANNEL_ID = "focus_schedule"
internal const val DNS_NOTIFICATION_CHANNEL_ID = "focus_dns_blocking"

internal fun Context.ensureScheduleNotificationChannel() {
  if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
  getSystemService(NotificationManager::class.java).createNotificationChannel(
    NotificationChannel(
      SCHEDULE_NOTIFICATION_CHANNEL_ID,
      getString(R.string.schedule_notification_channel),
      NotificationManager.IMPORTANCE_DEFAULT,
    ),
  )
}

internal fun Context.ensureDnsNotificationChannel() {
  if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
  getSystemService(NotificationManager::class.java).createNotificationChannel(
    NotificationChannel(
      DNS_NOTIFICATION_CHANNEL_ID,
      getString(R.string.dns_notification_channel),
      NotificationManager.IMPORTANCE_LOW,
    ),
  )
}
