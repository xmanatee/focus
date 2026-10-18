package love.nemi.focus

import android.content.Context
import androidx.core.content.edit
import java.util.Calendar

private const val PREFS_NAME = "FocusAndroidBlocker"
private const val RUNTIME_PLAN_KEY = "runtimePlan"
private const val BUDGET_ACTIVITY_PREFIX = "focusblocks.budget."

internal object FocusBlockerStorage {
  fun prefs(context: Context) =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun slotKey(slotId: String) = "slot.$slotId"

  fun saveRuntimePlan(context: Context, payload: String) {
    val blocks = runtimeBlocksFromPayload(payload)
    prefs(context).edit {
      putString(RUNTIME_PLAN_KEY, payload)
      val warningKeys = blocks.map { "budgetWarning.${it.id}" }.toSet()
      prefs(context).all.keys
        .filter { it.startsWith("budgetWarning.") && it !in warningKeys }
        .forEach(::remove)
    }
  }

  fun blockingBlockForPackage(
    context: Context,
    packageName: String,
    calendar: Calendar,
    usageTracker: AndroidUsageTracker,
  ): RuntimeBlock? {
    val day = dayFromCalendar(calendar)
    val minute = calendar.get(Calendar.HOUR_OF_DAY) * 60 +
      calendar.get(Calendar.MINUTE)
    return runtimeBlocksWithAccess(context).firstOrNull { block ->
      if (!block.selectedPackageIds.contains(packageName)) {
        return@firstOrNull false
      }
      block.isBlockingAt(day, minute, usedBudgetMinutes(block, calendar, usageTracker))
    }
  }

  fun blockedDomainsAt(
    context: Context,
    calendar: Calendar,
    usageTracker: AndroidUsageTracker,
  ): Set<String> {
    val day = dayFromCalendar(calendar)
    val minute = calendar.get(Calendar.HOUR_OF_DAY) * 60 +
      calendar.get(Calendar.MINUTE)
    return runtimeBlocksWithAccess(context).flatMapTo(mutableSetOf()) { block ->
      if (block.isBlockingAt(day, minute, usedBudgetMinutes(block, calendar, usageTracker))) {
        block.webDomains
      } else {
        emptySet()
      }
    }
  }

  fun hasWebsiteRules(context: Context): Boolean =
    runtimeBlocksWithAccess(context).any { it.webDomains.isNotEmpty() }

  fun notifyBudgetWarnings(
    context: Context,
    calendar: Calendar,
    usageTracker: AndroidUsageTracker,
  ) {
    if (!context.hasUsageAccess()) return
    for (block in runtimeBlocksWithAccess(context)) {
      val windowStart = block.budgetWindowStart(calendar) ?: continue
      val used = usageTracker.usedMinutes(
        block.selectedPackageIds, windowStart, calendar.timeInMillis,
      )
      val remaining = budgetWarningRemainingMinutes(block.budgetMinutes, used) ?: continue
      context.notifyBudgetWarning(block, windowStart, remaining)
    }
  }

  fun budgetThresholdReached(
    context: Context,
    activityName: String,
    calendar: Calendar,
    usageTracker: AndroidUsageTracker,
  ): Boolean {
    if (!activityName.startsWith(BUDGET_ACTIVITY_PREFIX)) return false
    val identity = activityName.removePrefix(BUDGET_ACTIVITY_PREFIX)
    val daySeparator = identity.lastIndexOf('.')
    if (daySeparator <= 0 || daySeparator == identity.lastIndex) return false
    val blockId = identity.substring(0, daySeparator)
    val dayValue = identity.substring(daySeparator + 1)
    val originDay = RuntimeDay.entries.firstOrNull { it.wireValue == dayValue }
      ?: return false
    val block = runtimeBlocksWithAccess(context).firstOrNull { it.id == blockId }
      ?: return false
    val windowStart = block.budgetWindowStart(calendar) ?: return false
    val windowCalendar = (calendar.clone() as Calendar).apply {
      timeInMillis = windowStart
    }
    if (dayFromCalendar(windowCalendar) != originDay || !context.hasUsageAccess()) {
      return false
    }
    return usageTracker.usedMinutes(
      block.selectedPackageIds,
      windowStart,
      calendar.timeInMillis,
    ) >= requireNotNull(block.budgetMinutes)
  }

  private fun runtimeBlocks(context: Context): List<RuntimeBlock> {
    val payload = prefs(context).getString(RUNTIME_PLAN_KEY, null)
      ?: return emptyList()
    return runtimeBlocksFromPayload(payload)
  }

  private fun usedBudgetMinutes(
    block: RuntimeBlock,
    calendar: Calendar,
    usageTracker: AndroidUsageTracker,
  ): Int {
    val windowStart = block.budgetWindowStart(calendar) ?: return 0
    return usageTracker.usedMinutes(
      block.selectedPackageIds, windowStart, calendar.timeInMillis,
    )
  }

  private fun runtimeBlocksWithAccess(context: Context): List<RuntimeBlock> {
    val blocks = runtimeBlocks(context)
    val usageAccess = context.hasUsageAccess()
    val websiteAccess = context.hasWebsiteBlockingAccess()
    return blocks.filter { block ->
      (!block.ruleKind.usesBudget || usageAccess) &&
        (block.webDomains.isEmpty() || websiteAccess)
    }
  }
}
