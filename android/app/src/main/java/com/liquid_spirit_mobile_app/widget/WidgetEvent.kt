package com.liquid_spirit_mobile_app.widget

data class WidgetEvent(
  val title: String,
  val dateText: String,
  val dayText: String,
  val timeText: String,
  val locationText: String,
  val startTimestamp: Long,
  val updatedAt: Long,
  val isPlaceholder: Boolean,
) {
  val hasEventDetails: Boolean
    get() = !isPlaceholder
}
