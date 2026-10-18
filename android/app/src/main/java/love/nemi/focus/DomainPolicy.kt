package love.nemi.focus

internal class DomainPolicyCache(private val lifetimeMillis: Long) {
  private var snapshot: Snapshot? = null

  fun domainsAt(now: Long, load: () -> Set<String>): Set<String> {
    val previous = snapshot
    if (previous != null && now - previous.loadedAt in 0 until lifetimeMillis) {
      return previous.domains
    }
    return load().also { snapshot = Snapshot(it, now) }
  }

  private data class Snapshot(val domains: Set<String>, val loadedAt: Long)
}

internal fun isDomainBlocked(
  domain: String,
  blockedDomains: Set<String>,
): Boolean {
  if (domain.isEmpty()) return false
  val normalized = domain.trimEnd('.').lowercase()
  return blockedDomains.any { blocked ->
    normalized == blocked || normalized.endsWith(".$blocked")
  }
}
