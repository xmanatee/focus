package love.nemi.focus

import java.util.Calendar
import org.json.JSONObject

private const val MAX_BLOCK_NAME_LENGTH = 50
private val TIME_PATTERN = Regex("(?:[01]\\d|2[0-3]):[0-5]\\d")

internal enum class RuntimeDay(val wireValue: String) {
  SUN("sun"), MON("mon"), TUE("tue"), WED("wed"), THU("thu"), FRI("fri"), SAT("sat");

  fun previous(): RuntimeDay = entries[(ordinal + entries.size - 1) % entries.size]

  companion object {
    fun fromWireValue(value: String): RuntimeDay =
      entries.firstOrNull { it.wireValue == value }
        ?: throw IllegalArgumentException("Invalid Android block day: $value")
  }
}

internal enum class RuntimeRuleKind(val wireValue: String) {
  BLOCK_DURING_SCHEDULE("blockDuringSchedule"),
  ALLOW_DURING_SCHEDULE("allowDuringSchedule"),
  DAILY_BUDGET("dailyBudget"),
  ALLOW_DURING_SCHEDULE_WITH_BUDGET("allowDuringScheduleWithBudget");

  val usesBudget: Boolean
    get() = this == DAILY_BUDGET || this == ALLOW_DURING_SCHEDULE_WITH_BUDGET

  companion object {
    fun fromWireValue(value: String): RuntimeRuleKind =
      entries.firstOrNull { it.wireValue == value }
        ?: throw IllegalArgumentException("Unsupported Android block rule: $value")
  }
}

internal data class RuntimeBlock(
  val id: String,
  val name: String,
  val startTime: String,
  val endTime: String,
  val days: Set<RuntimeDay>,
  val ruleKind: RuntimeRuleKind,
  val budgetMinutes: Int?,
  val selectedPackageIds: Set<String>,
  val webDomains: Set<String>,
) {
  init {
    require(id.isNotBlank() && id == id.trim()) { "Android block id is invalid." }
    require(name.isNotBlank() && name.length <= MAX_BLOCK_NAME_LENGTH) {
      "Android block name is invalid."
    }
    require(startTime != endTime) { "Android block time range is empty." }
    minutesOf(startTime)
    minutesOf(endTime)
    require(days.isNotEmpty()) { "Android block days are invalid." }
    require(selectedPackageIds.all { it.isNotBlank() && it == it.trim() }) {
      "Android block app selection is invalid."
    }
    require(webDomains.all(::isCanonicalDomain)) {
      "Android block website selection is invalid."
    }
    require(selectedPackageIds.isNotEmpty() || webDomains.isNotEmpty()) {
      "Android block has no blocking targets."
    }
    require(
      if (ruleKind.usesBudget) {
        budgetMinutes in 1 until 24 * 60 && selectedPackageIds.isNotEmpty()
      } else {
        budgetMinutes == null
      },
    ) { "Android block budget is invalid." }
  }

  fun isBlockingAt(day: RuntimeDay, minute: Int, usedMinutes: Int): Boolean {
    require(minute in 0 until 24 * 60) { "Invalid minute of day: $minute" }
    require(usedMinutes >= 0) { "Used minutes cannot be negative." }
    val inside = isInsideSchedule(day, minute)
    return when (ruleKind) {
      RuntimeRuleKind.BLOCK_DURING_SCHEDULE -> inside
      RuntimeRuleKind.ALLOW_DURING_SCHEDULE -> !inside
      RuntimeRuleKind.DAILY_BUDGET ->
        days.contains(day) && usedMinutes >= requireNotNull(budgetMinutes)
      RuntimeRuleKind.ALLOW_DURING_SCHEDULE_WITH_BUDGET ->
        !inside || usedMinutes >= requireNotNull(budgetMinutes)
    }
  }

  fun budgetWindowStart(at: Calendar): Long? {
    if (!ruleKind.usesBudget) return null
    val day = dayFromCalendar(at)
    val minute = at.get(Calendar.HOUR_OF_DAY) * 60 + at.get(Calendar.MINUTE)
    val start = minutesOf(startTime)
    val end = minutesOf(endTime)
    val origin = when (ruleKind) {
      RuntimeRuleKind.DAILY_BUDGET -> if (days.contains(day)) day else null
      RuntimeRuleKind.ALLOW_DURING_SCHEDULE_WITH_BUDGET ->
        if (start < end) {
          if (days.contains(day) && minute in start until end) day else null
        } else {
          when {
            days.contains(day) && minute >= start -> day
            days.contains(day.previous()) && minute < end -> day.previous()
            else -> null
          }
        }
      else -> null
    } ?: return null

    return (at.clone() as Calendar).apply {
      if (origin != day) add(Calendar.DAY_OF_MONTH, -1)
      if (ruleKind == RuntimeRuleKind.DAILY_BUDGET) {
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
      } else {
        set(Calendar.HOUR_OF_DAY, start / 60)
        set(Calendar.MINUTE, start % 60)
      }
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
    }.timeInMillis
  }

  private fun isInsideSchedule(day: RuntimeDay, minute: Int): Boolean {
    val start = minutesOf(startTime)
    val end = minutesOf(endTime)
    if (start < end) {
      return days.contains(day) && minute >= start && minute < end
    }
    return (days.contains(day) && minute >= start) ||
      (days.contains(day.previous()) && minute < end)
  }
}

