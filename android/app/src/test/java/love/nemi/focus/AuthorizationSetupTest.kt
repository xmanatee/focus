package love.nemi.focus

import org.junit.Assert.assertEquals
import org.junit.Test

class AuthorizationSetupTest {
  @Test
  fun freshSideloadStartsWithRestrictedSettings() {
    assertEquals(
      AuthorizationSetupStep.RESTRICTED_SETTINGS,
      resolveAuthorizationSetupStep(
        restrictedSettingsRequired = true,
        accessibilityEverEnabled = false,
        appInfoOpened = false,
      ),
    )
  }

  @Test
  fun openedAppInfoContinuesToAccessibility() {
    assertEquals(
      AuthorizationSetupStep.ACCESSIBILITY_SETTINGS,
      resolveAuthorizationSetupStep(
        restrictedSettingsRequired = true,
        accessibilityEverEnabled = false,
        appInfoOpened = true,
      ),
    )
  }

  @Test
  fun previouslyAuthorizedSideloadReopensAccessibilityDirectly() {
    assertEquals(
      AuthorizationSetupStep.ACCESSIBILITY_SETTINGS,
      resolveAuthorizationSetupStep(
        restrictedSettingsRequired = true,
        accessibilityEverEnabled = true,
        appInfoOpened = false,
      ),
    )
  }

  @Test
  fun storeInstallSkipsRestrictedSettings() {
    assertEquals(
      AuthorizationSetupStep.ACCESSIBILITY_SETTINGS,
      resolveAuthorizationSetupStep(
        restrictedSettingsRequired = false,
        accessibilityEverEnabled = false,
        appInfoOpened = false,
      ),
    )
  }
}
