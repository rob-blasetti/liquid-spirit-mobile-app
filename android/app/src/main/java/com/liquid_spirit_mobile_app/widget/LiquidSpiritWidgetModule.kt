package com.liquid_spirit_mobile_app.widget

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class LiquidSpiritWidgetModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "LiquidSpiritWidget"

  @ReactMethod
  fun updateNextEvent(payload: ReadableMap, promise: Promise) {
    try {
      WidgetEventStore.save(reactContext, payload)
      LiquidSpiritWidgetUpdater.updateAll(reactContext)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("LIQUID_SPIRIT_WIDGET_UPDATE_FAILED", error)
    }
  }

  @ReactMethod
  fun clear(promise: Promise) {
    try {
      WidgetEventStore.clear(reactContext)
      LiquidSpiritWidgetUpdater.updateAll(reactContext)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("LIQUID_SPIRIT_WIDGET_CLEAR_FAILED", error)
    }
  }
}
