package com.liquid_spirit_mobile_app.widget

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class LiquidSpiritWidgetPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(LiquidSpiritWidgetModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): MutableList<ViewManager<*, *>> =
    mutableListOf()
}
