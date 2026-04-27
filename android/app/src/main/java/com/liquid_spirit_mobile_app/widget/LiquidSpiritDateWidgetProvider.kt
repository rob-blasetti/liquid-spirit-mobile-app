package com.liquid_spirit_mobile_app.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context

class LiquidSpiritDateWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    LiquidSpiritWidgetUpdater.updateDateWidgets(context, appWidgetManager)
  }
}
