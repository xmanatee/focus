package love.nemi.focus

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ProtectedPackageTest {
  private val protectedPackages = setOf(
    "love.nemi.focus",
    "com.android.settings",
    "com.android.launcher",
  )

  @Test
  fun ordinaryApplicationsCanBeBlocked() {
    assertTrue(isPackageBlockable("com.example.social", protectedPackages))
  }

  @Test
  fun focusAndSystemEscapeRoutesCannotBeBlocked() {
    for (packageName in protectedPackages) {
      assertFalse(isPackageBlockable(packageName, protectedPackages))
    }
  }
}
