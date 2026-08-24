package love.nemi.focus

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class FocusAndroidBlockerPackage : BaseReactPackage() {
  override fun getModule(
    name: String,
    reactContext: ReactApplicationContext,
  ): NativeModule? =
    if (name == FocusAndroidBlockerModule.NAME) {
      FocusAndroidBlockerModule(reactContext)
    } else {
      null
    }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
    ReactModuleInfoProvider {
      mapOf(
        FocusAndroidBlockerModule.NAME to ReactModuleInfo(
          FocusAndroidBlockerModule.NAME,
          FocusAndroidBlockerModule::class.java.name,
          false,
          false,
          false,
          false,
        ),
      )
    }
}
