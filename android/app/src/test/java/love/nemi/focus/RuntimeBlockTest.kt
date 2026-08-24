package love.nemi.focus

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class RuntimeBlockTest {
  private val packageIds = setOf("com.example.app")

  @Test
  fun regularScheduleUsesStartInclusiveAndEndExclusiveBounds() {
    val block = block(start = "09:00", end = "17:00")

    assertFalse(block.isActiveAt(RuntimeDay.MON, 8 * 60 + 59))
    assertTrue(block.isActiveAt(RuntimeDay.MON, 9 * 60))
    assertTrue(block.isActiveAt(RuntimeDay.MON, 16 * 60 + 59))
    assertFalse(block.isActiveAt(RuntimeDay.MON, 17 * 60))
  }

  @Test
  fun overnightScheduleCarriesIntoTheFollowingDay() {
    val block = block(start = "22:00", end = "07:00")

    assertTrue(block.isActiveAt(RuntimeDay.MON, 22 * 60))
    assertTrue(block.isActiveAt(RuntimeDay.TUE, 6 * 60 + 59))
    assertFalse(block.isActiveAt(RuntimeDay.TUE, 7 * 60))
    assertFalse(block.isActiveAt(RuntimeDay.SUN, 23 * 60))
  }

  @Test
  fun allowScheduleBlocksOnlyOutsideTheWindow() {
    val block = block(
      start = "09:00",
      end = "17:00",
      ruleKind = RuntimeRuleKind.ALLOW_DURING_SCHEDULE,
    )

    assertTrue(block.isActiveAt(RuntimeDay.MON, 8 * 60))
    assertFalse(block.isActiveAt(RuntimeDay.MON, 12 * 60))
    assertTrue(block.isActiveAt(RuntimeDay.MON, 18 * 60))
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
      RuntimeRuleKind.fromWireValue("dailyBudget")
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
  ) = RuntimeBlock(
    id = "block-1",
    name = "Test",
    startTime = start,
    endTime = end,
    days = setOf(RuntimeDay.MON),
    ruleKind = ruleKind,
    selectedPackageIds = packageIds,
  )
}