internal fun runtimeBlocksFromPayload(payload: String): List<RuntimeBlock> {
  val root = JSONObject(payload)
  require(root.getInt("version") == 1) { "Unsupported Android runtime plan." }
  val blocks = root.getJSONArray("blocks")
  val parsed = List(blocks.length()) { index ->
    val block = blocks.getJSONObject(index)
    val rule = block.getJSONObject("rule")
    val ruleKind = RuntimeRuleKind.fromWireValue(rule.getString("kind"))
    RuntimeBlock(
      id = block.getString("id"),
      name = block.getString("name"),
      startTime = block.getString("startTime"),
      endTime = block.getString("endTime"),
      days = block.getJSONArray("days")
        .toUniqueStringSet("days")
        .map { RuntimeDay.fromWireValue(it) }
        .toSet(),
      ruleKind = ruleKind,
      budgetMinutes = if (ruleKind.usesBudget) rule.getInt("minutes") else null,
      selectedPackageIds = block.getJSONArray("selectedPackageIds")
        .toUniqueStringSet("selectedPackageIds"),
      webDomains = block.getJSONArray("webDomains")
        .toUniqueStringSet("webDomains"),
    )
  }
  validateUniqueBlockIds(parsed)
  return parsed
}

internal fun validateUniqueBlockIds(blocks: List<RuntimeBlock>) {
  require(blocks.map(RuntimeBlock::id).toSet().size == blocks.size) {
    "Android block ids must be unique."
  }
}

internal fun dayFromCalendar(calendar: Calendar): RuntimeDay =
  when (calendar.get(Calendar.DAY_OF_WEEK)) {
    Calendar.SUNDAY -> RuntimeDay.SUN
    Calendar.MONDAY -> RuntimeDay.MON
    Calendar.TUESDAY -> RuntimeDay.TUE
    Calendar.WEDNESDAY -> RuntimeDay.WED
    Calendar.THURSDAY -> RuntimeDay.THU
    Calendar.FRIDAY -> RuntimeDay.FRI
    Calendar.SATURDAY -> RuntimeDay.SAT
    else -> error("Invalid calendar day.")
  }

private fun org.json.JSONArray.toUniqueStringSet(fieldName: String): Set<String> {
  val values = List(length()) { index -> getString(index) }
  require(values.toSet().size == values.size) {
    "Android block $fieldName must be unique."
  }
  return values.toSet()
}

private fun minutesOf(time: String): Int {
  require(TIME_PATTERN.matches(time)) { "Invalid Android block time: $time" }
  val parts = time.split(":")
  return parts[0].toInt() * 60 + parts[1].toInt()
}

private fun isCanonicalDomain(value: String): Boolean =
  value.isNotBlank() &&
    value.length <= 253 &&
    value == value.trim().lowercase() &&
    value.contains('.') &&
    value.split('.').all { label ->
      label.isNotEmpty() &&
        label.length <= 63 &&
        label.first() != '-' &&
        label.last() != '-' &&
        label.all { it in 'a'..'z' || it in '0'..'9' || it == '-' }
    }
