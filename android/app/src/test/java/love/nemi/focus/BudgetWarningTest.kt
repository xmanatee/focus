package love.nemi.focus

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class BudgetWarningTest {
  @Test
  fun warnsOnlyWhileTheLastFiveMinutesOfALargerBudgetRemain() {
    assertNull(budgetWarningRemainingMinutes(null, 0))
    assertNull(budgetWarningRemainingMinutes(5, 1))
    assertNull(budgetWarningRemainingMinutes(30, 24))
    assertEquals(5, budgetWarningRemainingMinutes(30, 25))
    assertEquals(1, budgetWarningRemainingMinutes(30, 29))
    assertNull(budgetWarningRemainingMinutes(30, 30))
  }
}
