package love.nemi.focus

import org.junit.Assert.assertEquals
import org.junit.Test

class RuntimeAuthorizationTest {
  @Test
  fun reportsAuthorizedOnlyWhenSystemAccessIsPresent() {
    assertEquals(
      RuntimeAuthorizationStatus.AUTHORIZED,
      resolveRuntimeAuthorizationStatus(granted = true, requested = false),
    )
  }

  @Test
  fun distinguishesFreshSetupFromRevokedOrDeclinedAccess() {
    assertEquals(
      RuntimeAuthorizationStatus.NOT_DETERMINED,
      resolveRuntimeAuthorizationStatus(granted = false, requested = false),
    )
    assertEquals(
      RuntimeAuthorizationStatus.DENIED,
      resolveRuntimeAuthorizationStatus(granted = false, requested = true),
    )
  }
}
