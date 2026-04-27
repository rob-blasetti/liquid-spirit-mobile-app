package com.liquid_spirit_mobile_app.widget

import java.util.Calendar
import java.util.Date
import java.util.Locale
import kotlin.math.ceil

data class BadiDate(
  val day: Int,
  val monthName: String,
  val year: Int,
)

object BadiCalendarConverter {
  private val monthNames =
    listOf(
      "Splendor",
      "Glory",
      "Beauty",
      "Grandeur",
      "Light",
      "Mercy",
      "Words",
      "Perfection",
      "Names",
      "Might",
      "Will",
      "Knowledge",
      "Power",
      "Speech",
      "Questions",
      "Honour",
      "Sovereignty",
      "Dominion",
      "The Days of Há",
      "Loftiness",
    )

  fun date(from: Date): BadiDate {
    val localCalendar = Calendar.getInstance()
    localCalendar.time = from
    val gregorianYear = localCalendar.get(Calendar.YEAR)

    val utcCalendar = Calendar.getInstance(Locale.US)
    utcCalendar.timeZone = java.util.TimeZone.getTimeZone("UTC")
    utcCalendar.clear()
    utcCalendar.set(
      localCalendar.get(Calendar.YEAR),
      localCalendar.get(Calendar.MONTH),
      localCalendar.get(Calendar.DAY_OF_MONTH),
      0,
      0,
      0,
    )
    val utcDate = utcCalendar.time

    var badiYear = gregorianYear - 1843
    var nawRuz = nawRuzDate(gregorianYear)

    if (utcDate.before(nawRuz)) {
      badiYear -= 1
      nawRuz = nawRuzDate(gregorianYear - 1)
    }

    val daysSinceNawRuz = ((utcDate.time - nawRuz.time) / (24L * 60L * 60L * 1000L)).toInt()
    val dayOfYear = daysSinceNawRuz + 1
    val intercalaryDays = if (isGregorianLeapYear(gregorianYear)) 5 else 4

    return when {
      dayOfYear <= 18 * 19 -> {
        val monthNumber = ceil(dayOfYear / 19.0).toInt()
        BadiDate(
          day = ((dayOfYear - 1) % 19) + 1,
          monthName = monthNames[monthNumber - 1],
          year = badiYear,
        )
      }
      dayOfYear <= 18 * 19 + intercalaryDays ->
        BadiDate(
          day = dayOfYear - (18 * 19),
          monthName = monthNames[18],
          year = badiYear,
        )
      else ->
        BadiDate(
          day = dayOfYear - (18 * 19 + intercalaryDays),
          monthName = monthNames[19],
          year = badiYear,
        )
    }
  }

  private fun isGregorianLeapYear(year: Int): Boolean =
    (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)

  private fun nawRuzDate(year: Int): Date {
    val calendar = Calendar.getInstance(Locale.US)
    calendar.timeZone = java.util.TimeZone.getTimeZone("UTC")
    calendar.clear()
    calendar.set(year, Calendar.MARCH, 21, 0, 0, 0)
    return calendar.time
  }
}
