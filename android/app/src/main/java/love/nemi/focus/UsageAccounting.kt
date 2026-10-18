package love.nemi.focus

internal enum class UsageTransition {
  START,
  STOP,
  DEVICE_INACTIVE,
}

internal data class ForegroundUsageEvent(
  val timestamp: Long,
  val token: String,
  val transition: UsageTransition,
)

internal fun foregroundUsageMillis(
  events: List<ForegroundUsageEvent>,
  windowStart: Long,
  windowEnd: Long,
): Long {
  require(windowEnd >= windowStart) { "Usage window is invalid." }
  require(events.zipWithNext().all { (a, b) -> a.timestamp <= b.timestamp }) {
    "Usage events must be ordered."
  }

  val active = mutableSetOf<String>()
  var cursor = windowStart
  var total = 0L

  for (event in events) {
    if (event.timestamp > windowEnd) break
    if (event.timestamp >= windowStart) {
      if (active.isNotEmpty()) total += event.timestamp - cursor
      cursor = event.timestamp
    }
    when (event.transition) {
      UsageTransition.START -> active.add(event.token)
      UsageTransition.STOP -> active.remove(event.token)
      UsageTransition.DEVICE_INACTIVE -> active.clear()
    }
  }
  if (active.isNotEmpty()) total += windowEnd - cursor
  return total
}
