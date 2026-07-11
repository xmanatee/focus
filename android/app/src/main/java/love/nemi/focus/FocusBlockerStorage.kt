package love.nemi.focus

import android.content.Context
import java.util.Calendar
import org.json.JSONObject

private const val PREFS_NAME = "FocusAndroidBlocker"
private const val RUNTIME_PLAN_KEY = "runtimePlan"
private val DAY_ORDER = listOf("sun", "mon", "tue", "wed", "thu", "fri", "sat")
private val SUPPORTED_RULE_KINDS = setOf(
  "blockDuringSchedule",
  "allowDuringSchedule",
)

data class RuntimeBlock(
  val id: String,
  val name: String,
  val startTime: String,
  val endTime: String,
  val days: Set<String>,
  val ruleKind: String,
  val selectedPackageIds: Set<String>,
) {
  fun isActiveAt(day: String, minute: Int): Boolean {
    if (selectedPackageIds.isEmpty()) return false
    val inside = isInsideSchedule(day, minute)
    return when (ruleKind) {
      "blockDuringSchedule" -> inside
      "allowDuringSchedule" -> !inside
      else -> error("Unsupported Android block rule: $ruleKind")
    }
  }

  private fun isInsideSchedule(day: String, minute: Int): Boolean {
    val start = minutesOf(startTime)
    val end = minutesOf(endTime)
    if (start < end) {
      return days.contains(day) && minute >= start && minute < end
    }
    return (days.contains(day) && minute >= start) ||
      (days.contains(previousDay(day)) && minute < end)
  }
}

object FocusBlockerStorage {
  fun prefs(context: Context) =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun slotKey(slotId: String) = "slot.$slotId"

  fun saveRuntimePlan(context: Context, payload: String) {
    runtimeBlocksFromPayload(payload)
    prefs(context).edit().putString(RUNTIME_PLAN_KEY, payload).apply()
  }

  fun blockingBlockForPackage(
    context: Context,
    packageName: String,
    calendar: Calendar,
  ): RuntimeBlock? {
    val day = dayFromCalendar(calendar)
    val minute = calendar.get(Calendar.HOUR_OF_DAY) * 60 +
      calendar.get(Calendar.MINUTE)
    return runtimeBlocks(context).firstOrNull { block ->
      block.selectedPackageIds.contains(packageName) &&
        block.isActiveAt(day, minute)
    }
  }

  private fun runtimeBlocks(context: Context): List<RuntimeBlock> {
    val payload = prefs(context).getString(RUNTIME_PLAN_KEY, null)
      ?: return emptyList()
    return runtimeBlocksFromPayload(payload)
  }
}

private fun runtimeBlocksFromPayload(payload: String): List<RuntimeBlock> {
  val blocks = JSONObject(payload).getJSONArray("blocks")
  return List(blocks.length()) { index ->
    val block = blocks.getJSONObject(index)
    val ruleKind = block.getString("ruleKind")
    if (!SUPPORTED_RULE_KINDS.contains(ruleKind)) {
      error("Unsupported Android block rule: $ruleKind")
    }
    RuntimeBlock(
      id = block.getString("id"),
      name = block.getString("name"),
      startTime = block.getString("startTime"),
      endTime = block.getString("endTime"),
      days = block.getJSONArray("days").toStringSet(),
      ruleKind = ruleKind,
      selectedPackageIds = block.getJSONArray("selectedPackageIds")
        .toStringSet(),
    )
  }
}

private fun org.json.JSONArray.toStringSet(): Set<String> =
  List(length()) { index -> getString(index) }.toSet()

private fun minutesOf(time: String): Int {
  val parts = time.split(":")
  return parts[0].toInt() * 60 + parts[1].toInt()
}

private fun previousDay(day: String): String {
  val index = DAY_ORDER.indexOf(day)
  if (index < 0) error("Invalid day: $day")
  return DAY_ORDER[(index + 6) % DAY_ORDER.size]
}

private fun dayFromCalendar(calendar: Calendar): String =
  when (calendar.get(Calendar.DAY_OF_WEEK)) {
    Calendar.SUNDAY -> "sun"
    Calendar.MONDAY -> "mon"
    Calendar.TUESDAY -> "tue"
    Calendar.WEDNESDAY -> "wed"
    Calendar.THURSDAY -> "thu"
    Calendar.FRIDAY -> "fri"
    Calendar.SATURDAY -> "sat"
    else -> error("Invalid calendar day.")
  }
