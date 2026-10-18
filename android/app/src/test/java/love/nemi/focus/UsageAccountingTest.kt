package love.nemi.focus

import org.junit.Assert.assertEquals
import org.junit.Test

class UsageAccountingTest {
  @Test
  fun clipsAnOngoingSessionToTheRequestedWindow() {
    val events = listOf(
      usageEvent(0, "app/activity", UsageTransition.START),
      usageEvent(90_000, "app/activity", UsageTransition.STOP),
    )

    assertEquals(60_000L, foregroundUsageMillis(events, 30_000, 90_000))
  }

  @Test
  fun countsOverlappingSelectedAppsOnlyOnce() {
    val events = listOf(
      usageEvent(0, "one/activity", UsageTransition.START),
      usageEvent(30_000, "two/activity", UsageTransition.START),
      usageEvent(60_000, "one/activity", UsageTransition.STOP),
      usageEvent(90_000, "two/activity", UsageTransition.STOP),
    )

    assertEquals(90_000L, foregroundUsageMillis(events, 0, 120_000))
  }

  @Test
  fun screenOffEndsEveryForegroundSession() {
    val events = listOf(
      usageEvent(0, "app/activity", UsageTransition.START),
      usageEvent(45_000, "device", UsageTransition.DEVICE_INACTIVE),
    )

    assertEquals(45_000L, foregroundUsageMillis(events, 0, 120_000))
  }

  @Test
  fun keepsAnUnclosedSessionRunningUntilTheQueryEnd() {
    val events = listOf(
      usageEvent(15_000, "app/activity", UsageTransition.START),
    )

    assertEquals(45_000L, foregroundUsageMillis(events, 0, 60_000))
  }

  private fun usageEvent(
    timestamp: Long,
    token: String,
    transition: UsageTransition,
  ) = ForegroundUsageEvent(timestamp, token, transition)
}
