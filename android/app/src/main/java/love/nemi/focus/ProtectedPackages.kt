package love.nemi.focus

import android.content.Context
import android.content.Intent
import android.provider.Settings

internal fun Context.protectedBlockingPackageIds(): Set<String> {
  val packageManager = packageManager
  val packages = mutableSetOf(packageName)
  val protectedIntents = listOf(
    Intent(Settings.ACTION_SETTINGS),
    Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS),
    Intent(Settings.ACTION_MANAGE_APPLICATIONS_SETTINGS),
    Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME),
  )
  for (intent in protectedIntents) {
    packageManager.queryIntentActivities(intent, 0).mapTo(packages) {
      it.activityInfo.packageName
    }
  }
  return packages
}

internal fun isPackageBlockable(
  packageName: String,
  protectedPackages: Set<String>,
): Boolean = packageName !in protectedPackages
