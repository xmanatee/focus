package love.nemi.focus

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context

internal class AndroidUsageTracker(context: Context) {
  private val manager = context.getSystemService(UsageStatsManager::class.java)

  fun usedMinutes(
    packageIds: Set<String>,
    windowStart: Long,
    windowEnd: Long,
  ): Int {
    val events = mutableListOf<ForegroundUsageEvent>()
    val bootstrapStart = windowStart - BOOTSTRAP_WINDOW_MILLIS
    val stream = manager.queryEvents(bootstrapStart, windowEnd)
    val event = UsageEvents.Event()
    while (stream.hasNextEvent()) {
      stream.getNextEvent(event)
      val transition = transitionFor(event.eventType) ?: continue
      if (
        transition != UsageTransition.DEVICE_INACTIVE &&
        event.packageName !in packageIds
      ) {
        continue
      }
      events.add(
        ForegroundUsageEvent(
          timestamp = event.timeStamp,
          token = eventToken(event),
          transition = transition,
        ),
      )
    }
    return (foregroundUsageMillis(events, windowStart, windowEnd) / 60_000L)
      .toInt()
  }

  private fun eventToken(event: UsageEvents.Event): String {
    return "${event.packageName}/${event.className.orEmpty()}"
  }

  private fun transitionFor(eventType: Int): UsageTransition? = when (eventType) {
    UsageEvents.Event.ACTIVITY_RESUMED -> UsageTransition.START
    UsageEvents.Event.ACTIVITY_PAUSED,
    UsageEvents.Event.ACTIVITY_STOPPED,
    -> UsageTransition.STOP
    UsageEvents.Event.SCREEN_NON_INTERACTIVE,
    UsageEvents.Event.DEVICE_SHUTDOWN,
    -> UsageTransition.DEVICE_INACTIVE
    else -> null
  }

  companion object {
    private const val BOOTSTRAP_WINDOW_MILLIS = 24 * 60 * 60 * 1_000L
  }
}
