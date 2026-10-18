package love.nemi.focus

import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray

internal fun querySelectableApplications(context: Context): WritableArray {
  val packageManager = context.packageManager
  val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
  val protectedPackages = context.protectedBlockingPackageIds()
  val seenPackages = mutableSetOf<String>()
  val apps = packageManager.queryIntentActivities(intent, 0).mapNotNull { info ->
    val activityInfo = info.activityInfo ?: return@mapNotNull null
    val packageName = activityInfo.packageName
    if (
      !isPackageBlockable(packageName, protectedPackages) ||
      !seenPackages.add(packageName)
    ) {
      return@mapNotNull null
    }
    val label = info.loadLabel(packageManager).toString().trim()
    Arguments.createMap().apply {
      putString("id", packageName)
      putString("name", if (label.isEmpty()) packageName else label)
    }
  }

  return Arguments.createArray().apply {
    for (app in apps) pushMap(app)
  }
}
