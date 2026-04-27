package com.liquid_spirit_mobile_app.widget

import android.content.Context
import com.facebook.react.bridge.ReadableMap

object WidgetEventStore {
  private const val PREFS_NAME = "LiquidSpiritWidget"
  private const val KEY_TITLE = "title"
  private const val KEY_DATE_TEXT = "dateText"
  private const val KEY_DAY_TEXT = "dayText"
  private const val KEY_TIME_TEXT = "timeText"
  private const val KEY_LOCATION_TEXT = "locationText"
  private const val KEY_START_TIMESTAMP = "startTimestamp"
  private const val KEY_UPDATED_AT = "updatedAt"
  private const val KEY_IS_PLACEHOLDER = "isPlaceholder"

  fun save(context: Context, payload: ReadableMap) {
    context
      .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_TITLE, payload.stringValue(KEY_TITLE, "Community event"))
      .putString(KEY_DATE_TEXT, payload.stringValue(KEY_DATE_TEXT, ""))
      .putString(KEY_DAY_TEXT, payload.stringValue(KEY_DAY_TEXT, ""))
      .putString(KEY_TIME_TEXT, payload.stringValue(KEY_TIME_TEXT, ""))
      .putString(KEY_LOCATION_TEXT, payload.stringValue(KEY_LOCATION_TEXT, ""))
      .putLong(KEY_START_TIMESTAMP, payload.longValue(KEY_START_TIMESTAMP, 0L))
      .putLong(KEY_UPDATED_AT, payload.longValue(KEY_UPDATED_AT, System.currentTimeMillis()))
      .putBoolean(KEY_IS_PLACEHOLDER, payload.booleanValue(KEY_IS_PLACEHOLDER, false))
      .apply()
  }

  fun clear(context: Context) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().clear().apply()
  }

  fun nextEvent(context: Context): WidgetEvent? {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    if (!prefs.contains(KEY_TITLE)) return null

    val event =
      WidgetEvent(
        title = prefs.getString(KEY_TITLE, null)?.takeIf { it.isNotBlank() } ?: "Community event",
        dateText = prefs.getString(KEY_DATE_TEXT, "") ?: "",
        dayText = prefs.getString(KEY_DAY_TEXT, "") ?: "",
        timeText = prefs.getString(KEY_TIME_TEXT, "") ?: "",
        locationText = prefs.getString(KEY_LOCATION_TEXT, "") ?: "",
        startTimestamp = prefs.getLong(KEY_START_TIMESTAMP, 0L),
        updatedAt = prefs.getLong(KEY_UPDATED_AT, 0L),
        isPlaceholder = prefs.getBoolean(KEY_IS_PLACEHOLDER, false),
      )

    if (event.hasEventDetails && event.startTimestamp > 0L && event.startTimestamp < System.currentTimeMillis()) {
      return null
    }

    return event
  }

  private fun ReadableMap.stringValue(key: String, fallback: String): String =
    if (hasKey(key) && !isNull(key)) getString(key)?.takeIf { it.isNotBlank() } ?: fallback else fallback

  private fun ReadableMap.longValue(key: String, fallback: Long): Long =
    if (hasKey(key) && !isNull(key)) getDouble(key).toLong() else fallback

  private fun ReadableMap.booleanValue(key: String, fallback: Boolean): Boolean =
    if (hasKey(key) && !isNull(key)) getBoolean(key) else fallback
}
