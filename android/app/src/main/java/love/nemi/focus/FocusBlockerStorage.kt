package love.nemi.focus

import android.content.Context
import androidx.core.content.edit
import java.util.Calendar
import org.json.JSONObject

private const val PREFS_NAME = "FocusAndroidBlocker"
private const val RUNTIME_PLAN_KEY = "runtimePlan"
private const val MAX_BLOCK_NAME_LENGTH = 50
private val TIME_PATTERN = Regex("(?:[01]\\d|2[0-3]):[0-5]\\d")

internal enum class RuntimeDay(val wireValue: String) {
  SUN("sun"),
  MON("mon"),
  TUE("tue"),
  WED("wed"),
  THU("thu"),
  FRI("fri"),
  SAT("sat");

  fun previous(): RuntimeDay = entries[(ordinal + entries.size - 1) % entries.size]

  companion object {
    fun fromWireValue(value: String): RuntimeDay =
      entries.firstOrNull { it.wireValue == value }
        ?: throw IllegalArgumentException("Invalid Android block day: $value")
  }
}

internal enum class RuntimeRuleKind(val wireValue: String) {
  BLOCK_DURING_SCHEDULE("blockDuringSchedule"),
  ALLOW_DURING_SCHEDULE("allowDuringSchedule");

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
  val selectedPackageIds: Set<String>,
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
    require(
      selectedPackageIds.isNotEmpty() &&
        selectedPackageIds.all { it.isNotBlank() && it == it.trim() },
    ) {
      "Android block app selection is invalid."
    }
  }

  fun isActiveAt(day: RuntimeDay, minute: Int): Boolean {
    require(minute in 0 until 24 * 60) { "Invalid minute of day: $minute" }
    val inside = isInsideSchedule(day, minute)
    return when (ruleKind) {
      RuntimeRuleKind.BLOCK_DURING_SCHEDULE -> inside
      RuntimeRuleKind.ALLOW_DURING_SCHEDULE -> !inside
    }
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

internal object FocusBlockerStorage {
  fun prefs(context: Context) =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun slotKey(slotId: String) = "slot.$slotId"

  fun saveRuntimePlan(context: Context, payload: String) {
    runtimeBlocksFromPayload(payload)
    prefs(context).edit {
      putString(RUNTIME_PLAN_KEY, payload)
    }
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

internal fun runtimeBlocksFromPayload(payload: String): List<RuntimeBlock> {
  val blocks = JSONObject(payload).getJSONArray("blocks")
  val parsed = List(blocks.length()) { index ->
    val block = blocks.getJSONObject(index)
    RuntimeBlock(
      id = block.getString("id"),
      name = block.getString("name"),
      startTime = block.getString("startTime"),
      endTime = block.getString("endTime"),
      days = block.getJSONArray("days")
        .toUniqueStringSet("days")
        .map { RuntimeDay.fromWireValue(it) }
        .toSet(),
      ruleKind = RuntimeRuleKind.fromWireValue(block.getString("ruleKind")),
      selectedPackageIds = block.getJSONArray("selectedPackageIds")
        .toUniqueStringSet("selectedPackageIds"),
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

private fun dayFromCalendar(calendar: Calendar): RuntimeDay =
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
