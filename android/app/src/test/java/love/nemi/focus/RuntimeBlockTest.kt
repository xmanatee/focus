package love.nemi.focus

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Calendar
import java.util.TimeZone

class RuntimeBlockTest {
  private val packageIds = setOf("com.example.app")

  @Test
  fun regularScheduleUsesStartInclusiveAndEndExclusiveBounds() {
    val block = block(start = "09:00", end = "17:00")

    assertFalse(block.isBlockingAt(RuntimeDay.MON, 8 * 60 + 59, 0))
    assertTrue(block.isBlockingAt(RuntimeDay.MON, 9 * 60, 0))
    assertTrue(block.isBlockingAt(RuntimeDay.MON, 16 * 60 + 59, 0))
    assertFalse(block.isBlockingAt(RuntimeDay.MON, 17 * 60, 0))
  }

  @Test
  fun overnightScheduleCarriesIntoTheFollowingDay() {
    val block = block(start = "22:00", end = "07:00")

    assertTrue(block.isBlockingAt(RuntimeDay.MON, 22 * 60, 0))
    assertTrue(block.isBlockingAt(RuntimeDay.TUE, 6 * 60 + 59, 0))
    assertFalse(block.isBlockingAt(RuntimeDay.TUE, 7 * 60, 0))
    assertFalse(block.isBlockingAt(RuntimeDay.SUN, 23 * 60, 0))
  }

  @Test
  fun allowScheduleBlocksOnlyOutsideTheWindow() {
    val block = block(
      start = "09:00",
      end = "17:00",
      ruleKind = RuntimeRuleKind.ALLOW_DURING_SCHEDULE,
    )

    assertTrue(block.isBlockingAt(RuntimeDay.MON, 8 * 60, 0))
    assertFalse(block.isBlockingAt(RuntimeDay.MON, 12 * 60, 0))
    assertTrue(block.isBlockingAt(RuntimeDay.MON, 18 * 60, 0))
  }

  @Test
  fun dailyBudgetBlocksOnlyOnSelectedDaysAfterTheLimit() {
    val block = block(
      start = "09:00",
      end = "17:00",
      ruleKind = RuntimeRuleKind.DAILY_BUDGET,
      budgetMinutes = 30,
    )

    assertFalse(block.isBlockingAt(RuntimeDay.MON, 12 * 60, 29))
    assertTrue(block.isBlockingAt(RuntimeDay.MON, 12 * 60, 30))
    assertFalse(block.isBlockingAt(RuntimeDay.TUE, 12 * 60, 60))
  }

  @Test
  fun combinedRuleBlocksOutsideTheWindowAndAfterBudgetInsideIt() {
    val block = block(
      start = "09:00",
      end = "17:00",
      ruleKind = RuntimeRuleKind.ALLOW_DURING_SCHEDULE_WITH_BUDGET,
      budgetMinutes = 30,
    )

    assertTrue(block.isBlockingAt(RuntimeDay.MON, 8 * 60, 0))
    assertFalse(block.isBlockingAt(RuntimeDay.MON, 12 * 60, 29))
    assertTrue(block.isBlockingAt(RuntimeDay.MON, 12 * 60, 30))
  }

  @Test
  fun overnightCombinedBudgetStartsAtTheOriginDayScheduleBoundary() {
    val block = block(
      start = "22:00",
      end = "07:00",
      ruleKind = RuntimeRuleKind.ALLOW_DURING_SCHEDULE_WITH_BUDGET,
      budgetMinutes = 30,
    )
    val now = calendar(2026, Calendar.APRIL, 28, 1, 0)

    assertEquals(
      calendar(2026, Calendar.APRIL, 27, 22, 0).timeInMillis,
      block.budgetWindowStart(now),
    )
  }

  @Test
  fun combinedBudgetHasNoUsageWindowOutsideItsSchedule() {
    val block = block(
      start = "09:00",
      end = "17:00",
      ruleKind = RuntimeRuleKind.ALLOW_DURING_SCHEDULE_WITH_BUDGET,
      budgetMinutes = 30,
    )

    assertEquals(null, block.budgetWindowStart(calendar(2026, Calendar.APRIL, 27, 18, 0)))
  }

  @Test
  fun guardRunsAtTheNextMinuteBoundary() {
    assertEquals(60_000L, millisUntilNextMinute(120_000L))
    assertEquals(1L, millisUntilNextMinute(179_999L))
  }

  @Test
  fun blockedPresentationOwnsForegroundOnlyWhileLaunchingOrVisible() {
    val state = BlockedPresentationState()

    assertFalse(state.ownsForeground)
    state.markLaunchRequested()
    assertTrue(state.ownsForeground)
    state.markVisible()
    assertTrue(state.ownsForeground)
    state.markHidden()
    assertFalse(state.ownsForeground)
  }

  @Test
  fun runtimePlanRejectsInvalidTimeBeforePersistence() {
    assertThrows(IllegalArgumentException::class.java) {
      block(start = "24:00", end = "17:00")
    }
  }

  @Test
  fun runtimePlanRejectsUnsupportedDaysBeforePersistence() {
    assertThrows(IllegalArgumentException::class.java) {
      RuntimeDay.fromWireValue("monday")
    }
  }

  @Test
  fun runtimePlanRejectsUnsupportedRulesBeforePersistence() {
    assertThrows(IllegalArgumentException::class.java) {
      RuntimeRuleKind.fromWireValue("timeLimit")
    }
  }

  @Test
  fun runtimePlanRejectsDuplicateBlockIdsBeforePersistence() {
    val block = block(start = "09:00", end = "17:00")

    assertThrows(IllegalArgumentException::class.java) {
      validateUniqueBlockIds(listOf(block, block))
    }
  }

  private fun block(
    start: String,
    end: String,
    ruleKind: RuntimeRuleKind = RuntimeRuleKind.BLOCK_DURING_SCHEDULE,
    budgetMinutes: Int? = null,
  ) = RuntimeBlock(
    id = "block-1",
    name = "Test",
    startTime = start,
    endTime = end,
    days = setOf(RuntimeDay.MON),
    ruleKind = ruleKind,
    budgetMinutes = budgetMinutes,
    selectedPackageIds = packageIds,
    webDomains = emptySet(),
  )

  private fun calendar(
    year: Int,
    month: Int,
    day: Int,
    hour: Int,
    minute: Int,
  ): Calendar = Calendar.getInstance(TimeZone.getTimeZone("Europe/London")).apply {
    clear()
    set(year, month, day, hour, minute)
  }
}
