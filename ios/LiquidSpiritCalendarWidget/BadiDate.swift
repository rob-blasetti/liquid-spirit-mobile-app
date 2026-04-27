import Foundation

struct BadiDate {
    let day: Int
    let monthName: String
    let year: Int

    var formatted: String {
        "\(day) \(monthName) \(year) BE"
    }
}

enum BadiCalendarConverter {
    private static let monthNames = [
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
        "Loftiness"
    ]

    static func date(from date: Date) -> BadiDate {
        let localCalendar = Calendar(identifier: .gregorian)
        let localComponents = localCalendar.dateComponents([.year, .month, .day], from: date)
        let gregorianYear = localComponents.year ?? 1844

        var utcCalendar = Calendar(identifier: .gregorian)
        utcCalendar.timeZone = TimeZone(secondsFromGMT: 0)!

        let utcDate = utcCalendar.date(from: DateComponents(
            year: localComponents.year,
            month: localComponents.month,
            day: localComponents.day
        )) ?? date

        var badiYear = gregorianYear - 1843
        var nawRuz = nawRuzDate(forGregorianYear: gregorianYear, calendar: utcCalendar)

        if utcDate < nawRuz {
            badiYear -= 1
            nawRuz = nawRuzDate(forGregorianYear: gregorianYear - 1, calendar: utcCalendar)
        }

        let daysSinceNawRuz = utcCalendar.dateComponents([.day], from: nawRuz, to: utcDate).day ?? 0
        let dayOfYear = daysSinceNawRuz + 1
        let intercalaryDays = isGregorianLeapYear(gregorianYear) ? 5 : 4

        if dayOfYear <= 18 * 19 {
            let monthNumber = Int(ceil(Double(dayOfYear) / 19.0))
            let day = ((dayOfYear - 1) % 19) + 1
            return BadiDate(day: day, monthName: monthNames[monthNumber - 1], year: badiYear)
        }

        if dayOfYear <= 18 * 19 + intercalaryDays {
            return BadiDate(day: dayOfYear - (18 * 19), monthName: monthNames[18], year: badiYear)
        }

        return BadiDate(
            day: dayOfYear - (18 * 19 + intercalaryDays),
            monthName: monthNames[19],
            year: badiYear
        )
    }

    private static func isGregorianLeapYear(_ year: Int) -> Bool {
        (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)
    }

    private static func nawRuzDate(forGregorianYear year: Int, calendar: Calendar) -> Date {
        calendar.date(from: DateComponents(year: year, month: 3, day: 21)) ?? Date()
    }
}
