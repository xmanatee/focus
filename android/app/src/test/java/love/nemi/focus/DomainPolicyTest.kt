package love.nemi.focus

import org.junit.Assert.assertFalse
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class DomainPolicyTest {
  private val blocked = setOf("youtube.com", "example.co.uk")

  @Test
  fun loadsThePolicyOnTheFirstPacketAndRefreshesAfterExpiry() {
    val cache = DomainPolicyCache(5_000)
    var calls = 0
    val load = { calls++; blocked }

    assertEquals(blocked, cache.domainsAt(1_000, load))
    assertEquals(blocked, cache.domainsAt(5_999, load))
    assertEquals(1, calls)
    assertEquals(emptySet<String>(), cache.domainsAt(6_000) { emptySet() })
  }

  @Test
  fun refreshesInsteadOfKeepingAStalePolicyWhenTheClockMovesBack() {
    val cache = DomainPolicyCache(5_000)
    cache.domainsAt(10_000) { blocked }

    assertEquals(emptySet<String>(), cache.domainsAt(1_000) { emptySet() })
  }

  @Test
  fun blocksExactDomainsAndTheirSubdomains() {
    assertTrue(isDomainBlocked("youtube.com", blocked))
    assertTrue(isDomainBlocked("m.youtube.com", blocked))
    assertTrue(isDomainBlocked("www.example.co.uk", blocked))
  }

  @Test
  fun doesNotOvermatchLookalikeOrInvalidDomains() {
    assertFalse(isDomainBlocked("notyoutube.com", blocked))
    assertFalse(isDomainBlocked("youtube.com.example.org", blocked))
    assertFalse(isDomainBlocked("", blocked))
  }
}
