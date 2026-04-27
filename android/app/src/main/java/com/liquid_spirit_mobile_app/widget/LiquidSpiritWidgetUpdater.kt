package com.liquid_spirit_mobile_app.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.view.View
import android.widget.RemoteViews
import com.liquid_spirit_mobile_app.R
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

object LiquidSpiritWidgetUpdater {
  private const val PRIMARY_COLOR = 0xFF312783.toInt()

  fun updateAll(context: Context) {
    val appWidgetManager = AppWidgetManager.getInstance(context)
    updateDateWidgets(context, appWidgetManager)
    updateEventWidgets(context, appWidgetManager)
  }

  fun updateDateWidgets(context: Context, appWidgetManager: AppWidgetManager) {
    val componentName = ComponentName(context, LiquidSpiritDateWidgetProvider::class.java)
    val widgetIds = appWidgetManager.getAppWidgetIds(componentName)
    if (widgetIds.isEmpty()) return

    val views = RemoteViews(context.packageName, R.layout.widget_date)
    bindDate(
      views,
      DateViewIds(
        weekday = R.id.date_weekday,
        badiMonthDay = R.id.date_badi_month_day,
        badiYear = R.id.date_badi_year,
        gregorianMonthDay = R.id.date_gregorian_month_day,
        gregorianYear = R.id.date_gregorian_year,
      ),
    )

    appWidgetManager.updateAppWidget(widgetIds, views)
  }

  fun updateEventWidgets(context: Context, appWidgetManager: AppWidgetManager) {
    val componentName = ComponentName(context, LiquidSpiritEventWidgetProvider::class.java)
    val widgetIds = appWidgetManager.getAppWidgetIds(componentName)
    if (widgetIds.isEmpty()) return

    val views = RemoteViews(context.packageName, R.layout.widget_event)
    val event = WidgetEventStore.nextEvent(context)

    if (event == null) {
      views.setViewVisibility(R.id.event_content, View.GONE)
      views.setViewVisibility(R.id.event_fallback_date, View.VISIBLE)
      views.setViewVisibility(R.id.event_logo, View.GONE)
      bindDate(
        views,
        DateViewIds(
          weekday = R.id.fallback_weekday,
          badiMonthDay = R.id.fallback_badi_month_day,
          badiYear = R.id.fallback_badi_year,
          gregorianMonthDay = R.id.fallback_gregorian_month_day,
          gregorianYear = R.id.fallback_gregorian_year,
        ),
      )
    } else {
      views.setViewVisibility(R.id.event_fallback_date, View.GONE)
      views.setViewVisibility(R.id.event_content, View.VISIBLE)
      views.setViewVisibility(R.id.event_logo, View.VISIBLE)
      bindDate(
        views,
        DateViewIds(
          weekday = R.id.event_weekday,
          badiMonthDay = R.id.event_badi_month_day,
          badiYear = R.id.event_badi_year,
          gregorianMonthDay = R.id.event_gregorian_month_day,
          gregorianYear = R.id.event_gregorian_year,
        ),
      )
      bindEvent(views, event)
    }

    appWidgetManager.updateAppWidget(widgetIds, views)
  }

  private fun bindDate(views: RemoteViews, ids: DateViewIds) {
    val now = Date()
    val badiDate = BadiCalendarConverter.date(now)
    val calendar = Calendar.getInstance()
    calendar.time = now

    views.setTextViewText(ids.weekday, SimpleDateFormat("EEEE", Locale.getDefault()).format(now))
    views.setTextColor(ids.weekday, PRIMARY_COLOR)
    views.setTextViewText(ids.badiMonthDay, "${badiDate.day} ${badiDate.monthName}")
    views.setTextViewText(ids.badiYear, "${badiDate.year} BE")
    views.setTextViewText(ids.gregorianMonthDay, SimpleDateFormat("d MMMM", Locale.getDefault()).format(now))
    views.setTextViewText(ids.gregorianYear, calendar.get(Calendar.YEAR).toString())
  }

  private fun bindEvent(views: RemoteViews, event: WidgetEvent) {
    views.setTextViewText(R.id.event_heading, "Next Event")
    views.setTextViewText(R.id.event_title, event.title)
    views.setTextViewText(
      R.id.event_date,
      listOf(event.dayText, event.dateText).filter { it.isNotBlank() }.joinToString(", "),
    )
    views.setTextViewText(R.id.event_time, event.timeText)
    views.setTextViewText(R.id.event_location, event.locationText)

    val detailsVisibility = if (event.hasEventDetails) View.VISIBLE else View.GONE
    views.setViewVisibility(R.id.event_date, detailsVisibility)
    views.setViewVisibility(R.id.event_time, detailsVisibility)
    views.setViewVisibility(
      R.id.event_location,
      if (event.locationText.isBlank()) View.GONE else View.VISIBLE,
    )
  }
}

private data class DateViewIds(
  val weekday: Int,
  val badiMonthDay: Int,
  val badiYear: Int,
  val gregorianMonthDay: Int,
  val gregorianYear: Int,
)
